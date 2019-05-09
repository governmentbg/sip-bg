//Sys admin : START

var hostname = "eit1061.gisinv.bg" // hostname - CHANGE IT !
var scheme = "https://" // The scheme the website will be using. Possible values: ("http://" || "https://")
var forceProtocol = "https"; //Forcing protocol for avoiding mixed content. Possible values: ("http" || "https" || ""). 
// "" Means no forcing. This option may lead to 404 errors

var webmapUrlReplaces = {
    "eit1061.gisinv.bg:6080": hostname,
    "eit1061.gisinv.bg": hostname,
    "http://": scheme //Used for replacing urls in the webmap. The key will be replaced by the value. In most cases the value is the "hostname"
}

var origin = scheme + hostname; // Origin
var gisServer = origin + "/arcgis"; // ArcGIS endpoint
var tokenService = gisServer + "/tokens/generateToken"; // Token service endpoint
var restServices = gisServer + "/rest/services"; // Rest services endpoint
var selfInfo = gisServer + "/rest/self"; // Rest service "self" endpoint

var printServiceUrl = restServices + "/Utilities/PrintingTools/GPServer/Export%20Web%20Map%20Task"; // Print service url
var geometryServiceUrl = gisServer + "/rest/services/Utilities/Geometry/GeometryServer"; // Geometry service url

var documentsFolder = origin + "/Documents/"

//Sys admin : STOP
















config = {
    webmapUrlReplaces: webmapUrlReplaces,
    forceProtocol: forceProtocol,
    urls: {
        hostname: hostname,
        origin: origin,
        gisServer: gisServer,
        tokenService: tokenService,
        restServices: restServices,
        selfInfo: selfInfo,
        printServiceUrl: printServiceUrl,
        geometryServiceUrl: geometryServiceUrl
    },
    webMapUrls: {
        bg: "configs/webmap.json",
        en: ""
    },
    layersConfig: {

    },
    mapToFeatureServiceUrlCorrections: {

    },
    overridePopupInfos: {

    },
    ignoreResourceUrls: [],
    webMapToMapIgnoreResourceUrls: [
        "arcgis/rest/services/RegistersFeature",
        "arcgis/rest/services/RegistersProtected",
        "arcgis/rest/services/ServiceRegisters",
        "arcgis/rest/services/FeedbackFeature",
        "arcgis/rest/services/FeedbackAdminFeature",
        "arcgis/rest/services/Admin",
        "arcgis/rest/services/Users",
        "arcgis/rest/services/OrganizationFeature"], // if the resource url CONTAINS any webMapToMapIgnoreResourceUrls[i] it will not be added to the map
    mapConfig: {
        basemap: "osm",
        center: [2820000, 5260000],
        zoom: 8
    },
    login: "Optional", // "None" | "Optional" | "Required"
    //locale: "bg", //Can be hardcoded
    initState: {
        mosaicLayout: {
            currentNode: {
                direction: 'row',
                first: 'news',
                second: "map",
                splitPercentage: 40,
            },
            currentTheme: 'Blueprint',
            windowCount: 4,
        },
        map: {
            pointSymbol: {
                type: "simple-marker",
                color: "blue",
                size: 8,
                outline: {
                    width: 0.5,
                    color: "darkblue"
                }
            },
            polylineSymbol: {
                type: "simple-line",
                color: [226, 119, 40],
                width: 4
            },
            polygonSymbol: {
                type: "simple-fill",
                color: [255, 255, 255, 0.3],
                style: "solid",
                outline: {
                    color: "red",
                    width: 2
                }
            },
            identifyPointSymbol: {
                type: "simple-marker",
                color: "red",
                size: 10,
                opacity: 0.5,
                outline: {
                    width: 1,
                    color: "darkred"
                }
            },
            identifyPolylineSymbol: {
                type: "simple-line",
                color: "red",
                width: 1
            },
            identifyPolygonSymbol: {
                type: "simple-fill",
                color: [51, 200, 50, 0.2],
                style: "solid",
                outline: {
                    color: "red",
                    width: 1,
                    opacity: 0.6
                }
            },
            popup: {
                show: false,
                coordinates: [0, 0],
                maximized: false
            }
        }
    }
}


