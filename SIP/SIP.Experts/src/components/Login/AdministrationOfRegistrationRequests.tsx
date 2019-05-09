import * as React from 'react';
import { connect } from 'react-redux';
import { featureLayersAPI } from "../../core/actions/esri/helpers/featureLayersAPI";
import { IGraphic } from '../../core/interfaces/models/IGraphic';
import { getLayerInfos } from '../../core/reducers/layerInfos';
import { FeatureTableInfo } from '../../core/models/FeatureTableInfo';
import { IFeatureLayerInfo } from '../../core/interfaces/models';
import Query = require("esri/tasks/support/Query");
import QueryTask = require("esri/tasks/QueryTask");
import Graphic = require('esri/Graphic');
import axios from "axios";
import { eitAppConfig } from '../../eitAppConfig';
import { IEITAppStore, IUserInfo, IAdminService, INotifyInfo, IBrowserInfo } from "../../interfaces/reducers/IEITAppStore";
import { IFeatureTableDispatcher, IPopupDispatcher } from '../../core/interfaces/dispatchers';
import { tableDispatcher, popupDispatcher } from '../../core/actions/dispatchers';
import { setNewRegistrationRequests } from "../../actions/dispatchers/notifyActionDispatcher";


interface ParentProps {
    featureTableInfo: FeatureTableInfo;
    filteredByField: string;
    acceptBtnTitle?: string;
    acceptImageUrl: string;
    acceptStatus: string;
    registrationRequestsServiceUrl: string;
    selectedIds: { [key: string]: IGraphic };
    rejectImageUrl: string;
    rejectBtnTitle?: string;
    rejectStatus: string;
    statusFieldName: string;
};

interface OwnProps {
    userInfo: IUserInfo;
    notifyInfo: INotifyInfo;
    browserInfo: IBrowserInfo;
};



interface DispatchProps extends IFeatureTableDispatcher, IPopupDispatcher {
    setNewRegistrationRequests: typeof setNewRegistrationRequests
}
type Props = DispatchProps & ParentProps & OwnProps;

type T = { [key: string]: any };

interface InternalState {

}

class AdministrationOfRegistrationRequests extends React.Component<Props, InternalState> {
    constructor(props: Props) {
        super(props)
    }

    updateRegistrationRequestStatus(newStatus: string) {
        return new Promise((resolve, reject) => {
            if (this.props.registrationRequestsServiceUrl) {
                let layerInfo = this.getLayerInfo(this.props.registrationRequestsServiceUrl);
                if (layerInfo) {
                    let featureId = Object.keys(this.props.selectedIds)[0];
                    let feature = this.props.selectedIds[featureId];

                    let attributes = feature.attributes as any;

                    this.getFeatureFromLayer(this.props.registrationRequestsServiceUrl, layerInfo.idFieldName, attributes[layerInfo.idFieldName]).then(res => {
                        let returnedFeature = res[0];

                        if (returnedFeature.attributes[this.props.statusFieldName] == feature.attributes[this.props.statusFieldName]) {
                            returnedFeature.attributes[this.props.statusFieldName] = newStatus;
                            featureLayersAPI.applyEdits(layerInfo!, [], [returnedFeature]).then(r => {
                                resolve();
                            }).catch(e => reject(e));
                        }
                        else
                            resolve();
                    }).catch(e => reject(e));
                }
            } else
                resolve();
        });
    }

    getFeatureFromLayer(url: string, fieldName: string, id: string): Promise<Array<Graphic>> {
        return new Promise((resolve, reject) => {

            let query = new Query();
            let queryTask = new QueryTask({ url: url + "/query" });

            query.where = `${fieldName}=${id}`;
            query.outFields = ["*"];
            query.returnGeometry = false;

            queryTask.execute(query).then(res => {
                resolve(res.features)
            })
        })
    }

    getLayerInfo(id: string): Readonly<IFeatureLayerInfo> | null {
        let layerInfos = getLayerInfos();
        let layerInfo = null;
        for (const key in layerInfos) {
            if (key === id) {
                layerInfo = layerInfos[key];
                break;
            }
        }
        return layerInfo;
    }

    isFilteredByField(): boolean {
        let where = this.props.featureTableInfo.query.where;

        if (where && where.indexOf(this.props.filteredByField) !== -1) return true;

        return false;
    }

    handleAcceptClick = () => {
        let featureId = Object.keys(this.props.selectedIds)[0];
        let feature = this.props.selectedIds[featureId];
        let attributes = feature.attributes as any;
        let objectid = attributes["objectid"];
        if (objectid) {
            axios.post(eitAppConfig.AcceptRegistrationRequestStoreServiceUrl,
               // "http://localhost:55489/api/Admin/AcceptRegistrationRequest",
                {
                    objectid: objectid,
                    token: this.props.userInfo.token,
                    loggedUserId: this.props.userInfo && this.props.userInfo.user ? this.props.userInfo.user.id : '',
                    loggedUserUsername: this.props.userInfo ? this.props.userInfo.username : '',
                    ip: this.props.browserInfo.ip_address,
                    browser: this.props.browserInfo.browser_info,
                    organizationId:  this.props.userInfo && this.props.userInfo.user ? this.props.userInfo.user.organizationid : '',
                }, {
                    headers: {
                        'Content-Type': 'application/json;charset=UTF-8',
                        "Access-Control-Allow-Origin": "*",
                    }
                }
            ).then(result => {
                if (result.status != 200)
                    throw new Error();

                this.updateRegistrationRequestStatus(this.props.acceptStatus).then(r => {
                    this.props.reQuery();
                    if (this.props.notifyInfo.newRegistrationRequestsCount && this.props.notifyInfo.newRegistrationRequestsCount > 0)
                        this.props.setNewRegistrationRequests(this.props.notifyInfo.newRegistrationRequestsCount - 1)
                });
            }).catch(err => {
                this.showErrorMsg()
            });
        }
    }

