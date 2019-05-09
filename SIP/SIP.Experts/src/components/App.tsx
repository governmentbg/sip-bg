import '@blueprintjs/core/lib/css/blueprint.css';
import * as React from 'react';
import {
	Mosaic,
	MosaicNode,
	MosaicWindow,
	MosaicZeroState,
	ExpandButton,
	RemoveButton
} from '../core/components/Layouts/Mosaic/MosaicLib/MosaicLib';

import { FoldButton } from "../core/components/Layouts/Mosaic/MosaicLib/buttons/attributeTable/FoldButton";
import { connect } from 'react-redux';

import Map = require("esri/Map");
import WebMapView from "../core/components/Esri/WebMapView";

import PositionByCoordinates from "../core/components/PositionByCoordinates/PositionByCoordinates";

import LoginPopup from "../core/components/Login/LoginPopup";

import { IMosaicLayoutDispatcher, IMapDispatcher, IPopupDispatcher, IFeatureTableDispatcher } from "../core/interfaces/dispatchers";
import { mosaicLayoutDispatcher, mapDispatcher, popupDispatcher, tableDispatcher } from "../core/actions/dispatchers";
import { IMapView, IGraphic, IFeatureLayerInfo } from "../core/interfaces/models";

import { THEMES } from "../core/components/Layouts/Mosaic/Themes";


import MosaicWindows from "../enums/EITAppWindow";
import { appConfig } from '../core/appConfig';

import { IEITAppConfig } from "../interfaces/IEITAppConfig";

import CoordinatesSearch from "../core/components/Esri/CoordinatesSearch";

import MapToolBar from "../core/components/Map/MapToolbar";
import AdminSearchOnMap from './Widgets/AdminSearchOnMap';
import MobileRibbonsContainer from "../core/components/Layouts/MobileRibbons/MobileRibbonsContainer";
import MobileRibbonsWindow from '../core/enums/MobileRibbonsWindow';
import EITMobileView from "./EITMobileView";

import MobileRibbonButtonImage from "../core/components/Layouts/MobileRibbons/MobileRibbonButtonImage";
import LegendView from '../core/components/Esri/Widgets/LegendView';
import LayerListView from '../core/components/Esri/Widgets/LayerListView';
import Print from '../core/components/Esri/Widgets/Print';
import CustomerFeedbackForm from './Feedback/CustomerFeedbackForm';
import Bulletin from './Feedback/Bulletin';
import ImportDataForm from './ImportData/ImportDataForm';
import * as ServiceWizards from './Services/ServiceWizards';
import ServiceInfoPane from './Services/ServiceInfoPane';

import FixedPopupRenderer from '../core/components/PopupRenderers/FixedPopupRenderer';
import MapView = require("esri/views/MapView");
import RectangleIdentify from "../core/components/Map/Widgets/RectangleIdentify";
import EITTableContainer from "./AttributeTable/EITTableContainer";
import SingleEditorViewContainer from "./Editing/SingleEditorViewContainer";
import OrganizationEditing from "./Editing/OrganizationEditing";
import { tryRecoverCredentials } from "../actions/dispatchers/userInfo";
import { setBrowserInfo, getIPAddress, getBrowserInfo } from "../actions/dispatchers/browserInfoDispatcher";
import { IBrowserInfo, IBrowserInfoDispatcher } from "../interfaces/dispatchers/IBrowserInfoDispatcher";

import ExtentNavigator from "../core/components/Esri/ExtentNavigator";
import ClearMeasureGraphics from "../core/components/Esri/ClearMeasureGraphics";
import LayerList from "../core/components/Esri/LayerList";
import Legend from "../core/components/Esri/Legend";
import TableToolbar from "../core/components/AttributeTable/TableToolbar";


import Ribbon from './Ribbon/Ribbon';
// import Layers from './Esri/Widgets/Layers';
// import Legend from './Esri/Widgets/Legend';



import { nls } from "./nls";
import { OnClickAction } from '../core/enums/MapEvents';
import { IEITAppStore, IUserInfo } from '../interfaces/reducers/IEITAppStore';
import AboutPopup from "./Popups/AboutPopup";
import EITAppWindow from '../enums/EITAppWindow';
import EITools from "./EITools";
import EITNews from "./News/EITNews";
import ContentDoc from './ContentDoc';
import InspireContent from './InspireContent';
import OpenDataContent from './OpenDataContent';

