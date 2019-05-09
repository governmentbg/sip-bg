import { IAppConfig } from "../core/interfaces/reducers/IAppConfig";

interface IAppSpecific {
    mapServices: {
        TechnicalInfrastructure: string;
        Registers: string;
        Feedback: string;
        Admin: string;
    },
    featureServices: {
        TechnicalInfrastructure: string;
        Feedback: string;
        RegistersFeature: string;
    },
    externalUrl: string,
    importDataServiceUrl: string,
    inspireUrl: string
    //service51GPUrl: string,
    //service52GPUrl: string,
    //service53GPUrl: string,
}

export interface IEITAppConfig extends IAppConfig {
    appSpecific: IAppSpecific;
    layers: {
        Register1ServiceUrl: string;
        Register2ServiceUrl: string;
        Register2ServiceAttachmentsUrl: string;
        Register1ProtectedServiceUrl: string;
        Register2ProtectedServiceUrl: string;
        Register2ProtectedAttachmentsUrl: string;
        FeedbackServiceUrl: string;
        RegistersFeatureActions: string;
        RegistersFeatureJoint: string;
        OrganizationFeature0: string;
        OrganizationFeature1: string;
        OrganizationHyperlinks: string;
        Users: string;
        RegistrationRequest: string;
        RegistersOrganizations: string;
        RegistersOrganizationsHyperlinks: string;
        ElementType: string;
        Regions: string;
        Municipalities: string;
        Landscapes: string;
        Settlements: string;
        OutlineOfSettlements: string;
        MetadataService: string;
        News: string;
        NewsFeature: string;
        SystemLog: string;
        SystemLogsFeature:string;
        ServiceRegisters1: string;
        ServiceRegisters2: string;
        ServiceRegisters3: string;
        ServiceRegisters4: string;
        ServiceRegisters51: string;
        ServiceRegisters52: string;
        ServiceRegisters53: string;
        MergedServiceRegister: string;
        Service1Geoprocessing: string;
        Service2Geoprocessing: string;
    };
    infrastructureCodedValues: Array<{ id: number ,code: number, name: string, subLayers:Array<{id: number , name: string}> }>;
    activityCodedValues: Array<{ code: number, name: string }>;
    RegisterRegistrationRequestStoreServiceUrl: string;
    BulletinServiceUrl: string;
    ServiceSignaturesUrl: string;
    CheckUsernameAvailability: string;
    AcceptRegistrationRequestStoreServiceUrl: string;
    eDeliveryService: string;
    regIx: string;
    eAuth: string;
    samlUrl: string;
    samlTokenUrl: string;
    PreviewColumns: {
        ServiceRequestedByMyOrganization: Array<string>,
        ServicesRequestedByMe: Array<string>,
        ReceivedAccessSharingApplications: Array<string>,
        AllRequestedServices: Array<string>,
        ReceivedApplicationsECMRegistration: Array<string>,
        AllActivities: Array<string>,
        AllAnnouncements: Array<string>,
        AllUploadedData: Array<string>,
        RequestsCreateUser: Array<string>,
        MyActivities: Array<string>,
        MyOrganizationActivities: Array<string>,
        MyAnnouncements: Array<string>,
        MyOrganizationAnnouncements: Array<string>,
        UploadedDataByMe: Array<string>,
        UploadedDataByMyOrganization: Array<string>,
    };
    EITServices: {
        // DP_TODO: Discuss with Zlati
        //Service1: {
        //    GPUrl: string,
        //},
        //Service2: {
        //    GPUrl: string,
        //},
        Service51: {
            GPUrl: string,
        },
        Service52: {
            UploadUrl: string,
            GPUrl: string,
        },
        Service53: {
            UploadUrl: string,
            GPUrl: string,
        },
        ChangeServiceStatus: {
            GPUrl: string,
        }
    }
    
    serviceProviderName: string;
    serviceProviderBank: string;
    serviceProviderBIC: string;
    serviceProviderIBAN: string;
    payServiceUrl: string;
    paymentReferenceType: string;
    administrativeServiceNotificationURL: string;
    cardPayUrl: string;
    checkPaymentStatusUrl: string;
    IISDAServiceMainDataUrl: string;
    IISDAServiceNumbers: {
        Service1?: number,
        Service2?: number,
        Service3?: number,
        Service4?: number,
        Service51?: number,
        Service52?: number,
        Service53?: number,
    };
}