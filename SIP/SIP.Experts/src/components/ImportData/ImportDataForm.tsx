import * as React from "react";
import { connect } from 'react-redux';
import { nls } from "../nls";
import FloatingLabelInput, { formatDate } from "../Widgets/FloatingLabelInput";
import { isNullOrUndefined } from 'util';
import Graphic = require("esri/Graphic");
import { eitAppConfig } from "../../eitAppConfig";
import { IEITAppStore, IUserInfo } from "../../interfaces/reducers/IEITAppStore";
import { getLayerInfos } from "../../core/reducers/layerInfos";
import { IFeatureLayerInfo, IGraphic } from '../../core/interfaces/models';
import { featureLayersAPI } from "../../core/actions/helpers";
import { featureLayersAttachmentsAPI } from "../../core/actions/esri/helpers/featureLayersAttachmentsAPI"
import { IAttachmentResponse } from '../../core/interfaces/helpers';
import OverlayLoader from "../../core/components/Loading/OverlayLoading";
import * as Datetime from "react-datetime";
import { number, string } from 'prop-types';
import { isDate, Moment } from 'moment';
import Geoprocessor = require('esri/tasks/Geoprocessor');
import DataFile = require('esri/tasks/support/DataFile');

import axios from "axios";
import { appConfig } from '../../core/appConfig';
import moment = require('moment');
import { MosaicWindowActionsPropType } from '../../core/components/Layouts/Mosaic/MosaicLib/MosaicLib';


interface ParentProps {
}
interface DispatchProps {
}
interface OwnProps {
    userInfo: IUserInfo;
    defaultFormType?: number;
}
enum FieldNames {
    formatType = "formatType",
    infrastructureType = "infrastructureType",
    files = "files",
    credibility = "credibility",
    revisionDate = "revisionDate",
    keyWords = "keyWords"
}

interface InternalState {
    formatType?: number,
    infrastructureType: number,
    files?: FileList | null,
    loading: boolean;
    processSuccess?: boolean,
    revisionDate?: Moment,
    credibility?: number,
    keyWords?: string,
    code?: string
}

type Props = ParentProps & DispatchProps & OwnProps;

class ImportDataForm extends React.Component<Props, InternalState> {
    customFileReader: React.RefObject<HTMLInputElement>;
    acceptedFileExtensions = ""; //".zip, .kmz, .xlsx, .csv";
    constructor(props: Props) {
        super(props);
        this.state = {
            // Some defauls may be set from props:
            loading: false,
            formatType: this.props.defaultFormType,
            infrastructureType: 0,
        };
        this.customFileReader = React.createRef();
    }

    onUploadPackage = (event: React.MouseEvent<HTMLElement>): void => {
        if (this.customFileReader && this.customFileReader.current) {
            this.customFileReader.current.click();
        }
    }
    onUploadPackageChanged = (event: any): void => {
        if (this.customFileReader && this.customFileReader.current) {
            if (!isNullOrUndefined(this.customFileReader.current.files) && this.customFileReader.current.files.length > 0) {
                this.setState({
                    files: this.customFileReader.current.files,
                });
            }
        }
    }

