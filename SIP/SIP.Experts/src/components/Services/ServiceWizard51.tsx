import * as React from "react";
import { connect } from 'react-redux';
import { isNullOrUndefined } from 'util';
import { nls } from "../nls";
import * as Services from "./ServiceWizardBase";

export class ServiceForm51 extends Services.ServiceForm {
    constructor(props: Services.Props) {
        super(props);
        this.state = {
            serviceNr: 51,
            title: nls.nls.ribbon.adService51.description,
            introUrl: 'public/eit/Services/Service51Intro.htm',
            addIntroUrl: 'public/eit/Services/Service51AddIntro.htm',
            steps: [
                Services.WizardStep.login,
                Services.WizardStep.request,
                Services.WizardStep.signing,
                Services.WizardStep.result,
            ],
            loading: false,
            introHTMLContent: '',
            currentStep: 0,
        };
    }
}
