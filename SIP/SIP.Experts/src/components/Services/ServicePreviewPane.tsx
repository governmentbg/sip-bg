import * as React from "react";
import { connect } from 'react-redux';
import axios from "axios";
import { mosaicLayoutDispatcher } from "../../core/actions/dispatchers";
import { IMosaicLayoutDispatcher } from "../../core/interfaces/dispatchers";
import { IEITAppStore, IUserInfo } from "../../interfaces/reducers/IEITAppStore";
import EITAppWindow from '../../enums/EITAppWindow';
import * as Services from "./ServiceWizardBase";
import OverlayLoader from "../../core/components/Loading/OverlayLoading";
import { toggleWindow } from "../../actions/helpers/toggleWindowHelper";
import { IAdminServicePayload } from "../../actions/dispatchers/serviceActionDispatcher";
import { eitAppConfig } from "../../eitAppConfig";
import { getLayerInfos } from "../../core/reducers/layerInfos";
import { IFeatureLayerInfo, IGraphic, IGeometry } from '../../core/interfaces/models';
import Polygon = require("esri/geometry/Polygon");
import Extent = require("esri/geometry/Extent");
import geometryEngine = require('esri/geometry/geometryEngine');
import jsonUtils = require("esri/geometry/support/jsonUtils");
import { featureLayersAPI } from "../../core/actions/helpers";
import { AttachmentInfo } from "../Widgets/AttachmentsEditing";
import { featureLayersAttachmentsAPI } from "../../core/actions/esri/helpers/featureLayersAttachmentsAPI"
import { IAttachmentResponse, IAttachmentInfo, IQueryAttachmentMappedResponse } from "../../core/interfaces/helpers";
import ServiceRequestPane from "./ServiceRequestPane";
import ServiceSpatialRangePane from "./ServiceSpatialRangePane";
import { formatDate } from "../Widgets/FloatingLabelInput";
import AttachmentsEditing from "../Widgets/AttachmentsEditing";
import { nls } from "../nls";

interface InternalState {
    loading: boolean;
    error: boolean;
    adminServiceData: IAdminServicePayload,
    serviceNr: number;
    requestState?: any;
    spatialRangeState?: any;
    serviceFee?: number;
    results: AttachmentInfo[];
}

interface ParentProps {
}

interface DispatchProps {
}

interface OwnProps {
    userInfo: IUserInfo;
    browser_info: string;
}

export interface SelectedServiceProps {
    adminServiceData: IAdminServicePayload
}

type Props = DispatchProps & ParentProps & SelectedServiceProps & OwnProps;

export class ServicePreviewPane extends React.Component<Props, InternalState> {
    constructor(props: Props) {
        super(props);
        this.state = {
            loading: false,
            error: false,
            adminServiceData: {serviceCode : 0, serviceOID: 0},
            serviceNr: 0,
            results: [],
        };
    }

    componentWillMount() {
    }
    componentDidMount() {
        if (this.props.adminServiceData) {
            this.setState({
                adminServiceData: this.props.adminServiceData,
            });
            this.loadAdminService(this.props.adminServiceData);
        }
    }
    componentWillReceiveProps(props: Props) {
        if (props.adminServiceData &&
            (this.state.adminServiceData.serviceCode != props.adminServiceData.serviceCode) ||
            (this.state.adminServiceData.serviceOID != props.adminServiceData.serviceOID)) {
            this.setState({
                adminServiceData: props.adminServiceData,
            });
            this.loadAdminService(props.adminServiceData);
        }
    }

    loadAdminService = (adminServiceData: IAdminServicePayload): Promise<boolean> => {
        this.setState({
            loading: true,
            error: false,
            serviceNr: 0,
            requestState: undefined,
            spatialRangeState: undefined,
        });
        return new Promise<boolean>((resolve, reject) => {
            this.fetchAttachments(adminServiceData).then(res => {
                this.populateServiceForm(adminServiceData, res);
                resolve(true);
            }).catch(err => {
                console.error(err);
                this.showError();
                resolve(false);
            });
        });
    }

