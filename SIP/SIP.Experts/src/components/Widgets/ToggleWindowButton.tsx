import * as React from 'react';

import EITAppWindow from '../../enums/EITAppWindow';
import { connect } from 'react-redux';
import { mosaicLayoutDispatcher } from "../../core/actions/dispatchers";
import { IMosaicLayoutDispatcher } from "../../core/interfaces/dispatchers";
import { toggleWindow } from "../../actions/helpers/toggleWindowHelper";
import { nls } from "../nls";

interface OwnProps {
}
interface DispatchProps extends IMosaicLayoutDispatcher {
}

export interface ParentProps {
    window: EITAppWindow,
    imageUrl: string,
    width?: string,
    height?: string,
    id?: string;
    text?: string;
    outsideCaller?: string
}

export interface State {

}

export type Props = DispatchProps & OwnProps;

export class ToggleWindowButton<TParentProps extends ParentProps, TParentState extends State> extends React.Component<TParentProps & Props, TParentState & State> {
    constructor(props: TParentProps & Props) {
        super(props);
    }

    toggleWindow = (): void => {
        if (this.props.outsideCaller) {
            window.open(this.props.outsideCaller)
            return;
        }
        if (this.props.window === EITAppWindow.tables) {
            this.props.showWindow(this.props.window, 60, true);
        } else {
            toggleWindow(this.props, this.props.window);
        }
    }

    render() {
        const width: string = (this.props as ParentProps).width || "20px";
        const height: string = (this.props as ParentProps).height || "20px";
        return (
            <div className="ribbonToolbarButtom" title={nls.nls.eitWidgetNames[(this.props as ParentProps).window]} onClick={() => this.toggleWindow()}>
                {this.props.imageUrl ? 
                    <img style={{ width: width, height: height, }} src={this.props.imageUrl} />
                    :
                    <span>{this.props.text}</span>
            }
            </div>
        )
    }
}

export default connect<{}, IMosaicLayoutDispatcher, {}>(null, { ...mosaicLayoutDispatcher })(ToggleWindowButton)
