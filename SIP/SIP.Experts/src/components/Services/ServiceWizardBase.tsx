import * as React from "react";
import axios from "axios";
import { nls } from "../nls";
import { IEITAppStore, IUserInfo } from "../../interfaces/reducers/IEITAppStore";
import { isNullOrUndefined } from 'util';
import OverlayLoader from "../../core/components/Loading/OverlayLoading";
import ServiceLoginPane from "./ServiceLoginPane";
import ServiceRequestPane from "./ServiceRequestPane";
import ServiceSpatialRangePane from "./ServiceSpatialRangePane";
import ServiceSigningPane from "./ServiceSigningPane";
import ServiceResultPane from "./ServiceResultPane";
import EITRegixResult from '../../enums/EITRegixResult';
import EITAppWindow from '../../enums/EITAppWindow';
import { IMapDispatcher, IMosaicLayoutDispatcher, IMobileRibbonsDispatcher } from "../../core/interfaces/dispatchers";
import Geoprocessor = require('esri/tasks/Geoprocessor');
import { eitAppConfig } from '../../eitAppConfig';
import EITInfrastructureType from '../../enums/EITInfrastructureType';
import { connect } from 'react-redux';
import { AttachmentInfo } from "../Widgets/AttachmentsEditing";
import { formatDate } from "../Widgets/FloatingLabelInput";
import { hideWindow } from "../../actions/helpers/toggleWindowHelper";

interface InternalState {
    serviceNr: number;
    title: string;
    steps: WizardStep[],
    loading: boolean;
    introHTMLContent: string;
    currentStep: number;
    introUrl?: string;
    addIntroUrl?: string;
    authenticationState?: IServiceFormInternalState;
    requestState?: IServiceFormInternalState & any;
    spatialRangeState?: IServiceFormInternalState & any;
    signingState?: IServiceFormInternalState;
    serviceFee?: number;
    infrastructureTypes?: string;
    incoming_number?: string;
    processingError?: boolean;
}

export interface IServiceFormInternalState {
    loading: boolean;
    formIsValid: boolean;
    pdfUrl?: string;
    shapeUrl?: string;
}

export interface IServiceWizardParameterDispatcher {
    serviceNr: number;
    onStateChange: (state: IServiceFormInternalState) => void;
}

export interface DispatchProps extends IMapDispatcher, IMosaicLayoutDispatcher, IMobileRibbonsDispatcher {
}

export interface OwnProps {
    loading: boolean;
    ip_address: string;
    browser_info: string;
    userInfo: IUserInfo;
    defaultName: string;
    defaultEmail: string;
    eitServices: any;
    isMobile: boolean,
}

export enum WizardStep {
    login = 'login',
    spatialRange = 'spatialRange',
    request = 'request',
    parameters = 'parameters',
    signing = 'signing',
    result = 'result',
}

interface ParentProps {
}

export const eitInfrastructureTypeKeys: string[] = [
    EITInfrastructureType.CommunicationNet,
    EITInfrastructureType.Communication,
    EITInfrastructureType.Electric,
    EITInfrastructureType.StreetLight,
    EITInfrastructureType.Gas,
    EITInfrastructureType.Thermal,
    EITInfrastructureType.Sewer,
    EITInfrastructureType.MunRoad,
    EITInfrastructureType.Road,
    EITInfrastructureType.Port,
    EITInfrastructureType.AirPort,
    EITInfrastructureType.RailRoad,
    EITInfrastructureType.Subway,
]

export type Props = DispatchProps & OwnProps & ParentProps;

const initialFormState: IServiceFormInternalState = { loading: false, formIsValid: false };

export class ServiceForm extends React.Component<Props, InternalState> {
    constructor(props: Props) {
        super(props);
        this.state = {
            serviceNr: 1,
            title: '',
            steps: [WizardStep.result],
            loading: false,
            introHTMLContent: '',
            currentStep: 0,
            authenticationState: initialFormState,
            requestState: initialFormState,
            spatialRangeState: initialFormState,
            signingState: initialFormState,
            infrastructureTypes: '',
            incoming_number: '',
            processingError: false,
            //spatialRange: this.state.spatialRangeState ? this.state.spatialRangeState : undefined,
        };
    }