    unloadPackage = (): void => {
        if (this.customFileReader && this.customFileReader.current) {

            this.customFileReader.current.value = "";
            this.setState({
                files: this.customFileReader.current.files,
            });
        }
    }
    performProcess = (): void => {
        try {
            this.setState({ loading: true, code: '', processSuccess: undefined })

            var file = this.state.files ? this.state.files[0] : undefined;
            if (!file) throw Error();

            let formdata = new FormData();
            formdata.append("file", file);
            formdata.append("f", 'json');
            formdata.append("description", '');

            let url = eitAppConfig.appSpecific.importDataServiceUrl;
            axios.post(`${url}/uploads/upload`, formdata)
                .then(({ data }) => {

                    if (data.success) {
                        let itemId = data.item.itemID;
                        this.setState({ code: itemId })

                        var params = {
                            user_id: this.props.userInfo.user.id,
                            arcgis_token: this.props.userInfo.token,
                            referer: window.location.origin,
                            organization_id: this.props.userInfo.user.organizationid,
                            infrastructure_type_id: this.state.infrastructureType,
                            revision_date: this.formatDate(this.state.revisionDate!),
                            credibility: this.state.credibility,
                            key_words: this.state.keyWords,
                            file_extension: this.acceptedFileExtensions.slice(1),
                            file_id: itemId,
                            file_name: file!.name
                        }

                        let gp = new Geoprocessor();
                        gp.url = `${url}/ImportData`;
                        gp.execute(params).then(res => {
                            if (res && res.results[0].value == 'success') {
                                this.onProcessFinished(true);
                                this.clearForm()
                            }
                            else {
                                throw Error()
                            }
                        }).catch(e => {
                            this.onProcessFinished(false);
                        })
                    }
                })
        }
        catch (e) {
            this.onProcessFinished(false);
        }
    }

    onProcessFinished = (result: boolean): void => {
        this.setState({
            loading: false,
            processSuccess: result
        })
    }
    onValueChange = (newValue: string | number | Moment | undefined, fieldHasError: boolean, fieldName: FieldNames): void => {

        this.setState({
            ...this.state,
            [fieldName]: newValue as string,
        });

        if (fieldName === FieldNames.formatType) {
            if (this.state.files) {
                this.unloadPackage();
            }
            this.setState({ processSuccess: undefined })
        }

        if (fieldName === FieldNames.infrastructureType) {
            this.onInfrastructureChangeAsKeyWords((newValue || 0) as number)
            this.setState({ processSuccess: undefined })
        }
    }

    onInfrastructureChangeAsKeyWords = (newValue: number) => {
        let keyWords = "";
        if (this.state.infrastructureType > 0) {
            const prevKeyWordInfr = nls.nls.importData.infrastructureType[this.state.infrastructureType];
            let currKeyWords = this.state.keyWords as string; //isNullOrUndefined(this.state.keyWords)? "" : this.state.keyWords;
            currKeyWords = currKeyWords.replace(prevKeyWordInfr, nls.nls.importData.infrastructureType[newValue as number]).toString();
            keyWords = currKeyWords;
        } else {
            keyWords = nls.nls.importData.infrastructureType[newValue as number];
        }

        this.setState({
            ["keyWords"]: keyWords,
        });
    }

    isFormValid() {
        return (isNullOrUndefined(this.state.files) || this.state.files.length <= 0 ||
            isNullOrUndefined(this.state.formatType) || this.state.formatType == 0 ||
            isNullOrUndefined(this.state.infrastructureType) || this.state.infrastructureType == 0 ||
            isNullOrUndefined(this.state.revisionDate) || isNullOrUndefined(this.formatDate(this.state.revisionDate)) ||
            isNullOrUndefined(this.state.credibility) || this.state.credibility == 0)
    }

    clearForm = () => {
        this.setState({
            formatType: this.props.defaultFormType,
            infrastructureType: 0,
            revisionDate: undefined,
            credibility: 0,
            keyWords: '',
            code: ''
        })
        this.unloadPackage();
    }

    formatDate(date: Moment) {
        if (date) {
            let d = new Date((date as Moment).valueOf());
            if (d && String(d) !== 'Invalid Date')
                return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
        }
        return undefined;
    }

    formatBytes(bytes: any) {
        if (bytes < 1024) return bytes + " Bytes";
        else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + " KB";
        else if (bytes < 1073741824) return (bytes / 1048576).toFixed(2) + " MB";
        else return (bytes / 1073741824).toFixed(2) + " GB";
    }