import Registration from './Login/Registration';
import { eitAppConfig } from '../eitAppConfig';
import { FeatureTableInfo } from "../core/models/FeatureTableInfo";
import ExportXml from '../core/components/AttributeTable/Paginations/Tools/ExportXml';
import ExportCsv from '../core/components/AttributeTable/Paginations/Tools/ExportCsv';
import ZoomTo from '../core/components/AttributeTable/Paginations/Tools/ZoomTo';
import ToggleWatchMap from '../core/components/AttributeTable/Paginations/Tools/ToggleWatchMap';
import FieldValueChanger from '../core/components/AttributeTable/Paginations/Tools/FieldValueChanger';
import FieldValueChangerSelect from '../core/components/AttributeTable/Paginations/Tools/FieldValueChangerSelect';

import AdministrationOfRegistrationRequests from '../components/Login/AdministrationOfRegistrationRequests';

import AdditionalComponentUi from './AdditionalComponentUi';
import { string } from 'prop-types';
import { isNull, isNullOrUndefined, isObject } from 'util';

import NewsForm from './News/NewsForm'

interface DispatchProps extends IMosaicLayoutDispatcher, IMapDispatcher, IPopupDispatcher, IFeatureTableDispatcher, IBrowserInfoDispatcher {
	tryRecoverCredentials: typeof tryRecoverCredentials;
}

interface OwnProps {
	mapView: IMapView | undefined;
	currentNode: MosaicNode<string> | null;
	currentTheme: any;
	loggedIn: boolean;
	winCount: number;
	mobile: boolean;
	attributeTableTabs: { [key: string]: any }
	editinInfoId?: string;
	isMapActive: boolean;
	userInfo: IUserInfo;
}

type Props = DispatchProps & OwnProps

interface State {
	credentialsRestoreAttempted: boolean;
}
declare global { interface Window { setCookie: (name: string, value: string, days?: number) => void; getCookie: (name: string) => string; eraseCookie: (name: string, paths: Array<string>) => void; } }
class App extends React.PureComponent<Props, State> {
	map: Map;
	constructor(props: Props) {
		super(props);
		this.getMosaics = this.getMosaics.bind(this);
		this.createDefaultWindow = this.createDefaultWindow.bind(this);
		this.props.setMapOnClick(OnClickAction.IdentifyToTables);
		this.getMosaicWindowInfo = this.getMosaicWindowInfo.bind(this);
		this.state = {
			credentialsRestoreAttempted: false
		}
		if (!window.getCookie("hideAbout")) {
			props.addPopups({
				"about": {
					width: "700px",
					content: () => <AboutPopup />,
					header: () => <div></div>,
					closeButton: () => <span>X</span>
				}
			})
		}
	}

	componentDidMount() {
		this.props.tryRecoverCredentials(() => {
			this.setState({ credentialsRestoreAttempted: true })
        })
        getIPAddress().then((response: string) => {
            var browser_info: IBrowserInfo = {
                ip_address: response,
                browser_info: getBrowserInfo()
            };
            this.props.setBrowserInfo(browser_info);
		});
    }



