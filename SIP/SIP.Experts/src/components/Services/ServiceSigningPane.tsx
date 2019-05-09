import * as React from "react";
import { connect } from 'react-redux';
import axios from "axios";
import { IEITAppStore, IUserInfo } from "../../interfaces/reducers/IEITAppStore";
import PaymentForm, { AfterRegisterResponse } from "./PaymentForm";
import EITInfrastructureType from '../../enums/EITInfrastructureType';
import EITRegixResult from '../../enums/EITRegixResult';
import OverlayLoader from "../../core/components/Loading/OverlayLoading";
import FloatingLabelInput from "../Widgets/FloatingLabelInput";
import { InputValueType } from "../Widgets/FloatingLabelInput";
import { nls } from "../nls";
import { isNullOrUndefined } from 'util';
import { IServiceWizardParameterDispatcher } from './ServiceWizardBase';
import { IServiceFormInternalState } from './ServiceWizardBase';
import { IPopupDispatcher } from '../../core/interfaces/dispatchers';
import { popupDispatcher } from '../../core/actions/dispatchers';
import PaymentSuccessLinks from "./PaymentSuccessLinks";
import { eitAppConfig } from '../../eitAppConfig';


interface InternalState extends IServiceFormInternalState {
    signatureNeeded: boolean,
    username: string;
    signed: boolean;
    paid: boolean;
    resultPrepared: boolean;
    payment?: AfterRegisterResponse;
    jobId?: string;
    error: boolean;
    pdfUrl: string;
    shapeUrl: string;
}

interface ParentProps extends IServiceWizardParameterDispatcher {
    amountDue: number;
    previousState: Partial<InternalState>;
    triggerGeoprocessing: () =>  Promise<{loading: boolean, jobId: string, pdfUrl: string, shapeUrl: string}>;
}

interface OwnProps {
    loading: boolean;
    userInfo: IUserInfo;
}

interface DispatchProps extends IPopupDispatcher {
}

type Props = DispatchProps & OwnProps & ParentProps;

