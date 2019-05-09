import { IPaylodAction, IActionDispatcher } from "../../interfaces/dispatchers/IAction";
import UserInfoAction from "../../enums/ActionTypes/UserInfoAction";
import { IGraphic } from "../../core/interfaces/models";
import { eitAppConfig } from "../../eitAppConfig";
import axios from "axios";
// import * as queryString from "query-string";
import { stringify } from "querystring";
import ErrorActions from '../../core/enums/ActionTypes/ErrorActions';
import  { layerInfoDispatcher }  from "../../core/actions/esri/dispatchers/layerInfos";
import { IEITAppStore } from '../../interfaces/reducers/IEITAppStore';
import MapView = require("esri/views/MapView");
import { registerEsriTokenInterceptor } from '../../core/configEsri';
import request = require("esri/request");
import { isNullOrUndefined } from 'util';
import { OperationCanceledException } from 'typescript';
import { any } from 'prop-types';
import { mosaicLayoutDispatcher, popupDispatcher } from "../../core/actions/dispatchers";
import { nls } from '../../components/nls';
import * as React from "react";
import NotifyAction from '../../enums/ActionTypes/NotifyAction';
import { userInfo } from 'os';
declare global { interface Window { setCookie: (name: string, value: string, days?: number) => void; getCookie: (name: string) => string; eraseCookie: (name: string, paths: Array<string>) => void; } }
export const singIn = (username: string, password: string) => (dispatch: (data: IPaylodAction | IActionDispatcher) => void, getStore: () => IEITAppStore) => {
    dispatch({
        type: UserInfoAction.SET_LOADING,
        payload: true
    })

    axios.post(
        eitAppConfig.urls.tokenService,
        stringify({
            username,
            password,
            f: "json",
            expiration: 720,
            client: "referer",
            referer: window.location.origin
        }),
        {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        })
        .then(tokenResponse => {
            let expires = new Date(tokenResponse.data.expires);
            let token = tokenResponse.data.token;
            if (tokenResponse.data.error) {
                dispatch({
                    type: UserInfoAction.ERROR_SIGNIN,
                    payload: tokenResponse.data.error
                })
                return;
            }
            axios.get(`${eitAppConfig.urls.selfInfo}?token=${token}&f=json`).then(selfInfoResponse => {

                if (isNullOrUndefined(selfInfoResponse) || isNullOrUndefined(selfInfoResponse.data) || isNullOrUndefined(selfInfoResponse.data.user) || isNullOrUndefined(selfInfoResponse.data.user.roles) || selfInfoResponse.data.user.roles.length === 0) {
                    throw new Error(nls.nls.login.notActiveUser);
                }

                dispatchCredentials(dispatch, token, expires, selfInfoResponse, getStore)
                let mapView = getStore().map.mapView.mapView as MapView;
                dispatch(layerInfoDispatcher.importWebMap(mapView.map));
            }).catch(error => {
                dispatch({
                    type: UserInfoAction.ERROR_SIGNIN,
                    payload: error
                })
            })

        }).catch(error => {
            console.error(error);
            dispatch({
                type: UserInfoAction.ERROR_SIGNIN,
                payload: error
            })
        })
}
let time: NodeJS.Timer | undefined;

const startInactivityCountdown = (dispatch: (data: IPaylodAction | IActionDispatcher) => void, getStore: () => IEITAppStore) => {
    const resetTimer = () => {
        clearTimeout(time!);
        time = setTimeout(() => {
            clearTimeout(time!);
            let store = getStore();
            if (store.eit.userInfo && store.eit.userInfo.username) {
                dispatch(signOut(true))
            }
        }, 1800000)

    }
    if (!time) {
        document.onmousemove = resetTimer;
        document.onkeypress = resetTimer;
    }
    resetTimer();
}


