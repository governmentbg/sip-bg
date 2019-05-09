import * as React from "react";
import { connect } from 'react-redux';
import { isNullOrUndefined } from 'util';
import { nls } from "../nls";
import * as Services from "./ServiceWizardBase";

export class ServiceForm3 extends Services.ServiceForm {
    constructor(props: Services.Props) {
        super(props);
        this.state = {
            serviceNr: 3,
            title: nls.nls.ribbon.adService3.description,
            introUrl: 'public/eit/Services/Service3Intro.htm',
            steps: [
            Services.WizardStep.spatialRange],
            loading: false,
            introHTMLContent: '',
            currentStep: 0,
        };
    }
}