class ServiceSigningPane extends React.Component<Props, InternalState> {
    constructor(props: Props) {
        super(props);
        this.state = {
            loading: false,
            formIsValid: false,
            username: this.getUserName(props),
            signatureNeeded: this.getSignatureNeeded(props),
            signed: false,
            paid: false,
            resultPrepared: false,
            error: false,
            pdfUrl: "",
            shapeUrl: "",
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
        //console.log("##### REQUEST STATE #####");
        //console.log(newState);
        this.setState(newState);
        if (this.props.onStateChange) {
            this.props.onStateChange(newState);
        }
    }

    getFormIsValid = (state: InternalState): boolean => {
        if ([1, 2].indexOf(this.props.serviceNr) > -1 && !state.resultPrepared) {
            return false;
        }
        return (!state.signatureNeeded || state.signed) && (this.props.amountDue == 0 || state.paid);
    }

    componentWillMount() {
        this.onStateChange({
            ...this.state,
            ...this.props.previousState,
        });
    }

    componentDidMount() {
    }

    componentWillReceiveProps(props: Props) {
        if (this.state.username != this.getUserName(props)) {
            this.onStateChange({
                username: this.getUserName(props),
                signatureNeeded: this.getSignatureNeeded(props),
            });
        }
        if (props.previousState) {
            if (this.state.signatureNeeded != this.getSignatureNeeded(props)||
                this.state.signed != props.previousState.signed ||
                this.state.paid != props.previousState.paid) {
                this.onStateChange({
                    ...props.previousState,
                    signatureNeeded: this.getSignatureNeeded(props),
                });
            }
        }
    }

    getUserName = (props: Props): string => {
        return props.userInfo ? props.userInfo.username || "" : ""
    }
    getIsPrivilegedUser = (userInfo: IUserInfo) => {
        return userInfo.isAdmin;
    }
    getSignatureNeeded = (props: Props): boolean => {
        return !this.getIsPrivilegedUser(props.userInfo);
    }

    signWithDigitalSignature = (): void => {
        try {
            this.onStateChange({
                loading: true,
                error: false,
            })
            if ([1, 2].indexOf(this.props.serviceNr) > -1) {
                if(this.props.userInfo.isAdmin){
                    this.submitJob();
                }
                else{
                    axios.post(eitAppConfig.ServiceSignaturesUrl, {})
                        .then((r: any) => {
                            this.submitJob();
                            // From Teo:
                            //this.onStateChange({
                            //    loading: false,
                            //    error: true,
                            //});
                        }).catch(e => {
                            //this.onStateChange({
                            //    loading: false,
                            //    error: true,
                            //})
                            // From Teo:
                            this.submitJob();
                        });
                }
               
                
            } else {
                setTimeout(() => {
                this.onStateChange({
                    loading: false,
                    signed: true,
                })
            }, 3500);
            }
        }
        catch (e) {
            console.error(e);
            this.onStateChange({
                loading: false,
                error: true,
            })
        }
        
    }

    submitJob = () => {
        this.props.triggerGeoprocessing()
        .then(res => this.onStateChange({
            loading: res.loading,
            jobId: res.jobId,
            pdfUrl: res.pdfUrl,
            shapeUrl: res.shapeUrl,
            signed: true,
            resultPrepared: true,
        }))
        .catch(e => {
            this.onStateChange({
                loading: false,
                error: true,
            })
        });
    }

    performPaymentDummy = (event: React.MouseEvent<HTMLElement>): void => {
        if (!this.state.signed){
            return;
        }
        event.preventDefault();
        try {
            this.onStateChange({
                loading: true
            })
            setTimeout(() => {
                this.onStateChange({
                    loading: false,
                    paid: true,
                })
            }, 2500);
        }
        catch (e) {
            this.onStateChange({
                loading: false,
            })
        }
    }

    performPayment = (event: React.MouseEvent<HTMLElement>): void => {
        event.preventDefault();
        if (!this.state.signed || !this.state.jobId){
            return;
        }
        this.props.addPopups({
            paymenPopup: {
                width: "700px",
                height: "80%",
                content: () => <PaymentForm 
                                    token={this.props.userInfo.token}
                                    jobId={this.state.jobId!}
                                    onSuccess={(payment: AfterRegisterResponse) => {
                                        this.props.removePopups(["paymenPopup"])
                                        this.onStateChange({
                                            payment: payment 
                                        })
                                    }}
                                    amount={this.props.amountDue.toFixed(2)} 
                                    applicantUin={this.props.userInfo.user.identificationcode} 
                                    applicantName={this.props.userInfo.user.organizationname}
                                    onCancel={() => this.props.removePopups(["paymenPopup"])}
                />,
                header: () => <div>{nls.nls.serviceWizard.signingAndPayment.paymentRequest}</div>
            }
        })
    }

    formatDouble = (value: number, fractionDigits: number): string => {
        return value.toLocaleString('en', { useGrouping: true, minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits }).replace(/,/g, ' ').replace('.', ',');
    }

    formatAmount = (value: number): string => {
        return this.formatDouble(value, 2) + ' ' + nls.nls.serviceWizard.signingAndPayment.amountCurrency;
    }

    render() {
        let amountDue: number = this.props.amountDue;
        let signButtonTitle: string = ([1, 2].indexOf(this.props.serviceNr) > -1) ?
                (this.getIsPrivilegedUser(this.props.userInfo) ?
                    nls.nls.serviceWizard.signingAndPayment.signWithDigitalSignature.service1and2Priviledged :
                    nls.nls.serviceWizard.signingAndPayment.signWithDigitalSignature.service1and2) :
                nls.nls.serviceWizard.signingAndPayment.signWithDigitalSignature.otherServices;
        return (
            <div className="flex-auto vertical-flex-container" style={{ width: "100%", paddingRight: "10px" }}>
                <OverlayLoader size="60px" show={this.state.loading} />
                {
                    [1, 2].indexOf(this.props.serviceNr) > -1 || this.state.signatureNeeded ?
                    <div className="flex-auto horizontal-wrapping-flex-container"
                        style={{ paddingBottom: "10px", paddingTop: "10px" }}>
                        {
                            !this.state.payment ? 
                                <button className="flex-item flex-auto appBtn"
                                title={signButtonTitle}
                                onClick={this.signWithDigitalSignature}
                                style={{ height: "auto", flexGrow: 0, flexBasis: "250px", marginBottom: "10px" }}>
                                <img src="public/eit/Services/apply32.png" style={{ width: "20px", height: "30px" }} />
                                <span>&nbsp;{signButtonTitle}</span>
                                </button>
                                : 
                                null
                        }
                        </div>
                        :null
                }
                {
                    amountDue > 0 && !this.state.paid ?
                        <div className="flex-auto vertical-flex-container"
                            style={{ paddingBottom: "10px", paddingTop: "10px" }}>
                            <p className="flex-item flex-auto" style={{ textIndent: "2em" }}>{nls.nls.serviceWizard.signingAndPayment.amounDue}{this.formatAmount(amountDue)}.</p>
                            {
                                this.state.signed && !this.state.payment ?
                                <div className="flex-item flex-auto" style={{textIndent: "2em", textAlign: "justify", marginTop: "10px"}}>
                                {nls.nls.serviceWizard.signingAndPayment.paymentPurpose}
                                <p style={{textAlign: "center", marginTop: "10px"}}><span>{nls.nls.serviceWizard.signingAndPayment.paymentGateway}
                                    <a href='#' onClick={this.performPayment} style={{ fontWeight: "bold" }}>{nls.nls.serviceWizard.signingAndPayment.paymentGatewayLink}.</a></span></p>
                                {/* <a style={{opacity: 0}} href='#' onClick={this.performPayment}>##########.</a> */}
                            </div>
                                : null
                            }
                        </div>
                        : null
                }
                {
                    this.state.paid ?
                        <div className="flex-auto vertical-flex-container"
                            style={{ paddingBottom: "10px", paddingTop: "10px" }}>
                            <p className="flex-item flex-auto" style={{ color: "darkgreen" }}>{nls.nls.serviceWizard.signingAndPayment.paymentSuccess}</p>
                            
                        </div>
                        :
                        (this.state.payment ? <PaymentSuccessLinks onSuccessfulPay={() =>{
                            this.onStateChange({paid: true})
                        }} payment={this.state.payment}/> : null)
                }
                {
                    this.state.error ?
                        <p className="flex-item flex-auto" style={{ width: "100%" }}>{nls.nls.serviceWizard.processingError}</p> :
                        null
                }
            </div>
        )
    }
}

const mapStateToProps = (state: IEITAppStore) => ({
    loading: !state.map.webMapImported,
    userInfo: state.eit.userInfo
})

export default connect<OwnProps, any, any>(mapStateToProps, {...popupDispatcher})(ServiceSigningPane);
