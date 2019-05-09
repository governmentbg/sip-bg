import * as React from "react";
import { connect } from 'react-redux';
import axios from "axios";
import { IEITServices, Iservice51Data, IEITAppStore, IUserInfo } from "../../interfaces/reducers/IEITAppStore";
import EITInfrastructureType from '../../enums/EITInfrastructureType';
import EITRegixResult from '../../enums/EITRegixResult';
import OverlayLoader from "../../core/components/Loading/OverlayLoading";
import FloatingLabelInput from "../Widgets/FloatingLabelInput";
import { InputValueType, formatDate } from "../Widgets/FloatingLabelInput";
import { nls } from "../nls";
import { isNullOrUndefined } from 'util';
import { IServiceWizardParameterDispatcher, eitInfrastructureTypeKeys } from './ServiceWizardBase';
import { IServiceFormInternalState } from './ServiceWizardBase';
import { eitAppConfig } from "../../eitAppConfig";
import AttachmentsEditing from "../Widgets/AttachmentsEditing";
import { AttachmentInfo } from "../Widgets/AttachmentsEditing";
import { setServiceData } from '../../actions/dispatchers/eitServicesDispatcher';
import { IEITServiceActions } from '../../interfaces/dispatchers/IEITServiceActions';
import { v4 as uuid } from 'uuid';
import { reduceEachTrailingCommentRange } from 'typescript';
import ToggleWindowButton from '../Widgets/ToggleWindowButton';
import EITAppWindow from '../../enums/EITAppWindow';
import { IMosaicLayoutDispatcher } from '../../core/interfaces/dispatchers/IMosaicLayoutDispatcher';
import { mosaicLayoutDispatcher } from "../../core/actions/dispatchers";

interface InternalState extends IServiceFormInternalState {
    isPreview: boolean;
    uniqueServiceID: string;
    applicationDate?: string;
    username: string;
    authorizedpersonname: string;
    organizationname: string;
    identificationcode: string;
    email: string;
    contactdata: string;
    recipientid: string;
    recipientids: string[];
    recipient: string;
    recipients: string[];
    subject: string;
    message: string;
    settlement: string;
    usagetermfrom: Date | string;
    usagetermto: Date | string;
    attachments: AttachmentInfo[];
    attachment53_1?: AttachmentInfo;
    attachment53_2?: AttachmentInfo;
    infrastructureTypes: { [key: string]: boolean };
    regixValidationNeeded: boolean,
    regixResult?: EITRegixResult;
    networkOperatorDeclared: boolean;
    signed: boolean,
    amountDue: number;
    paid: boolean;
    edeliverysubjectidentifier: string;
    isReturnedRecipient?: boolean;
}

interface ParentProps extends IServiceWizardParameterDispatcher {
    serviceFee: number;
    isPreview: boolean;
    previousState: Partial<InternalState>;
    getInfrastructureType: (infrastructureTypes: { [key: string]: boolean }, networkOperatorDeclared: boolean) => string;
}

interface OwnProps {
    userInfo: IUserInfo;
    loading: boolean;
    eitServices: IEITServices;
}

interface DispatchProps extends IMosaicLayoutDispatcher {
}

type Props = DispatchProps & IEITServiceActions & OwnProps & ParentProps;



const mockAuthentication = (serviceNr: number): boolean => {
    return serviceNr < 300;
}

class ServiceRequestPane extends React.Component<Props, InternalState> {
    serviceData51: Iservice51Data;
    constructor(props: Props) {
        super(props);
        this.state = {
            loading: false,
            isPreview: this.props.isPreview,
            formIsValid: false,
            // ServiceParameters start
            uniqueServiceID: this.getUniqueServiceID(props),
            applicationDate: this.getApplicationDate(props),
            username: this.getUserName(props),
            authorizedpersonname: this.getAuthorizedpersonname(props),
            organizationname: this.getOrganizationName(props),
            identificationcode: this.getIdentificationcode(props),
            email: this.getEmail(props),
            contactdata: this.getContactData(props),
            subject: this.getSubject(props),
            message: this.getMessage(props),
            usagetermfrom:this.getUsageTermFrom(props), 
            usagetermto:this.getUsageTermTo(props), 
            settlement: this.getSettlement(props),
            infrastructureTypes: this.getInfrastructureTypes(props),
            networkOperatorDeclared: this.getNetworkOperatorDeclared(props),
            amountDue: this.getAmountDue(props),  // (?)
            attachments: this.getAttachments(props),
            attachment53_1: this.getAttachment53_1(props),
            attachment53_2: this.getAttachment53_2(props),
            recipient: this.getRecipient(props),
            recipients: this.getRecipients(props),
            // ServiceParameters end
            recipientid: '',
            recipientids: [],
            regixValidationNeeded: this.getRegixValidationNeeded(props),
            regixResult: undefined,
            signed: false,
            paid: false,
            edeliverysubjectidentifier: "",
            isReturnedRecipient: true,
        };
        if (this.props.eitServices[51]) {
            this.serviceData51 = Object.assign({}, this.props.eitServices[51]);
        }
    }

    onStateChange = (partialState: Partial<InternalState>): void => {
        this.serviceDataSetter(partialState)
        let newState: InternalState = {
            ...this.state,
            ...partialState,
            formIsValid: this.getFormIsValid({
                ...this.state,
                ...this.props.previousState,
                ...partialState,
            })
        }
        this.setState(newState);
        if (this.props.onStateChange) {
            this.props.onStateChange(newState);
        }
    }