    getFeatureLayerInfo = (serviceNr: number): IFeatureLayerInfo | undefined => {
        switch (serviceNr) {
            case 1:
                return getLayerInfos()[eitAppConfig.layers.ServiceRegisters1];
            case 2:
                return getLayerInfos()[eitAppConfig.layers.ServiceRegisters2];
            case 52:
                return getLayerInfos()[eitAppConfig.layers.ServiceRegisters52];
            case 53:
                return getLayerInfos()[eitAppConfig.layers.ServiceRegisters53];
        }
        return undefined;
    }
    fetchAttachments = (adminServiceData: IAdminServicePayload): Promise<AttachmentInfo[]> => {
        let featureLayerInfo: IFeatureLayerInfo | undefined = this.getFeatureLayerInfo(adminServiceData.serviceCode);
        if (featureLayerInfo) {
            let serviceFeatureLayerInfo: IFeatureLayerInfo = featureLayerInfo!;
            let featureIDs: Array<number> = [adminServiceData.serviceOID];
            return new Promise((resolve, reject) => {
                featureLayersAttachmentsAPI.queryAttachmentsByIds(
                    serviceFeatureLayerInfo!, featureIDs).then((res: IAttachmentResponse) => {
                        let attachmentInfos: IAttachmentInfo[] = [];
                        res.featureAttachmentActions.forEach((feature: IQueryAttachmentMappedResponse) => {
                            feature[adminServiceData.serviceOID].forEach((attachmentInfo: IAttachmentInfo) => {
                                attachmentInfos.push(attachmentInfo);
                            });
                        })
                        let attachments: AttachmentInfo[] = [];
                        attachmentInfos.forEach((attachmentInfo: IAttachmentInfo) => {
                            let url = `${serviceFeatureLayerInfo.url}/${adminServiceData.serviceOID}/attachments/${attachmentInfo.id}?token=${this.props.userInfo.token}`;
                            // Some workarounds
                            if ((attachmentInfo.contentType == 'application/pdf' ||
                                attachmentInfo.contentType == 'text/txt')
                                && this.props.browser_info.toLowerCase().indexOf('edge') > -1) {
                                url = `${serviceFeatureLayerInfo.url}/${adminServiceData.serviceOID}/attachments/${attachmentInfo.id}`;
                            }
                            var file: File | undefined = undefined;
                            try {
                                file = new File([], attachmentInfo.name);
                            }
                            catch(ex) {
                            }
                            let attachment: AttachmentInfo = {
                                name: attachmentInfo.name,
                                size: attachmentInfo.size,
                                type: attachmentInfo.contentType,
                                url: url,
                                file: file,
                            };
                            attachments.push(attachment);
                        })
                        resolve(attachments);
                    }).catch(err => reject(err));
            })
        }
        else {
            return new Promise<AttachmentInfo[]>((resolve, reject) => {
                resolve([]); 
            });
        }
    }
    populateServiceForm = (adminServiceData: IAdminServicePayload, attachments: AttachmentInfo[]): void => {
        let serviceparameters: any = {};
        try {
            serviceparameters = JSON.parse(decodeURIComponent(adminServiceData.attributes.serviceparameters));
        }
        catch (err) {
            //console.error(err);
        }
        //console.log('## adminServiceData -> request');
        //console.log(serviceparameters);
        let request: any = {
            servicename: adminServiceData.attributes.servicename,
            uniqueServiceID: adminServiceData.attributes.id || `${adminServiceData.serviceCode}-${adminServiceData.serviceOID}`,
            // Fixes spelling mistake. It's not autorized! It's authorized!
            authorizedpersonname: adminServiceData.attributes.autorizedpersonname,
            // Fix for missing subject & messagetext
            message: adminServiceData.attributes.messagetext,
            subject: adminServiceData.attributes.subject,
            attachments: attachments,
            attachment53_1: attachments.length > 0 ? attachments[0] : undefined,
            attachment53_2: attachments.length > 1 ? attachments[1] : undefined,
            ...serviceparameters,
        };
        if(serviceparameters.usageterm) {
            if (serviceparameters.usageterm.from && serviceparameters.usageterm.to) {
                request.usagetermfrom = serviceparameters.usageterm.from;
                request.usagetermto = serviceparameters.usageterm.to;
            }
            else {
                // Backward compatibility for some time
                request.usagetermfrom = serviceparameters.usageterm;
                request.usagetermto = serviceparameters.usageterm;
            }
        }
        if(serviceparameters.organization_name) {
            request.organizationname = serviceparameters.organization_name;
        }
        if (serviceparameters.authorized_person_name) {
            request.authorizedpersonname = serviceparameters.authorized_person_name;
        }
        if (serviceparameters.identification_code) {
            request.identificationcode = serviceparameters.identification_code;
        }
        if (serviceparameters.vector_requested) {
            request.vectorDataSelected = serviceparameters.vector_requested;
        }
        if (serviceparameters.spatialRange) {
            try {
                request.spatialRange = jsonUtils.fromJSON(serviceparameters.spatialRange) as IGeometry;
                if (!request.spatialRange) {
                    request.spatialRange = jsonUtils.fromJSON(JSON.parse(serviceparameters.spatialRange)) as IGeometry;
                }
                //console.warn('request.spatialRangee');
                //console.log(request.spatialRange));
            }
            catch (err) {
            }
        }

        //console.log(request);
        this.setState({
            loading: false,
            error: false,
            serviceNr: adminServiceData.serviceCode,
            requestState: request,
            spatialRangeState: request,
        });
        if ([1, 2].indexOf(adminServiceData.serviceCode) > -1) {
            this.setState({
                results: attachments,
            });
        }
    }
    showError = (): void => {
        this.setState({
            loading: false,
            error: true,
            serviceNr: 0,
            requestState: undefined,
            spatialRangeState: undefined,
        });
    }

