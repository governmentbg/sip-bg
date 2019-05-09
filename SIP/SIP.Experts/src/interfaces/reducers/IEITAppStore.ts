import { IAppStore } from '../../core/interfaces/reducers/IAppStore';
import { IGraphic } from '../../core/interfaces/models';
import organizationEdits from '../../reducers/organizationEdits';
import { IAdminServicePayload } from '../../actions/dispatchers/serviceActionDispatcher';

export interface IUserInfo {
    username: string;
    roles: Array<string>;
    privilege: string;
    token: string;
    expires: Date;
    singInError?: Error;
    loading: boolean;
    isAdmin: boolean;
    isMunicipality: boolean;
    isOperator: boolean;
    isRegulator: boolean;
    user: {
        objectid: string;
        autorizedpersonname: string;
        email: string;
        organizationid: string;
        organizationtype?: number;
        authorizedpersonname: string;
        identificationcode: string;
        contactdata: string;
        organizationname: string;
        id: string;
        jointusageregistersubscribtion: boolean;
        newssubscribtion: boolean;
        notificationperiod: number;
    }
}

export interface IOrganizationEdits {
    organization: IGraphic;
}

export interface IEITMap {
    isMapActive: boolean;
}

export interface Iservice51Data {
    applicantType: string;
    date: string;
    authorizedpersonname: string;
    identificationcode: string;
    organizationname: string;
    contactdata: string;
    email: string;
    recipient: string;
    subject: string;
    message: string;
    uniqueIdOfRecipient: string;
}

export interface IEITServices {
    "51": Iservice51Data;
}

export interface IAdminService {
    adminServiceData: IAdminServicePayload,
}

export interface INotifyInfo {
    newRegistrationRequestsCount: number,
    new53Count: number
}

export interface IBrowserInfo {
    ip_address: string,
    browser_info: string,
}

export interface IEITAppStore extends IAppStore {
    eit: {
        userInfo: IUserInfo,
        organizationEdits: IOrganizationEdits,
        eitMap: IEITMap,
        adminService: IAdminService,
        servicesData: IEITServices,
        notifyInfo: INotifyInfo,
        browserInfo: IBrowserInfo,
    }
}