    _p8(s: any = undefined) {
        let p = (Math.random().toString(16) + "000000000").substr(2, 8);
        return s ? "-" + p.substr(0, 4) + "-" + p.substr(4, 4) : p;
    }

    guid() {
        return this._p8() + this._p8(true) + this._p8(true) + this._p8();
    }
    getSystemLogGraphic = (): IGraphic => {
        let featureId = Object.keys(this.props.selectedIds)[0];
        let feature = this.props.selectedIds[featureId];
        let attributes = feature.attributes as any;
        let objectid = attributes["objectid"];

        let graphic: Graphic;
        graphic = new Graphic({
            attributes: {

                activitytime: new Date().getTime(),
                systemmodule: 1,
                operationname: 'Отказан потребител',
                operationparameters: `Registration request objectId: ${objectid}`,
                ipaddress: this.props.browserInfo.ip_address,
                username: this.props.userInfo ? this.props.userInfo.username : '',
                description: 'Успешно отказан потребител',
                id: this.guid(),
                userid: this.props.userInfo && this.props.userInfo.user ? this.props.userInfo.user.id : '',
                organizationid:  this.props.userInfo && this.props.userInfo.user ? this.props.userInfo.user.organizationid : '',
            }
        });
        return graphic;
    }

    handleRejectClick = () => { 
        let log = this.getSystemLogGraphic();
        const systemLogsFeatureLayerInfo: IFeatureLayerInfo = getLayerInfos()[eitAppConfig.layers.SystemLogsFeature];
      
        this.updateRegistrationRequestStatus(this.props.rejectStatus).then(r => {
            this.props.reQuery();

            featureLayersAPI.applyEdits(systemLogsFeatureLayerInfo, [log]);

            if (this.props.notifyInfo.newRegistrationRequestsCount && this.props.notifyInfo.newRegistrationRequestsCount > 0)
                this.props.setNewRegistrationRequests(this.props.notifyInfo.newRegistrationRequestsCount - 1)

        }).catch(e => {
            log.attributes.description = "Неуспешно отказан потребител";
            featureLayersAPI.applyEdits(systemLogsFeatureLayerInfo, [log]);
            this.showErrorMsg()
        });
    }

    showErrorMsg = () => {
        this.props.addPopups({
            "registrationRequestsMsg": {
                width: "300px",
                content: () =>
                    <React.Fragment>
                        <div style={{ marginBottom: 10 }}>
                            <div style={{ float: "left", margin: 10 }}>
                                <img src="public/eit/Registration/error32.png" />
                            </div>
                            <div>An error has occurred. Please try again, and if the problem persists, contact system administrator.</div>
                        </div>
                        <button className="appBtn" onClick={() => {
                            this.props.removePopups(["registrationRequestsMsg"])
                        }}>OK</button>
                    </React.Fragment>,
                header: () => <div>Грешка</div>,
                closeButton: () => <span>X</span>
            }
        })
    }

    isDisabled = () => {
        return Object.keys(this.props.selectedIds).length != 1 ||
            !(this.isFilteredByField() && (this.props.featureTableInfo.id === this.props.registrationRequestsServiceUrl));
    }

    render() {
        return (
            <React.Fragment>
                <button
                    style={{ minWidth: "25px", display: "flex", alignItems: "center", justifyContent: "space-evenly" }}
                    type="button"
                    onClick={this.handleAcceptClick}
                    className={"tableToolbarBtn marginLeft"}
                    title={this.props.acceptBtnTitle}
                    disabled={this.isDisabled()}>
                    <img style={{ height: "25px", width: "25px" }} src={this.props.acceptImageUrl} />
                </button>
                <button
                    style={{ minWidth: "25px", display: "flex", alignItems: "center", justifyContent: "space-evenly" }}
                    type="button"
                    className={"tableToolbarBtn marginLeft"}
                    onClick={this.handleRejectClick}
                    title={this.props.rejectBtnTitle}
                    disabled={this.isDisabled()}>
                    <img style={{ height: "25px", width: "25px" }} src={this.props.rejectImageUrl} />
                </button>
            </React.Fragment>
        )

    }
}

const mapStateToProps = (state: IEITAppStore) => ({
    userInfo: state.eit.userInfo,
    notifyInfo: state.eit.notifyInfo,
    browserInfo: state.eit.browserInfo
})

export default connect<OwnProps, DispatchProps, ParentProps>(mapStateToProps, { ...tableDispatcher, setNewRegistrationRequests, ...popupDispatcher })(AdministrationOfRegistrationRequests);