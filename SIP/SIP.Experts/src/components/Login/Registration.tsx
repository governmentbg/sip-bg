import * as React from 'react'
import { eitAppConfig } from '../../eitAppConfig';
import { nls } from "../nls";
import FloatingLabelInput, { InputValueType } from '../Widgets/FloatingLabelInput';
import axios, { AxiosResponse } from "axios";
import OverlayLoader from "../../core/components/Loading/OverlayLoading";
import 'bootstrap/dist/css/bootstrap.css'
import { isNullOrUndefined } from 'util';
import { IUserInfo, IEITAppStore } from '../../interfaces/reducers/IEITAppStore';
import { connect } from 'react-redux';
import { IBrowserInfo } from '../../interfaces/dispatchers/IBrowserInfoDispatcher';

enum ButtonState {
    default,
    executing,
    success,
    error
}

interface State {
    externalUrl: string;
    name: string;
    position: string;
    organizationName: string;
    organizationId: string;
    organizationType: string | number;
    webSite: string;
    phoneNumber: string;
    email: string;
    address: string;
    userName: string;
    password: string;
    repeatPassword: string;
    strengthLevelIndex: number;
    passwordMatch: boolean,
    valid: boolean;
    loading: boolean,
    isUsernameAvailable: boolean,
    showUsernameError: boolean;
    submitSuccess?: boolean;
    checkUsernameBtnState: ButtonState;
}


interface OwnProps {
    userInfo: IUserInfo;
    browserInfo: IBrowserInfo
};

class Registration extends React.Component<OwnProps, State> {
    onShowResultMessage: NodeJS.Timer;

    constructor(props: OwnProps) {
        super(props);

        this.state = {
            externalUrl: eitAppConfig.appSpecific.externalUrl ? eitAppConfig.appSpecific.externalUrl : "",
            name: "",
            position: "",
            organizationName: "",
            organizationId: "",
            organizationType: 0,
            webSite: "",
            phoneNumber: "",
            email: "",
            address: "",
            userName: "",
            password: "",
            repeatPassword: "",
            strengthLevelIndex: -1,
            passwordMatch: false,
            valid: false,
            loading: false,
            isUsernameAvailable: false,
            showUsernameError: false,
            submitSuccess: undefined,
            checkUsernameBtnState: ButtonState.default
        };
    }



    // strength of password
    hasNumber(value: string) {
        return new RegExp(/[0-9]/).test(value);
    }

    hasMixed(value: string) {
        return new RegExp(/[a-z]/).test(value) &&
            new RegExp(/[A-Z]/).test(value);
    }