	getMosaicWindowInfo(title: string, path: any, props: any): { content: JSX.Element, props: { title: string, tools: React.ReactChild[], createNode: any, path: any } } {
		let content: JSX.Element;
		switch (title) {
			case MosaicWindows.map:
				content = <div className="webmap">
					<AdditionalComponentUi show={!this.props.isMapActive} />
					{this.getMapToolbar()}
					<ExtentNavigator />
					<ClearMeasureGraphics />
					<Legend />
					<WebMapView />
				</div>;

				props.title = nls.nls.eitWidgetNames[title];
				props.toolbarControls = React.Children.toArray([<div />]);
				break;
			case MosaicWindows.tools:
				content = <EITools />
				props.title = nls.nls.eitWidgetNames[title];
				props.toolbarControls = React.Children.toArray([<RemoveButton title={nls.nlsu.general.close} />,]);
				break;
			case MosaicWindows.news:
				content = <EITNews />
				props.title = nls.nls.eitWidgetNames[title];
				props.toolbarControls = React.Children.toArray([<RemoveButton title={nls.nlsu.general.close} />,]);
				break;
			case MosaicWindows.metaDatSearch:
				content = <ContentDoc />
				props.title = nls.nls.eitWidgetNames[title];
				props.toolbarControls = React.Children.toArray([<RemoveButton title={nls.nlsu.general.close} />,]);
				break;
			case MosaicWindows.inspire:
				content = <InspireContent />
				props.title = nls.nls.eitWidgetNames[title];
				props.toolbarControls = React.Children.toArray([<RemoveButton title={nls.nlsu.general.close} />,]);
				break;
			case MosaicWindows.openData:
				content = <OpenDataContent />
				props.title = nls.nls.eitWidgetNames[title];
				props.toolbarControls = React.Children.toArray([<RemoveButton title={nls.nlsu.general.close} />,]);
				break;
			case MosaicWindows.createUserRequest:
				content = <Registration />
				props.title = nls.nls.eitWidgetNames[title];
				props.toolbarControls = React.Children.toArray([<RemoveButton title={nls.nlsu.general.close} />,]);
				break;
			// case MosaicWindows.legend:
			// 	content = <LegendView />
			// 	props.title = nls.nls.eitWidgetNames[title];
			// 	props.toolbarControls = React.Children.toArray([<RemoveButton title={nls.nlsu.general.close} />,]);
			// 	break;
			case MosaicWindows.detailEditing:
				content = <SingleEditorViewContainer detailViewClassName="editing-detail-view" />
				props.title = !!this.props.editinInfoId ?
					(this.props.editinInfoId == eitAppConfig.layers.RegistersFeatureJoint ? nls.nls.ribbon.registry2.createNewАnnouncement : (this.props.editinInfoId == eitAppConfig.layers.RegistersFeatureActions ? nls.nls.ribbon.registry1.createNewАctivity : nls.nls.eitWidgetNames[title]))
					:
					nls.nls.eitWidgetNames[title];
				props.toolbarControls = React.Children.toArray([<RemoveButton title={nls.nlsu.general.close} />,]);
				break;

			case MosaicWindows.organizationEditing:
				content = <OrganizationEditing detailViewClassName="editing-detail-view" />
				props.title = nls.nls.eitWidgetNames[title];
				props.toolbarControls = React.Children.toArray([<RemoveButton title={nls.nlsu.general.close} />,]);
				break;

			// case MosaicWindows.layers:
			// 	content = <LayerListView />
			// 	props.title = nls.nls.eitWidgetNames[title];
			// 	props.toolbarControls = React.Children.toArray([<RemoveButton title={nls.nlsu.general.close} />,]);
			// 	break;

			// case MosaicWindows.print:
			// 	content = <Print />
			// 	props.title = nls.nls.eitWidgetNames[title];
			// 	props.toolbarControls = React.Children.toArray([<RemoveButton title={nls.nlsu.general.close} />,]);
			// 	break;

			case MosaicWindows.feedback:
				content = <CustomerFeedbackForm />
				props.title = nls.nls.eitWidgetNames[title];
				props.toolbarControls = React.Children.toArray([<RemoveButton title={nls.nlsu.general.close} />,]);
				break;
			case MosaicWindows.bulletin:
				content = <Bulletin />
				props.title = nls.nls.eitWidgetNames[title];
				props.toolbarControls = React.Children.toArray([<RemoveButton title={nls.nlsu.general.close} />,]);
				break;

			case MosaicWindows.adService1Info:
				content = <ServiceInfoPane
                    title={nls.nls.ribbon.adService1.description}
                    serviceNr={1} 
					introUrl='public/eit/Services/Service1Intro.htm'
					window={EITAppWindow.adService1Wizard} />
				props.title = nls.nls.eitWidgetNames[title];
				props.toolbarControls = React.Children.toArray([<RemoveButton title={nls.nlsu.general.close} />,]);
				break;
			case MosaicWindows.adService2Info:
				content = <ServiceInfoPane
                    title={nls.nls.ribbon.adService2.description}
                    serviceNr={2} 
					introUrl='public/eit/Services/Service2Intro.htm'
					window={EITAppWindow.adService2Wizard} />
				props.title = nls.nls.eitWidgetNames[title];
				props.toolbarControls = React.Children.toArray([<RemoveButton title={nls.nlsu.general.close} />,]);
				break;
			case MosaicWindows.adService3Info:
				content = <ServiceInfoPane
                    title={nls.nls.ribbon.adService3.description}
                    serviceNr={3} 
					introUrl='public/eit/Services/Service3Intro.htm'
					window={EITAppWindow.adService3Wizard} />
				props.title = nls.nls.eitWidgetNames[title];
				props.toolbarControls = React.Children.toArray([<RemoveButton title={nls.nlsu.general.close} />,]);
				break;
			case MosaicWindows.adService4Info:
				content = <ServiceInfoPane
                    title={nls.nls.ribbon.adService4.description}
                    serviceNr={4} 
					introUrl='public/eit/Services/Service4Intro.htm'
					window={EITAppWindow.adService4Wizard} />
				props.title = nls.nls.eitWidgetNames[title];
				props.toolbarControls = React.Children.toArray([<RemoveButton title={nls.nlsu.general.close} />,]);
				break;
			case MosaicWindows.adService51Info:
				content = <ServiceInfoPane
                    title={nls.nls.ribbon.adService51.description}
                    serviceNr={51} 
					introUrl='public/eit/Services/Service51Intro.htm'
					window={EITAppWindow.adService51Wizard} />
				props.title = nls.nls.eitWidgetNames[title];
				props.toolbarControls = React.Children.toArray([<RemoveButton title={nls.nlsu.general.close} />,]);
				break;
			case MosaicWindows.adService52Info:
				content = <ServiceInfoPane
                    title={nls.nls.ribbon.adService52.description}
                    serviceNr={52} 
					introUrl='public/eit/Services/Service52Intro.htm'
					window={EITAppWindow.adService52Wizard} />
				props.title = nls.nls.eitWidgetNames[title];
				props.toolbarControls = React.Children.toArray([<RemoveButton title={nls.nlsu.general.close} />,]);
				break;
			case MosaicWindows.adService53Info:
				content = <ServiceInfoPane
                    title={nls.nls.ribbon.adService53.description}
                    serviceNr={53} 
					introUrl='public/eit/Services/Service53Intro.htm'
					window={EITAppWindow.adService53Wizard} />
				props.title = nls.nls.eitWidgetNames[title];
				props.toolbarControls = React.Children.toArray([<RemoveButton title={nls.nlsu.general.close} />,]);
				break;

			case MosaicWindows.adService1Wizard:
				content = <ServiceWizards.ServiceWizard1 />
				props.title = nls.nls.eitWidgetNames[title];
				props.toolbarControls = React.Children.toArray([<RemoveButton title={nls.nlsu.general.close} />,]);
				break;
			case MosaicWindows.adService2Wizard:
				content = <ServiceWizards.ServiceWizard2 />
				props.title = nls.nls.eitWidgetNames[title];
				props.toolbarControls = React.Children.toArray([<RemoveButton title={nls.nlsu.general.close} />,]);
				break;
			case MosaicWindows.adService3Wizard:
				content = <ServiceWizards.ServiceWizard3 />
				props.title = nls.nls.eitWidgetNames[title];
				props.toolbarControls = React.Children.toArray([<RemoveButton title={nls.nlsu.general.close} />,]);
				break;
			case MosaicWindows.adService4Wizard:
				content = <ServiceWizards.ServiceWizard4 />
				props.title = nls.nls.eitWidgetNames[title];
				props.toolbarControls = React.Children.toArray([<RemoveButton title={nls.nlsu.general.close} />,]);
				break;
			case MosaicWindows.adService51Wizard:
				content = <ServiceWizards.ServiceWizard51 />
				props.title = nls.nls.eitWidgetNames[title];
				props.toolbarControls = React.Children.toArray([<RemoveButton title={nls.nlsu.general.close} />,]);
				break;
			case MosaicWindows.adService52Wizard:
				content = <ServiceWizards.ServiceWizard52 />
				props.title = nls.nls.eitWidgetNames[title];
				props.toolbarControls = React.Children.toArray([<RemoveButton title={nls.nlsu.general.close} />,]);
				break;
			case MosaicWindows.adService53Wizard:
				content = <ServiceWizards.ServiceWizard53 />
				props.title = nls.nls.eitWidgetNames[title];
				props.toolbarControls = React.Children.toArray([<RemoveButton title={nls.nlsu.general.close} />,]);
				break;
			case MosaicWindows.servicePreview:
				content = <ServiceWizards.ServicePreview />
				props.title = nls.nls.eitWidgetNames[title];
				props.toolbarControls = React.Children.toArray([<RemoveButton title={nls.nlsu.general.close} />,]);
				break;

			case MosaicWindows.tables:
				content = <EITTableContainer tabbed={true} alwaysShowTabTitle={Object.keys(this.props.attributeTableTabs).length != 1 || !!nls.nls.eitWidgetNames['tables_str_container']} />;
				if (Object.keys(this.props.attributeTableTabs).length == 1) {
					props.title = this.props.attributeTableTabs[Object.keys(this.props.attributeTableTabs)[0]].title;
				} else {
					props.title = nls.nls.eitWidgetNames[title];
					if (nls.nls.eitWidgetNames['tables_str_container']) {
						nls.nls.eitWidgetNames[title] = nls.nls.eitWidgetNames['tables_str_container'];
						delete nls.nls.eitWidgetNames['tables_str_container'];
					}
				}

				props.toolbarControls = <TableToolbar tools={
					(props: FeatureTableInfo, layerInfo: IFeatureLayerInfo) => {
						let ts = [<ExportXml title={nls.nls.table.exportXML} key={1} table={props} isAdmin={this.props.userInfo.isAdmin} selectedIds={props.selectedIds || {}} btnClassName="tableToolbarBtn marginLeft" />];
						ts.push(<ExportCsv title={nls.nls.table.exportCSV} key={5} table={props} isAdmin={this.props.userInfo.isAdmin} selectedIds={props.selectedIds || {}} btnClassName="tableToolbarBtn marginLeft" />);
						if (!layerInfo.isTable) {
							ts.push(<ZoomTo
								key={2} title={""}
								selections={props.selectedIds || {}}
								btnClassName="tableToolbarBtn marginLeft" />,
								<ToggleWatchMap title={nls.nls.table.filterFromMap} key={3} tableId={props.id} watching={props.watchMapExtend} btnClassName="tableToolbarBtn marginLeft" />)
						}

						if (props.id === eitAppConfig.layers.Register1ProtectedServiceUrl && (props.title === nls.nls.login.myOrganizationActivities || props.title === nls.nls.login.myActivities || props.title === nls.nls.login.allActivities)) {
							ts.push(
								<FieldValueChanger
									key={6}
									featureTableInfo={props}
									title={'Смяна на състояние като активна'}
									btnClassName={"tableToolbarBtn marginLeft"}
									fieldName={"plannedactivitystatus"}
									changeValueTo={1}
									filteredByFields={this.props.userInfo.isAdmin ? ["1=1"] : ["userid", "networkoperatorid"]}
									selectedIds={props.selectedIds || {}}
									img={"public/icons/edit.png"}
									serviceUrl={eitAppConfig.layers.Register1ProtectedServiceUrl}
									editUrl={eitAppConfig.layers.RegistersFeatureActions} />
							);
							ts.push(
								<FieldValueChanger
									key={7}
									featureTableInfo={props}
									title={'Смяна на състояние като неактивна'}
									btnClassName={"tableToolbarBtn marginLeft"}
									fieldName={"plannedactivitystatus"}
									changeValueTo={2}
									filteredByFields={this.props.userInfo.isAdmin ? ["1=1"] : ["userid", "networkoperatorid"]}
									selectedIds={props.selectedIds || {}}
									img={"public/icons/edit.png"}
									serviceUrl={eitAppConfig.layers.Register1ProtectedServiceUrl}
									editUrl={eitAppConfig.layers.RegistersFeatureActions} />
							);
						}

						if (props.id === eitAppConfig.layers.Register2ProtectedServiceUrl && (props.title === nls.nls.login.myOrganizationAnnouncements || props.title === nls.nls.login.myAnnouncements || props.title === nls.nls.login.allAnnouncements)) {
							ts.push(
								<FieldValueChanger
									key={8}
									featureTableInfo={props}
									title={'Смяна на състояние като активно'}
									btnClassName={"tableToolbarBtn marginLeft"}
									fieldName={"jointusagestatus"}
									changeValueTo={1}
									filteredByFields={this.props.userInfo.isAdmin ? ["1=1"] : ["userid", "networkoperatorid"]}
									selectedIds={props.selectedIds || {}}
									img={"public/icons/edit.png"}
									serviceUrl={eitAppConfig.layers.Register2ProtectedServiceUrl}
									editUrl={eitAppConfig.layers.RegistersFeatureJoint} />

							);

							ts.push(
								<FieldValueChanger
									key={9}
									featureTableInfo={props}
									title={'Смяна на състояние като неактивно'}
									btnClassName={"tableToolbarBtn marginLeft"}
									fieldName={"jointusagestatus"}
									changeValueTo={2}
									filteredByFields={this.props.userInfo.isAdmin ? ["1=1"] : ["userid", "networkoperatorid"]}
									selectedIds={props.selectedIds || {}}
									img={"public/icons/edit.png"}
									serviceUrl={eitAppConfig.layers.Register2ProtectedServiceUrl}
									editUrl={eitAppConfig.layers.RegistersFeatureJoint} />

							);
						}
						if (props.id === eitAppConfig.layers.MergedServiceRegister && props.query.where.indexOf("service_id = 53") > -1 && this.props.userInfo.isAdmin) {
							ts.push(
								<FieldValueChangerSelect
									key={10}
									featureTableInfo={props}
									title={"Статус на заявлението"}
									placeholder={nls.nls.statusECMplaceholder}
									fieldName={"registrationstatus"}
									filteredByField={this.props.userInfo.isAdmin ? "service_id = 53" : `service_id = 53 and recipientid='${this.props.userInfo.user.organizationid}'`}
									userInfo={this.props.userInfo}
									selectedIds={props.selectedIds || {}}
									selectorItems={{ ...{ 0: 'Смяна на статус на заявлението' }, ...nls.nls.stusesECM }}
									img={"public/eit/Common/validate.png"}
									serviceUrl={eitAppConfig.layers.MergedServiceRegister}
									editUrl={eitAppConfig.EITServices.ChangeServiceStatus.GPUrl}
								/>

							);
						}
						if (props.id === eitAppConfig.layers.FeedbackServiceUrl) {
							ts.push(
								<FieldValueChanger
									key={11}
									featureTableInfo={props}
									title={'Маркирай като прочетено'}
									btnClassName={"tableToolbarBtn marginLeft"}
									fieldName={"feedbackstatus"}
									changeValueTo={2}
									filteredByFields={["1=1"]}
									selectedIds={props.selectedIds || {}}
									img={"public/icons/edit.png"}
									serviceUrl={eitAppConfig.layers.FeedbackServiceUrl}
									editUrl={eitAppConfig.layers.FeedbackServiceUrl} />

							)
						}
						if (props.id === eitAppConfig.layers.RegistrationRequest) {
							ts.push(<AdministrationOfRegistrationRequests
								key={12}
								featureTableInfo={props}
								statusFieldName={"requeststatus"}
								acceptBtnTitle="Потвърждаване на заявката"
								acceptImageUrl={"public/eit/Registration/accept_user.png"}
								acceptStatus={"2"}
								filteredByField={"requeststatus"}
								selectedIds={props.selectedIds || {}}
								rejectBtnTitle={"Отхвърляне на заявката"}
								rejectImageUrl={"public/eit/Registration/reject_user.png"}
								rejectStatus={"3"}
								registrationRequestsServiceUrl={eitAppConfig.layers.RegistrationRequest}
							/>);
						}

						if (props.id === eitAppConfig.layers.News && this.props.userInfo.isAdmin) {
							ts.push(
								<button
									key={13}
									className={"tableToolbarBtn marginLeft"}
									onClick={() => {
										this.props.addPopups({
											"newsFormPopup": {
												width: "500px",
												height: "80%",
												content: () => <NewsForm
													token={this.props.userInfo.token}
													onSuccess={() => {
														this.props.reQuery();
													}}
													onCancel={() => {
														this.props.removePopups(["newsFormPopup"])
													}
													}
												/>,
												header: () => <div>{nls.nls.news.formTitle}</div>
											}
										})
									}}>
									<img style={{ height: "25px", width: "25px" }} src="public/eit/Common/add_news32.png" />
								</button>
							);
							ts.push(
								<FieldValueChanger
									key={14}
									featureTableInfo={props}
									title={'Смяна на състояние като активна'}
									btnClassName={"tableToolbarBtn marginLeft"}
									fieldName={"newsstatus"}
									changeValueTo={1}
									filteredByFields={["1=1"]}
									selectedIds={props.selectedIds || {}}
									img={"public/eit/Common/activate_news32.png"}
									serviceUrl={eitAppConfig.layers.News}
									editUrl={eitAppConfig.layers.NewsFeature} />
							);
							ts.push(
								<FieldValueChanger
									key={15}
									featureTableInfo={props}
									title={'Смяна на състояние като неактивна'}
									btnClassName={"tableToolbarBtn marginLeft"}
									fieldName={"newsstatus"}
									changeValueTo={2}
									filteredByFields={["1=1"]}
									selectedIds={props.selectedIds || {}}
									img={"public/eit/Common/deactivate_news32.png"}
									serviceUrl={eitAppConfig.layers.News}
									editUrl={eitAppConfig.layers.NewsFeature} />
							);
						}


						ts.push(<RemoveButton title={nls.nlsu.general.close} key={4} />)
						return ts;
					}
				} />
				break;
			case MosaicWindows.importData:
				content = <ImportDataForm />
				props.title = nls.nls.eitWidgetNames[title];
				props.toolbarControls = React.Children.toArray([<RemoveButton title={nls.nlsu.general.close} />,]);
				break;
			default:
				content = <h1>{`${nls.nlsu.general.window} ${title}`}</h1>;
				props.title = `${nls.nlsu.general.window}  ${title}`;
				props.notFound = true;
				break;
		}

		return {
			content: content,
			props: props
		}
	}

