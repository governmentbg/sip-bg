import * as React from 'react';
import { nls } from "./nls";


interface Props {
    show: boolean;
}

export default class AdditionalComponentUi extends React.Component<Props> {

    constructor(props: Props) {
        super(props);
    }

    render() {
        return (
            <div onClick = {() => {}} style = {{ display: this.props.show ? "" : "none", height: "100%", width: "100%", zIndex: 9999, position: "absolute", top: 0, bottom: 0 }}>
                <div className="map-disable">{nls.nls.ribbon.registry2.deactivatedMap}</div>
                <div style={{height: "100%", width: "100%", opacity: 0.75, backgroundColor: "black"}} > { /*{ height: "100%", width: "100%", opacity: 0.3, pointerEvents: "none" }*/}
                </div>
            </div>
        );
    }
}