    getInfrastructureType = (infrastructureTypes: { [key: string]: boolean }, networkOperatorDeclared: boolean): void => {
        const infrastructureArr = Array<string>();
        for (const infrastructureTypeKey in infrastructureTypes) {
            if (true) {
                const boolValue = infrastructureTypes[infrastructureTypeKey];
                if (boolValue) {
                    infrastructureArr.push(nls.nls.infrastructureTypes[infrastructureTypeKey])
                }
            }
        }
        infrastructureArr.push(`Организацията е мрежови оператор: ${networkOperatorDeclared}`);
        const resulstInfrTypeString = infrastructureArr.join('; ');
        this.setState({
            ...this.state,
            infrastructureTypes: resulstInfrTypeString,
        });
    }

    fetchText = (url: string | undefined): void => {
        if (!(!!url)) return;
        try {
            (axios.get(url)).then((response: any) => {
                this.setState({
                    introHTMLContent: response.data,
                });
            }).catch((error: Error) => { console.error(error); });
        }
        catch (e) {
            console.error(e);
        }
    }
    componentWillMount() {
        //this.fetchText(this.state.addIntroUrl);
    }
    componentDidMount() {
        this.fetchText(this.state.addIntroUrl);
    }

    AEqualsB = (step: number, stepB: WizardStep) => {
        let stepIndexB: number = this.state.steps.indexOf(stepB);
        if (stepIndexB == -1) return false;
        return (step == stepIndexB);
    }
    getFormIsValid = (formState: any): boolean => {
        return !isNullOrUndefined(formState) && formState.formIsValid;
    }
    canGoBack = (): boolean => {
        return this.state.currentStep > 0 && 
        this.state.currentStep < this.state.steps.length - 1 && 
        (!this.state.signingState || !(this.state.signingState as any).paid) &&
        !this.state.processingError;
    }
    canGoForward = (): boolean => {
        if (this.state.processingError) {
            return true;
        }
        if (this.AEqualsB(this.state.currentStep, WizardStep.login)) {
            return this.getFormIsValid(this.state.authenticationState);
        }
        if (this.AEqualsB(this.state.currentStep, WizardStep.request)) {
            return this.getFormIsValid(this.state.requestState);
        }
        if (this.AEqualsB(this.state.currentStep, WizardStep.spatialRange)) {
            return this.getFormIsValid(this.state.spatialRangeState);
        }
        if (this.AEqualsB(this.state.currentStep, WizardStep.signing)) {
            return this.getFormIsValid(this.state.signingState);
        }
        return (this.state.currentStep == this.state.steps.length - 1);
    }
    onGoBackClick = (event: React.MouseEvent<HTMLElement>): void => {
        this.setState({
            ...this.state,
            currentStep: this.state.currentStep - 1,
        });
    }
    onGoForwardClick = (event: React.MouseEvent<HTMLElement>): void => {

        // if (this.state.currentStep == this.state.steps.length - 2 && this.state.serviceNr > 4) {
        //     if (this.state.serviceNr === 51) {
        //         this.executeService51().then(r => {
        //             this.setState({
        //                 ...this.state,
        //                 currentStep: this.state.currentStep + 1,
        //                 incoming_number: r
        //             });
        //         })
        //     }
        // } else {
        if (this.state.currentStep == this.state.steps.length - 1 || this.state.processingError) {
            hideWindow(this.props, EITAppWindow['adService' + this.state.serviceNr.toString() + 'Wizard']);
                return;
            }
            if (this.state.steps[this.state.currentStep] == WizardStep.spatialRange) {
                this.props.unMark();
            }
            if ([51, 52, 53].indexOf(this.state.serviceNr) > -1 && this.state.steps[this.state.currentStep] == WizardStep.signing) {
                let incomingNumber: any;
                if (this.state.serviceNr === 51) {
                    this.executeService51().then(incomingNumberResult => {
                        incomingNumber = incomingNumberResult;
                    })
                }
                this.geoprocessingService5x().then(res => {
                    if (this.state.serviceNr === 51) {
                        this.setState({
                            ...this.state,
                            currentStep: this.state.currentStep + 1,
                            incoming_number: incomingNumber
                        });
                    } else if (res) {
                        this.setState({
                            ...this.state,
                            currentStep: this.state.currentStep + 1
                        });                        
                    }

                }).catch(err => {
                    // to do
                })
                return;
            }
            this.setState({
                ...this.state,
                currentStep: this.state.currentStep + 1,
            });
        // }
    }