///// app specific
config.appSpecific = {
    mapServices: {
        TechnicalInfrastructure: restServices + "/TechnicalInfrastructure/MapServer/",
        Registers: restServices + "/Registers/MapServer/",
        RegistersProtected: restServices + "/RegistersProtected/MapServer/",
        Feedback: restServices + "/FeedbackFeature/MapServer/",
        Admin: restServices + "/Admin/MapServer/",
        Users: restServices + "/Users/MapServer/",
        Organization: restServices + "/OrganizationFeature/MapServer/",
        RegistersFeature: restServices + "/RegistersFeature/MapServer/",
        ServiceRegisters: restServices + "/ServiceRegisters/MapServer/",
        RegistrationRequest: restServices + "/RegistrationRequestFeature/MapServer/",
        FeedbackAdmin: restServices + "/FeedbackAdminFeature/MapServer/",
        News: restServices + "/News/MapServer/"      
    },
    featureServices: {
        TechnicalInfrastructure: restServices + "/TechnicalInfrastructure/FeatureServer/",
        Feedback: restServices + "/FeedbackFeature/FeatureServer/",
        FeedbackAdminFeature: restServices + "/FeedbackAdminFeature/FeatureServer/",
        RegistersFeature: restServices + "/RegistersFeature/FeatureServer/",
        Organization: restServices + "/OrganizationFeature/FeatureServer/",
        RegistrationRequest: restServices + "/RegistrationRequestFeature/FeatureServer/",
        News: restServices + "/NewsFeature/FeatureServer/",
    },
    eitservices: {
        Service1: restServices + "/EITServices/Service1/GPServer/",
        Service2: restServices + "/EITServices/Service2/GPServer/",
    },
    externalUrl: "https://gptogc.esri.com/geoportal/catalog/main/home.page",
    importDataServiceUrl: restServices + "/EITServices/ImportData/GPServer",
    inspireUrl: gisServer  + "/services/Registers/MapServer/WMSServer?request=GetCapabilities&service=WMS",
}

//TODO: write layers for convenience... otherwise use config.appSpecific.mapServices.Registers + "*" in the application
config.layers = {
    // Map
    Register1ServiceUrl: config.appSpecific.mapServices.Registers + "3",
    Register2ServiceUrl: config.appSpecific.mapServices.Registers + "4",
    Register2ServiceAttachmentsUrl: config.appSpecific.mapServices.Registers + "6",

    Register1ProtectedServiceUrl: config.appSpecific.mapServices.RegistersProtected + "0",
    Register2ProtectedServiceUrl: config.appSpecific.mapServices.RegistersProtected + "1",
    Register2ProtectedAttachmentsUrl: config.appSpecific.mapServices.RegistersFeature + "1",

    RegisterLabel2ServiceUrl: config.appSpecific.mapServices.Registers + "2",

    FeedbackServiceUrl: config.appSpecific.featureServices.Feedback + "1",
    SystemLog: config.appSpecific.mapServices.FeedbackAdmin + "2",
   
    RegistersFeatureActions: config.appSpecific.mapServices.RegistersFeature + "0",
    RegistersFeatureJoint: config.appSpecific.mapServices.RegistersFeature + "1",
    RegistrationRequest: config.appSpecific.featureServices.RegistrationRequest + "1",
    Users: config.appSpecific.mapServices.Users + "1",
    RegistersOrganizations: config.appSpecific.mapServices.Registers + "1",
    RegistersOrganizationsHyperlinks: config.appSpecific.mapServices.Registers + "5",
    ElementType: config.appSpecific.mapServices.Registers + "7",
    Regions: config.appSpecific.mapServices.Admin + "0",
    Municipalities: config.appSpecific.mapServices.Admin + "3",
    Landscapes: config.appSpecific.mapServices.Admin + "4",
    Settlements: config.appSpecific.mapServices.Admin + "0",
    OutlineOfSettlements: config.appSpecific.mapServices.Admin + "2",   
    //Metadata
    MetadataService: config.appSpecific.mapServices.Admin + "6",
    
    News: config.appSpecific.mapServices.News + "1",

    ServiceRegisters1: config.appSpecific.mapServices.ServiceRegisters + "1",
    ServiceRegisters2: config.appSpecific.mapServices.ServiceRegisters + "2",
    ServiceRegisters3: config.appSpecific.mapServices.ServiceRegisters + "3",
    ServiceRegisters4: config.appSpecific.mapServices.ServiceRegisters + "4",
    ServiceRegisters51: config.appSpecific.mapServices.ServiceRegisters + "5",
    ServiceRegisters52: config.appSpecific.mapServices.ServiceRegisters + "6",
    ServiceRegisters53: config.appSpecific.mapServices.ServiceRegisters + "7",
    MergedServiceRegister: config.appSpecific.mapServices.ServiceRegisters + "8",

    // Feature
    OrganizationFeature0: config.appSpecific.featureServices.Organization + "0",
    OrganizationFeature1: config.appSpecific.featureServices.Organization + "1",
    OrganizationHyperlinks: config.appSpecific.featureServices.Organization + "2",

    NewsFeature: config.appSpecific.featureServices.News + "1",
    SystemLogsFeature: config.appSpecific.featureServices.FeedbackAdminFeature + "2",
    
    //EITServices
    Service1Geoprocessing : config.appSpecific.eitservices.Service1 + "Service1",
    Service2Geoprocessing : config.appSpecific.eitservices.Service2 + "Service2",
}