const dispatchCredentials = (dispatch: (data: IPaylodAction | IActionDispatcher) => void, token: string, expires: Date, selfInfoResponse: any, getStore: () => IEITAppStore) => {
    registerEsriTokenInterceptor(eitAppConfig.urls.hostname, token)
    let payload = {
        token,
        expires,
        username: selfInfoResponse.data.user.username,
        roles: selfInfoResponse.data.user.roles,
        privilege: selfInfoResponse.data.user.privilege,
        isAdmin: selfInfoResponse.data.user.roles && selfInfoResponse.data.user.roles.indexOf("EIT_Admin") != -1,
        isOperator: selfInfoResponse.data.user.roles && selfInfoResponse.data.user.roles.indexOf("EIT_Operator") != -1,
        isRegulator: selfInfoResponse.data.user.roles && selfInfoResponse.data.user.roles.indexOf("EIT_Regulator") != -1
    } as any;
    request(eitAppConfig.layers.Users + "/query", {
        query: {
            f: "json",
            where: `UPPER(username) = UPPER('${selfInfoResponse.data.user.username}')`,
            outFields: ["*"],
            returnGeometry: false
        }
    })
        .then(result => {
            payload.user = result.data.features[0].attributes
            startInactivityCountdown(dispatch, getStore);


            if (!payload.user)
                throw Error(nls.nls.login.doesntExists)
            else if (payload.user.userstatus === 2)
                throw Error(nls.nls.login.blockedUser)
            else if (payload.user.userstatus === 3)
                throw Error(nls.nls.login.deactivatedUser)

            // Compensation for the misspelling of authorizedpersonname:
            if (payload.user && payload.user.hasOwnProperty('autorizedpersonname')) {
                payload.user = { ...payload.user, authorizedpersonname: payload.user.autorizedpersonname };
            }
            if (payload.user && payload.user.hasOwnProperty('organizationtype'))
                payload = { ...payload, isMunicipality: payload.user.organizationtype && (payload.user.organizationtype === 4 || payload.user.organizationtype === 5) }//(payload.user.organizationtype === 2 || payload.user.organizationtype === 9) }
            let organizationid: string = result.data.features[0].attributes.organizationid;
            request(eitAppConfig.layers.RegistersOrganizations + "/query", {
                query: {
                    f: "json",
                    where: "id='" + organizationid + "'",
                    outFields: ["*"],
                    resultRecordCount: 1,
                    returnGeometry: false
                }
            }).then(resultOrg => {
                payload = {
                    ...payload,
                    user: { ...payload.user, identificationcode: resultOrg.data.features[0].attributes.identificationcode }
                }

                if (payload.user && payload.isAdmin) {
                    request(eitAppConfig.layers.RegistrationRequest + "/query", {
                        query: {
                            f: "json",
                            where: "requeststatus=1",
                            outFields: ["*"],
                            returnGeometry: false,
                            returnCountOnly: true
                        }
                    }).then(({ data }) => {

                        if (data && data.count) {
                            dispatch({
                                type: NotifyAction.SET_NEW_REGISTRATIION,
                                payload: data.count
                            })
                        } else {
                            dispatch({
                                type: NotifyAction.SET_NEW_REGISTRATIION,
                                payload: 0
                            })
                        }
                    }).catch(errorOrg => {
                        dispatch({
                            type: NotifyAction.SET_NEW_REGISTRATIION,
                            payload: 0
                        })
                    });
                }
              
                if (payload.user && (payload.isAdmin || payload.isRegulator || payload.isMunicipality)) {
                    request(eitAppConfig.layers.MergedServiceRegister + "/query", {
                        query: {
                            f: "json",
                            where: payload.isAdmin ? "service_id=53 and registrationstatus=1" : `service_id=53 and registrationstatus=1 and recipientid='${payload.user.organizationid}'`,
                            outFields: ["*"],
                            returnGeometry: false,
                            returnCountOnly: true
                        }
                    }).then(({ data }) => {

                        if (data && data.count) {
                            dispatch({
                                type: NotifyAction.SET_NEW_53,
                                payload: data.count
                            })
                        } else {
                            dispatch({
                                type: NotifyAction.SET_NEW_53,
                                payload: 0
                            })
                        }
                    }).catch(errorOrg => {
                        dispatch({
                            type: NotifyAction.SET_NEW_53,
                            payload: 0
                        })
                    });
                }



                dispatchPayload(payload, dispatch);
            }).catch(errorOrg => {
                dispatchPayload(payload, dispatch);
            });
        }).catch(error => {
            dispatchPayload(payload, dispatch)
        })
}

const dispatchPayload = (payload: any, dispatch: (data: IPaylodAction | IActionDispatcher) => void) => {
    window.setCookie("_cr", encodeURIComponent(JSON.stringify(payload)), 1)
    dispatch({
        type: UserInfoAction.SIGN_IN,
        payload: payload
    })
    dispatch({
        type: UserInfoAction.CLEAR_ERROR,
        payload: {}
    })
}

export const tryRecoverCredentials = (callback: (success: boolean) => void) => (dispatch: (data: IPaylodAction | IActionDispatcher) => void, getStore: () => IEITAppStore) => {
    let credentials = window.getCookie("_cr");
    let onError = () => {
        window.eraseCookie("_cr", ["/"])
        callback(false)
    }
    if (credentials) {
        credentials = decodeURIComponent(credentials)
        let parsedCredentials = JSON.parse(credentials);
        if (parsedCredentials.token && parsedCredentials.expires) {
            try {
                let expires = new Date(parsedCredentials.expires)
                if (expires < new Date()) {
                    onError()
                }
                else {
                    axios.get(`${eitAppConfig.urls.selfInfo}?token=${parsedCredentials.token}&f=json`)
                        .then(selfInfoResponse => {
                            if (selfInfoResponse.data.user.username == parsedCredentials.username) {
                                dispatchCredentials(dispatch, parsedCredentials.token, expires, selfInfoResponse, getStore);
                                callback(true)
                            }
                            else {
                                onError()
                            }
                        }).catch(error => {
                            onError()
                        })
                }
            }
            catch (e) {
                onError()
            }
        }
    }
    else {
        callback(false)
    }
}

export const signOut = (expired?: boolean) => (dispatch: (data: IPaylodAction | IActionDispatcher) => void, getStore: () => IEITAppStore) => {
    if (time) {
        clearTimeout(time);
        time = undefined;
    }
    registerEsriTokenInterceptor(eitAppConfig.urls.hostname, "")
    window.eraseCookie("_cr", ["/"])
    dispatch({
        type: UserInfoAction.CLEAR_ERROR,
        payload: {}
    })
    dispatch({
        type: UserInfoAction.SIGN_OUT,
        payload: {}
    })
    let mapView = getStore().map.mapView.mapView as MapView;
    let popups = getStore().popups;
    let popupArray: Array<string> = [];
    for (let key in popups) {
        popupArray.push(key)
    }
    if (popupArray.length > 0) {
        dispatch(popupDispatcher.removePopups(popupArray))
    }
    if (expired) {
        dispatch(popupDispatcher.addPopups({
            sessionExpired: {
                width: "400px",
                content: () => (
                    <div>
                        <div>Сесията изтече</div>
                        <button className="appBtn width margin" onClick={() => {
                            dispatch(popupDispatcher.removePopups(["sessionExpired"]))
                        }}>OK</button>
                    </div>
                ),
                header: () => <div></div>
            }
        }))
    }
    dispatch(mosaicLayoutDispatcher.changeCurrentNode(eitAppConfig.initState.mosaicLayout.currentNode))
    dispatch(layerInfoDispatcher.importWebMap(mapView.map));
}