    executeService51(): Promise<string> {
        let resultDocumentId = "";
        return new Promise((resolve, reject) => {
            let data = this.constructDataForService51();
            axios.post(eitAppConfig.eDeliveryService, data, //
                {
                    headers: {
                        'Content-Type': 'application/json',
                    }
                }).then(r => {
                    resultDocumentId = r.data;
                    resolve(resultDocumentId);
                }).catch(e => {
                    reject(e);
                })
            // axios.post("http://localhost:6690/api/eDelivery/TestMethods", {},
            // {
            //     headers: {
            //         'Content-Type': 'application/json',
            //     }
            // }).then(r => {
            //     resultDocumentId = r.data;
            //     resolve(resultDocumentId);
            // }).catch(e => {
            //     reject(e);
            // })
        })
    }

    constructDataForService51(): FormData {
        // let data = new FormData();
        let serviceData51 = Object.assign({}, this.props.eitServices[51]);

        // return data;
        return serviceData51;
    }

    mapStepName = (step: WizardStep): string => {
        try {
            return nls.nls.serviceWizard.steps[step].name;
        }
        catch (e) {
            return 'Стъпка ' + (step + 1).toString();
        }
    }
    mapStepDescription = (step: WizardStep): string => {
        try {
            if (step == WizardStep.request && nls.nls.serviceWizard.requestTitleByService.hasOwnProperty(this.state.serviceNr)) {
                return nls.nls.serviceWizard.requestTitleByService[this.state.serviceNr];
            }
            if (step == WizardStep.signing && nls.nls.serviceWizard.previewTitleByService.hasOwnProperty(this.state.serviceNr)) {
                return nls.nls.serviceWizard.previewTitleByService[this.state.serviceNr];
            }
            if (step == WizardStep.result && nls.nls.serviceWizard.resultTitleByService.hasOwnProperty(this.state.serviceNr)) {
                return nls.nls.serviceWizard.resultTitleByService[this.state.serviceNr];
            }
            return nls.nls.serviceWizard.steps[step].description;
        }
        catch (e) {
            return 'Стъпка ' + (step + 1).toString();
        }
    }
    mapStepToVisibility = (step: WizardStep): boolean => {
        return this.state.steps[this.state.currentStep] == step;
    }
    mapStepToGoForward = (): string => {
        let step: number = this.state.currentStep;
        let steps: WizardStep[] = this.state.steps;
        if (step == steps.length - 1 || this.state.processingError) {
            return nls.nls.serviceWizard.close;
        }
        if (step == steps.length - 2 &&
            nls.nls.serviceWizard.submitTitleByService.hasOwnProperty(this.state.serviceNr)) {
            return nls.nls.serviceWizard.submitTitleByService[this.state.serviceNr];
        }
        return nls.nls.serviceWizard.goForward;
    }
    mapStepToGoForwardIconPath = (): string => {
        let step: number = this.state.currentStep;
        let steps: WizardStep[] = this.state.steps;
        if (step == steps.length - 1 || this.state.processingError) {
            return 'public/eit/Services/exit32.png';
        }
        if (step == steps.length - 2) {
            return 'public/eit/Services/submit32.png';
        }
        return 'public/eit/Services/arrowForth32.png';
    }

