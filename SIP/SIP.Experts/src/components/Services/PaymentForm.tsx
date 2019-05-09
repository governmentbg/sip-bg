import * as React from "react";
import { connect } from "react-redux";
import { IEITAppStore, IUserInfo } from "../../interfaces/reducers/IEITAppStore";
import { nls } from "../nls";
import FloatingLabelInput, { InputValueType } from '../Widgets/FloatingLabelInput';
import "./PaymentFormStyle.scss";
import { eitAppConfig } from "../../eitAppConfig";
import OverlayLoader from '../../core/components/Loading/OverlayLoading';
import PaymentSuccessLinks from "./PaymentSuccessLinks";
import axios from "axios";
import { appConfig } from '../../core/appConfig';

interface Props {
    token: string;
    amount: string;
    applicantUin: string;
    applicantName: string;
    jobId: string;
    onSuccess: (paymentId: AfterRegisterResponse) => void;
    onCancel: () => void;
}

export class AfterRegisterResponse {
    id: string;
    idData: string;
    idDataHmac: string;
    idPostData: string;
    idPostDataHmac: string;
    clientId: string;
}

interface State {
    errorMsg?: string;
    loading: boolean;
    paymentId?: AfterRegisterResponse;
    paymentData: {
        // aisPaymentId: string,//"<aisPaymentId>",    
        serviceProviderName: string,//"<serviceProviderName>",
        serviceProviderBank: string,//"<serviceProviderBank>",
        serviceProviderBIC: string,//"<serviceProviderBIC>",
        serviceProviderIBAN: string,//"<serviceProviderIBAN>",
        currency: string,//"<currency>",
        // paymentTypeCode: string,//"<paymentTypeCode>",
        paymentAmount: string,//"<paymentAmount>",
        paymentReason: string,//"<paymentReason>",
        applicantUinTypeId: string,//"<applicantUinTypeId>",
        applicantUin: string,//"<applicantUin>",
        applicantName: string,//"<applicantName>",
        paymentReferenceType: string,//"<paymentReferenceType>",
        paymentReferenceNumber: string,//"<paymentReferenceNumber>",
        paymentReferenceDate: string,//"<paymentReferenceDate>",
        expirationDate: string,//"<expirationDate>",
        // additionalInformation: string,//"<additionalInformation>",
        // administrativeServiceUri: string,//"<administrativeServiceUri>",
        // administrativeServiceSupplierUri: string,//"<administrativeServiceSupplierUri>",
        administrativeServiceNotificationURL: string,//"<administrativeServiceNotificationURL>",
    }
}

class PaymentForm extends React.Component<Props, State>{
    constructor(props: Props) {
        super(props);
        this.state = {
            loading: false,
            paymentData: {
                // aisPaymentId: "",
                serviceProviderName: eitAppConfig.serviceProviderName,
                serviceProviderBank: eitAppConfig.serviceProviderBank,
                serviceProviderBIC: eitAppConfig.serviceProviderBIC,
                serviceProviderIBAN: eitAppConfig.serviceProviderIBAN,
                currency: "BGN",
                // paymentTypeCode: "",
                paymentAmount: props.amount,
                paymentReason: nls.nls.serviceWizard.signingAndPayment.paymentReasonValue,
                applicantUinTypeId: "3",
                applicantUin: props.applicantUin,
                applicantName: props.applicantName,
                paymentReferenceType: eitAppConfig.paymentReferenceType,
                paymentReferenceNumber: this.guid(),
                paymentReferenceDate: new Date().toISOString(),
                expirationDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString(),
                // additionalInformation: "",
                // administrativeServiceUri: "",
                // administrativeServiceSupplierUri: "",
                administrativeServiceNotificationURL: eitAppConfig.administrativeServiceNotificationURL
            },
        }
    }

    _p8(s: any = undefined) {
        let p = (Math.random().toString(16) + "000000000").substr(2, 8);
        return s ? "-" + p.substr(0, 4) + "-" + p.substr(4, 4) : p;
    }

    guid() {
        return this._p8() + this._p8(true) + this._p8(true) + this._p8();
    }
    onValueChange = (newValue: string, fieldHasError: boolean, fieldName: string): void => {
        this.setState({ ...this.state, paymentData: { ...this.state.paymentData, [fieldName]: newValue } });
    }
    render() {
        return (
            <div style={{position: "relative"}}>
                <OverlayLoader size="60px" show={this.state.loading}/>
                <div>
                    {
                        this.state.errorMsg ?  
                            <div style={{ width: "100%", height: "50px", fontSize: "17px", color: "red", backgroundColor: "#3h3h3h" }}>
                                {nls.nls.general.errorOccured}
                        </div> : null
                        }
                        <table style={{width: "100%"}}>
                            <tbody>
                                <tr>
                                    <td>{nls.nls.serviceWizard.signingAndPayment.paymentAmount}</td>
                                    <td><input className="form-control" disabled value={this.state.paymentData.paymentAmount} /></td>
                                    <td> <input className="form-control" disabled value={this.state.paymentData.currency} /></td>
                                </tr>
                                <tr>
                                    <td>{nls.nls.serviceWizard.signingAndPayment.paymentReason}</td>
                                    <td colSpan={2}><input className="form-control" disabled value={this.state.paymentData.paymentReason} /></td>
                                </tr>
                                <tr>
                                    <td>{nls.nls.serviceWizard.signingAndPayment.applicantUin}</td>
                                    <td colSpan={2}><input className="form-control" disabled value={this.state.paymentData.applicantUin} /></td>
                                </tr>
                                <tr>
                                    <td>{nls.nls.serviceWizard.signingAndPayment.applicantName}</td>
                                    <td colSpan={2}> <input className="form-control" disabled value={this.state.paymentData.applicantName} /></td>
                                </tr>
                            </tbody>
                        </table>

                        <div style={{ display: "flex", flexDirection: "column" }}>
                          
                        </div>
                        {this.getButtons()}
                    </div>
             </div>
        )
    }

    getButtons(){
        return (
            <div style={{ display: "flex" }}>
                <button className="appBtn margin" onClick={() => {
                    console.log(JSON.stringify(JSON.stringify(this.state.paymentData)))
                    this.requestPayment();
                }}>{nls.nls.serviceWizard.signingAndPayment.pay}</button>
                <button className="appBtn margin" onClick={() => {
                    this.props.onCancel();
                }}>{nls.nls.serviceWizard.signingAndPayment.cancel}</button>
            </div>
        )
    }

    requestPayment = () => {
        this.setState({...this.state, loading: true, errorMsg: ""});
        axios.post(eitAppConfig.payServiceUrl, {
            data: JSON.stringify(this.state.paymentData),
            jobId: this.props.jobId,
            token: this.props.token
        })
        .then(r => {
            
            if(!r.data.id){
                console.error(r.data)
                this.setState({...this.state, loading: false, errorMsg: nls.nls.general.errorOccured})
            }
            else{
                this.setState({...this.state, loading: false, paymentId: r.data as AfterRegisterResponse})
                this.props.onSuccess(r.data as AfterRegisterResponse)
            }
            
        })
        .catch(e => {
            // this.setState({...this.state, loading: false, paymentId: "demo"})
            //     this.props.onSuccess("demo")
            console.error(e);
            this.setState({...this.state, loading: false, errorMsg: nls.nls.general.errorOccured})
        })

    }
}

export default PaymentForm;