    mockLoading = (): void => {
        try {
            this.setState({
                loading: true
            })
            setTimeout(() => {
                this.setState({
                    loading: false,
                });
            }, 500);
        }
        catch (e) {
            this.setState({
                loading: false
            });
        }
    }

    render() {
        let serviceFee: number = this.state.serviceFee ? this.state.serviceFee : 0;
        let vectorDataChoiceAvailable: boolean = [1, 2].indexOf(this.state.serviceNr) > -1;
        return (
            <div className="vertical-flex-container"
                style={{ height: "100%", backgroundColor: "darkgrey", padding: "10px", overflowX: "hidden", overflowY: "auto", scrollBehavior: "smooth" }}>
                <OverlayLoader size="60px" show={this.state.loading} />
                <div className="flex-auto vertical-flex-container"
                style={{ backgroundColor:"white" }}>
                {
                    <React.Fragment>
                       <div className="flex-item flex-auto vertical-flex-container">
                            <p>{nls.nls.serviceWizard.servicePreviewTitle}</p>
                            <p>{this.state.requestState ? this.state.requestState.servicename : ''}</p>
                            <p>№ {this.props.adminServiceData.incomingnumber}</p>
                        </div>
                        {
                            this.state.serviceNr > 0 ?
                                <React.Fragment>
                                    <div className="flex-auto vertical-flex-container">
                                        <div className="flex-auto">
                                            <ServiceRequestPane
                                                serviceNr={this.state.serviceNr}
                                                previousState={this.state.requestState}
                                                isPreview={true} />
                                        </div>
                                        {[1, 2].indexOf(this.state.serviceNr) > -1 ?
                                            <React.Fragment>
                                            <div className="flex-auto">
                                                <ServiceSpatialRangePane
                                                    style={{ flexBasis: "auto", flexGrow: 0 }}
                                                    serviceNr={this.state.serviceNr}
                                                    previousState={this.state.spatialRangeState}
                                                    isPreview={true}
                                                    vectorDataChoiceAvailable={vectorDataChoiceAvailable}
                                                    serviceFee={serviceFee}
                                                    vectorServiceFee={serviceFee} />
                                            </div>
                                            <div className="flex-auto">
                                                <AttachmentsEditing
                                                    attachments={this.state.results}
                                                    label={nls.nls.serviceWizard.resultAttachments}
                                                    isDisabled={true} />
                                            </div>
                                            </React.Fragment>
                                            : null
                                        }
                                    </div>
                                </React.Fragment>
                                : null
                        }
                    </React.Fragment>
                }
                </div>
            </div>
        )
    }
}

export const mapStateToSelectedServiceProps = (state: IEITAppStore) => {
    return {
        adminServiceData: state.eit.adminService.adminServiceData,
        userInfo: state.eit.userInfo,
        browser_info: state.eit.browserInfo.browser_info,
    }
}