config.layersConfig[config.layers.Register1ServiceUrl] = {
    preview: ["shortname", "activityname", "activitystatusdesc", "activitytypes", "activitystartdate", "activityenddate", "infrastructuretypes", "affectedinfrastructure", "plannedactivitystatusdesc"]
}

config.layersConfig[config.layers.RegisterLabel2ServiceUrl] = {
    doNotIdentify: true
}

config.layersConfig[config.layers.Register2ServiceUrl] = {
    preview: ["publicationdate", "shortname", "externalidentificator", "infrastructuretypes", "affectedinfrastructure", "righttypedesc", "rightdateentry", "rightenddate", "jointusagestatus"]
}

config.layersConfig[config.layers.RegistersFeatureActions] = {
    preview: ["shortname", "activityname", "infrastructuretypes", "activitytypes", "activitystartdate", "activityenddate", "infrastructuretypes", "affectedinfrastructure", "technicalchar", "restriction", "plannedactivitystatus"]
}

config.layersConfig[config.layers.RegistersFeatureJoint] = {
    preview: ["publicationdate", "shortname", "externalidentificator", "infrastructuretypes", "affectedinfrastructure", "technicalchar", "elementtype", "locationdescription", "rightdescription", "rightdateentry", "rightenddate", "jointusagestatus"]
}

config.layersConfig[config.layers.RegistersOrganizations] = {
    preview: ["shortname", "organizationtypedesc", "identificationcode", "siteurl"]
}

config.layersConfig[config.layers.MetadataService] = {
    preview: ["shortname", "credibility", "revisiondate", "keywords", "filename"]
}

config.layersConfig[config.layers.SystemLog] = {
    preview: ["activitytime", "systemmodule", "operationname", "operationparameters", "ipaddress", "username", "description", "targetid"]
}

config.layersConfig[config.layers.FeedbackServiceUrl] = {
    preview: ["formtype", "submissiontime", "username", "email", "addressee", "formtext", "contactdata", "subject", "feedbackstatus" ] 
}

for (var i = 1; i < 53; i++) {
    config.layersConfig[config.appSpecific.mapServices.TechnicalInfrastructure + i] = {
        preview: ["elementtype", "technicalchar", "revisiondate", "credibility" ]
    }
}

for (var i = 0; i < 8; i++) {
    config.layersConfig[config.appSpecific.mapServices.ServiceRegisters + i] = {
        preview: ["incomingnumber", "applicationtime", "messagetype", "subject", "serviceparameters", "completiontime"]
    }
}

