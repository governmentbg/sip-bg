import * as React from "react";
import { connect } from 'react-redux';
import { nls } from "../nls";
import FloatingLabelInput from "../Widgets/FloatingLabelInput";
import { InputValueType } from "../Widgets/FloatingLabelInput";
import { isNullOrUndefined } from 'util';
import Graphic = require("esri/Graphic");
import { eitAppConfig } from "../../eitAppConfig";
import { IEITAppStore } from "../../interfaces/reducers/IEITAppStore";
import { getLayerInfos } from "../../core/reducers/layerInfos";
import { IFeatureLayerInfo, IGraphic } from '../../core/interfaces/models';
import { featureLayersAPI } from "../../core/actions/helpers";
import AttachmentsEditing from "../Widgets/AttachmentsEditing";
import { AttachmentInfo } from "../Widgets/AttachmentsEditing";
import { featureLayersAttachmentsAPI } from "../../core/actions/esri/helpers/featureLayersAttachmentsAPI"
import { IAttachmentResponse, IAddAttachmentResponse } from '../../core/interfaces/helpers';
import OverlayLoader from "../../core/components/Loading/OverlayLoading";

interface ParentProps {
}
interface DispatchProps {
}
interface OwnProps {
    defaultName: string;
    defaultEmail: string;
    defaultFormType?: number;
}
enum FieldNames {
    username = "username",
    email = "email",
    contactdata = 'contactdata',
    addressee = "addressee",
    formtype = "formtype",
    subject = "subject",
    formtext = "formtext",
}

interface InternalState {
    username?: string,
    email?: string,
    contactdata?: string,
    addressee?: string,
    formtype?: number,
    subject?: string,
    formtext?: string,
    emailHasError: boolean,
    formtextHasError: boolean,
    attachments: AttachmentInfo[];
    submitSuccess?: boolean,
    loading: boolean;
}

type Props = ParentProps & DispatchProps & OwnProps;

class CustomerFeedbackForm extends React.Component<Props, InternalState> {
    customFileReader: React.RefObject<HTMLInputElement>;
    constructor(props: Props) {
        super(props);
        this.state = {
            // Some defauls may be set from props:
            loading: false,
            username: this.props.defaultName,
            email: this.props.defaultEmail,
            addressee: '',
            contactdata: '',
            formtype: this.props.defaultFormType,
            subject: '',
            formtext: '',
            emailHasError: false,
            formtextHasError: false,
            attachments: [],
        };
        this.customFileReader = React.createRef();
    }
    getHasValue = (currentValue: any) => {
        return !isNullOrUndefined(currentValue) ? currentValue.toString().trim().length > 0 : false;
    }
    getFormHasError = (): boolean => {
        let requiredFields: string[] = [FieldNames.email.toString(), FieldNames.formtype.toString(), FieldNames.formtext.toString()];
        let result: boolean = false;
        for (let requiredField in requiredFields) {
            result = result || !this.getHasValue(this.state[requiredFields[requiredField]]);
        }
        result = result || this.state.emailHasError;
        result = result || this.state.formtextHasError;
        return result;
    }
    onValueChange = (newValue: InputValueType, fieldHasError: boolean, fieldName: FieldNames): void => {
        if (fieldName === FieldNames.email ||
            fieldName === FieldNames.formtext) {
            this.setState({
                ...this.state,
                [fieldName]: newValue as string,
                [fieldName + 'HasError']: fieldHasError,
            });
        }
        else {
            this.setState({
                ...this.state,
                [fieldName]: newValue as string,
            });
        }
    }
    onAttachmentsChange = (newAttachments: AttachmentInfo[]): void =>{
        this.setState({
            attachments : newAttachments,
        });
    }
    onStartOverClick = (event: React.MouseEvent<HTMLElement>): void => {
        this.resetState(undefined);
    }
    
    addAttachmentsToFeature = (feature: IGraphic, addedResults: Array<{ objectId: number, success: boolean }>): Promise<IAddAttachmentResponse[]> => {
        const feedbackFeatureLayerInfo: IFeatureLayerInfo = getLayerInfos()[eitAppConfig.layers.FeedbackServiceUrl];
        let attachmentFiles: Array<File> = new Array<File>();
        if (addedResults.length == 1 && addedResults[0].success) {
            feature.attributes["objectid"] = addedResults[0].objectId;
            this.state.attachments.forEach(attachment => {
                if (!isNullOrUndefined(attachment.file)) {
                    attachmentFiles.push(attachment.file);
                }
            });
        }
        return featureLayersAttachmentsAPI.addAttachmentsToFeature(feedbackFeatureLayerInfo, feature, attachmentFiles, "objectid");
    }

