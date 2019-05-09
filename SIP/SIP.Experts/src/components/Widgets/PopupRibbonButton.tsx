import * as React from 'react';

import { connect } from 'react-redux';
import { mosaicLayoutDispatcher } from "../../core/actions/dispatchers";
import { IMosaicLayoutDispatcher } from "../../core/interfaces/dispatchers";
import RibbonButton from "../Ribbon/RibbonButton";
import { ToggleWindowButton as ToggleWindowButton, ParentProps as BaseParentProps, Props as PropsBase } from "./ToggleWindowButton";

import { nls } from "../nls";
import { IAppStore } from '../../core/interfaces/reducers/IAppStore';
import { IEITAppStore, IUserInfo } from '../../interfaces/reducers/IEITAppStore';


interface OwnProps {
    userInfo: IUserInfo
}

interface ParentProps {
    content: JSX.Element;
    title: string;
    closeOnMauseLeave?: boolean;
    timeOutBeforeCloseInMs?: number
}

type Props = BaseParentProps & OwnProps & ParentProps

interface State {
    popupOpen: boolean;
    userName: string;
}

class PopupRibbonButton extends ToggleWindowButton<Props, State> {
    onLeave: NodeJS.Timer;
    constructor(props: Props & PropsBase) {
        super(props);
        this.state = {
            popupOpen: false,
            userName: props.userInfo.username || ""
        }
    }

    componentWillReceiveProps(props: Props) {
        if (props.userInfo.username && this.state.userName == "" && props.userInfo.username != "") {
            this.setState({ popupOpen: false, userName: props.userInfo.username })
        }
        else {
            this.setState({ ...this.state, userName: props.userInfo.username })
        }
    }

    toggleWindow = (): void => {
        this.setState({ popupOpen: !this.state.popupOpen })
    }

    handleOnMauseLeave = () => {
        this.onLeave = setTimeout(() => this.setState({ popupOpen: false }), this.props.timeOutBeforeCloseInMs || 60000);
    }

    handleOnMouseEnter = () => {
        if (this.onLeave)
            clearTimeout(this.onLeave);
    }

    componentWillUnmount() {
        if (this.onLeave)
            clearTimeout(this.onLeave);
    }
    
    render() {
        const width: string = this.props.width || "20px";
        const height: string = this.props.height || "20px";
        return (
            <div className="ribbonToolbarButtom" title={this.props.title}>
                <div onClick={() => this.toggleWindow()} style={{ width: "100%", height: "100%", position: "absolute" }}></div>
                <img style={{ width: width, height: height, }} src={this.props.imageUrl} />
                <div onMouseLeave={this.props.closeOnMauseLeave ? this.handleOnMauseLeave : undefined} onMouseEnter={this.handleOnMouseEnter} className="popupRibbonButton" style={{
                    maxHeight: this.state.popupOpen ? "290px" : "0"
                }}>{this.props.content}</div>
            </div>
        )
    }
}

const mapStateToProps = (state: IEITAppStore) => ({
    userInfo: state.eit.userInfo
})

export default connect<OwnProps, IMosaicLayoutDispatcher, ParentProps>(mapStateToProps, { ...mosaicLayoutDispatcher })(PopupRibbonButton)
