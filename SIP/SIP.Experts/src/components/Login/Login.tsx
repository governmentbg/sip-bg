import * as React from 'react';

import EITAppWindow from '../../enums/EITAppWindow';
import { connect } from 'react-redux';
import { mosaicLayoutDispatcher } from "../../core/actions/dispatchers";
import { IMosaicLayoutDispatcher } from "../../core/interfaces/dispatchers";
import { nls } from "../nls";
import { singIn, signOut } from "../../actions/dispatchers/userInfo";
import { IEITAppStore, IUserInfo } from '../../interfaces/reducers/IEITAppStore';
import FloatingLabelInput from '../Widgets/FloatingLabelInput';
import OverlayLoader from '../../core/components/Loading/OverlayLoading';
import ToggleWindowButton from '../Widgets/ToggleWindowButton';
import { isNullOrUndefined } from 'util';
interface State {
    username: string;
    password: string;
    errorMessage: string;
}

interface ParentProps {
    style?: React.CSSProperties;
    uniqueKey: string;
}

interface OwnProps {
    userInfo: IUserInfo
}

interface DispatchProps {
    singIn: typeof singIn;
    signOut: typeof signOut;
}

type Props = DispatchProps & OwnProps & ParentProps;

class Login extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            username: "",
            password: "",
            errorMessage: ""
        }
    }

    getErrorMessage(): JSX.Element {
        return !!this.props.userInfo && !!this.props.userInfo["signInError"] ? <div style={{ color: "red" }}>{this.props.userInfo["signInError"].code == 401 ?
            nls.nls.login.invalidCredentials : this.props.userInfo["signInError"].message}</div>
            :
            (this.state.errorMessage ?
                <div style={{ color: "red" }}>{this.state.errorMessage}</div>
                :
                <div></div>)
    }

    trySubmit(): void {
        if (!this.state.password || !this.state.username) {
            this.setState({ ...this.state, errorMessage: nls.nls.login.pleaseImput })
            return;
        }
        this.setState({ ...this.state, password: "", errorMessage: "" })
        this.props.singIn(this.state.username, this.state.password)
    }

    getAuthorizedPersonNameForShow = () => {
        return this.props.userInfo.user &&
            this.props.userInfo.user.authorizedpersonname &&
            !isNullOrUndefined(this.props.userInfo.user.authorizedpersonname) &&
            this.props.userInfo.user.authorizedpersonname !== ''
            ? this.props.userInfo.user.authorizedpersonname
            : this.props.userInfo.username
    }

    getUserNameForShow = () => {
        return this.props.userInfo.user &&
            this.props.userInfo.username &&
            !isNullOrUndefined(this.props.userInfo.username) &&
            this.props.userInfo.user.authorizedpersonname !== ''
            ? this.props.userInfo.username
            : this.props.userInfo.user.authorizedpersonname
    }

    getOrganizationName = () => {
        return this.props.userInfo.user &&
            this.props.userInfo.user.organizationname &&
            !isNullOrUndefined(this.props.userInfo.user.organizationname) &&
            this.props.userInfo.user.organizationname !== ''
            ? this.props.userInfo.user.organizationname
            : this.props.userInfo.username
    }
    
    getLoginForm(): JSX.Element {
        return (
            !this.props.userInfo.singInError && this.props.userInfo.username ?
                <div style={this.props.style}>
                    <label>{`${nls.nls.login.hello}`} {`${this.getAuthorizedPersonNameForShow()}`}</label>
                    <label><b>{`${nls.nls.login.userName}:`}</b> {`${this.getUserNameForShow()}`}</label>
                    <label><b>{`${nls.nls.login.organization}:`}</b> {`${this.getOrganizationName()}`}</label>
                    <button className="appBtn" style={{ flex: "inherit", marginTop: "10px" }} onClick={() => {
                        this.setState({ ...this.state, password: "" })
                        this.props.signOut();
                    }}>{nls.nls.login.signOut}</button>
                    <div style={{ minWidth: 170, marginTop: 15 }}>
                        <ToggleWindowButton window={EITAppWindow.createUserRequest} imageUrl={''} text={nls.nls.login.registration} />
                    </div>
                </div>
                :
                (
                    <div style={this.props.style}>
                        <OverlayLoader size="30px" show={this.props.userInfo.loading} />
                        <FloatingLabelInput
                            key={`${this.props.uniqueKey}1`}

                            className="flex-item-side-margin"
                            placeholder={nls.nls.login.userName}
                            value={this.state.username}
                            onValueChange={(newValue: string | number | undefined, hasError: boolean) => {
                                { this.setState({ ...this.state, username: newValue ? newValue.toString() : "", errorMessage: "" }) }
                            }}
                            onKeyUp={e => { e.keyCode == 13 && this.trySubmit() }} />
                        <FloatingLabelInput
                            key={`${this.props.uniqueKey}2`}

                            className="flex-item-side-margin"
                            placeholder={nls.nls.login.password}
                            value={this.state.password}
                            type="password"
                            onValueChange={(newValue: string | number | undefined, hasError: boolean) => {
                                { this.setState({ ...this.state, password: newValue ? newValue.toString() : "", errorMessage: "" }) }
                            }}
                            onKeyUp={e => { e.keyCode == 13 && this.trySubmit() }} />
                        <button className="appBtn" style={{ flex: "inherit", marginTop: "10px" }} onClick={() => {
                            this.trySubmit();
                        }}>{nls.nls.login.signIn}</button>
                        <label style={{ marginTop: "10px" }}>{nls.nls.login.doNotHaveAnAccount}</label>
                        {/* <button className="appBtn" style={{flex: "inherit"}} onClick={() => (EITAppWindow.createUserRequest as wind).open()
                        }>{nls.nls.login.registration}</button> */}
                        <ToggleWindowButton window={EITAppWindow.createUserRequest} imageUrl={''} text={nls.nls.login.registration} />
                        {this.getErrorMessage()}
                    </div>
                )
        )
    }

    render() {
        return (
            this.getLoginForm()
        )
    }
}

const mapStateToProps = (state: IEITAppStore) => ({
    userInfo: state.eit.userInfo
})

export default connect<OwnProps, DispatchProps, ParentProps>(mapStateToProps, { singIn, signOut })(Login)