import * as React from 'react';

import { connect } from 'react-redux';
import { mosaicLayoutDispatcher } from "../../core/actions/dispatchers";
import { IMosaicLayoutDispatcher } from "../../core/interfaces/dispatchers";
import RibbonButton from "../Ribbon/RibbonButton";
import {ToggleWindowButton as ToggleWindowButton, ParentProps as BaseParentProps, Props as PropsBase} from "./ToggleWindowButton";
import { nls } from "../nls";

interface ParentProps extends BaseParentProps {
	vertical?: boolean;
	size?: "S" | "M" | "L";
	tooltip?: string;
	disabled?: boolean;
	children?: any;
}

interface State {

}

class ToggleWindowRibbonButton extends ToggleWindowButton<ParentProps, State> {
    constructor(props: ParentProps & PropsBase) {
        super(props);
    }
    removeTags = (tooltip?: string): string => {
        return (tooltip || '').replace(new RegExp('<br/>', 'g'), "").replace(new RegExp('<b>', 'g'), "").replace(new RegExp('</b>', 'g'), "");
    }
    render()
    {
        return (
            <RibbonButton imageUrl={this.props.imageUrl} 
                size={this.props.size}
                disabled={this.props.disabled}
                tooltip={this.removeTags(this.props.tooltip)}
                vertical={this.props.vertical}
                clickHandler={() => this.toggleWindow()}>
                <span>{nls.nls.eitWidgetNames[this.props.window]}</span>
                {this.props.children}
            </RibbonButton>
        )
    }
}

export default connect<{}, IMosaicLayoutDispatcher, {}>(null, { ...mosaicLayoutDispatcher })(ToggleWindowRibbonButton)