    onAuthenticationStateChange = (newState: IServiceFormInternalState): void => {
        this.setState({
            authenticationState: { ...newState }
        });
    }
    onRequestStateChange = (newState: IServiceFormInternalState): void => {
        this.setState({
            requestState: { ...newState }
        });
        /*
        if ((newState as any).regixResult == EITRegixResult.Error) {
            this.setState({
                processingError: true
            });
        } else {
            this.setState({
                processingError: false
            });
        }
        */
    }
    onSpatialRangeStateChange = (newState: IServiceFormInternalState): void => {
        this.setState({
            spatialRangeState: { ...newState }
        });
    }
    onSigningStateChange = (newState: IServiceFormInternalState): void => {
        this.setState({
            signingState: { ...newState }
        });
    }

    geoprocessingService1 = (): Promise<{loading: boolean, jobId: string, pdfUrl: string, shapeUrl: string}> => {
        return new Promise((resolve, reject) => {
            //console.log("Service 1");
            let requestState: any = this.state.requestState;
            const inputGeometry = JSON.stringify(this.state.spatialRangeState.spatialRange);
            const authorizedPersonName = this.props.userInfo.user.autorizedpersonname;
            const organizationName = this.props.userInfo.user.organizationname;
            const userToken = this.props.userInfo.token;
            const infrastructureType = this.state.infrastructureTypes;
            const identificationCode = requestState.identificationcode; // Why God, 'user.identificationcode' is often undefined especially for admin user? : this.props.userInfo.user.identificationcode;
            const requestVectorData = this.state.spatialRangeState.vectorDataSelected; //this.state.vectorDataSelected;
            const service_parameters = {
                applicationDate: requestState. applicationDate,
                authorizedpersonname: requestState.authorizedpersonname,
                organizationname: requestState.organizationname,
                identificationcode: identificationCode,
                email: requestState.email,
                contactdata: requestState.contactdata,
                spatialRange: this.state.spatialRangeState.spatialRange.toJSON(), //this.state.spatialRangeState.spatialRange,
                vectorDataSelected: this.state.spatialRangeState.vectorDataSelected,
                spatialRangeArea: this.state.spatialRangeState.spatialRangeArea,
                amountDue: this.state.spatialRangeState.amountDue,
                infrastructureTypes: this.state.requestState.infrastructureTypes,
                networkOperatorDeclared: this.state.requestState.networkOperatorDeclared,
            };
            var gpUrl = eitAppConfig.layers.Service1Geoprocessing;  //"http://eit1061.gisinv.bg/arcgis/rest/services/EITServices/Service1/GPServer/Service1";
            const gp = new Geoprocessor();
            gp.url = gpUrl;

            const params = {
                input_geometry: inputGeometry,
                arcgis_token: userToken,
                organization_name: organizationName,
                identification_code: identificationCode,
                authorized_person_name: authorizedPersonName,
                infrastructure_type: infrastructureType,
                vector_requested: requestVectorData,
                service_parameters: JSON.stringify(service_parameters),
                //id_of_executed_service: 1,
                referer: window.location.origin,
            };

            let jobId = "";
            const pdfFolder = "pdf_result";
            const shapeFolder = "shp_result";
            const  incNumberFolder = "incoming_number";
            let pdfUrl = "";
            let shapeUrl = "";
            let incomingNumber = "";

            gp.submitJob(params).then((res) => {
                jobId = res.jobId;
                console.log(res);
                //console.log(jobId);
                return gp.getResultData(jobId, pdfFolder);;
            })
                .then((res) => {
                    console.log(res);
                    pdfUrl = res.value;
                    return pdfUrl;
                }).then((res) => {
                    //console.log("PDF URL: " + this.state.pdfUrl);
                    return gp.getResultData(jobId, shapeFolder);
                })
                .then((res) => {
                    shapeUrl = res.value;
                    return shapeUrl;
                }).then((res) => {
                    return gp.getResultData(jobId, incNumberFolder);
                }).then((res) => {
                    incomingNumber = res.value;

                    this.setState({
                        ...this.state,
                        incoming_number: incomingNumber
                    });

                    resolve({loading: false, jobId: jobId, pdfUrl: pdfUrl, shapeUrl: shapeUrl});
                }).catch(e => {
                    this.setState({
                        processingError: true,
                    });
                    //reject(console.log(e));
                    console.log(e)
                    {reject(e)}
                });
        })
    }

