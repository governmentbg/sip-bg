import * as React from 'react'
import { nls } from './nls';
import { eitAppConfig } from '../eitAppConfig';


export default class InspireContent extends React.Component {
    handleClick = (el: any): void => {
        el.stopPropagation();
        el.preventDefault();
        window.open(el.currentTarget.text, "_blank");
    }
    
    render() {
        return (
            // <div>InspireContent</div>
            <div style={{ padding: 20, overflow: "auto", height: "100%" }}>
                <h5>{nls.nls.openData.INSPIRE.title}</h5>
                <p style={{ wordBreak: "break-all" }}>
                    <a href={nls.nls.openData.INSPIRE.link} onClick={this.handleClick}>
                        {eitAppConfig.appSpecific.inspireUrl}
                    </a>
                </p>
            </div>
        )
    }
}
