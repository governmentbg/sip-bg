import * as React from "react";
import { connect } from 'react-redux';
import axios from "axios";
import { mosaicLayoutDispatcher } from "../../core/actions/dispatchers";
import { IMosaicLayoutDispatcher } from "../../core/interfaces/dispatchers";
import { IEITAppStore, IUserInfo } from "../../interfaces/reducers/IEITAppStore";
import EITAppWindow from '../../enums/EITAppWindow';
import OverlayLoader from "../../core/components/Loading/OverlayLoading";
import { toggleWindow } from "../../actions/helpers/toggleWindowHelper";
import { nls } from "../nls";
import { IServiceWizardParameterDispatcher } from './ServiceWizardBase';
import { IServiceFormInternalState } from './ServiceWizardBase';
import Login from '../Login/Login';
import { isNullOrUndefined } from 'util';
import { eitAppConfig } from '../../eitAppConfig';

interface InternalState extends IServiceFormInternalState {
    authenticationNeeded: boolean,
    authenticated: boolean;
    authorizedpersonname: string;
    username: string;
    isAuth: boolean;
}

interface ParentProps extends IServiceWizardParameterDispatcher {
    previousState: Partial<InternalState>;
}

interface OwnProps {
    loading: boolean;
    userInfo: IUserInfo;
}

interface DispatchProps {
}

type Props = DispatchProps & OwnProps & ParentProps;

class ServiceLoginPane extends React.Component<Props, InternalState> {
    intervalNumber: any;
    constructor(props: Props) {
        super(props);
        this.state = {
            loading: false,
            authenticationNeeded: this.getAuthenticationNeeded(props),
            authenticated: false,
            authorizedpersonname: '',
            username: this.getUserName(props),
            formIsValid: false,
            isAuth: false,
        };
    }

    onStateChange = (partialState: Partial<InternalState>): void => {
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
        return (!state.authenticationNeeded || state.authenticated) && !isNullOrUndefined(state.username) && state.username.trim() != '';
    }

    componentWillMount() {
        this.onStateChange({
            ...this.state,
            ...this.props.previousState,
        });
    }

    componentDidMount() {
    }

    componentWillUnmount() {
        if (this.intervalNumber !== undefined) {
            clearInterval(this.intervalNumber);
        } 
    }

    componentWillReceiveProps(props: Props) {
        if (props.previousState) {
            if (this.state.authenticated != props.previousState.authenticated) {
                this.onStateChange({
                    ...props.previousState
                });
            }
        }
        if (this.state.username != this.getUserName(props)) {
            this.onStateChange({
                username: this.getUserName(props),
                authenticationNeeded: this.getAuthenticationNeeded(props),
                authenticated: false,
                authorizedpersonname: this.getAuthorizedpersonname(false, props),
            })
        };
    }

    getSignatureUser(xml: XMLDocument) {
        let signatureAttributes = xml.getElementsByTagName("saml2:AttributeValue");
        if (signatureAttributes && signatureAttributes.length) {
            this.onStateChange({
                authorizedpersonname: signatureAttributes[0].innerHTML
            });
        }
    }