	getMosaics(title: string, path: any) {
		var content: JSX.Element;
		let props = {
			createNode: this.createDefaultWindow,
			path
		} as any;
		let mosaicWidnowInfo = this.getMosaicWindowInfo(title, path, props);

		return (
			<MosaicWindow
				{...mosaicWidnowInfo.props} >
				{mosaicWidnowInfo.content}
			</MosaicWindow>
		)
	}
	createDefaultWindow() {
		return MosaicWindows.map;
	}

	getMapToolbar() {
		return (
			<MapToolBar left={true} widgets={[{
				key: "extentnavigator",
				content: <AdminSearchOnMap />,
				button: <span className="esri-icon-map-pin"></span>
			}]} defaultOpen="">
			</MapToolBar>

		);
	}

	render() {
		return (
			this.state.credentialsRestoreAttempted ?
				<div className="main">
					<div className="react-mosaic-example-app">
						{this.props.mobile ? null : <Ribbon />}
						{appConfig.login == "Required" ?
							<LoginPopup />
							:
							this.props.mobile ?
								<div style={{ height: "100%", width: "100%" }}>
									<EITMobileView getMosaicWindowInfo={this.getMosaicWindowInfo}>
										<div className="webmap">
											<WebMapView />
										</div>

									</EITMobileView>

								</div>
								:
								<Mosaic
									renderTile={this.getMosaics}
									zeroStateView={<MosaicZeroState createNode={this.createDefaultWindow} />}
									value={this.props.currentNode}
									onChange={(currentNode: MosaicNode<string>) => { this.props.changeCurrentNode(currentNode) }}
									className={THEMES[this.props.currentTheme]} />


						}
					</div>
					<FixedPopupRenderer />

				</div>
				:
				null
		);
	}
}

const mapStateToProps = (state: IEITAppStore) => {
	return ({
		mapView: state.map.mapView,
		currentNode: state.mosaicLayout.currentNode,
		currentTheme: state.mosaicLayout.currentTheme,
		loggedIn: state.application.loggedIn,
		winCount: state.mosaicLayout.windowCount,
		mobile: state.application.mobile,
		attributeTableTabs: state.attributeTable.attributeTableTabs,
		editinInfoId: state.edits.singleEditor ? state.edits.singleEditor.layerInfoId : undefined,
		isMapActive: state.eit.eitMap.isMapActive,
		userInfo: state.eit.userInfo
	})
};

export default connect<OwnProps, DispatchProps, {}>((state: IEITAppStore) => mapStateToProps(state), {
    ...mosaicLayoutDispatcher, ...mapDispatcher, setBrowserInfo, tryRecoverCredentials, ...popupDispatcher, ...tableDispatcher
})(App);