    getFormIsValid = (state: InternalState): boolean => {
        if (!!state.isPreview) {
            return true;
        };
        let commonRequirements: boolean = !!state.authorizedpersonname && !!state.identificationcode && !!state.organizationname;
        switch (this.props.serviceNr) {
            case 1:
            case 2:
                return !state.regixValidationNeeded || (state.regixResult == EITRegixResult.Admission || !!state.networkOperatorDeclared);
            case 51:
                return commonRequirements && !!state.email && !!state.recipient && !!state.subject;
            case 52:
                return commonRequirements && !!state.email && !!state.recipient && !!state.subject && !!state.message &&
                    !!state.settlement && !!state.usagetermfrom && !!state.usagetermto && state.attachments.length > 0;
            case 53:
                return commonRequirements && !!state.email && state.recipients.length > 0 && !!state.subject && !!state.message &&
                    !!state.attachment53_1 && !!state.attachment53_2;
        }
        return true;
    }

    componentWillMount() {
        let infrastrTypes: { [key: string]: boolean } = {};
        eitInfrastructureTypeKeys.map((infrastructureTypeKey: EITInfrastructureType, i: number) => {
            infrastrTypes[infrastructureTypeKey] = this.props.previousState && this.props.previousState.infrastructureTypes ? !!this.props.previousState.infrastructureTypes[infrastructureTypeKey] : false;
        });
        this.onStateChange({
            ...this.state,
            ...this.props.previousState,
            infrastructureTypes: infrastrTypes
        });
    }

    componentDidUpdate() {
        if (this.props.getInfrastructureType) {
            this.props.getInfrastructureType(this.state.infrastructureTypes, this.state.networkOperatorDeclared);
        }
    }

    componentDidMount() {
    }

    componentWillReceiveProps(props: Props) {
        // On user-logged-in application state change:
        if (this.state.username != this.getUserName(props)) {
            this.onStateChange({
                username: this.getUserName(props),
                authorizedpersonname: this.getAuthorizedpersonname(props),
                organizationname: this.getOrganizationName(props),
                identificationcode: this.getIdentificationcode(props),
                email: this.getEmail(props),
                contactdata: this.getContactData(props),
                regixValidationNeeded: this.getRegixValidationNeeded(props),
                regixResult: undefined,
            })
        }
        // On current service change:
        if (this.state.uniqueServiceID != this.getUniqueServiceID(props)) {
            this.onStateChange({
                uniqueServiceID: this.getUniqueServiceID(props),
                applicationDate: this.getApplicationDate(props),
                username: this.getUserName(props),
                authorizedpersonname: this.getAuthorizedpersonname(props),
                organizationname: this.getOrganizationName(props),
                identificationcode: this.getIdentificationcode(props),
                email: this.getEmail(props),
                contactdata: this.getContactData(props),
                subject: this.getSubject(props),
                message: this.getMessage(props),
                usagetermfrom:this.getUsageTermFrom(props), 
                usagetermto:this.getUsageTermTo(props), 
                settlement: this.getSettlement(props),
                infrastructureTypes: this.getInfrastructureTypes(props),
                networkOperatorDeclared: this.getNetworkOperatorDeclared(props),
                amountDue: this.getAmountDue(props),  // (?)
                attachments: this.getAttachments(props),
                attachment53_1: this.getAttachment53_1(props),
                attachment53_2: this.getAttachment53_2(props),
                recipient: this.getRecipient(props),
                recipients: this.getRecipients(props),
            })
        }
        if (this.state.isPreview != props.isPreview) {
            this.onStateChange({
                isPreview: props.isPreview,
            });
        }
    }

    canVerifyRegister = (): boolean => {
        var infrastructureTypeKey: string;
        for (infrastructureTypeKey in this.state.infrastructureTypes) {
            if (this.state.infrastructureTypes[infrastructureTypeKey]) return true;
        }
        return false;
    }

    onRegixVerified = (result: EITRegixResult): void => {
        this.onStateChange({
            loading: false,
            regixResult: result,
        })
    }

    performRegixVerification = (): void => {
        try {
            this.onStateChange({
                loading: true
            })
            // this.sendRegIxRequet().
            //     then(xmlStr => {
            //         // xmlStr = '<?xml version="1.0" ?>' + xmlStr
            //         let xml = new DOMParser().parseFromString(xmlStr, "text/xml")
            //         // console.log(xml)
            //         // var wnd = window.open("about:blank", "", "_blank");
            //         // wnd.document.write(xmlStr);
            //         // var testOpen = window.open('content-type: text/xml')
            //         // testOpen.document.write(xmlStr);
            //         // testOpen.document.close();
            //         this.onStateChange({
            //             loading: false,
            //             // regixResult: xmlStr
            //         });
            //     }).catch(err => {
            //         this.onStateChange({
            //             loading: false
            //         });
            // })
            setTimeout(() => {
                let admitted: boolean = this.state.infrastructureTypes[EITInfrastructureType.CommunicationNet];
                let notImplemented: boolean = !admitted && this.state.infrastructureTypes[EITInfrastructureType.StreetLight];
                let denied: boolean = !admitted && !notImplemented && eitInfrastructureTypeKeys.findIndex((infrastructureTypeKey: string, index: number) => {
                    return this.state.infrastructureTypes[infrastructureTypeKey];
                }) > -1;
                if (admitted) {
                    this.onRegixVerified(EITRegixResult.Admission);
                }
                else if (notImplemented) {
                    this.onRegixVerified(EITRegixResult.NotImplemented);
                }
                // Demo Error
                else if (this.state.infrastructureTypes[EITInfrastructureType.Subway]){
                    this.onRegixVerified(EITRegixResult.Error);
                }
                else if (denied) {
                    this.onRegixVerified(EITRegixResult.Denial);
                }
                else {
                    this.onRegixVerified(EITRegixResult.Declared);
                }
            }, 1500);
        }
        catch (e) {
            this.onRegixVerified(EITRegixResult.Error);
        }
    }