    periodicRequests(requestId: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            let counter = 100;
            this.intervalNumber = setInterval(() => {
                counter--;
                if (counter > 0) {
                    axios.get(eitAppConfig.samlTokenUrl, {
                        params: {
                            "id": requestId
                        },
                        headers: {
                            "Accept": "application/xml",
                            "Content-Type": "application/xml"
                        }
                    }).then(r => {
                        let resultData = r.data;
                        if (resultData) {
                            try {
                                let xml = new DOMParser().parseFromString(resultData, "text/xml");
                                let serviceError = xml.getElementsByTagName("ServiceError");
                                let samlResponse = xml.getElementsByTagName("samlp:Response");
                                if (samlResponse && samlResponse.length) {
                                    console.warn(xml);
                                    this.getSignatureUser(xml);
                                    clearInterval(this.intervalNumber);
                                    resolve(true);
                                } else if (serviceError && !serviceError.length) {
                                    reject("An error has occured!");
                                }
    
                            } catch(e) {
                                clearInterval(this.intervalNumber);
                            }
    
                        } else {
                            console.error('Unable to get token');
                            clearInterval(this.intervalNumber);
                            reject('Unable to get token');
                        }
                    }).catch(err => {
                        console.error(err);
                        clearInterval(this.intervalNumber);
                        reject(err);
                    });
                } else {
                    clearInterval(this.intervalNumber);
                    reject("The token not found");
                }
            }, 3000);
        });
    }

    eAuthentication(authnRequest: string) {
        if (authnRequest) {
            let formPost: HTMLFormElement = document.createElement('form');
            formPost.target = "_blank"; //eAuthn
            formPost.setAttribute("method", "POST");
            formPost.setAttribute("action", eitAppConfig.eAuth);
            let samlRequest: HTMLInputElement = document.createElement('input');
            samlRequest.type = "hidden";
            samlRequest.name = "SAMLRequest";
            samlRequest.value = authnRequest;
            formPost.appendChild(samlRequest);
            let relayState: HTMLInputElement = document.createElement('input');
            relayState.type = "hidden";
            relayState.name = "RelayState";
            relayState.value = "";
            formPost.appendChild(relayState);
            document.body.appendChild(formPost);
            // window.open("", "eAuthn", "status=0,title=0,height=600,width=800,scrollbars=1");
            formPost.submit();
            document.body.removeChild(formPost);
        }
    }

    getSamlAuthnRequest(): Promise<object> {
        return new Promise((resolve, reject) => {
            axios.get(eitAppConfig.samlUrl, {
                params: {
                    userToken: this.props.userInfo.token
                },
                headers: {
                    "Content-Type": "application/json;charset=UTF-8",
                    "Access-Control-Allow-Origin": "*",
                }
            }).then(result => {
                resolve(result.data);
            }).catch(err => {
                reject(err);
            });
        });
    }

    performAuthentication = (event: React.MouseEvent<HTMLElement>): void => {
        let requestId = "";
        this.onStateChange({
            loading: true,
            isAuth: true
        });
        this.getSamlAuthnRequest().then((r: any) => {
            requestId = r.Id;
            let authnRequest = r.samlAuthRequest;
            this.eAuthentication(authnRequest);
            this.periodicRequests(requestId).then(r => {
                if (r) {
                    this.onStateChange({
                        loading: false,
                        authenticated: true,
                        isAuth: false
                    });
                }
            }).catch(err => {
                console.error(err);
                this.onStateChange({
                    loading: false,
                    authenticated: true,
                    authorizedpersonname: this.getAuthorizedpersonname(true, this.props),
                    isAuth: false
                });
            })
        }).catch(err => {
            console.error(err);
            this.onStateChange({
                loading: false,
                authenticated: true,
                authorizedpersonname: this.getAuthorizedpersonname(true, this.props),
                isAuth: false
            });
        })
        // try {
        //     setTimeout(() => {
        //         this.onStateChange({
        //             loading: false,
        //             authenticated: true,
        //             authorizedpersonname: this.getAuthorizedpersonname(true, this.props)
        //         });
        //     }, 1500);
        // }
        // catch (e) {
        //     this.onStateChange({
        //         loading: false,
        //     });
        // }
    }

    getUserName = (props: Props): string => {
        return props.userInfo ? props.userInfo.username || "" : ""
    }
    getIsPrivilegedUser = (userInfo: IUserInfo) => {
        return userInfo.isAdmin || userInfo.isRegulator || userInfo.isMunicipality;
    }
    getAuthenticationNeeded = (props: Props): boolean => {
        return [1, 2].indexOf(props.serviceNr) > -1 && !this.getIsPrivilegedUser(props.userInfo);
    }
    // TODO: Do not use defaults eventually.
    getAuthorizedpersonname = (authenticated: boolean, props: Props) => {
        return authenticated && props.userInfo && props.userInfo.username && props.userInfo.user.authorizedpersonname ?
            props.userInfo.user.authorizedpersonname : '';
    }

    endAuth() {
        clearInterval(this.intervalNumber);
        this.onStateChange({
            loading: false,
            authenticated: true,
            authorizedpersonname: this.getAuthorizedpersonname(true, this.props),
            isAuth: false
        });
    }

    render() {
        return (
            <div className="vertical-flex-container"
                style={{ width: "100%", height: "100%", paddingRight: "10px" }}>
                <OverlayLoader size="60px" show={this.state.loading} />
                <p style={{ padding: "10px" }}>{nls.nls.serviceWizard.authentication.authenticationPrompt}</p>
                {
                    this.props.userInfo.username ?
                        <div className="flex-auto" style={{ padding: "10px" }}>
                            <p>{nls.nls.serviceWizard.authentication.loginProvided}<span> </span><span style={{ fontWeight: 700 }}>{this.props.userInfo.user.authorizedpersonname}</span></p>
                        </div>
                        :
                        <div className="flex-auto" style={{ padding: "10px" }}>
                            <Login uniqueKey={"serviceLogin"} style={{ margin: "0px", padding: "0px" }} />
                        </div>
                }
                <p />
                {
                    this.state.authenticationNeeded ?
                        <React.Fragment>
                            <div style={{ textIndent: "2em", textAlign: "justify" }}>{nls.nls.serviceWizard.authentication.authenticationPurpose}
                                <p style={{ textAlign: "center", marginTop: "10px" }}><span>{nls.nls.serviceWizard.authentication.authenticationGateway}
                                    <a style={{ pointerEvents: this.props.userInfo.username ? "auto" : "none", fontWeight: "bold" }}
                                        href='#' onClick={this.performAuthentication}>{nls.nls.serviceWizard.authentication.authenticationGatewayLink}.</a></span></p></div>

                            {this.state.authenticated ?
                                <div className="flex-auto" style={{ padding: "10px" }}>
                                    <p>{nls.nls.serviceWizard.authentication.authenticationProvided}<span> </span><span style={{ fontWeight: 700 }}>{this.state.authorizedpersonname}</span></p>
                                </div>
                                : null}
                        </React.Fragment>
                        : null
                }
                {this.state.isAuth ? <button className="appBtn" style={{ position: "absolute", height: "50px", flexGrow: 0, flexBasis: "180px", bottom: "50px", zIndex: 1000 }} onClick={() => this.endAuth()}>
                    <span>Прекрати автентикация</span>
                </button> : null}
            </div>
        )
    }
}

const mapStateToProps = (state: IEITAppStore) => ({
    loading: !state.map.webMapImported,
    userInfo: state.eit.userInfo,
})

export default connect<OwnProps, any, any>(mapStateToProps, {})(ServiceLoginPane);