    geoprocessingService2 = (): Promise<{loading: boolean, jobId: string, pdfUrl: string, shapeUrl: string}> => {
        return new Promise((resolve, reject) => {
            //console.log("Service 2")
            let requestState: any = this.state.requestState;
            const inputGeometry = JSON.stringify(this.state.spatialRangeState.spatialRange); 
            const authorizedPersonName = this.props.userInfo.user.autorizedpersonname;
            const organizationName = this.props.userInfo.user.organizationname;
            const userToken = this.props.userInfo.token;
            const infrastructureType = this.state.infrastructureTypes;
            const identificationCode = requestState.identificationcode; // this.props.userInfo.user.identificationcode;
            const requestVectorData = this.state.spatialRangeState.vectorDataSelected; //this.state.vectorDataSelected;
            const service_parameters = {
                applicationDate: requestState. applicationDate,
                authorizedpersonname: requestState.authorizedpersonname,
                organizationname: requestState.organizationname,
                identificationcode: identificationCode,
                email: requestState.email,
                contactdata: requestState.contactdata,
                spatialRange: this.state.spatialRangeState.spatialRange.toJSON(),
                vectorDataSelected: this.state.spatialRangeState.vectorDataSelected,
                spatialRangeArea: this.state.spatialRangeState.spatialRangeArea,
                amountDue: this.state.spatialRangeState.amountDue,
                infrastructureTypes: this.state.requestState.infrastructureTypes,
                networkOperatorDeclared: this.state.requestState.networkOperatorDeclared,
            };
            var gpUrl = eitAppConfig.layers.Service2Geoprocessing;  //"http://eit1061.gisinv.bg/arcgis/rest/services/EITServices/Service2/GPServer/Service2";
            const gp = new Geoprocessor();
            gp.url = gpUrl;

            const params = {
                input_geometry: inputGeometry,
                arcgis_token: userToken,
                organization_name: organizationName,
                identification_code: identificationCode,
                authorized_person_name: authorizedPersonName,
                infrastructure_type: infrastructureType,
                vector_requested: requestVectorData,
                service_parameters: JSON.stringify(service_parameters),
                //id_of_executed_service: 2,
                referer: window.location.origin,
            };

            let jobId = "";
            const pdfFolder = "pdf_result";
            const shapeFolder = "shp_result"
            const  incNumberFolder = "incoming_number";
            let pdfUrl = "";
            let shapeUrl = "";
            let incomingNumber = "";

            gp.submitJob(params).then((res) => {
                jobId = res.jobId;
                console.log(res);
                //console.log(jobId);
                return gp.getResultData(jobId, pdfFolder);;
            })
                .then((res) => {
                    console.log(res);
                    pdfUrl = res.value;
                    return pdfUrl;
                }).then((res) => {
                    //console.log("PDF URL: " + this.state.pdfUrl);
                    return gp.getResultData(jobId, shapeFolder);
                })
                .then((res) => {
                    shapeUrl = res.value;
                    return shapeUrl;
                }).then((res) => {
                    return gp.getResultData(jobId, incNumberFolder);
                }).then((res) => {
                    incomingNumber = res.value;

                    this.setState({
                        ...this.state,
                        incoming_number: incomingNumber
                    });

                    resolve({loading: false, jobId: jobId, pdfUrl: pdfUrl, shapeUrl: shapeUrl});
                }).catch(e => {
                    this.setState({
                        processingError: true,
                    });
                    //reject(console.log(e));
                    console.log(e)
                    {reject(e)}
                });
        })
    }