    sendRegIxRequet(): Promise<string> {
        return new Promise((resolve, reject) => {
            let regIxRequestData = {}; //this.createRegIxRequestData();
            let formPost = document.createElement('form');
            formPost.target = "RegIx";
            formPost.setAttribute("method", "POST");
            formPost.setAttribute("action", eitAppConfig.regIx);
            document.body.appendChild(formPost);
            window.open("", "RegIx", "status=0,title=0,height=600,width=800,scrollbars=1");
            formPost.submit();
            document.body.removeChild(formPost);
        })
    }

    createRegIxRequestData() {
        return {
            token: this.props.userInfo.token
        };
    }

    mapInfrastructureType = (infrastructureTypeKey: EITInfrastructureType): string => {
        return nls.nls.infrastructureTypes[infrastructureTypeKey];
    }

    mapRegixResult = (regixResult: EITRegixResult | undefined): string => {
        if (isNullOrUndefined(regixResult)) return "";
        return nls.nls.serviceWizard.regixResults[regixResult];
    }

    onValueChange = (newValue: InputValueType, fieldHasError: boolean, fieldName: string): void => {
        this.serviceDataSetter({[fieldName]: newValue});
        this.onStateChange({
            ...this.state,
            [fieldName]: newValue,
            //[fieldName + 'HasError']: fieldHasError,
        });
    }
    serviceDataSetter(internalState: any): void { //newValue: InputValueType, fieldHasError: boolean, fieldName: string
        let dataProps = ["applicantType","date","authorizedpersonname","identificationcode","organizationname","contactdata","email","recipient","subject","message","uniqueIdOfRecipient"];
        let _serviceData51: any = {}
        for (let i = 0; i < dataProps.length; i++) {
            if (internalState.hasOwnProperty(dataProps[i])) {
                _serviceData51[dataProps[i]] = internalState[dataProps[i]];
            }
        }
        if (Object.keys(_serviceData51).length > 0) {
            this.props.setServiceData(_serviceData51);
        }
    }

