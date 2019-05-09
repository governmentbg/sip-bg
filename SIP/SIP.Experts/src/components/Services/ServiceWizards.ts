import { connect } from 'react-redux';
import { mapDispatcher, mosaicLayoutDispatcher, mobileRibbonsDispatcher } from "../../core/actions/dispatchers";
import * as Services from "./ServiceWizardBase";
import { ServiceForm1 } from './ServiceWizard1';
import { ServiceForm2 } from './ServiceWizard2';
import { ServiceForm3 } from './ServiceWizard3';
import { ServiceForm4 } from './ServiceWizard4';
import { ServiceForm51 } from './ServiceWizard51';
import { ServiceForm52 } from './ServiceWizard52';
import { ServiceForm53 } from './ServiceWizard53';

import {ServicePreviewPane, SelectedServiceProps, mapStateToSelectedServiceProps} from './ServicePreviewPane';

export const ServiceWizard1 = connect<Services.OwnProps, Services.DispatchProps, any>(Services.mapStateToProps, { ...mapDispatcher, ...mosaicLayoutDispatcher, ...mobileRibbonsDispatcher })(ServiceForm1);
export const ServiceWizard2 = connect<Services.OwnProps, Services.DispatchProps, any>(Services.mapStateToProps, { ...mapDispatcher, ...mosaicLayoutDispatcher, ...mobileRibbonsDispatcher })(ServiceForm2);
export const ServiceWizard3 = connect<Services.OwnProps, Services.DispatchProps, any>(Services.mapStateToProps, { ...mapDispatcher, ...mosaicLayoutDispatcher, ...mobileRibbonsDispatcher })(ServiceForm3);
export const ServiceWizard4 = connect<Services.OwnProps, Services.DispatchProps, any>(Services.mapStateToProps, { ...mapDispatcher, ...mosaicLayoutDispatcher, ...mobileRibbonsDispatcher })(ServiceForm4);
export const ServiceWizard51 = connect<Services.OwnProps, Services.DispatchProps, any>(Services.mapStateToProps, { ...mapDispatcher, ...mosaicLayoutDispatcher, ...mobileRibbonsDispatcher })(ServiceForm51);
export const ServiceWizard52 = connect<Services.OwnProps, Services.DispatchProps, any>(Services.mapStateToProps, { ...mapDispatcher, ...mosaicLayoutDispatcher, ...mobileRibbonsDispatcher })(ServiceForm52);
export const ServiceWizard53 = connect<Services.OwnProps, Services.DispatchProps, any>(Services.mapStateToProps, { ...mapDispatcher, ...mosaicLayoutDispatcher, ...mobileRibbonsDispatcher })(ServiceForm53);

export const ServicePreview = connect<SelectedServiceProps, any, any>(mapStateToSelectedServiceProps, {})(ServicePreviewPane);

//export * from "./ServiceWizard1";
//export * from "./ServiceWizard2";
//export * from "./ServiceWizard3";
//export * from "./ServiceWizard4";
//export * from "./ServiceWizard51";
//export * from "./ServiceWizard52";
//export * from "./ServiceWizard53";