    uploadAttachment = (uploadUrl: string, file: File): Promise<string> => {
        let formdata = new FormData();
        formdata.append("file", file);
        formdata.append("f", 'json');
        formdata.append("description", '');
        return new Promise((resolve, reject) => {
            axios.post(uploadUrl, formdata)
                .then(({ data }) => {
                    if (data.success) {
                        resolve(data.item.itemID);
                    }
                    else {
                        reject('Failure');
                    }
                }).catch(err => { reject(err) });
        });
    }
    uploadAttachments = (uploadUrl: string, attachments: AttachmentInfo[]): Promise<string[]> => {
        return new Promise((resolve, reject) => {
            if (attachments.length > 0) {
                let uploadAttachmentPromises: Promise<string>[] = [];
                attachments.forEach((attachment: AttachmentInfo) => {
                    if (!isNullOrUndefined(attachment.file)){
                        uploadAttachmentPromises.push(this.uploadAttachment(uploadUrl, attachment.file));
                    }
                });
                Promise.all(uploadAttachmentPromises).then((results: string[]) => {
                    resolve(results);
                }).catch(err => {
                    console.error(err);
                    reject(err);
                });
            }
            else {
                resolve([]);
            }
        });
    }
    geoprocessingService5x = (): Promise<boolean> => {
        let requestState: any = this.state.requestState as any;
        // Populating common parameters
        let attachments: AttachmentInfo[] = [];
        let recipient_ids: string[] = [];
        let serviceparameters : any = {
            applicationDate: requestState.applicationDate,
            recipient: requestState.recipient,
            authorizedpersonname: requestState.authorizedpersonname,
            organizationname: requestState.organizationname,
            identificationcode: requestState.identificationcode,
            email: requestState.email,
            contactdata: requestState.contactdata,
            subject: requestState.subject,
            message: requestState.message,
        };
        // Populating service specific parameters
        switch (this.state.serviceNr) {
            case 51:
                // 51 has no extra service parameters
                recipient_ids = [requestState.recipientid];
                break;
            case 52:
                serviceparameters = {
                    ...serviceparameters,
                    settlement: requestState.settlement,
                    usageterm: { from: formatDate(requestState.usagetermfrom as Date | string, false), to: formatDate(requestState.usagetermto as Date | string, false)},
                };
                attachments = requestState.attachments as AttachmentInfo[];
                recipient_ids = [requestState.recipientid];
                break;
            case 53:
                serviceparameters = {
                    ...serviceparameters,
                    recipients: requestState.recipients,
                    settlement: requestState.settlement,
                };
                attachments = [requestState.attachment53_1 as AttachmentInfo, requestState.attachment53_2 as AttachmentInfo];
                recipient_ids = requestState.recipientids;
                break;
        }
       
        const uploadUrl: string = eitAppConfig.EITServices[`Service${this.state.serviceNr}`].UploadUrl;
        const gpUrl: string = eitAppConfig.EITServices[`Service${this.state.serviceNr}`].GPUrl;
        let params = {
            arcgis_token: this.props.userInfo.token,
            token_referer: window.location.origin,
            recipient_ids: JSON.stringify(recipient_ids), //recipient_ids.join(";"),
            subject: requestState.subject,
            message_text: requestState.message,
            service_parameters: JSON.stringify(serviceparameters),
            ip_address: this.props.ip_address,
            browser_info: this.props.browser_info,
            attachments: '',
        };
        const gp = new Geoprocessor();
        gp.url = gpUrl;
        return new Promise((resolve, reject) => {
            this.uploadAttachments(uploadUrl, attachments).
                then((result) => {
                    params.attachments = JSON.stringify(result); // result.join(";");
                    console.log(params);
                    gp.execute(params).then((res) => {
                        return res.results[0].value;
                    }).then(res => {
                        if (res) {
                            this.setState({
                                ...this.state,
                                incoming_number: res,
                            });
                            resolve(true);
                        }
                        else {
                            this.setState({
                                processingError: true,
                            });
                            resolve(false);
                        }
                        }).catch(err => {
                            this.setState({
                                processingError: true,
                            })
                        console.log(err);
                        resolve(false);
                    });
                });
        });
    }