    onRegixCheckBoxValueChange = (newValue: InputValueType, fieldName: string): void => {
        //console.log('!!! CheckBoxValueChanged !!!');
        this.onStateChange({
            ...this.state,
            regixResult: undefined,
            infrastructureTypes: { ...this.state.infrastructureTypes, [fieldName]: newValue as boolean }
        });
        
    }
    onDeclarationCheckBoxValueChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
        let newValue: boolean = event.target.checked;
        this.onStateChange({
            networkOperatorDeclared: newValue,
        });
    }

    getUniqueServiceID = (props: Props): string => {
        if (props.previousState) {
            return props.previousState.uniqueServiceID || '';
        }
        return uuid();
    }
    getUserName = (props: Props): string => {
        return props.userInfo ? props.userInfo.username || "" : ""
    }
    getIsPrivilegedUser = (userInfo: IUserInfo) => {
        return userInfo.isAdmin || userInfo.isRegulator || userInfo.isMunicipality;
    }
    getRegixValidationNeeded = (props: Props): boolean => {
        return [1, 2].indexOf(props.serviceNr) > -1 && !this.getIsPrivilegedUser(props.userInfo);
    }
    getApplicationDate = (props: Props): string => {
        if (props.previousState) {
            return props.previousState.applicationDate || '';
        }
        if (!props.isPreview) {
            let todaysDate: Date = new Date();
            let today: string | undefined = formatDate(todaysDate, true);
            return today || '';
        }
        return '';
    }
    // TODO: Do not use defaults eventually.
    getAuthorizedpersonname = (props: Props): string => {
        if (props.previousState) {
            return props.previousState.authorizedpersonname || '';
        }
        if (!props.isPreview) {
            return props.userInfo && props.userInfo.username && props.userInfo.user.authorizedpersonname ?
                props.userInfo.user.authorizedpersonname : (mockAuthentication(props.serviceNr) ? (props.userInfo.username || 'инж. Стефан Стефанов') : '');
        }
        return '';
    }
    getIdentificationcode = (props: Props): string => {
        if (props.previousState) {
            return props.previousState.identificationcode || '';
        }
        if (!props.isPreview) {
            return props.userInfo && props.userInfo.username && props.userInfo.user.identificationcode ? props.userInfo.user.identificationcode : (mockAuthentication(props.serviceNr) ? '112073391' : '');
        }
        return '';
    }
    getOrganizationName = (props: Props): string => {
        if (props.previousState) {
            return props.previousState.organizationname || '';
        }
        if (!props.isPreview) {
            return props.userInfo && props.userInfo.username && props.userInfo.user.organizationname ? props.userInfo.user.organizationname : (mockAuthentication(props.serviceNr) ? 'ТРИМЕДИЯ КОМПЮТЪР ООД' : '');
        }
        return '';
    }
    getEmail = (props: Props): string => {
        if (props.previousState) {
            return props.previousState.email || '';
        }
        if (!props.isPreview) {
            return props.userInfo && props.userInfo.username && props.userInfo.user.email ? props.userInfo.user.email : (mockAuthentication(props.serviceNr) ? (props.userInfo.username || 'abc') + '@abv.bg' : '');
        }
        return '';
    }
    getContactData = (props: Props): string => {
        if (props.previousState) {
            return props.previousState.contactdata || '';
        }
        if (!props.isPreview) {
            return props.userInfo && props.userInfo.username && props.userInfo.user.contactdata ? props.userInfo.user.contactdata : '';
        }
        return '';
    }
    getSubject = (props: Props): string => {
        if (props.previousState) {
            return props.previousState.subject || '';
        }
        if (!props.isPreview) {
            let subject: string = '';
            switch (props.serviceNr) {
                case 51:
                case 52:
                case 53:
                    subject = nls.nls.serviceWizard.requestSubjectByService[props.serviceNr];
                    break;
            }
            return subject;
        }
        return '';
    }
    getMessage = (props: Props) => {
        if (props.previousState) {
            return props.previousState.message || '';
        }
        if (!props.isPreview) {
            let message: string = '';
            switch (props.serviceNr) {
                case 51:
                case 52:
                case 53:
                    message = nls.nls.serviceWizard.requestMessageByService[props.serviceNr];
                    break;
            }
            return message;
        }
        return '';
    }
    getRecipient = (props: Props): string => {
        if (props.previousState) {
            return props.previousState.recipient || '';
        }
        if (!props.isPreview) {
            let recipient: string = '';
            switch (props.serviceNr) {
                case 53:
                    recipient = nls.nls.serviceWizard.request.inputAddressee53;
                    break;
            }
            return recipient;
        }
        return '';
    }
    getRecipients = (props: Props): string[] => {
        if (props.previousState) {
            return props.previousState.recipients || [];
        }
        return [];
    }
    getUsageTermFrom = (props: Props): Date | string => {
        if (props.previousState) {
            return props.previousState.usagetermfrom || '';
        }
        return '';
    }
    getUsageTermTo = (props: Props): Date | string => {
        if (props.previousState) {
            return props.previousState.usagetermto || '';
        }
        return '';
    }
    getSettlement = (props: Props): string => {
        if (props.previousState) {
            return props.previousState.settlement || '';
        }
        return '';
    }
    getAmountDue = (props: Props): number => {
        if (props.previousState) {
            return props.previousState.amountDue || 0;
        }
        return 0;
    }
    getInfrastructureTypes = (props: Props): { [key: string]: boolean } => {
        if (props.previousState) {
            return props.previousState.infrastructureTypes || {};
        }
        return {};
    }
    getNetworkOperatorDeclared = (props: Props): boolean => {
        if (props.previousState) {
            return !!props.previousState.networkOperatorDeclared;
        }
        return false;
    }
    getAttachments = (props: Props): AttachmentInfo[] => {
        if (props.previousState) {
            return props.previousState.attachments || [];
        }
        return [];
    }
    getAttachment53_1 = (props: Props): AttachmentInfo | undefined => {
        if (props.previousState && props.previousState.attachment53_1) {
            return props.previousState.attachment53_1;
        }
        return undefined;
    }
    getAttachment53_2 = (props: Props): AttachmentInfo | undefined => {
        if (props.previousState && props.previousState.attachment53_2) {
            return props.previousState.attachment53_2;
        }
        return undefined;
    }


    clearRecipients = (): void => {
        this.onStateChange({
            recipients: [],
            recipientids: [],
        });
    }

    onAutoCompleteRecipientSelection = (args: any): void => {
        if (args && args.attribute && args.attribute.length == 3) {
            //console.log(args.attribute);
            this.onStateChange({
                recipient: args.attribute[0].name.toString(),
                recipientid: args.attribute[1].id.toString(),
                edeliverysubjectidentifier: args.attribute[2].edeliverysubjectidentifier.toString(),
            });
        }
        else {
            this.onStateChange({
                recipient: '',
                recipientid: '',
            });
        }
    }
    onAutoCompleteAdminSelection = (args: any): void => {
        if (args && args.attribute && args.attribute.length == 2) {
            //console.log(args.attribute);
            this.onStateChange({
                settlement: args.attribute[0].name.toString() + ' (общ.' + args.attribute[1].munname.toString() + ')',
            });
        }
        else {
            //console.warn('settlement', '');
            this.onStateChange({
                settlement: '',
            });
        }
    }
    onAutoCompleteOperatorSelection = (args: any): void => {
        if (args && args.attribute && args.attribute.length == 2) {
            //console.log(args.attribute);
            this.onStateChange({
                recipient: args.attribute[0].name.toString(),
                recipientid: args.attribute[1].id.toString(),
            });
        }
        else {
            this.onStateChange({
                recipient: '',
                recipientid: '',
            });
        }
    }
    onAutoCompleteMunicipalitySelection = (args: any): void => {
        if (args && args.attribute && args.attribute.length == 2) {
            //console.log(args.attribute);
            let newrecipients: string[] = this.state.recipients.slice();
            newrecipients.push(args.attribute[0].name.toString() + ',\n');
            let newrecipientids: string[] = this.state.recipientids.slice();
            newrecipientids.push(args.attribute[1].id.toString());
            this.onStateChange({
                recipients: newrecipients,
                recipientids: newrecipientids,
            });
        }
    }

    getIsDataReturnedAutocomplete = (isReturnedDta: boolean) => {
        if(isReturnedDta != this.state.isReturnedRecipient)
        {
            this.setState({
                isReturnedRecipient: isReturnedDta
            });   
        } 
    }

    onAttachmentsChange = (newAttachments: AttachmentInfo[]): void => {
        this.onStateChange({
            attachments: newAttachments,
        });
    }
    onAttachment53_1Change = (newAttachments: AttachmentInfo[]): void => {
        this.onStateChange({
            attachment53_1: newAttachments.length > 0 ? newAttachments[0] : undefined,
        });
    }
    onAttachment53_2Change = (newAttachments: AttachmentInfo[]): void => {
        this.onStateChange({
            attachment53_2: newAttachments.length > 0 ? newAttachments[0] : undefined,
        });
    }

    toggleWindow = (): void => {
        this.props.toggleWindow(EITAppWindow.feedback);
    }

    render() {
        let today: Date = new Date();
        today = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        let minFromDate: Date = today;
        let maxFromDate: Date | undefined = this.state.usagetermto && typeof this.state.usagetermto != 'string' ? this.state.usagetermto as Date : undefined;
        let minToDate: Date | undefined = this.state.usagetermfrom && typeof this.state.usagetermfrom != 'string' ? this.state.usagetermfrom as Date : today;

        let autocompleteAdminLayers = {
            [eitAppConfig.layers.Settlements]: {
                alias: "Населени места",
                searchField: "searchdata",
                returnFields: "name,munname",
                displayPattern: "{name} (общ. {munname})",
            },
        };
        let commonOrganizationWhere: string = `id <> '${this.props.userInfo.user.organizationid || ""}'`;
        if (this.state.recipientids.length > 0) {
            commonOrganizationWhere = `(${commonOrganizationWhere}) and (id not in ('${this.state.recipientids.join("', '")}'))`;
        }
        let autocompleteMunicipalityLayers = {
            [eitAppConfig.layers.RegistersOrganizations]: {
                alias: "Община",
                searchField: "name||' '||shortname",
                returnFields: "name,id",
                displayPattern: "{name}",
                whereClause: `(${commonOrganizationWhere}) and (organizationtype = 4)`,
            },
        };
        let autocompleteRecipientLayers = undefined;
        switch (this.props.serviceNr) {
            case 51:
                autocompleteRecipientLayers = {
                    [eitAppConfig.layers.RegistersOrganizations]: {
                        alias: "Адресат на искане на информация за хода на услуга",
                        searchField: "name||' '||shortname",
                        returnFields: "name,id, edeliverysubjectidentifier",
                        displayPattern: "{name}",
                        whereClause: `(${commonOrganizationWhere}) and (edeliverysubjectidentifier is not null) and (edeliverysubjectidentifier <> '')`,  //TODO: (and organizationtype in / not in (...))
                    },
                };
                break;
            case 52:
                autocompleteRecipientLayers = {
                    [eitAppConfig.layers.RegistersOrganizations]: {
                        alias: "Община/оператор",
                        searchField: "name||' '||shortname",
                        returnFields: "name,id",
                        displayPattern: "{name}",
                        whereClause: `(${commonOrganizationWhere}) and (organizationtype in (1, 4))`,
                    },
                };
                break;
        }
        let onAutoCompleteRecipientSelection = undefined;
        switch (this.props.serviceNr) {
            case 51:
                onAutoCompleteRecipientSelection = this.onAutoCompleteRecipientSelection;
                break;
            case 52:
                onAutoCompleteRecipientSelection = this.onAutoCompleteOperatorSelection;
                break;
        }
        //console.warn('### RECIPIENT ###');
        //console.log(this.state.recipient);
        //console.log(this.state.infrastructureTypes);
        let infrastructureTypesStyle: any = {};
        if (!this.props.isPreview) {
            infrastructureTypesStyle = { minHeight: "0px", flexShrink: 1, overflowX: "hidden", overflowY: "auto", marginTop: "30px", marginBottom: "30px" }
        }
        const maxAttachments: number = 3;
        const inputAttachments: string = this.props.isPreview ?
            nls.nls.serviceWizard.request.inputAttachments :
            nls.nls.serviceWizard.request.inputAttachments + nls.nls.serviceWizard.request.inputAttachmentsMax.replace('{0}', maxAttachments.toString());
        const acceptTypes: string = "application/pdf, image/*, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document, application/zip, application/rar, application/x-compress";
        return (
            <div className="vertical-flex-container" style={{ width: "100%", height: "100%", paddingRight: "10px" }}>
                <OverlayLoader size="60px" show={this.state.loading} />
                <div className="flex-auto horizontal-wrapping-flex-container">
                    <FloatingLabelInput
                        isDisabled={true}
                        className="flex-item flex-scalable"
                        placeholder={nls.nls.serviceWizard.request.inputDate}
                        value={this.state.applicationDate} />
                    <FloatingLabelInput
                        isRequired={true}
                        requiredMsg={' *'}
                        isDisabled={this.props.serviceNr < 3 || this.props.isPreview}
                        className="flex-item flex-scalable"
                        placeholder={nls.nls.serviceWizard.request.inputAuthorizedPersonName}
                        value={this.state.authorizedpersonname}
                        onValueChange={(newValue: InputValueType, hasError: boolean) => this.onValueChange(newValue, hasError, 'authorizedpersonname')} />
                    <FloatingLabelInput
                        isRequired={true}
                        requiredMsg={' *'}
                        isDisabled={this.props.serviceNr < 3 || this.props.isPreview}
                        className="flex-item flex-scalable"
                        placeholder={nls.nls.serviceWizard.request.inputIdentificationCode}
                        value={this.state.identificationcode}
                        onValueChange={(newValue: InputValueType, hasError: boolean) => this.onValueChange(newValue, hasError, 'identificationcode')} />
                    <FloatingLabelInput
                        isRequired={true}
                        requiredMsg={' *'}
                        isDisabled={this.props.serviceNr < 3 || this.props.isPreview}
                        className="flex-item flex-scalable"
                        placeholder={nls.nls.serviceWizard.request.inputOrganizationName}
                        value={this.state.organizationname}
                        onValueChange={(newValue: InputValueType, hasError: boolean) => this.onValueChange(newValue, hasError, 'organizationname')} />
                    {
                        this.props.serviceNr > 4 ?
                            <React.Fragment>
                                <FloatingLabelInput
                                    isDisabled={this.props.isPreview}
                                    className="flex-item flex-scalable"
                                    placeholder={nls.nls.serviceWizard.request.inputContactData}
                                    /*
                                    pattern={new RegExp('^([+]|0|00){0,1}([1-9])([0-9 ])*$', 'i')}
                                    */
                                    errorMsg={nls.nls.serviceWizard.request.invalidContactData}
                                    value={this.state.contactdata}
                                    onValueChange={(newValue: InputValueType, hasError: boolean) => this.onValueChange(newValue, hasError, 'contactdata')} />
                                <FloatingLabelInput
                                    isRequired={true}
                                    requiredMsg={' *'}
                                    isDisabled={this.props.isPreview}
                                    className="flex-item flex-scalable"
                                    placeholder={nls.nls.serviceWizard.request.inputEmail}
                                    /*
                                    pattern={new RegExp('^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$', 'i')}
                                    */
                                    errorMsg={nls.nls.serviceWizard.request.invalidEmail}
                                    value={this.state.email}
                                    onValueChange={(newValue: InputValueType, hasError: boolean) => this.onValueChange(newValue, hasError, 'email')} />
                                <FloatingLabelInput
                                    isRequired={true}
                                    requiredMsg={' *'}
                                    isDisabled={this.props.isPreview || this.props.serviceNr == 53}
                                    autoComplete={this.props.serviceNr != 53}
                                    className="flex-item flex-scalable"
                                    placeholder={nls.nls.serviceWizard.requestAddresseeTitleByService[this.props.serviceNr]}
                                    isDataReturnedAutocomplete={this.getIsDataReturnedAutocomplete}
                                    value={this.state.recipient}
                                    autoCompleteSearchLayerInfo={autocompleteRecipientLayers}
                                    onAutoCompleteSelection={onAutoCompleteRecipientSelection}
                                    onValueChange={(newValue: InputValueType, hasError: boolean) => this.onValueChange(newValue, hasError, 'recipient')} />
                                {(!this.state.isReturnedRecipient && this.props.serviceNr == 52) ?
                                    <div className="flex-auto vertical-flex-container text-wrapper" style={{ width: "100%", marginTop: "30px", marginBottom: "5px"}}>
                                        <p className="flex-item flex-auto " style={{ textIndent: "2em", textAlign: "justify", paddingTop: "5px"}}>
                                            <span>{nls.nls.serviceWizard.request.noOperatorGateway}
                                                <a href='#' onClick={this.toggleWindow} className={"gateway-link"} style={{color: "#1084cd", fontWeight: "bold", fontSize: "15px" }}>{nls.nls.serviceWizard.signingAndPayment.paymentGatewayLink}</a>
                                            </span>
                                        </p>
                                    </div>
                                    : null}
                            </React.Fragment>
                            : null
                    }
                </div>
                {
                    this.props.serviceNr > 4 ?
                        <React.Fragment>
                            <div className={this.props.isPreview ? "flex-auto vertical-flex-container" : "flex-scalable vertical-flex-container"}
                                style={{width: "100%", height: this.props.isPreview ? "" : "100%"}}>
                                <FloatingLabelInput
                                    style={{
                                        flexGrow: this.props.isPreview ? "" : 0.5,
                                        minHeight: this.props.isPreview ? "" : "60px"
                                    }}
                                    isRequired={true}
                                    requiredMsg={' *'}
                                    isDisabled={this.props.isPreview}
                                    className={this.props.isPreview ? "flex-item flex-auto" : "flex-item flex-scalable"}
                                    isMultiline={true}
                                    placeholder={nls.nls.serviceWizard.requestSubjectTitleByService[this.props.serviceNr]}
                                    maxLength={255}
                                    value={this.state.subject}
                                    onValueChange={(newValue: InputValueType, hasError: boolean) => this.onValueChange(newValue, hasError, 'subject')} />
                                {
                                    this.props.serviceNr == 52 ?
                                        <React.Fragment>
                                            <div className="flex-auto horizontal-wrapping-flex-container"
                                                style={{ width: "100%" }}>
                                                <FloatingLabelInput
                                                    isRequired={true}
                                                    requiredMsg={' *'}
                                                    isDisabled={this.props.isPreview}
                                                    autoComplete={true}
                                                    className="flex-item flex-scalable"
                                                    placeholder={nls.nls.serviceWizard.request.inputSettlement}
                                                    value={this.state.settlement}
                                                    autoCompleteSearchLayerInfo={autocompleteAdminLayers}
                                                    onAutoCompleteSelection={this.onAutoCompleteAdminSelection}
                                                    onValueChange={(newValue: InputValueType, hasError: boolean) => this.onValueChange(newValue, hasError, 'settlement')} />
                                            </div>
                                            <div className="flex-auto horizontal-wrapping-flex-container"
                                                style={{ width: "100%", height: "14px"}}>
                                                <label className="fl-input-label fl-valid">{nls.nls.serviceWizard.request.inputUsageTerm}</label>
                                            </div>
                                            <div className="flex-auto horizontal-wrapping-flex-container"
                                                 style={{ width: "100%" }}>
                                                <FloatingLabelInput
                                                    type='date'
                                                    isRequired={true}
                                                    requiredMsg={' *'}
                                                    isDisabled={this.props.isPreview}
                                                    className="flex-item flex-scalable"
                                                    placeholder={nls.nls.serviceWizard.request.inputUsageTermFrom}
                                                    value={this.state.usagetermfrom}
                                                    onValueChange={(newValue: InputValueType, hasError: boolean) => this.onValueChange(newValue, hasError, 'usagetermfrom')}
                                                    minDate={minFromDate}
                                                    maxDate={maxFromDate}/>
                                                <FloatingLabelInput
                                                    type='date'
                                                    isRequired={true}
                                                    requiredMsg={' *'}
                                                    isDisabled={this.props.isPreview}
                                                    className="flex-item flex-scalable"
                                                    placeholder={nls.nls.serviceWizard.request.inputUsageTermTo}
                                                    value={this.state.usagetermto}
                                                    onValueChange={(newValue: InputValueType, hasError: boolean) => this.onValueChange(newValue, hasError, 'usagetermto')}
                                                    minDate={minToDate}/>
                                            </div>
                                        </React.Fragment>
                                        : null
                                }
                                <FloatingLabelInput
                                    isRequired={!this.props.isPreview && this.props.serviceNr != 51}
                                    requiredMsg={' *'}
                                    isDisabled={this.props.isPreview}
                                    className={this.props.isPreview ? "flex-item flex-auto" : "flex-item flex-scalable"}
                                    isMultiline={true}
                                    maxLength={2000}
                                    placeholder={nls.nls.serviceWizard.requestMessageTitleByService[this.props.serviceNr]}
                                    value={this.state.message}
                                    onValueChange={(newValue: InputValueType, hasError: boolean) => this.onValueChange(newValue, hasError, 'message')} />
                                {
                                    this.props.serviceNr == 53 ?
                                        <React.Fragment>
                                            <div className={this.props.isPreview ? "flex-auto vertical-flex-container" : "flex-scalable vertical-flex-container"}
                                                style={{ width: "100%", height: this.props.isPreview ? "" : "100%" }}>
                                                {
                                                    !this.props.isPreview ?
                                                        <div className="flex-auto horizontal-wrapping-flex-container">
                                                            <FloatingLabelInput
                                                                isDisabled={this.props.isPreview}
                                                                autoComplete={true}
                                                                className="flex-item flex-scalable"
                                                                placeholder={nls.nls.serviceWizard.request.inputAddMunicipality}
                                                                autoCompleteSearchLayerInfo={autocompleteMunicipalityLayers}
                                                                onAutoCompleteSelection={this.onAutoCompleteMunicipalitySelection} />
                                                            <div className="flex-item flex-auto">
                                                                <button className="appBtn"
                                                                    title={nls.nls.serviceWizard.clear}
                                                                    onClick={this.clearRecipients}>
                                                                    <img src="public/eit/Services/Delete32.png" style={{ width: "20px", height: "20px" }} />
                                                                </button>
                                                            </div>
                                                        </div> : null
                                                }
                                                <FloatingLabelInput
                                                    isRequired={!this.props.isPreview}
                                                    requiredMsg={' *'}
                                                    isDisabled={true}
                                                    className={this.props.isPreview ? "flex-item flex-auto" : "flex-item flex-scalable"}
                                                    isMultiline={true}
                                                    placeholder={nls.nls.serviceWizard.request.inputMunicipalities}
                                                    value={this.state.recipients}
                                                    onValueChange={(newValue: InputValueType, hasError: boolean) => this.onValueChange(newValue, hasError, 'serviceNumber')} />
                                            </div>
                                        </React.Fragment>
                                        : null
                                }
                                {
                                    this.props.serviceNr == 52 ?
                                        <div className="flex-auto vertical-flex-container">
                                            <AttachmentsEditing
                                                maxNumber={maxAttachments}
                                                attachments={this.state.attachments}
                                                label={inputAttachments}
                                                isRequired={!this.props.isPreview}
                                                requiredMsg={'\xa0*'}
                                                isDisabled={this.props.isPreview}
                                                acceptTypes={acceptTypes}
                                                onAttachmentsChange={this.onAttachmentsChange} />
                                        </div>
                                        : null
                                }
                                {
                                    this.props.serviceNr == 53 ?
                                        <React.Fragment>
                                            <div className="flex-auto vertical-flex-container">
                                                <AttachmentsEditing
                                                    maxNumber={1}
                                                    attachments={this.state.attachment53_1 ? [this.state.attachment53_1] : []}
                                                    label={nls.nls.serviceWizard.request.inputAttachment53_1}
                                                    isRequired={!this.props.isPreview}
                                                    requiredMsg={'\xa0*'}
                                                    isDisabled={this.props.isPreview}
                                                    acceptTypes={acceptTypes}
                                                    onAttachmentsChange={this.onAttachment53_1Change} />
                                            </div>
                                            <div className="flex-auto vertical-flex-container">
                                                <AttachmentsEditing
                                                    maxNumber={1}
                                                    attachments={this.state.attachment53_2 ? [this.state.attachment53_2] : []}
                                                    label={nls.nls.serviceWizard.request.inputAttachment53_2}
                                                    isRequired={!this.props.isPreview}
                                                    requiredMsg={'\xa0*'}
                                                    isDisabled={this.props.isPreview}
                                                    acceptTypes={acceptTypes}
                                                    onAttachmentsChange={this.onAttachment53_2Change} />
                                            </div>
                                        </React.Fragment>
                                        : null
                                }

                            </div>
                        </React.Fragment>
                        : null
                }
                {
                    this.props.serviceNr < 3 ?
                        <React.Fragment>
                            <label className="flex-item flex-auto"
                                style={{ marginTop: "10px", marginBottom: "5px" }}>Организацията е тип мрежови оператор:</label>
                            <div className={this.props.isPreview ? "flex-auto vertical-flex-container" : "flex-scalable vertical-flex-container"}>
                                <div className="flex-auto vertical-flex-container">
                                    {
                                        eitInfrastructureTypeKeys.map((infrastructureTypeKey: EITInfrastructureType, i: number) =>
                                            (
                                                !this.props.isPreview || this.state.infrastructureTypes[infrastructureTypeKey] ?
                                                    <FloatingLabelInput
                                                        className="flex-item flex-auto"
                                                        placeholder={this.mapInfrastructureType(infrastructureTypeKey)}
                                                        type='checkbox'
                                                        value={this.state.infrastructureTypes[infrastructureTypeKey]}
                                                        key={infrastructureTypeKey}
                                                        isDisabled={this.props.isPreview}
                                                        onValueChange={(newValue: InputValueType, hasError: boolean) => this.onRegixCheckBoxValueChange(newValue, infrastructureTypeKey)} />
                                                    : null
                                            ))
                                    }
                                </div>
                                {
                                    this.props.isPreview ?
                                        null :
                                        <React.Fragment>
                                            <div className="flex-item flex-auto"
                                                style={{ display: "flex", flexDirection: "row", justifyContent: "center", width: "100%" }}>
                                                <div className="flex-item flex-auto" style={{ marginBottom: "10px", marginTop: "10px" }}>
                                                    <button className="appBtn"
                                                        title={nls.nls.serviceWizard.verifyRegixTooltip}
                                                        onClick={this.performRegixVerification}
                                                        disabled={!this.canVerifyRegister()}
                                                        style={{ height: "30px" }}>
                                                        <img src="public/eit/Services/apply32.png" style={{ width: "20px", height: "20px" }} />
                                                        <span>&nbsp;{nls.nls.serviceWizard.verifyRegix}</span>
                                                    </button>
                                                </div>
                                            </div>
                                            <p className="flex-item flex-auto" style={{ width: "100%" }}>{this.mapRegixResult(this.state.regixResult)}</p>
                                            {this.state.regixResult && this.state.regixResult == EITRegixResult.Admission ? <div className="flex-item flex-auto"> <button className="appBtn" onClick={() => this.sendRegIxRequet()}>{nls.nls.serviceWizard.regIxTestRegister}</button></div> : null}
                                            
                                        </React.Fragment>
                                }
                                {
                                    (this.props.isPreview && this.state.networkOperatorDeclared) || this.state.regixResult == EITRegixResult.NotImplemented ?
                                        <div className="flex-auto vertical-flex-container">
                                            <FloatingLabelInput
                                                className="flex-item flex-auto"
                                                placeholder={nls.nls.serviceWizard.regixResults.NotImplementedDeclaration}
                                                type='checkbox'
                                                value={this.state.networkOperatorDeclared}
                                                key={'networkOperatorDeclared'}
                                                isDisabled={this.props.isPreview}
                                                onValueChange={(newValue: InputValueType, hasError: boolean) => this.onValueChange(newValue, hasError, 'networkOperatorDeclared')} />
                                        </div>
                                        : null
                                }
                            </div>
                        </React.Fragment>
                        : null
                }
            </div>
        );
    }
}

const mapStateToProps = (state: IEITAppStore) => ({
    userInfo: state.eit.userInfo,
    loading: !state.map.webMapImported,
    eitServices: state.eit.servicesData
})

export default connect<OwnProps, any, any>(mapStateToProps, {setServiceData, ...mosaicLayoutDispatcher})(ServiceRequestPane);
