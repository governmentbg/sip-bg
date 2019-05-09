import * as React from "react";
import { connect } from 'react-redux';
import { isNullOrUndefined } from 'util';
import { nls } from "../nls";
import * as Services from "./ServiceWizardBase";

export class ServiceForm4 extends Services.ServiceForm {
    constructor(props: Services.Props) {
        super(props);
        this.state = {
            serviceNr: 4,
            title: nls.nls.ribbon.adService4.description,
            introUrl: 'public/eit/Services/Service4Intro.htm',
            steps: [
            Services.WizardStep.spatialRange],
            loading: false,
            introHTMLContent: '',
            currentStep: 0,
        };
    }
}

