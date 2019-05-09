import * as React from 'react';
import { nls } from "../nls";
import { connect } from 'react-redux';
import { popupDispatcher } from "../../core/actions/dispatchers";
import { IPopupDispatcher } from "../../core/interfaces/dispatchers";

interface State {
    hideForever: boolean;
}

interface OwnProps {

}

interface DispatchProps extends IPopupDispatcher {

}

interface ParentProps {

}

type Props = DispatchProps & OwnProps & ParentProps
declare global { interface Window { setCookie: (name: string, value: string, days?: number) => void; getCookie: (name: string) => string; eraseCookie: (name: string, paths: Array<string>) => void; }}
class AboutPopup extends React.Component<Props , State> {
    constructor(props: Props){
        super(props);
        this.state = {
            hideForever: false
        }
    }
    render(){
        return (
            <div>
                <div>
                    <img style={{maxWidth: "300px", width: "100%"}} src="public/eit/About/es.png"/>
                    <img style={{maxWidth: "300px", width: "100%"}} src="public/eit/About/du.png"/>
                </div>
                <img src="public/eit/About/MTITC_logo.png" style={{width: "100%"}}/>
                <h3>{nls.nls.about.h3}</h3>
                <div style={{textAlign: "center", fontSize: "11px"}}>
                    {nls.nls.about.forTheSystem}
                </div>
                <label>
                <input type="checkbox" onClick={(e) => {
                    this.setState({hideForever: !this.state.hideForever})
                }} checked={this.state.hideForever}></input>
               {nls.nls.about.doNotShowAgain}</label>
                <button className="appBtn" onClick={e => {
                    if(this.state.hideForever){
                        window.setCookie("hideAbout", "true", 365)
                    }
                    this.props.removePopups(["about"])
                }}>{nls.nls.general.close}</button>
            </div>
        )
    }
}

export default connect<OwnProps, DispatchProps, ParentProps>(null, {...popupDispatcher})(AboutPopup);
