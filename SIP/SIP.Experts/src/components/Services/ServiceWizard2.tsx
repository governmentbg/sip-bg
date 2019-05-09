import * as React from "react";
import { connect } from 'react-redux';
import { isNullOrUndefined } from 'util';
import { nls } from "../nls";
import * as Services from "./ServiceWizardBase";

export class ServiceForm2 extends Services.ServiceForm {
    constructor(props: Services.Props) {
        super(props);
        this.state = {
            serviceNr: 2,
            title: nls.nls.ribbon.adService2.description,
            introUrl: 'public/eit/Services/Service2Intro.htm',
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
        };
    }
}
