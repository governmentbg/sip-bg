import * as React from "react";
import { connect } from 'react-redux';
import { nls } from "../nls";
import * as Services from "./ServiceWizardBase";

export class ServiceForm1 extends Services.ServiceForm {
    constructor(props: Services.Props) {
        super(props);
        this.state = {
            serviceNr: 1,
            title: nls.nls.ribbon.adService1.description,
            introUrl: 'public/eit/Services/Service1Intro.htm',
            steps: [
                Services.WizardStep.login,
                Services.WizardStep.request,
                Services.WizardStep.spatialRange,
                Services.WizardStep.signing,
                Services.WizardStep.result,
            ],
            loading: false,
            introHTMLContent: '',
            currentStep: 0,
            serviceFee: 0.10,
        };
    }
}