    hasSpecial(value: string) {
        return new RegExp(/[!#?@$%^&*)(+=._-]/).test(value);
    }

    getPasswordRegExp(minLenght: number, needUpperCase: boolean, needLowerCase: boolean, needDigit: boolean, needSpecialCharacter: boolean) {
        let pattern = new RegExp(`^${needLowerCase ? '(?=.*?[a-z])' : ''}${needSpecialCharacter ? '(?=.*?[#?!@$%^&*-._+=])' : ''}${needUpperCase ? '(?=.*?[A-Z])' : ''}${needDigit ? '(?=.*?[0-9])' : ''}.{${minLenght},}$`);
        return pattern;
    }


    strengthLevel(count: number): number {
        if (count == 0)
            return -1;
        if (count < 2)
            return 0; // red 'weak'
        if (count < 3)
            return 1; // yellow 'normal'
        if (count < 4)
            return 2; // orange 'medium'
        if (count < 5)
            return 3; // lightgreen 'strong'
        if (count < 6)
            return 4; // green 'very strong'
        return -1;
    }

    strengthIndicator(value: string) {
        let strengths = 0;
        if (value.length > 5)
            strengths++;
        if (value.length > 7)
            strengths++;
        if (this.hasNumber(value))
            strengths++;
        if (this.hasSpecial(value))
            strengths++;
        if (this.hasMixed(value))
            strengths++;

        return strengths;
    }

    isFormValid = (): boolean => {
        return !!(this.state.valid &&
            this.state.name &&
            this.state.position &&
            this.state.organizationName &&
            this.state.organizationId &&
            (this.state.organizationType && this.state.organizationType !== 0) &&
            this.state.phoneNumber &&
            this.state.email &&
            this.state.address &&
            this.state.userName &&
            this.state.isUsernameAvailable &&
            (this.state.password && this.state.repeatPassword && this.state.passwordMatch && this.getPasswordRegExp(6, true, true, true, true).test(this.state.password)));
    }

    onNameInput(name: string, err: boolean) {
        this.setState({ name, valid: true })
        if (err) {
            this.setState({ valid: false })
        }
    }

    onPositionInput(position: string, err: boolean) {
        this.setState({ position, valid: true })
        if (err) {
            this.setState({ valid: false })
        }
    }

    onOrganizationNameInput(organizationName: string, err: boolean) {
        this.setState({ organizationName, valid: true })
        if (err) {
            this.setState({ valid: false })
        }
    }

    onOrganizationIdInput(organizationId: string, err: boolean) {
        this.setState({ organizationId, valid: true })
        if (err) {
            this.setState({ valid: false })
        }
    }
    onOrganizationTypeInput(organizationType: string | number, err: boolean) {
        this.setState({ organizationType, valid: true })
        if (err) {
            this.setState({ valid: false })
        }
    }

    onWebSiteInput(webSite: string) {
        this.setState({ webSite })
    }

    onPhoneNumberInput(phoneNumber: string, err: boolean) {
        this.setState({ phoneNumber, valid: true })
        if (err) {
            this.setState({ valid: false })
        }
    }

    onEmailInput(email: string, err: boolean) {
        this.setState({ email, valid: true })
        if (err) {
            this.setState({ valid: false })
        }
    }

    onAddressInput(address: string, err: boolean) {
        this.setState({ address, valid: true })
        if (err) {
            this.setState({ valid: false })
        }
    }

    onUserNameInput(userName: string, err: boolean) {
        this.setState({ checkUsernameBtnState: ButtonState.default, isUsernameAvailable: false });
        this.setState({ userName, valid: true })
        if (err) {
            this.setState({ valid: false, showUsernameError: true })
        } else {
            this.setState({ showUsernameError: false });
        }
    }

    onPasswordInput(password: string, err: boolean) {
        if (password !== this.state.password)
            this.setState({ passwordMatch: false });
        if (err) {
            this.setState({ valid: false })
        }
        let strength = this.strengthIndicator(password);
        let indexNumber = this.strengthLevel(strength);
        this.setState({ password, valid: true });
        this.setStrengthLevelIndex(indexNumber);
    }

    onRepeatPasswordInput(repeatPassword: string) {
        this.setState({ repeatPassword });
        this.setState({ passwordMatch: repeatPassword === this.state.password });
    }

    onClear(submitSuccess: boolean | undefined) {
        this.setState({
            name: "",
            position: "",
            organizationName: "",
            organizationId: "",
            webSite: "",
            organizationType: 0,
            phoneNumber: "",
            email: "",
            address: "",
            userName: "",
            password: "",
            repeatPassword: "",
            strengthLevelIndex: -1,
            passwordMatch: false,
            loading: false,
            isUsernameAvailable: false,
            submitSuccess: submitSuccess,
            checkUsernameBtnState: ButtonState.default
        });
    }

    setStrengthLevelIndex(levelNumber: number) {
        this.setState({ strengthLevelIndex: levelNumber });
    }

    sendNewUser() {
        if (this.isFormValid()) {
            this.setState({ loading: true });
            axios.post(//"http://localhost:55489/api/Public/RegistrationRequest", {
                eitAppConfig.RegisterRegistrationRequestStoreServiceUrl, {
                user: {
                    name: this.state.name,
                    position: this.state.position,
                    organizationName: this.state.organizationName,
                    organizationId: this.state.organizationId,
                    webSite: this.state.webSite,
                    organizationType: this.state.organizationType,
                    phoneNumber: this.state.phoneNumber,
                    email: this.state.email,
                    address: this.state.email,
                    username: this.state.userName,
                    password: this.state.password
                },
                loggedUserId: this.props.userInfo && this.props.userInfo.user ? this.props.userInfo.user.id : '',
                loggedUserUsername: this.props.userInfo ? this.props.userInfo.username : '',
                organizationId: this.props.userInfo && this.props.userInfo.user ? this.props.userInfo.user.organizationid : '',
                ip: this.props.browserInfo.ip_address,
                browser: this.props.browserInfo.browser_info
            }, {
                headers: {
                    'Content-Type': 'application/json;charset=UTF-8',
                    "Access-Control-Allow-Origin": "*",
                }
            }).then(res => {
                this.onClear(true);
            }).catch(err => {
                this.setState({ loading: false, submitSuccess: false });
            });
            this.onShowResultMessage = setTimeout(() => this.scrollToResult(), 700);
        }
    }

    scrollToResult() {
        const thisForm = document.getElementById("registration");
        if (thisForm)
            thisForm.scrollTop = thisForm.scrollHeight;
    }

    checkUserNameHandler = () => {
        if (this.state.checkUsernameBtnState === ButtonState.default) {
            axios.get(
                eitAppConfig.CheckUsernameAvailability, { params: { username: this.state.userName } }
            ).then(result => {
                let res = result.data;
                if (res) {
                    this.setState({ checkUsernameBtnState: ButtonState.success, isUsernameAvailable: true });
                }
                else {
                    this.setState({ checkUsernameBtnState: ButtonState.error, isUsernameAvailable: false });
                }
            }).catch(err => {
                console.log(err);
                this.setState({ checkUsernameBtnState: ButtonState.default, isUsernameAvailable: false });
            });
        }
    }

    getCheckUsernameBtnTooltip = () => {
        switch (this.state.checkUsernameBtnState) {
            case ButtonState.success:
                return nls.nls.registrationForm.usernameAvailableTooltip;
            case ButtonState.error:
                return nls.nls.registrationForm.usernameNotAvailableTooltip;
            default:
                return nls.nls.registrationForm.checkUsernameavailabilityTooltip;
        }
    }

    getCheckUsernameBtnImage = () => {
        switch (this.state.checkUsernameBtnState) {
            case ButtonState.success:
                return "public/eit/Registration/available-user.png";
            case ButtonState.error:
                return "public/eit/Registration/not-available-user.png";
            default:
                return "public/eit/Registration/check-user.png";
        }
    }

    componentWillUnmount() {
        clearTimeout(this.onShowResultMessage);
    }

    render() {
        return (
            <div id="registration" style={{ overflowY: "auto", height: "100%" }}>
                {/* <h3 style={{fontStyle: "italic", fontWeight: 600}}>Регистрация</h3> */}
                <OverlayLoader size={"80px"} show={this.state.loading} />
                <div>
                    <div style={{ textAlign: "center", fontSize: "14.0pt", marginLeft: "5%", marginTop: "5%", fontStyle: "italic", fontWeight: 500, color: "#3498db" }}>{nls.nls.registrationForm.requestingUser}</div>
                    <div className="flex-item flex-scalable vertical-flex-container"
                        style={{ height: "100%", scrollBehavior: "smooth" }}>
                        <div className="flex-item flex-auto">
                            <FloatingLabelInput
                                isRequired={true}
                                requiredMsg={' *'}
                                className="flex-item flex-scalable"
                                placeholder={nls.nls.registrationForm.name}
                                value={this.state.name}
                                maxLength={255}
                                hasError={!!this.state.name}
                                onValueChange={(newValue: InputValueType, hasError: boolean) => { this.onNameInput(newValue as string, hasError) }} />
                            <FloatingLabelInput
                                isRequired={true}
                                requiredMsg={' *'}
                                className="flex-item flex-scalable"
                                placeholder={nls.nls.registrationForm.position}
                                value={this.state.position}
                                maxLength={255}
                                hasError={!!this.state.position}
                                onValueChange={(newValue: InputValueType, hasError: boolean) => { this.onPositionInput(newValue as string, hasError) }} />
                        </div>
                    </div>

                    <div style={{ textAlign: "center", fontSize: "14.0pt", marginLeft: "5%", marginTop: "5%", fontStyle: "italic", fontWeight: 500, color: "#3498db" }}>{nls.nls.registrationForm.organization}</div>
                    <div className="flex-item flex-scalable vertical-flex-container"
                        style={{ height: "100%", scrollBehavior: "smooth" }}>
                        <div className="flex-item flex-auto">
                            <FloatingLabelInput
                                isRequired={true}
                                requiredMsg={' *'}
                                className="flex-item flex-scalable"
                                placeholder={nls.nls.registrationForm.organizationName}
                                value={this.state.organizationName}
                                maxLength={255}
                                hasError={!!this.state.organizationName}
                                onValueChange={(newValue: InputValueType, hasError: boolean) => { this.onOrganizationNameInput(newValue as string, hasError) }} />
                            <FloatingLabelInput
                                isRequired={true}
                                requiredMsg={' *'}
                                className="flex-item flex-scalable"
                                placeholder={nls.nls.registrationForm.organizationId}
                                value={this.state.organizationId}
                                maxLength={255}
                                hasError={!!this.state.organizationId}
                                onValueChange={(newValue: InputValueType, hasError: boolean) => { this.onOrganizationIdInput(newValue as string, hasError) }} />

                            <FloatingLabelInput
                                className="flex-item flex-scalable"
                                placeholder={nls.nls.registrationForm.website}
                                value={this.state.webSite}
                                maxLength={255}
                                onValueChange={(newValue: InputValueType, hasError: boolean) => { this.onWebSiteInput(newValue as string) }} />

                            <FloatingLabelInput
                                isRequired={true}
                                requiredMsg={' *'}
                                className="flex-item flex-scalable"
                                placeholder={nls.nls.registrationForm.organizationType}
                                value={this.state.organizationType}
                                selectorItems={{ ...nls.nls.registrationForm.organizationTypeItems }}
                                hasError={this.state.organizationType !== 0}
                                onValueChange={(newValue: InputValueType, hasError: boolean) => { this.onOrganizationTypeInput(newValue as string | number, hasError) }} />
                        </div>
                    </div>
                    <div style={{ textAlign: "center", fontSize: "14.0pt", marginLeft: "5%", marginTop: "5%", fontStyle: "italic", fontWeight: 500, color: "#3498db" }}>{nls.nls.registrationForm.contactData}</div>
                    <div className="flex-item flex-scalable vertical-flex-container"
                        style={{ height: "100%", scrollBehavior: "smooth" }}>
                        <div className="flex-item flex-auto">
                            <FloatingLabelInput
                                isRequired={true}
                                requiredMsg={' *'}
                                className="flex-item flex-scalable"
                                placeholder={nls.nls.registrationForm.phone}
                                value={this.state.phoneNumber}
                                maxLength={255}
                                pattern={new RegExp(/[0-9]/)}
                                hasError={!!this.state.phoneNumber}
                                onValueChange={(newValue: InputValueType, hasError: boolean) => { this.onPhoneNumberInput(newValue as string, hasError) }} />

                            <FloatingLabelInput
                                isRequired={true}
                                requiredMsg={' *'}
                                pattern={new RegExp('^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$', 'i')}
                                className="flex-item flex-scalable"
                                placeholder={nls.nls.registrationForm.email}
                                value={this.state.email}
                                maxLength={255}
                                hasError={!!this.state.email}
                                onValueChange={(newValue: InputValueType, hasError: boolean) => { this.onEmailInput(newValue as string, hasError) }} />

                            <FloatingLabelInput
                                isRequired={true}
                                requiredMsg={' *'}
                                className="flex-item flex-scalable"
                                placeholder={nls.nls.registrationForm.postAddress}
                                value={this.state.address}
                                maxLength={255}
                                hasError={!!this.state.address}
                                onValueChange={(newValue: InputValueType, hasError: boolean) => { this.onAddressInput(newValue as string, hasError) }} />
                        </div>
                    </div>
                    <div style={{ textAlign: "center", fontSize: "14.0pt", marginLeft: "5%", marginTop: "5%", fontStyle: "italic", fontWeight: 500, color: "#3498db" }}>{nls.nls.registrationForm.createUser}</div>
                    <div className="flex-item flex-scalable vertical-flex-container"
                        style={{ height: "100%", scrollBehavior: "smooth" }}>
                        <div className="flex-item flex-auto">
                            <br />
                            <div className="flex-item flex-auto">
                                <p style={{ fontSize: "85%", textIndent: "1em", marginTop: "2px", marginBottom: "2px" }}>{nls.nls.registrationForm.usernameInfo}</p>
                            </div>
                            <div style={{ display: "flex" }}>
                                <FloatingLabelInput
                                    isRequired={true}
                                    requiredMsg={' *'}
                                    pattern={new RegExp('^[a-zA-Z0-9.@_-]{2,50}$', 'i')}
                                    className="flex-item flex-scalable"
                                    placeholder={nls.nls.registrationForm.userName}
                                    value={this.state.userName}
                                    maxLength={255}
                                    hasError={!!this.state.userName}
                                    onValueChange={(newValue: InputValueType, hasError: boolean) => { this.onUserNameInput(newValue as string, hasError) }} />

                                <button disabled={this.state.showUsernameError || isNullOrUndefined(this.state.userName) || this.state.userName.length === 0}
                                    type="button"
                                    style={{
                                        marginTop: 15,
                                        background: "transparent", border: "none", display: "flex",
                                        cursor: !(this.state.showUsernameError || isNullOrUndefined(this.state.userName) || this.state.userName.length === 0) ? "pointer" : "not-allowed"
                                        , opacity: this.state.showUsernameError || isNullOrUndefined(this.state.userName) || this.state.userName.length === 0 ? 0.5 : 1
                                    }}
                                    title={this.getCheckUsernameBtnTooltip()}
                                    value=""
                                    onClick={this.checkUserNameHandler}>
                                    <div>
                                        <img style={{ height: 25, width: 25 }} src={this.getCheckUsernameBtnImage()} />
                                        <span style={{ color: "red", display: !(this.state.showUsernameError || isNullOrUndefined(this.state.userName) || this.state.userName.length === 0) && this.state.checkUsernameBtnState === ButtonState.default ? "unset" : "none" }}>*</span>
                                    </div>
                                </button>
                            </div>
                            <br />
                            <div className="flex-item flex-auto">
                                <p style={{ fontSize: "85%", textIndent: "1em", marginTop: "2px", marginBottom: "2px" }}>{nls.nls.registrationForm.passwordInfo}</p>
                            </div>
                            <FloatingLabelInput
                                isRequired={true}
                                requiredMsg={' *'}
                                className="flex-item flex-scalable"
                                placeholder={nls.nls.registrationForm.password}
                                value={this.state.password}
                                maxLength={255}
                                type={"password"}
                                pattern={this.getPasswordRegExp(6, true, true, true, true)}
                                hasError={!!this.state.password}
                                onValueChange={(newValue: InputValueType, hasError: boolean) => this.onPasswordInput(newValue as string, hasError)} />
                            <div className={"strength-meter mt-2"}>
                                <div className="strength-meter-fill" data-strength={this.state.strengthLevelIndex}></div> {/* -1...4 */}
                            </div>
                            <FloatingLabelInput
                                isRequired={true}
                                requiredMsg={' *'}
                                className="flex-item flex-scalable"
                                placeholder={nls.nls.registrationForm.repeatPassword}
                                type={"password"}
                                value={this.state.repeatPassword}
                                maxLength={255}
                                hasError={!!this.state.repeatPassword}
                                onValueChange={(newValue: InputValueType, hasError: boolean) => { this.onRepeatPasswordInput(newValue as string) }} />
                        </div>
                    </div>
                </div>
                <div className="flex-item flex-auto"
                    style={{ paddingBottom: "10px", paddingTop: "10px" }}>
                    <button className="appBtn"
                        onClick={() => { this.onClear(undefined) }}
                        style={{ height: "30px", flexGrow: 0, flexBasis: "150px", marginBottom: "10px" }}>
                        <img src="public/eit/Feedback/StartOver32.png" style={{ width: "20px", height: "20px" }} />
                        <span>&nbsp;{nls.nls.feedback.startOver}</span>
                    </button>
                    <button className="appBtn"
                        disabled={!this.isFormValid()}
                        onClick={() => { this.sendNewUser() }}
                        style={{ height: "30px", flexGrow: 0, flexBasis: "150px", marginBottom: "10px" }}>
                        <img src="public/eit/Feedback/Send32.png" style={{ width: "20px", height: "20px" }} />
                        <span>&nbsp;{nls.nls.feedback.sendFeedback}</span>
                    </button>
                    {isNullOrUndefined(this.state.submitSuccess) ?
                        (null) :
                        this.state.submitSuccess ?
                            (<div className="flex-item">
                                <p style={{ color: "green" }}>{nls.nls.registrationForm.createUserOnSuccess}</p>
                            </div>) :
                            (<div className="flex-item">
                                <p style={{ color: "red" }}>{nls.nls.registrationForm.createUserOnError}</p>
                            </div>)
                    }
                </div>
            </div>
        );
    }
}


const mapStateToProps = (state: IEITAppStore) => ({
    userInfo: state.eit.userInfo,
    browserInfo: state.eit.browserInfo
})

export default connect<OwnProps>(mapStateToProps)(Registration);