    render() {
        //console.log(this.state.requestState);
        //console.log(this.state.spatialRangeState);
        let serviceFee: number = this.state.serviceFee ? this.state.serviceFee : 0;
        let vectorDataChoiceAvailable: boolean = [1, 2].indexOf(this.state.serviceNr) > -1;
        let htmlStyle = {paddingLeft: "10px", paddingRight: "10px", height: "", overflow: "", };
        htmlStyle = (this.props.isMobile && this.state.introHTMLContent) ? {...htmlStyle, height: "25%", overflow: "hidden auto"} : htmlStyle;
        //const samplePdfUrl = "../../public/eit/Services/SampleData/EIT_ElectronicCommunicationNetwork.pdf";
        //const sampleShapeUrl = "../../public/eit/Services/SampleData/EIT_ElectronicCommunicationNetwork.zip";
        return (
            <div className="vertical-flex-container"
                style={{ width: "100%", height: "100%", paddingBottom: "0px", paddingTop: "0px", overflowX: "hidden", overflowY: "auto" }}>
                <OverlayLoader size="60px" show={this.state.loading} />
                {
                    this.mapStepToVisibility(WizardStep.request) ?
                        <div className="flex-item flex-auto" style={htmlStyle}>
                            <div dangerouslySetInnerHTML={{ __html: this.state.introHTMLContent }} />
                        </div>
                        : null
                }
                <div className="flex-item flex-auto horizontal-wrapping-flex-container">
                    <span style={{ fontSize: "130%", textIndent: "1em", marginTop: "2px", marginBottom: "2px", paddingRight: "22px" }}>{this.mapStepDescription(this.state.steps[this.state.currentStep])}</span>
                    <a href={this.state.introUrl}
                        target="_blank"
                        style={{ position: "absolute", right: "0px", top: "0px", width: "20px", height: "20px" }}>
                        <button className="appBtn" style={{ width: "20px", height: "20px", padding: "0px" }}>
                            <img style={{ width: "20px", height: "20px" }} src='public/eit/Services/Info32.png' />
                        </button>
                    </a>
                </div>
                <div className="flex-item flex-scalable" style={{ overflowX: "hidden", overflowY: "auto", scrollBehavior: "smooth", width: "100%", height: "100%" }}>
                    {
                        this.mapStepToVisibility(WizardStep.login) ?
                            <ServiceLoginPane
                                serviceNr={this.state.serviceNr}
                                onStateChange={this.onAuthenticationStateChange}
                                previousState={this.state.authenticationState} /> :
                            this.mapStepToVisibility(WizardStep.request) ?
                                <ServiceRequestPane
                                    serviceNr={this.state.serviceNr}
                                    onStateChange={this.onRequestStateChange}
                                    previousState={this.state.requestState}
                                    isPreview={false}
                                    getInfrastructureType={this.getInfrastructureType} /> :
                                this.mapStepToVisibility(WizardStep.spatialRange) ?
                                    <ServiceSpatialRangePane
                                        serviceNr={this.state.serviceNr}
                                        onStateChange={this.onSpatialRangeStateChange}
                                        vectorDataChoiceAvailable={vectorDataChoiceAvailable}
                                        previousState={this.state.spatialRangeState}
                                        serviceFee={serviceFee}
                                        vectorServiceFee={serviceFee} /> :
                                    this.mapStepToVisibility(WizardStep.signing) ?
                                        <React.Fragment>
                                            <div className="flex-scalable vertical-flex-container"
                                                style={{ height: "100%" }}>
                                                <div className="flex-auto">
                                                    <ServiceRequestPane
                                                        style={{ flexBasis: "auto", flexGrow: 0 }}
                                                        serviceNr={this.state.serviceNr}
                                                        previousState={this.state.requestState}
                                                        onStateChange={this.onRequestStateChange}
                                                        isPreview={true} />
                                                </div>
                                                {[1, 2].indexOf(this.state.serviceNr) > -1 ?
                                                    <div className="flex-auto">
                                                        <ServiceSpatialRangePane
                                                            style={{ flexBasis: "auto", flexGrow: 0 }}
                                                            serviceNr={this.state.serviceNr}
                                                            previousState={this.state.spatialRangeState}
                                                            isPreview={true}
                                                            onStateChange={this.onSpatialRangeStateChange}
                                                            vectorDataChoiceAvailable={vectorDataChoiceAvailable}
                                                            serviceFee={serviceFee}
                                                            vectorServiceFee={serviceFee} />
                                                    </div>
                                                    : null
                                                }
                                                <div className="flex-auto">
                                                    <ServiceSigningPane serviceNr={this.state.serviceNr}
                                                        style={{ flexBasis: "auto", flexGrow: 0 }}
                                                        amountDue={this.state.spatialRangeState ? this.state.spatialRangeState.amountDue : 0}
                                                        previousState={this.state.signingState}
                                                        onStateChange={this.onSigningStateChange}
                                                        triggerGeoprocessing={this.state.serviceNr === 1 ? this.geoprocessingService1 : this.geoprocessingService2}  //this.state.serviceNr === 1 ? this.geoprocessingService1 : this.geoprocessingService2;
                                                    />
                                                </div>
                                                <div className="flex-scalable">
                                                    &nbsp;
                                                </div>
                                            </div>
                                        </React.Fragment> :
                                        this.mapStepToVisibility(WizardStep.result) ?
                                            <ServiceResultPane
                                                serviceNr={this.state.serviceNr}
                                                vectorDataSelected={this.state.spatialRangeState ? this.state.spatialRangeState.vectorDataSelected : false}
                                                pdfUrl={this.state.signingState? this.state.signingState.pdfUrl : null}
                                                shapeUrl={this.state.signingState? this.state.signingState.shapeUrl : null}
                                                incoming_number={this.state.incoming_number} /> :
                                            (null)
                    }
                </div>
                {
                    this.state.processingError ?
                        <div className="flex-item flex-auto horizontal-wrapping-flex-container"
                            style={{ paddingBottom: "10px", paddingTop: "10px" }}>
                            <p className="flex-item flex-auto" style={{ width: "100%" }}>{nls.nls.serviceWizard.processingError}</p> :
                        </div>
                        : null
                }
                {
                    this.state.steps.length > 0 ?
                        <div className="flex-item flex-auto horizontal-wrapping-flex-container"
                            style={{ paddingBottom: "10px", paddingTop: "10px" }}>
                            {
                                this.canGoBack() ?
                                    <button className="appBtn"
                                        disabled={!this.canGoBack()}
                                        onClick={this.onGoBackClick}
                                        style={{ height: "30px", flexGrow: 0, flexBasis: "180px", marginBottom: "10px" }}>
                                        <img src="public/eit/Services/arrowBack32.png" style={{ width: "20px", height: "20px" }} />
                                        <span>&nbsp;{nls.nls.serviceWizard.goBack}</span>
                                    </button> : null
                            }
                            <button className="appBtn"
                                disabled={!this.canGoForward()}
                                onClick={this.onGoForwardClick}
                                style={{ height: "30px", flexGrow: 0, flexBasis: "180px", marginBottom: "10px" }}>
                                <img src={this.mapStepToGoForwardIconPath()} style={{ width: "20px", height: "20px" }} />
                                <span>&nbsp;{this.mapStepToGoForward()}</span>
                            </button>
                        </div>
                        : null
                }
            </div>
        )
    }
}

export const mapStateToProps = (state: IEITAppStore) => ({
    userInfo: state.eit.userInfo,
    ip_address: state.eit.browserInfo.ip_address,
    browser_info: state.eit.browserInfo.browser_info,
    loading: !state.map.webMapImported,
    defaultName: state.eit.userInfo.username || "",
    defaultEmail: state.eit.userInfo.user.email || "",
    eitServices: state.eit.servicesData,
    isMobile: state.application.mobile,
})

export default connect<OwnProps>(mapStateToProps, {})(ServiceForm)