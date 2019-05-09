import { nls } from "../nls";
import * as Services from "./ServiceWizardBase";

export class ServiceForm53 extends Services.ServiceForm {
    constructor(props: Services.Props) {
        super(props);
        this.state = {
            serviceNr: 53,
            title: nls.nls.ribbon.adService53.description,
            introUrl: 'public/eit/Services/Service53Intro.htm',
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
