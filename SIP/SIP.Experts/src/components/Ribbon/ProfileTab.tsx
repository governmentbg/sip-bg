import * as React from "react";
import RibbonButton from "./RibbonButton";
import RibbonPanel from "./RibbonPanel";
import RibbonGroup from "./RibbonGroup";
import { nls } from "../nls";
import Login from "../Login/Login";
import SendForEditingButton from "../Widgets/SendForEditingButton";
import {
	IEITAppStore,
	IUserInfo,
	INotifyInfo
} from "../../interfaces/reducers/IEITAppStore";
import { connect } from "react-redux";
import { eitAppConfig } from "../../eitAppConfig";
import { IGraphic, IFeatureLayerInfo } from "../../core/interfaces/models";
import OverlayLoader from "../../core/components/Loading/OverlayLoading";
import { setEditingOrganization } from "../../actions/dispatchers/organizationEdits";
import { featureLayersAPI } from "../../core/actions/helpers";
import { eitFeatureTables } from "../../actions/dispatchers/eitFeatureTables";
import { IEITFeatureTableDispatcher } from "../../interfaces/dispatchers/IEITFeatureTableDispatcher";
import {
	mosaicLayoutDispatcher
} from "../../core/actions/dispatchers";
import {
	IMosaicLayoutDispatcher
} from "../../core/interfaces/dispatchers";
import EITAppWindow from "../../enums/EITAppWindow";
import QuickSearchButton from "../Widgets/QuickSearchButton";
import QuickSearchMergeButton from "../Widgets/QuickSearchMergeButton";
import { object } from 'prop-types';
import { isNullOrUndefined } from 'util';
import { Badge } from 'react-bootstrap';

interface OwnProps {
	userInfo: IUserInfo;
	featureLayerInfos: { [id: string]: IFeatureLayerInfo };
	mobile: boolean;
	notifyInfo: INotifyInfo
}

interface ParentProps { }

interface DispatchProps extends IEITFeatureTableDispatcher, IMosaicLayoutDispatcher {
	setEditingOrganization: typeof setEditingOrganization;
}

type Props = DispatchProps & ParentProps & OwnProps;

interface State {
	loaded: boolean;
}

