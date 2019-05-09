import * as React from "react";
import { nls } from "../nls";
import { eitAppConfig } from '../../eitAppConfig';
import { AfterRegisterResponse } from './PaymentForm';
import axios from "axios";

interface Props {
    payment: AfterRegisterResponse;
    onSuccessfulPay: () => void;
}

interface State {
    paid: boolean;
}

class PaymentSuccessLinks extends React.Component<Props, State> {
    paidStatusCaller: NodeJS.Timer;
    constructor(props: Props){
        super(props);
        this.checkStatus = this.checkStatus.bind(this);
        this.state = {
            paid: false
        }
        this.paidStatusCaller = setInterval(() => {
            this.checkStatus()
        }, 30000)
    }

    componentWillUnmount(){
        clearInterval(this.paidStatusCaller)
    }

    checkStatus(){
        axios.post(eitAppConfig.checkPaymentStatusUrl, {
            id: this.props.payment.id
        })
        .then(r => {
            if(r.data.status.toUpperCase() == "AUTHORIZED"){
                clearInterval(this.paidStatusCaller)
                this.props.onSuccessfulPay();
                this.setState({...this.state, paid: true})
            }
        })
        .catch(e => {

        })
    }

    render(){
        let notPaidStyle: React.CSSProperties = {
            textAlign: "center",
            color: "red",
            backgroundColor: "#ffe0e0"
        }
        let paidStyle: React.CSSProperties = {
            textAlign: "center",
            color: "#077f15",
            backgroundColor: "#cbfdd0"
        }
        return (
            <div style={{ display: "column", justifyContent: "space-evenly", alignItems: "center" }}>
                <div>Услугата е регистрирана успешно в портала.</div>
                {
                    this.state.paid ? 
                    <div></div>  
                    :
                    <form action={eitAppConfig.cardPayUrl} target="_blank" method="post">
                        <input hidden value={this.props.payment.clientId} name="ClientId"></input>
                        <input hidden value={this.props.payment.idPostDataHmac} name="Hmac"></input>
                        <input hidden value={this.props.payment.idPostData} name="Data"></input>
                        <button className="appBtn margin" type="submit">{nls.nls.serviceWizard.paymentSuccessLinks.continuePaymentButton}</button>
                    </form> 
                }
                
                <div>
                    <div style={this.state.paid ? paidStyle : notPaidStyle}>
                        {
                            this.state.paid ? nls.nls.serviceWizard.paymentSuccessLinks.successPaymentState : nls.nls.serviceWizard.paymentSuccessLinks.pendingPaymentState
                        }
                    </div>
                    <div style={{ display: this.state.paid ? "none" : "block" }}>
                        <div style={{ fontStyle: "italic" }}>{nls.nls.serviceWizard.paymentSuccessLinks.pendingPaymentLabel1}</div>
                        <div style={{ fontSize: "12px", fontStyle: "italic", textAlign: "center" }}>{nls.nls.serviceWizard.paymentSuccessLinks.pendingPaymentLabel2}</div>
                        <button className="appBtn width" onClick={this.checkStatus}>{nls.nls.serviceWizard.paymentSuccessLinks.refreshPaymentButton}</button>
                        </div>
                    </div>
            </div>
        )
    }
}

export default PaymentSuccessLinks;