// config.layersConfig[config.appSpecific.mapServices.ServiceRegisters + 8] = {
//     preview: ["service_id", "servicename", "incomingnumber", "organizationid", "applicationtime", "messagetype", "subject", "completiontime", "subject", "autorizedpersonname", "executionstatusdesc", "serviceparameters", "registrationstatus"]
// }
 
config.PreviewColumns = {
    ServicesRequestedByMe: 
        ["service_id", "servicename", "incomingnumber", "applicationtime", "subject", "completiontime", "subject", "commonstatusdesc", "recipient_name"],
    ServiceRequestedByMyOrganization:
        ["service_id", "servicename", "incomingnumber", "applicationtime", "subject", "completiontime", "subject", "autorizedpersonname", "commonstatusdesc", "recipient_name"],
    AllRequestedServices: 
        ["service_id", "servicename", "incomingnumber", "applicationtime", "subject", "completiontime", "subject", "autorizedpersonname", "organization_shortname", "commonstatusdesc", "recipient_name"],
    ReceivedAccessSharingApplications:
        ["incomingnumber", "organization_name", "applicationtime", "subject", "completiontime", "subject", "autorizedpersonname", "commonstatusdesc"],
    ReceivedApplicationsECMRegistration:
        ["incomingnumber", "organization_name", "applicationtime", "subject", "completiontime", "subject", "autorizedpersonname", "commonstatusdesc"],
    AllActivities: 
        ["shortname", "activityname", "activitystatusdesc", "activitytypes", "activitystartdate", "activityenddate", "infrastructuretypes", "affectedinfrastructure", "plannedactivitystatusdesc"],
    AllAnnouncements:
        ["publicationdate", "shortname", "externalidentificator", "infrastructuretypes", "affectedinfrastructure", "righttypedesc", "rightdateentry", "rightenddate", "jointusagestatusdesc"],
    AllUploadedData:
        ["credibility", "revisiondate", "keywords", "filename", "autorizedpersonname", "shortname"],
    RequestsCreateUser:
        ["username", "autorizedpersonname", "organizationname", "identificationcode", "requesttime", "email", "electronicidentification", "contactdata"],
    MyActivities:
        ["activityname", "activitystatusdesc", "activitytypes", "activitystartdate", "activityenddate", "infrastructuretypes", "affectedinfrastructure", "plannedactivitystatusdesc"],
    MyOrganizationActivities:
        ["autorizedpersonname", "activityname", "activitystatusdesc", "activitytypes", "activitystartdate", "activityenddate", "infrastructuretypes", "affectedinfrastructure", "plannedactivitystatusdesc"],
    MyAnnouncements:
        ["publicationdate", "externalidentificator", "infrastructuretypes", "affectedinfrastructure", "righttypedesc", "rightdateentry", "rightenddate", "jointusagestatusdesc"],
    MyOrganizationAnnouncements:
        ["publicationdate", "autorizedpersonname", "externalidentificator", "infrastructuretypes", "affectedinfrastructure", "righttypedesc", "rightdateentry", "rightenddate", "jointusagestatusdesc"],
    UploadedDataByMe:
        ["credibility", "revisiondate", "keywords", "filename"],
    UploadedDataByMyOrganization:
        ["credibility", "revisiondate", "keywords", "filename", "autorizedpersonname"],
}

const eitServicesFolder = restServices + "/EITServices/";
config.EITServices = {
  Service1: {
    GPUrl: eitServicesFolder + "Service1/GPServer/Service1",
  },
  Service2: {
    GPUrl: eitServicesFolder + "Service2/GPServer/Service2",
  },
  Service51: {
    GPUrl: eitServicesFolder + "Service51/GPServer/Service51",
  },
  Service52: {
    UploadUrl: eitServicesFolder + "Service52/GPServer/uploads/upload",
    GPUrl: eitServicesFolder + "Service52/GPServer/Service52",
  },
  Service53: {
    UploadUrl: eitServicesFolder + "Service53/GPServer/uploads/upload",
    GPUrl: eitServicesFolder + "Service53/GPServer/Service53",
  },
  ChangeServiceStatus: {
    GPUrl: eitServicesFolder + "ChangeServiceStatus/GPServer/ChangeServiceStatus"
  }
};

