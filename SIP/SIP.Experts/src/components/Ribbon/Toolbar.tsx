import * as React from 'react';
import { isNullOrUndefined } from 'util';
import ToggleWindowButton from '../Widgets/ToggleWindowButton';
import ToggleDropDownButton from '../Widgets/ToggleDropDownButton';
import PopupRibbonButton from '../Widgets/PopupRibbonButton';
import EITAppWindow from '../../enums/EITAppWindow';
import Login from "../Login/Login";
import { nls } from "../nls";
import { IAppConfig } from '../../core/interfaces/reducers/IAppConfig';
import {setLanguage} from "../../core/components/nls";

declare global { interface Window { locale: string; getCookie: (name: string) => string; setCookie: (name: string, value: string, days?: number) => void; }}

export const toggleLang = function() : void {
    if (isNullOrUndefined(window.getCookie('locale')) || window.getCookie('locale')=='' || window.getCookie('locale') == 'bg') {
        window.setCookie('locale', 'en');
        setLanguage('en');
    }
    else {
        window.setCookie('locale', 'bg');
        setLanguage('bg');
    }
    location.reload();
}

export default class Toolbar extends React.Component {
    toggleLanguage = toggleLang;
    render() {
        const lang: string = nls.nls.changeLang;
        const langUrl: string = 'public/eit/About/' + lang + '.png';
        return (
            <div className="ribbonToolbar">
                <ToggleWindowButton outsideCaller="public/eit/law.htm" window={EITAppWindow.contentDoc} imageUrl='' text={nls.nls.eitWidgetNames.contentDoc} />
                <ToggleWindowButton window={EITAppWindow.news} imageUrl={''} text={nls.nls.eitWidgetNames.news}/>
                <ToggleDropDownButton windows={[EITAppWindow.inspire, EITAppWindow.metaDatSearch, EITAppWindow.openData]} imageUrl={''} text={nls.nls.eitWidgetNames.openData} />
                <PopupRibbonButton closeOnMauseLeave={false} window={EITAppWindow.tables} imageUrl={'public/eit/RibbonToolbar/UserProfile32.png'} title={nls.nls.ribbon.profile}
                    content={<Login uniqueKey={"toolbarLogin"} style={{padding: "15px", border: "1px solid #bcbcbc", display: "flex", flexDirection: "column", minWidth: "250px"}}/>}/>
                     <div className="ribbonToolbarButtom" title={lang}>
                    <div onClick={this.toggleLanguage} style={{ width: "100%", height: "100%", position: "absolute" }}></div>
                    <img style={{ width: "20px", height: "20px" }} src={langUrl} />
                </div>
                {/* <ToggleWindowButton window={EITAppWindow.layers} imageUrl={'public/eit/RibbonToolbar/Layers32.png'} /> */}
                {/* <ToggleWindowButton window={EITAppWindow.legend} imageUrl={'public/eit/RibbonToolbar/Legend32.png'} /> */}
                <ToggleWindowButton window={EITAppWindow.feedback} imageUrl={'public/eit/RibbonToolbar/Feedback32.png'} />
                {/* <ToggleWindowButton window={EITAppWindow.print} imageUrl={'public/eit/RibbonToolbar/Print32.png'} /> */}
                <ToggleWindowButton window={EITAppWindow.tables} imageUrl={'public/eit/RibbonToolbar/Tables32.png'} />
                <ToggleWindowButton window={EITAppWindow.tools} imageUrl={'public/icons/tools.svg'} />
            </div>
        )
    }
}
