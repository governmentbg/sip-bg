import * as React from "react";
import { connect } from 'react-redux';
import { nls } from "../nls";
import { eitAppConfig } from "../../eitAppConfig";
import { IEITAppStore, IUserInfo } from "../../interfaces/reducers/IEITAppStore";
import OverlayLoader from "../../core/components/Loading/OverlayLoading";
import "./BulletinCSS.scss"
import request = require('esri/request');
import axios from 'axios';

interface OwnProps {
    userInfo: IUserInfo;
}

interface DispatchProps {

}

type Props = DispatchProps & OwnProps;

interface State {
    loading: boolean;
    newsSubscribed?: boolean;
    announcementSubscribed?: boolean;
    error?: string;
    saveChangesSuccess?: boolean;
    notifyEveryday?: boolean;
}

class Bulletin extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            loading: true
        }
    }

    componentDidMount() {
        this.loadDefaultState(false)
    }

    loadDefaultState = (afterChanges: boolean): void => {
        if (!afterChanges) {
            request(eitAppConfig.layers.Users + "/query", {
                query:  {
                    f: "json",
                    where: `id='${this.props.userInfo.user.id}'`,
                    outFields: ["newssubscribtion, jointusageregistersubscribtion, notificationperiod"],
                    resultRecordCount: 1,
                    returnGeometry: false
                }
            }).then(result => {
                if (result.data && result.data.features && result.data.features.length > 0) {
                    let {newssubscribtion, jointusageregistersubscribtion, notificationperiod} = result.data.features[0].attributes;       
                    this.setState({
                        ...this.state,
                        loading: false,
                        error: '',
                        newsSubscribed: newssubscribtion,
                        announcementSubscribed: jointusageregistersubscribtion,
                        notifyEveryday: notificationperiod === 1 ? true : false,
                        saveChangesSuccess: afterChanges
                    })
                }
                else {
                    throw Error('User not found')
                }
            }).catch(e => {
                this.onError();
            })
        }
        else {
            this.setState({
                ...this.state,
                loading: false,
                error: '',
                newsSubscribed: !!(this.state.newsSubscribed || 0),
                announcementSubscribed: !!(this.state.announcementSubscribed || 0),
                notifyEveryday: this.state.notifyEveryday,
                saveChangesSuccess: afterChanges
            })
        }
    }

    onError = () => {
        this.setState({ ...this.state, error: nls.nls.bulletin.submitFailure, saveChangesSuccess: false, loading: false });
    }

    getCheckboxees = (): JSX.Element => {
        return (
            <React.Fragment>
                <div>{nls.nls.bulletin.typeSelect}</div>
                <div className="checkboxContainer">
                    <label>
                        <input type="checkbox" onChange={() => {
                            this.setState({ ...this.state, newsSubscribed: !this.state.newsSubscribed })
                        }} checked={!!this.state.newsSubscribed} />
                        {nls.nls.bulletin.news}
                    </label>
                </div>
                <div className="checkboxContainer">
                    <label>
                        <input type="checkbox" onChange={() => {
                            this.setState({ ...this.state, announcementSubscribed: !this.state.announcementSubscribed })
                        }} checked={!!this.state.announcementSubscribed} />
                        {nls.nls.bulletin.announcements}
                    </label>
                </div>
                <br />
                <br />
                <div>{nls.nls.bulletin.periodSelect}</div>
                <div className="checkboxContainer">
                    <label>
                        <input type="radio" name="notificationPeriod" onChange={() => {
                            this.setState({ ...this.state, notifyEveryday: !this.state.notifyEveryday })
                        }} checked={!!this.state.notifyEveryday} />
                        {nls.nls.bulletin.day}
                    </label>
                </div>
                <div className="checkboxContainer">
                    <label>
                        <input type="radio" name="notificationPeriod" onChange={() => {
                            this.setState({ ...this.state, notifyEveryday: !this.state.notifyEveryday })
                        }} checked={!this.state.notifyEveryday} />
                        {nls.nls.bulletin.week}
                    </label>
                </div>
                <br />
            </React.Fragment>
        )
    }

    isFormValid = () => {
        return !!this.props.userInfo.user.email;
    }

    handleSaveChanges = () => {
        this.setState({
            ...this.state,
            loading: true,
            error: ""
        });
        axios.post(eitAppConfig.BulletinServiceUrl, {
            // "http://localhost:55489/api/public/Bulletin",{
            username: this.props.userInfo.username,
            objectid: this.props.userInfo.user.objectid,
            newssubscribtion: this.state.newsSubscribed ? 1 : 0,
            jointusageregistersubscribtion: this.state.announcementSubscribed ? 1 : 0,
            notificationperiod: this.state.notifyEveryday ? 1 : 2,
            token: this.props.userInfo.token,
            referer: window.location.origin
        },
            {
                headers: {
                    'Content-Type': 'application/json;charset=UTF-8',
                    "Access-Control-Allow-Origin": "*",
                }
            }).then(result => {
                this.loadDefaultState(true);
            })
            .catch(e => {  
                this.onError();
            })
    }

    render() {
        if (!this.props.userInfo.username) {
            return (
                <div>
                    {nls.nls.bulletin.pleaseLogin}
                </div>
            )
        }
        return (
            <div className="vertical-flex-container Bulletin"
                style={{ height: "100%" }}>
                <OverlayLoader size="60px" show={this.state.loading} />
                <div className="flex-item flex-auto">
                    <p style={{ textIndent: "1em", marginTop: "2px", marginBottom: "2px" }}>{nls.nls.bulletin.promptText}<b>{(this.props.userInfo!.user && this.props.userInfo!.user.autorizedpersonname) || this.props.userInfo!.username}</b></p>
                    <p style={{ textIndent: "1em", marginTop: "2px", marginBottom: "2px" }}>{nls.nls.bulletin.sendToText}<b>{this.props.userInfo!.user.email}</b></p>
                </div>
                <br />
                <br />
                <div className="flex-item flex-scalable ">
                    {this.getCheckboxees()}

                    <div className="flex-item flex-scalable vertical-flex-container" >
                        <button className="appBtn flex-item"
                            disabled={!this.isFormValid()}
                            onClick={this.handleSaveChanges}
                            style={{ minWidth: "150px", width: "97%", maxHeight: "30px", marginTop: "10px" }}>
                            <span>{nls.nls.bulletin.saveChanges}</span>
                        </button>
                    </div>

                    {this.state.saveChangesSuccess ?
                        <div className="flex-item" style={{marginTop:15}}>
                            <p style={{ color: "green" }}>{nls.nls.bulletin.submitSuccess}</p>
                        </div>
                        :
                        null}
                    {this.state.error ? <div className="flex-item" style={{marginTop:15}}>
                        <p style={{ color: "red" }}>{nls.nls.bulletin.submitFailure}</p>
                    </div> : null}
                </div>
            </div>
        )
    }
}

const mapStateToProps = (state: IEITAppStore) => ({
    userInfo: state.eit.userInfo
})

export default connect<OwnProps, DispatchProps, {}>(mapStateToProps, {})(Bulletin);