config.infrastructureCodedValues = [
    {
        "id": 5,
        "name": "Инфраструктурата за разполагане на ЕСМ",
        "code": 1,
        "subLayers": [
            {
                "id": 6,
                "name": "Точкови съоръжения от инфраструктурата за разполагане на ЕСМ",
            },
            {
                "id": 7,
                "name": "Линейни съоръжения от инфраструктурата за разполагане на ЕСМ",
            },
            {
                "id": 8,
                "name": "Полигонови съоръжения от инфраструктурата за разполагане на ЕСМ",
            },
        ]
    },
    {
        "id": 13,
        "name": "Газопреносна и газоразпределителна мрежа",
        "code": 2,
        "subLayers": [
            {
                "id": 14,
                "name": "Газопреносни и газоразпределителни точкови съоръжения",
            },
            {
                "id": 15,
                "name": "Газопреносни и газоразпределителни линейни съоръжения",
            },
            {
                "id": 16,
                "name": "Газопреносни и газоразпределителни полигонови съоръжения",
            },
        ]
    },
    {
        "id": 9,
        "name": "Електропреносна и елекроразпределителна мрежа",
        "code": 3,
        "subLayers": [
            {
                "id": 10,
                "name": "Електропреносни и електроразпределителни точкови съоръжения",
            },
            {
                "id": 11,
                "name": "Електропреносни и електроразпределителни линейни съоръжения",
            },
            {
                "id": 12,
                "name": "Електропреносни и електроразпределителни полигонови съоръжения",
            },
        ]
    },
    {
        "id": 25,
        "name": "Обществено осветление",
        "code": 4,
        "subLayers": [
            {
                "id": 26,
                "name": "Точкови съоръжения на общественото осветление",
            },
            {
                "id": 27,
                "name": "Линейни съоръжения на общественото осветление",
            },
            {
                "id": 28,
                "name": "Полигонови съоръжения на общественото осветление",
            },
        ]
    },
    {
        "id": 17,
        "name": "Топлопреносна и топлоразпределителна мрежа",
        "code": 5,
        "subLayers": [
            {
                "id": 18,
                "name": "Топлопреносни и топлоразпределителни точкови съоръжения",
            },
            {
                "id": 19,
                "name": "Топлопреносни и топлоразпределителни линейни съоръжения",
            },
            {
                "id": 20,
                "name": "Топлопреносни и топлоразпределителни полигонови съоръжения",
            },
        ]
    },
    {
        "id": 21,
        "name": "Канализационна мрежа и системи за управление на отпадни води",
        "code": 6,
        "subLayers": [
            {
                "id": 22,
                "name": "Канализационни точкови съоръжения",
            },
            {
                "id": 23,
                "name": "Канализационни линейни съоръжения",
            },
            {
                "id": 24,
                "name": "Канализационни полигонови съоръжения",
            },
        ]
    },
    {
        "id": 41,
        "name": "Железопътна мрежа",
        "code": 7,
        "subLayers": [
            {
                "id": 42,
                "name": "Точкови съоръжения от железопътната инфраструктура",
            },
            {
                "id": 43,
                "name": "Линейни съоръжения от железопътната инфраструктура",
            },
            {
                "id": 44,
                "name": "Полигонови съоръжения от железопътната инфраструктура",
            },
        ]
    },
    {
        "id": 29,
        "name": "Метрополитен",
        "code": 8,
        "subLayers": [
            {
                "id": 30,
                "name": "Точкови съоръжения от инфраструктурата на метрополитен",
            },
            {
                "id": 31,
                "name": "Линейни съоръжения от инфраструктурата на метрополитен",
            },
            {
                "id": 32,
                "name": "Полигонови съоръжения от инфраструктурата на метрополитен",
            },
        ]
    },
    {
        "id": 33,
        "name": "Републиканска пътна мрежа",
        "code": 9,
        "subLayers": [
            {
                "id": 34,
                "name": "Точкови съоръжения по РПМ",
            },
            {
                "id": 35,
                "name": "Линейни съоръжения по РПМ",
            },
            {
                "id": 36,
                "name": "Полигонови съоръжения по РПМ",
            },
        ]
    },
    {
        "id": 37,
        "name": "Общински пътища",
        "code": 10,
        "subLayers": [
            {
                "id": 38,
                "name": "Точкови съоръжения по общинската пътна мрежа",
            },
            {
                "id": 39,
                "name": "Линейни съоръжения по общинската пътна мрежа",
            },
            {
                "id": 40,
                "name": "Полигонови съоръжения по общинската пътна мрежа",
            },
        ]
    },
    {
        "id": 45,
        "name": "Пристанищна инфраструктура",
        "code": 11,
        "subLayers": [
            {
                "id": 46,
                "name": "Точкови съоръжения от пристанищната инфраструктура",
            },
            {
                "id": 47,
                "name": "Линейни съоръжения от пристанищната инфраструктура",
            },
            {
                "id": 48,
                "name": "Полигонови съоръжения от пристанищната инфраструктура",
            },
        ]
    },
    {
        "id": 49,
        "name": "Летищна инфраструктура",
        "code": 12,
        "subLayers": [
            {
                "id": 50,
                "name": "Точкови съоръжения от летищната инфраструктура",
            },
            {
                "id": 51,
                "name": "Линейни съоръжения от летищната инфраструктура",
            },
            {
                "id": 52,
                "name": "Полигонови съоръжения от летищната инфраструктура",
            },
        ]
    },
    {
        "id": 1,
        "name": "Електросъобщителна мрежа",
        "code": 99,
        "subLayers": [
            {
                "id": 2,
                "name": "Точкови елементи от ЕСМ",
            },
            {
                "id": 3,
                "name": "Линейни елементи от ЕСМ",
            },
            {
                "id": 4,
                "name": "Полигонови елементи от ЕСМ ",
            },
        ]
    },
]
config.activityCodedValues = [
    {
        "name": "Строителство",
        "code": 1
    },
    {
        "name": "Разполагане",
        "code": 2
    },
    {
        "name": "Монтаж",
        "code": 3
    },
]

