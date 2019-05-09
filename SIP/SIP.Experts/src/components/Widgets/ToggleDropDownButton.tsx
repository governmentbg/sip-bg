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
    windows: Array<EITAppWindow>,
    imageUrl: string,
    width?: string,
    height?: string,
    id?: string;
    text?: string;
    outsideCaller?: string
}

export interface State {
    openDropDown: boolean;
    dropDownList: Array<JSX.Element>;
}

export type Props = DispatchProps & OwnProps;

export class ToggleDropDownButton<TParentProps extends ParentProps, TParentState extends State> extends React.Component<TParentProps & Props, TParentState | State> {
    
    
    constructor(props: TParentProps & Props) {
        super(props);
        this.state = {
            openDropDown: false,
            dropDownList: this.setDropDownList()
        }
    }

    setDropDownList(): Array<JSX.Element> {
        let dropDownElements: Array<JSX.Element> = [];

        if (this.props.windows && this.props.windows.length) {
            let windowsNames = this.props.windows;
            for (let i = 0; i < windowsNames.length; i++) {
                dropDownElements.push(<div>{nls.nls.eitWidgetNames[windowsNames[i]]}</div>)
                
            }
        }

        return dropDownElements;
    }

    itemClick(itemIndex: number) {
        let item = this.props.windows[itemIndex];
        toggleWindow(this.props, item);
    }

    _toggleWindow = (): void => {
        this.setState({openDropDown: !this.state.openDropDown});
    }

    render() {
        const width: string = (this.props as ParentProps).width || "20px";
        const height: string = (this.props as ParentProps).height || "20px";
        return (
            <div onMouseLeave={() => this.state.openDropDown ? this._toggleWindow() : ""} className="ribbonToolbarButtom" title={nls.nls.eitWidgetNames.openData} onClick={() => this._toggleWindow()}>
                {this.props.imageUrl ? 
                    <img style={{ width: width, height: height, }} src={this.props.imageUrl} />
                    :
                    <span>{this.props.text}</span>
                }
                {
                    this.state.openDropDown ? 
                        <div onMouseLeave={() => this._toggleWindow()} className="ribbon-drop-down-list">
                            {this.state.dropDownList.map((item, index) => {
                                return (
                                    <div key={index} className="ribbon-drop-down-item-container">

                                        <div key={index + "_res"} className="ribbon-drop-down-item" onClick={(evt) => this.itemClick(index)}>{item}</div>

                                    </div>
                                );
                            })}
                        </div>
                        : "" 
                }
            </div>
        )
    }
}

export default connect<{}, IMosaicLayoutDispatcher, {}>(null, { ...mosaicLayoutDispatcher })(ToggleDropDownButton)

// .autocomplete-items {
//     position: absolute;
//     border: 1px solid #d4d4d4;
//     border-bottom: none;
//     border-top: none;
//     z-index: 99;
//     max-height: 500px;
//     overflow: auto;
//     /*position the autocomplete items to be the same width as the container:*/
//     top: 100%;
//     left: 0;
//     right: 0;
//   }
  
//   .autocomplete-items .item-group-container .item-title {
//     background-color: #cccccc;
//     text-align: center;
//     font-size: large;
//     font-family: 'Roboto';
//   }

//   .autocomplete-items .item-group-container .item-found {
//     padding: 10px;
//     cursor: pointer;
//     background-color: #fff; 
//     border-bottom: 1px solid #d4d4d4; 
//     font-family: 'Roboto';
//   }
  
//   .autocomplete-items .item-group-container .item-found:hover {
//     /*when hovering an item:*/
//     background-color: #e9e9e9; 
//   }