class ProfileTab extends React.Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = { loaded: false };
		this.showHyperlinks = this.showHyperlinks.bind(this);
		this.openBulletin = this.openBulletin.bind(this);
	}

	componentDidMount() {
		this.loadGraphics(this.props);
	}

	loadGraphics(props: Props) {
		if (this.props.userInfo.username) {
			this.setState({ ...this.state, loaded: false });
			let organizationLayerInfo =
				props.featureLayerInfos[eitAppConfig.layers.OrganizationFeature0];
			if (organizationLayerInfo) {
				this.setState({ ...this.state, loaded: true });
			}
		} else {
			this.setState({ ...this.state, loaded: true });
		}
	}

	componentWillReceiveProps(props: Props) {
		this.loadGraphics(props);
	}

	getUserPropertyValue(propertyName: string) {
		if (this.props.userInfo.user && this.props.userInfo.user.hasOwnProperty(propertyName))
			return this.props.userInfo.user[propertyName];

		return undefined;
	}
	handleEditOrganization = () => {
		let organizationLayerInfo = this.props.featureLayerInfos[
			eitAppConfig.layers.OrganizationFeature0
		];
		this.setState({ ...this.state, loaded: false });
		featureLayersAPI
			.execute(organizationLayerInfo, {
				where: "1=1",
				outFields: ["*"],
				num: 1,
				returnGeometry: true
			})
			.then(result => {
				this.props.setEditingOrganization(
					result[0]
				);
				this.props.showWindow(EITAppWindow.organizationEditing);
				this.setState({ ...this.state, loaded: true });
			})
			.catch(e => {
				this.setState({ ...this.state, loaded: true });
			});
	}

	showHyperlinks() {
		let organizationLayerInfo = this.props.featureLayerInfos[
			eitAppConfig.layers.OrganizationFeature0
		];
		featureLayersAPI
			.execute(organizationLayerInfo, {
				where: "1=1",
				outFields: ["*"],
				num: 1
			})
			.then(result => {
				this.props.showWindow(EITAppWindow.tables);
				this.props.removeTabs([], []);
				this.props.setQuerySyncFeatureTable([
					{
						id: eitAppConfig.layers.OrganizationHyperlinks,
						query: {
							where: `organizationid='${result[0].attributes["id"]}'`,
							outFields: ["*"],
							returnGeometry: true
						},
						selectedIds: {}
					}
				]);
			});
	}

	openBulletin() {
		this.props.showWindow(EITAppWindow.bulletin);
	}

	render() {
		let mergedServicesOrderByFields: Array<string> = ['applicationtime desc', 'service_objectid desc'];
		return (
			<RibbonPanel>
				<OverlayLoader size="60px" show={!this.state.loaded} />
				{this.props.userInfo.username ? (
					<RibbonGroup mobile={this.props.mobile} groupName="Организация">
						{!this.props.userInfo.isAdmin ?
							<RibbonButton
								clickHandler={this.handleEditOrganization}
								imageUrl="public/eit/Ribbon/EditFeature32.png"
								vertical={true}
								tooltip={nls.nls.login.editOrganization} >
								{nls.nls.login.editOrganization}
							</RibbonButton> : (null)
						}
						{this.props.userInfo.isAdmin ?
							<React.Fragment>
								<QuickSearchButton
									vertical={true}
									serviceUrl={eitAppConfig.layers.RegistrationRequest}
									title={nls.nls.login.requestsCreateUser}
									forceColumns={eitAppConfig.PreviewColumns.RequestsCreateUser}
									imageUrl="public/eit/Profile/RegistrationRequests32.png"
									searchType={"all"}
									searchWhere={"requeststatus=1"}
									orderByFields={['objectid desc']}
									tooltip={nls.nls.login.requestsCreateUser}
									tableTitle={nls.nls.login.requestsCreateUser}
									size={"S"}
								/>
								{this.props.notifyInfo.newRegistrationRequestsCount && this.props.notifyInfo.newRegistrationRequestsCount > 0 ?
									<Badge style={{
										marginLeft: -30,
										backgroundColor: "#ff6b6b",
										maxHeight: 20,
										width: 25,
										borderRadius: 10,
									}}>{this.props.notifyInfo.newRegistrationRequestsCount > 99 ? `${this.props.notifyInfo.newRegistrationRequestsCount}+` : this.props.notifyInfo.newRegistrationRequestsCount}</Badge>
									// <span style={{ height: 10,
									// 	width: 10,
									// 	backgroundColor: "#ff4646",
									// 	opacity:0.8,
									// 	marginLeft: -30,
									// 	verticalAlign:"top",
									// 	borderRadius: "50%",
									// 	display: "inline-block"}}></span> 
									: null
								}

								<QuickSearchButton
									vertical={true}
									serviceUrl={eitAppConfig.layers.FeedbackServiceUrl}
									title={nls.nls.login.receivedLettersFeedback}
									tableTitle={nls.nls.login.receivedLettersFeedback}
									imageUrl="public/eit/Profile/UsersFeedback32.png"
									searchType={"all"}
									searchWhere={"1=1"}
									orderByFields={['objectid desc']}
									tooltip={""}
									size={"S"}
								/>
							</React.Fragment> : (null)
						}
						{!this.props.userInfo.isAdmin ?
							<React.Fragment>
								<QuickSearchButton
									vertical={true}
									serviceUrl={eitAppConfig.layers.MergedServiceRegister}
									title={nls.nls.login.serviceRequestedByMyOrganization}
									tableTitle={nls.nls.login.serviceRequestedByMyOrganization}
									forceColumns={eitAppConfig.PreviewColumns.ServiceRequestedByMyOrganization}
									imageUrl="public/eit/Profile/MyOrganizationsServices32.png"
									searchType={"all"}
									searchWhere={`organizationid='${this.getUserPropertyValue('organizationid')}'`}
									orderByFields={mergedServicesOrderByFields}
									tooltip={""}
									size={"S"} />
								<QuickSearchButton
									vertical={true}
									serviceUrl={eitAppConfig.layers.MergedServiceRegister}
									title={nls.nls.login.servicesRequestedByMe}
									tableTitle={nls.nls.login.servicesRequestedByMe}
									forceColumns={eitAppConfig.PreviewColumns.ServicesRequestedByMe}
									imageUrl="public/eit/Profile/MyServices32.png"
									searchType={"all"}
									searchWhere={`UPPER(userid)=UPPER('${this.getUserPropertyValue('id')}')`}
									orderByFields={mergedServicesOrderByFields}
									tooltip={""}
									size={"S"} />
							</React.Fragment> : (null)
						}
						{!this.props.userInfo.isRegulator && !this.props.userInfo.isAdmin ? (
							<QuickSearchButton
								vertical={true}
								serviceUrl={eitAppConfig.layers.MergedServiceRegister}
								title={nls.nls.login.receivedAccessSharingApplications}
								tableTitle={nls.nls.login.receivedAccessSharingApplications}
								forceColumns={eitAppConfig.PreviewColumns.ReceivedAccessSharingApplications}
								imageUrl="public/eit/Profile/JointUsageRequests32.png"
								searchType={"all"}
								searchWhere={`service_id = 52 and recipientid='${this.getUserPropertyValue('organizationid')}'`}
								tooltip={""}
								size={"S"} />) : (null)
						}
						{this.props.userInfo.isAdmin || this.props.userInfo.isRegulator || this.props.userInfo.isMunicipality ?
							<React.Fragment>

								<QuickSearchButton
									vertical={true}
									serviceUrl={eitAppConfig.layers.MergedServiceRegister}
									title={nls.nls.login.receivedApplicationsECMRegistration}
									tableTitle={nls.nls.login.receivedApplicationsECMRegistration}
									forceColumns={eitAppConfig.PreviewColumns.ReceivedApplicationsECMRegistration}
									imageUrl="public/eit/Profile/NetworkRegistrationRequests32.png"
									searchType={"all"}
                                    searchWhere={this.props.userInfo.isAdmin ? "service_id = 53 and recipientid is null" : `service_id = 53 and recipientid='${this.getUserPropertyValue('organizationid')}'`}
									orderByFields={mergedServicesOrderByFields}
									tooltip={""}
									size={"S"} />
								{this.props.notifyInfo.new53Count && this.props.notifyInfo.new53Count > 0 ?
									<Badge style={{
										marginLeft: -30,
										backgroundColor: "#ff6b6b",
										maxHeight: 20,
										width: 25,
										borderRadius: 10,
									}}>{this.props.notifyInfo.new53Count > 99 ? `${this.props.notifyInfo.new53Count}+` : this.props.notifyInfo.new53Count}</Badge>
									// <span style={{ height: 10,
									// 	width: 10,
									// 	backgroundColor: "#ff4646",
									// 	opacity:0.8,
									// 	marginLeft: -30,
									// 	verticalAlign:"top",
									// 	borderRadius: "50%",
									// 	display: "inline-block"}}></span> 
									: null}

							</React.Fragment>
							: (null)

						}
						{!this.props.userInfo.isRegulator && !this.props.userInfo.isAdmin ?
							<React.Fragment>
								<QuickSearchButton
									vertical={true}
									serviceUrl={eitAppConfig.layers.Register1ProtectedServiceUrl}
									title={nls.nls.login.myOrganizationActivities}
									tableTitle={nls.nls.login.myOrganizationActivities}
									forceColumns={eitAppConfig.PreviewColumns.MyOrganizationActivities}
									imageUrl="public/eit/Profile/MyOrganizationsPlannedActivities32.png"
									searchType={"all"}
									searchWhere={`networkoperatorid='${this.getUserPropertyValue('organizationid')}'`}
									tooltip={""}
									size={"S"} />
								<QuickSearchButton
									vertical={true}
									serviceUrl={eitAppConfig.layers.Register1ProtectedServiceUrl}
									title={nls.nls.login.myActivities}
									tableTitle={nls.nls.login.myActivities}
									forceColumns={eitAppConfig.PreviewColumns.MyActivities}
									imageUrl="public/eit/Profile/MyPlannedActivities32.png"
									searchType={"all"}
									searchWhere={`userid='${this.getUserPropertyValue('id')}'`}
									tooltip={""}
									size={"S"} />

							</React.Fragment>
							: null
						}
						{!this.props.userInfo.isRegulator && !this.props.userInfo.isAdmin ?
							<React.Fragment>
								<QuickSearchButton
									vertical={true}
									serviceUrl={eitAppConfig.layers.Register2ProtectedServiceUrl}
									title={nls.nls.login.myOrganizationAnnouncements}
									tableTitle={nls.nls.login.myOrganizationAnnouncements}
									forceColumns={eitAppConfig.PreviewColumns.MyOrganizationAnnouncements}
									imageUrl="public/eit/Profile/MyOrganizationsJointUsageRegister32.png"
									searchType={"all"}
									searchWhere={`networkoperatorid='${this.getUserPropertyValue('organizationid')}'`}
									tooltip={""}
									size={"S"} />
								<QuickSearchButton
									vertical={true}
									serviceUrl={eitAppConfig.layers.Register2ProtectedServiceUrl}
									title={nls.nls.login.myAnnouncements}
									tableTitle={nls.nls.login.myAnnouncements}
									forceColumns={eitAppConfig.PreviewColumns.MyAnnouncements}
									imageUrl="public/eit/Profile/MyJointUsageRegister32.png"
									searchType={"all"}
									searchWhere={`userid='${this.getUserPropertyValue('id')}'`}
									tooltip={""}
									size={"S"} />

							</React.Fragment>
							: (null)
						}

						{!this.props.userInfo.isRegulator && !this.props.userInfo.isAdmin ?
							<React.Fragment>
								<QuickSearchButton
									vertical={true}
									serviceUrl={eitAppConfig.layers.MetadataService}
									title={nls.nls.login.uploadedByMyOrganization}
									tableTitle={nls.nls.login.uploadedByMyOrganization}
									forceColumns={eitAppConfig.PreviewColumns.UploadedDataByMyOrganization}
									imageUrl="public/eit/Profile/MyData32.png"
									searchType={"all"}
									searchWhere={`networkoperatorid='${this.getUserPropertyValue('organizationid')}'`}
									orderByFields={['objectid desc']}
									tooltip={nls.nls.login.uploadedByMyOrganization}
									size={"S"} />
								<QuickSearchButton
									vertical={true}
									serviceUrl={eitAppConfig.layers.MetadataService}
									title={nls.nls.login.uploadedByMe}
									tableTitle={nls.nls.login.uploadedByMe}
									forceColumns={eitAppConfig.PreviewColumns.UploadedDataByMe}
									imageUrl="public/eit/Profile/MyData32.png"
									searchType={"all"}
									searchWhere={`userid='${this.getUserPropertyValue('id')}'`}
									orderByFields={['objectid desc']}
									tooltip={nls.nls.login.uploadedByMe}
									size={"S"} />
							</React.Fragment>
							: (null)
						}
						{this.props.userInfo.isAdmin ?
							<React.Fragment>
								<QuickSearchButton
									vertical={true}
									serviceUrl={eitAppConfig.layers.MergedServiceRegister}
									title={nls.nls.login.allRequestedService}
									tableTitle={nls.nls.login.allRequestedService}
									forceColumns={eitAppConfig.PreviewColumns.AllRequestedServices}
									imageUrl="public/eit/Profile/MyOrganizationsServices32.png"
									searchType={"all"}
									searchWhere={"1=1"}
									orderByFields={mergedServicesOrderByFields}
									tooltip={nls.nls.login.allRequestedService}
									size={"S"} />
								<QuickSearchButton
									vertical={true}
									serviceUrl={eitAppConfig.layers.Register1ProtectedServiceUrl}
									title={nls.nls.login.allActivities}
									tableTitle={nls.nls.login.allActivities}
									forceColumns={eitAppConfig.PreviewColumns.AllActivities}
									imageUrl="public/eit/Profile/MyOrganizationsPlannedActivities32.png"
									searchType={"all"}
									searchWhere={"1=1"}
									tooltip={nls.nls.login.allActivities}
									size={"S"} />
								<QuickSearchButton
									vertical={true}
									serviceUrl={eitAppConfig.layers.Register2ProtectedServiceUrl}
									title={nls.nls.login.allAnnouncements}
									tableTitle={nls.nls.login.allAnnouncements}
									forceColumns={eitAppConfig.PreviewColumns.AllAnnouncements}
									imageUrl="public/eit/Profile/MyOrganizationsJointUsageRegister32.png"
									searchType={"all"}
									searchWhere={"1=1"}
									tooltip={nls.nls.login.allAnnouncements}
									size={"S"} />
								<QuickSearchButton
									vertical={true}
									serviceUrl={eitAppConfig.layers.MetadataService}
									title={nls.nls.login.allUploadedData}
									tableTitle={nls.nls.login.allUploadedData}
									forceColumns={eitAppConfig.PreviewColumns.AllUploadedData}
									imageUrl="public/eit/Profile/MyData32.png"
									searchType={"all"}
									searchWhere={"1=1"}
									orderByFields={['objectid desc']}
									tooltip={nls.nls.login.allUploadedData}
									size={"S"} />
 
								<QuickSearchButton
									vertical={true}
									serviceUrl={eitAppConfig.layers.News}
									title={nls.nls.login.news}
									tableTitle={nls.nls.login.news}
									imageUrl="public/eit/Profile/News32.png"
									searchType={"all"}
									searchWhere={"1=1"}
									orderByFields={['objectid desc']}
									tooltip={nls.nls.login.news}
									size={"S"} />

							</React.Fragment> : (null)
						}

						<RibbonButton clickHandler={this.openBulletin} vertical={true} imageUrl="public/eit/Profile/Bulletin32.png">
							{nls.nls.login.bulletin}
						</RibbonButton>
					</RibbonGroup>
				) : null}
			</RibbonPanel>
		);
	}
}

const mapStateToProps = (state: IEITAppStore) => ({
	userInfo: state.eit.userInfo,
	featureLayerInfos: state.layerInfos.featureLayerInfos,
	mobile: state.application.mobile,
	notifyInfo: state.eit.notifyInfo,
});

export default connect<OwnProps, DispatchProps, ParentProps>(
	mapStateToProps,
	{ ...eitFeatureTables, ...mosaicLayoutDispatcher, setEditingOrganization }
)(ProfileTab);