config.RegisterRegistrationRequestStoreServiceUrl = origin + "/StoreAPI/api/Public/RegistrationRequest";
config.CheckUsernameAvailability = origin + "/StoreAPI/api/Public/CheckUsernameAvailability";
config.AcceptRegistrationRequestStoreServiceUrl = origin + "/StoreAPI/api/Admin/AcceptRegistrationRequest";
config.eDeliveryService = origin + "/EITIntegration/api/eDelivery/SendData";
config.regIx = "http://eit1061.gisinv.bg/EITIntegration/api/RegIx/GetData";

config.serviceProviderName = "ЕАУ";
config.serviceProviderBank = "Уникредит";
config.serviceProviderBIC = "134";
config.serviceProviderIBAN = "UNCR5134654734562345247567";
config.payServiceUrl = origin + "/StoreAPI/api/Service1EPayment/RegisterPayment";
config.administrativeServiceNotificationURL = origin + "/StoreAPI/api/Service1EPayment/OnStatusChanged";
config.checkPaymentStatusUrl = origin + "/StoreAPI/api/Service1EPayment/CheckStatus";
config.paymentReferenceType = "1";
config.eAuth = "https://eauthn.egov.bg:9445/eAuthenticator/eAuthenticator.seam";
config.samlTokenUrl = "https://eit.esribulgaria.com/EITSaml/EITEauth/EITSaml/GetSamlToken";
config.samlUrl = origin + "/EITSaml/EITEauth/EITSaml/GetSaml";

config.cardPayUrl = "https://epayments.abbaty.com:10102/vpos/payment";

config.BulletinServiceUrl = origin + "/StoreAPI/api/Public/Bulletin";
config.ServiceSignaturesUrl = origin + "/Signatures.WebAPI/api/ServiceSignatures/Service1";
config.IISDAServiceMainDataUrl = origin + "/StoreAPI/api/IISDA/GetAdmServiceMainData";
config.IISDAServiceNumbers = {
  Service1: 2,
  Service2: 3,
  Service3: 7,
  Service4: 8,
  Service51: 12,
  Service52: 14,
  Service53: 13,
};