    onSendFeedbackClick = (event: React.MouseEvent<HTMLElement>): void => {
        try {
            this.setState({
                loading:true,
            });
            const feedbackFeatureLayerInfo: IFeatureLayerInfo = getLayerInfos()[eitAppConfig.layers.FeedbackServiceUrl];
            let feature = this.getFeedbackGraphic();
            featureLayersAPI.applyEdits(feedbackFeatureLayerInfo, [feature])
                .then(result => {
                    //console.log(`adding ${this.state.attachments.length} atachments to ${result.addResults.length} features`)
                    this.addAttachmentsToFeature(feature, result.addResults).then(res => {
                        //console.log(`sucessfully added ${res.length} atachments`)
                        this.resetState(true);
                    }).catch(err => {
                        console.error(err);
                        this.resetState(false);
                    });
                })
                .catch(error => {
                    console.error(error);
                    this.resetState(false);
                })
        }
        catch (e) {
            console.error(e);
            this.resetState(false);
        }
    }
    resetState = (submitSuccess: boolean | undefined): void => {
        if (!isNullOrUndefined(submitSuccess) && !submitSuccess) {
            this.setState({
                submitSuccess: false,
                loading: false,
            });
        }
        else {
            this.setState({
                username: this.props.defaultName,
                email: this.props.defaultEmail,
                contactdata: '',
                addressee: '',
                formtype: this.props.defaultFormType,
                subject: '',
                formtext: '',
                emailHasError: false,
                formtextHasError: false,
                attachments: [],
                submitSuccess: submitSuccess,
                loading: false,
            });
        }
    }
    getFeedbackGraphic = (): IGraphic => {
        let graphic: Graphic;
        graphic = new Graphic({
            attributes: {
                username: this.state.username,
                email: this.state.email,
                contactdata: this.state.contactdata,
                addressee: this.state.addressee,
                formtype: this.state.formtype == 0 ? undefined : this.state.formtype,
                subject: this.state.subject,
                formtext: this.state.formtext,
                submissiontime: new Date().getTime(),
            }
        });
        return graphic;

    }
    render() {
        const hasError = this.getFormHasError();
        const maxAttachments: number = 3;
        const inputAttachments: string = nls.nls.feedback.inputAttachments.replace('{0}', maxAttachments.toString());
        return (
            <div className="vertical-flex-container"
                style={{ height: "100%" }}>
                <OverlayLoader size="60px" show={this.state.loading}/>
                <div className="flex-item flex-auto">
                    <p style={{ fontSize: "85%", textIndent: "1em", marginTop: "2px", marginBottom: "2px" }}>{nls.nls.feedback.promptText}</p>
                </div>
                <div className="flex-item flex-scalable vertical-flex-container"
                    style={{ height: "100%", overflow: "auto", overflowX: "hidden", scrollBehavior: "smooth" }}>
                <div className="flex-item flex-auto horizontal-wrapping-flex-container">
                    <FloatingLabelInput
                        className="flex-item flex-scalable"
                        placeholder={nls.nls.feedback.inputUserName}
                        value={this.state.username}
                        maxLength={255}
                        onValueChange={(newValue: InputValueType, hasError: boolean) => this.onValueChange(newValue, hasError, FieldNames.username)} />
                    <FloatingLabelInput type="text"
                        className="flex-item flex-scalable"
                        isRequired={true}
                        requiredMsg={' *'}
                        pattern={new RegExp('^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$', 'i')}
                        errorMsg={nls.nls.feedback.invalidEmail}
                        placeholder={nls.nls.feedback.inputEmail}
                        value={this.state.email}
                        maxLength={255}
                        hasError={this.state.emailHasError}
                        onValueChange={(newValue: InputValueType, hasError: boolean) => this.onValueChange(newValue, hasError, FieldNames.email)} />
                    <FloatingLabelInput
                        className="flex-item flex-scalable"
                        placeholder={nls.nls.feedback.inputContactData}
                        value={this.state.contactdata}
                        maxLength={255}
                        onValueChange={(newValue: InputValueType, hasError: boolean) => this.onValueChange(newValue, hasError, FieldNames.contactdata)} />
                    <FloatingLabelInput
                        className="flex-item flex-scalable"
                        placeholder={nls.nls.feedback.inputAddressee}
                        value={this.state.addressee}
                        maxLength={255}
                        onValueChange={(newValue: InputValueType, hasError: boolean) => this.onValueChange(newValue, hasError, FieldNames.addressee)} />
                    <FloatingLabelInput
                        className="flex-item flex-scalable"
                        isRequired={false}
                        placeholder={nls.nls.feedback.inputFormType}
                        value={this.state.formtype}
                        selectorItems={{ 0: '' , 1: nls.nls.feedback.formType1, 2: nls.nls.feedback.formType2, 3: nls.nls.feedback.formType3, 9: nls.nls.feedback.formType9 }}
                        onValueChange={(newValue: InputValueType, hasError: boolean) => this.onValueChange(newValue, hasError, FieldNames.formtype)} />
                    <FloatingLabelInput
                        className="flex-item flex-scalable"
                        placeholder={nls.nls.feedback.inputSubject}
                        value={this.state.subject}
                        maxLength={255}
                        onValueChange={(newValue: InputValueType, hasError: boolean) => this.onValueChange(newValue, hasError, FieldNames.subject)} />
                </div>
                <div className="flex-item flex-scalable vertical-flex-container">
                    <FloatingLabelInput
                        className="flex-item flex-scalable"
                        isMultiline={true}
                        isRequired={true}
                        requiredMsg={' *'}
                        placeholder={nls.nls.feedback.inputFormText}
                        value={this.state.formtext}
                        maxLength={2000}
                        hasError={this.state.formtextHasError}
                        onValueChange={(newValue: InputValueType, hasError: boolean) => this.onValueChange(newValue, hasError, FieldNames.formtext)} />
                    </div>
                    {/*
                    <div className="flex-item flex-auto horizontal-wrapping-flex-container" style={{ justifyContent: "center" }}>
                        <button className="appBtn flex-item"
                            onClick={this.testFuncForUploadAttachment}
                            style={{ minWidth: "150px", height: "30px" }}>
                            <span>Прикачи</span>
                        </button>
                    </div>
                    */}
                    <div className="flex-item flex-auto">
                        <AttachmentsEditing
                            maxNumber={maxAttachments}
                            attachments={this.state.attachments}
                            label={inputAttachments}
                            onAttachmentsChange={ this.onAttachmentsChange }/>
                    </div>
                </div>
                <div className="flex-item flex-auto horizontal-wrapping-flex-container"
                    style={{ paddingBottom: "10px", paddingTop: "10px" }}>
                    <button className="appBtn"
                        onClick={this.onStartOverClick}
                        style={{ height: "30px", flexGrow: 0, flexBasis: "150px", marginBottom: "10px" }}>
                        <img src="public/eit/Feedback/StartOver32.png" style={{ width: "20px", height: "20px" }} />
                        <span>&nbsp;{nls.nls.feedback.startOver}</span>
                    </button>
                    <button className="appBtn"
                        disabled={hasError}
                        onClick={this.onSendFeedbackClick}
                        style={{ height: "30px", flexGrow: 0, flexBasis: "150px", marginBottom: "10px" }}>
                        <img src="public/eit/Feedback/Send32.png" style={{ width: "20px", height: "20px" }} />
                        <span>&nbsp;{nls.nls.feedback.sendFeedback}</span>
                    </button>
                </div>
                {/*
                    <div className="flex-item">
                    <hr/>
                    <p>Form has error: {hasError.toString()}</p>
                    <p>Email has error: {this.state.emailHasError.toString()}</p>
                    <p>Email: [{this.state.email}]</p>
                    <p>FormType: [{this.state.formtype}]</p>
                    <p>Message: [{this.state.formtext}]</p> 
                    </div>
                */}
                {isNullOrUndefined(this.state.submitSuccess) ?
                    (null) :
                    this.state.submitSuccess ?
                        (<div className="flex-item">
                            <p style={{ color: "green" }}>{nls.nls.feedback.submitSuccess}</p>
                        </div>) :
                        (<div className="flex-item">
                            <p style={{ color: "red" }}>{nls.nls.feedback.submitFailure}</p>
                        </div>)
                }
                {/*
                    <input ref={this.customFileReader} type="file" onChange={(evt => console.log(this.customFileReader && this.customFileReader.current && this.customFileReader.current.files))} style={{ display: "none" }} />
                */}
            </div>
        )
    }
}

const mapStateToProps = (state: IEITAppStore) => ({
    defaultName: state.eit.userInfo.user.autorizedpersonname || "",
    defaultEmail: state.eit.userInfo.user.email || "",
    defaultFormType: 0,
})

export default connect<OwnProps, any, any>(mapStateToProps, {})(CustomerFeedbackForm);