    getAcceptedFiles() {
        if (this.acceptedFileExtensions)
            switch (this.acceptedFileExtensions) {
                case ".zip": return ".zip";
                case ".kmz": return ".kmz, .kml";
                case ".xlsx": return ".xlsx, .xls";
                case ".csv": return ".csv";
            }
    }
    render() {
        const formatTypeValue = this.state.formatType;

        let renderFormatType;
        if (isNullOrUndefined(formatTypeValue) || formatTypeValue == 0) {
            this.acceptedFileExtensions = ""
            renderFormatType = (null)
        }
        if (formatTypeValue == 1) {
            this.acceptedFileExtensions = ".zip"
            renderFormatType =
                <div className="flex-item flex-auto" style={{ fontSize: "85%", textIndent: "1em", marginTop: "2px", marginBottom: "2px" }}>
                    {nls.nls.importData.formatType1Description}
                    <div>
                        <a href={'public/eit/Services/SampleData/Requirements_SHAPE.pdf'} target="_blank" >{nls.nls.importData.formatType1Requirements}</a>
                    </div> <div>
                        <a href={'public/eit/Services/SampleData/SampleData_SHAPE.zip'} target="_blank" >{nls.nls.importData.formatType1SampleLink}</a>
                    </div>
                </div>
        }
        else if (formatTypeValue == 2) {
            this.acceptedFileExtensions = ".kmz"
            renderFormatType =
                <div className="flex-item flex-auto" style={{ fontSize: "85%", textIndent: "1em", marginTop: "2px", marginBottom: "2px" }}>
                    {nls.nls.importData.formatType2Description}
                    <div>
                        <a href={'public/eit/Services/SampleData/Requirements_KMZ(KML).pdf'} target="_blank" >{nls.nls.importData.formatType2Requirements}</a>
                    </div> <div>
                        <a href={'public/eit/Services/SampleData/SampleData_KMZ(KML).kmz'} target="_blank" >{nls.nls.importData.formatType2SampleLink}</a>
                    </div>
                </div>
        }
        else if (formatTypeValue == 3) {
            this.acceptedFileExtensions = ".xlsx"
            renderFormatType =
                <div className="flex-item flex-auto" style={{ fontSize: "85%", textIndent: "1em", marginTop: "2px", marginBottom: "2px" }}>
                    {nls.nls.importData.formatType3Description}
                    <div>
                        <a href={'public/eit/Services/SampleData/Requirements_EXCEL.pdf'} target="_blank" >{nls.nls.importData.formatType3Requirements}</a>
                    </div> <div>
                        <a href={'public/eit/Services/SampleData/SampleData_EXCEL.xlsx'} target="_blank" >{nls.nls.importData.formatType3SampleLink}</a>
                    </div>
                </div>
        }
        else if (formatTypeValue == 4) {
            this.acceptedFileExtensions = ".csv"
            renderFormatType =
                <div className="flex-item flex-auto" style={{ fontSize: "85%", textIndent: "1em", marginTop: "2px", marginBottom: "2px" }}>
                    {nls.nls.importData.formatType4Description}
                    <div>
                        <a href={'public/eit/Services/SampleData/Requirements_CSV.pdf'} target="_blank" >{nls.nls.importData.formatType4Requirements}</a>
                    </div> <div>
                        <a href={'public/eit/Services/SampleData/SampleData_CSV.csv'} target="_blank" >{nls.nls.importData.formatType4SampleLink}</a>
                    </div>
                </div>
        }

        return (
            <div style={{ overflow: "hidden auto", height: "100%" }}>
                <div className="vertical-flex-container" style={{ height: "100%", maxHeight: "100%", overflowY: "auto", overflowX: "hidden" }}>
                    <OverlayLoader size="60px" show={this.state.loading} />
                    <div className="flex-item flex-auto">
                        <p style={{ fontSize: "85%", textIndent: "1em", marginTop: "2px", marginBottom: "2px" }}>{nls.nls.importData.promptText}</p>
                    </div>
                    <div className="flex-item flex-auto" style={{ fontSize: "85%", marginTop: "15px", marginBottom: "10px"}} >
                        <p style={{ textIndent: "2em", textDecoration: "underline lightgrey" }}>
                        {nls.nls.importData.importGuidelinesText}
                        </p>
                        <div style={{ fontWeight: "bold" }}>
                            <a href={'public/eit/Services/SampleData/GuidelinesForImportingData.docx'} target="_blank" style={{ marginLeft: "15px" }} >{nls.nls.importData.importGuidelinesFile}</a>
                        </div>
                    </div>
                    <div className="flex-item flex-auto horizontal-wrapping-flex-container">
                        <div className="flex-item flex-scalable vertical-flex-container" style={{ justifyContent: "center", minWidth: "100%" }}>
                            <FloatingLabelInput
                                isRequired={true}
                                requiredMsg={' *'}
                                placeholder={nls.nls.importData.importFormatType}
                                value={this.state.formatType}
                                selectorItems={{ 0: '', 1: nls.nls.importData.formatType1, 2: nls.nls.importData.formatType2, 3: nls.nls.importData.formatType3, 4: nls.nls.importData.formatType4 }}
                                onValueChange={(newValue: string | number | undefined, hasError: boolean) => this.onValueChange(newValue, hasError, FieldNames.formatType)} />
                            {renderFormatType}

                            {/* {(isNullOrUndefined(this.state.formatType) || this.state.formatType == 0) ?
                                (null) :
                                this.state.formatType == 1 ?
                                    (<div className="flex-item flex-auto">
                                        <p style={{ fontSize: "85%", textIndent: "1em", marginTop: "2px", marginBottom: "2px" }}>
                                            {nls.nls.importData.formatType1Description}
                                            <a href={'public/eit/law.htm'} target="_blank" >{nls.nls.importData.formatType1SampleLink}</a>
                                        </p>
                                    </div>) :
                                    (<div className="flex-item flex-auto">
                                        <p style={{ fontSize: "85%", textIndent: "1em", marginTop: "2px", marginBottom: "2px" }}>
                                            {nls.nls.importData.formatType2Description}
                                            <a href={'public/eit/law.htm'} target="_blank" >{nls.nls.importData.formatType2SampleLink}</a>
                                        </p>
                                    </div>)
                            } */}
                        </div>
                        <div className="flex-item flex-scalable vertical-flex-container" style={{ justifyContent: "center", minWidth: "100%", marginTop: 10 }}>
                            <FloatingLabelInput
                                isRequired={true}
                                requiredMsg={' *'}
                                placeholder={nls.nls.importData.importInfrastructureType}
                                value={this.state.infrastructureType}
                                selectorItems={{ ...{ 0: '' }, ...nls.nls.importData.infrastructureType }}
                                onValueChange={(newValue: string | number | undefined, hasError: boolean) => this.onValueChange(newValue, hasError, FieldNames.infrastructureType)} />
                            {/* {(isNullOrUndefined(this.state.infrastructureType) || this.state.infrastructureType == 0) ?
                                (null) :
                                (<div className="flex-item flex-auto">
                                    <p style={{ fontSize: "85%", textIndent: "1em", marginTop: "2px", marginBottom: "2px" }}>{nls.nls.importData.infrastructureTypeDescription[this.state.infrastructureType]}</p>
                                </div>)
                            } */}
                        </div>
                        <div className="flex-item flex-scalable vertical-flex-container" style={{ justifyContent: "center", marginTop: 15, minWidth: "100%" }} >
                            <button className="appBtn flex-item"
                                disabled={(isNullOrUndefined(this.state.formatType) || this.state.formatType == 0 ||
                                    isNullOrUndefined(this.state.infrastructureType) || this.state.infrastructureType == 0)}
                                onClick={this.onUploadPackage}
                                style={{ minWidth: "150px", width: "97%", maxHeight: "30px", marginTop: "10px" }}>
                                <span>{nls.nls.importData.uploadFileButton}</span>
                            </button>
                            {(isNullOrUndefined(this.state.files) || this.state.files.length == 0) ?
                                (null) :
                                (<div className="flex-item flex-auto">
                                    <p style={{ fontSize: "85%", textIndent: "1em", marginTop: "2px", marginBottom: "2px" }}>{nls.nls.importData.fileForUpload}</p>
                                    {Array.from(this.state.files).map(file => (
                                        <div key={file.name} style={{ fontSize: "85%", paddingLeft: 5, boxShadow: '0 2px 8px 0 rgba(0, 0, 0, 0.2), 0 3px 20px 0 rgba(0, 0, 0, 0.19)', background: "lightyellow", marginTop: "2px", marginBottom: "2px" }}>{
                                            <React.Fragment>
                                                {nls.nls.importData.fileNameLabel} <b>{file.name} </b>
                                                <br />
                                                {nls.nls.importData.fileSizeLabel} {this.formatBytes(file.size)}
                                            </React.Fragment>
                                        }
                                        </div>
                                    ))}
                                </div>)
                            }
                        </div>

                        {(isNullOrUndefined(this.state.files) || this.state.files.length == 0) ?
                            (null) :
                            (<div className="flex-item flex-scalable vertical-flex-container" style={{ justifyContent: "center", minWidth: "100%", marginTop: 10 }}>
                                <FloatingLabelInput
                                    isRequired={true}
                                    requiredMsg={' *'}
                                    type='date'
                                    placeholder={nls.nls.importData.revisionDateType}
                                    value={this.state.revisionDate}
                                    onValueChange={(newValue: string | number | Moment | undefined, hasError: boolean) => {
                                        this.onValueChange(newValue, hasError, FieldNames.revisionDate)
                                    }
                                    }
                                />
                                <FloatingLabelInput
                                    isRequired={true}
                                    requiredMsg={' *'}
                                    placeholder={nls.nls.importData.importCredibility}
                                    value={this.state.credibility}
                                    selectorItems={{ ...{ 0: '' }, ...nls.nls.importData.credibilityType }}
                                    onValueChange={(newValue: string | number | undefined, hasError: boolean) => {
                                        this.onValueChange(newValue, hasError, FieldNames.credibility)
                                    }}
                                />
                                <FloatingLabelInput
                                    type="text"
                                    placeholder={nls.nls.importData.keyWords}
                                    value={this.state.keyWords}
                                    onValueChange={(newValue: string, hasError: boolean) => this.onValueChange(newValue, hasError, FieldNames.keyWords)}
                                />
                            </div>)}

                        <div className="flex-item flex-scalable vertical-flex-container" style={{ justifyContent: "center", minWidth: "100%" }}>
                            <button className="appBtn flex-item"
                                disabled={this.isFormValid()}
                                onClick={this.performProcess}
                                style={{ minWidth: "150px", width: "97%", maxHeight: "30px", marginTop: "10px" }}>
                                <span>{nls.nls.importData.processFileButton}</span>
                            </button>
                        </div>
                        {isNullOrUndefined(this.state.processSuccess) ?
                            (null) :
                            this.state.processSuccess ?
                                (<div className="flex-item" style={{ marginTop: "10px" }}>
                                    <p style={{ color: "green" }}>{nls.nls.importData.processSuccess}</p>
                                </div>) :
                                (<div className="flex-item" style={{ marginTop: "10px" }}>
                                    <p style={{ color: "red" }}>{this.state.code ? `${nls.nls.importData.processFailure}  Code: ${this.state.code}` : nls.nls.importData.processFailure}</p>
                                </div>)
                        }
                    </div>
                    <input ref={this.customFileReader} type="file" onChange={(evt => this.onUploadPackageChanged(evt))} style={{ display: "none" }} accept={this.getAcceptedFiles()} />
                </div>
            </div>
        )
    }
}

const mapStateToProps = (state: IEITAppStore) => ({
    userInfo: state.eit.userInfo,
    defaultFormType: 0,
})

export default connect<OwnProps, any, any>(mapStateToProps, {})(ImportDataForm);
