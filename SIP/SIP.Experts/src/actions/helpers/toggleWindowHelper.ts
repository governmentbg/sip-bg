import EITAppWindow from '../../enums/EITAppWindow';
import { IMosaicLayoutDispatcher } from "../../core/interfaces/dispatchers";
import { IMobileRibbonsDispatcher } from '../../core/interfaces/dispatchers';

export const toggleWindow = (mosaicLayoutDispatcher: IMosaicLayoutDispatcher, eitAppWindow: EITAppWindow): void => {
    var services: EITAppWindow[] = [EITAppWindow.adService1Wizard,
    EITAppWindow.adService2Wizard,
    EITAppWindow.adService3Wizard,
    EITAppWindow.adService4Wizard,
    EITAppWindow.adService51Wizard,
    EITAppWindow.adService52Wizard,
    EITAppWindow.adService53Wizard
    ];
    if ((eitAppWindow.toString() as string).indexOf('metaDatSearch') > -1) {
        mosaicLayoutDispatcher.showWindow(eitAppWindow.toString(), 25);
    }
    else if (eitAppWindow == EITAppWindow.servicePreview) {
        mosaicLayoutDispatcher.showWindow(eitAppWindow.toString());
    }
    else if ((eitAppWindow.toString() as string).startsWith('adService')) {
        var i: any;
        for (i in services) {
            if (services[i].toString().replace('Wizard', '') != eitAppWindow.toString().replace('Wizard', '').replace('Info', '')) {
                mosaicLayoutDispatcher.hideWindow(services[i].toString());
                mosaicLayoutDispatcher.hideWindow(services[i].toString().replace('Wizard', 'Info'));
            }
        }
        if ((eitAppWindow.toString() as string).indexOf('Wizard') > -1) {
            const wizardType = (eitAppWindow.toString() as string).substr(9, 1);
            switch (wizardType) {
                case "1":
                case "2":
                mosaicLayoutDispatcher.showWindow(eitAppWindow.toString(), 35);
                break;
                case "3":
                case "4":
                mosaicLayoutDispatcher.showWindow(eitAppWindow.toString(), 30);
                break;
                case "5":
                mosaicLayoutDispatcher.showWindow(eitAppWindow.toString(), 50);
                break;
                default:
                mosaicLayoutDispatcher.showWindow(eitAppWindow.toString(), 50);
                break;
            }
        }
        else {
            mosaicLayoutDispatcher.showWindow(eitAppWindow.toString());
        }
        if ((eitAppWindow.toString() as string).indexOf('Wizard') > -1) {
            mosaicLayoutDispatcher.hideWindow(eitAppWindow.toString().replace('Wizard', 'Info'));
            //mosaicLayoutDispatcher.showWindow(eitAppWindow.toString().replace('Wizard', 'Info'), 20);
        };
    }
    else {
        mosaicLayoutDispatcher.toggleWindow(eitAppWindow.toString());
    }
};

export const hideWindow = (layoutDispatcher: IMosaicLayoutDispatcher & IMobileRibbonsDispatcher, eitAppWindow: EITAppWindow) => {
    layoutDispatcher.hideWindow(eitAppWindow.toString());
    layoutDispatcher.setVisibleRibbonTab("__index");
}
 