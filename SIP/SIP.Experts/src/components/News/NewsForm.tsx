import * as React from "react";
import { connect } from "react-redux";
import { IEITAppStore, IUserInfo } from "../../interfaces/reducers/IEITAppStore";
import { nls } from "../nls";
import FloatingLabelInput, { InputValueType } from '../Widgets/FloatingLabelInput';
import { eitAppConfig } from "../../eitAppConfig";
import OverlayLoader from '../../core/components/Loading/OverlayLoading';

import axios from "axios";
import { isNullOrUndefined } from 'util';
import { appConfig } from '../../core/appConfig';
import Graphic = require('esri/Graphic');
import { IGraphic, IFeatureLayerInfo } from '../../core/interfaces/models';
import { getLayerInfos } from '../../core/reducers/layerInfos';
import { featureLayersAPI } from '../../core/actions/helpers';

enum FieldNames {
    title = "title",
    body = "body",
    titleEn = "titleEn",
    bodyEn = "bodyEn",
}

interface Props {
    token: string;
    onSuccess: () => void;
    onCancel: () => void;
}

interface State {
    loading: boolean;
    title: string;
    body: string;
    titleEn: string;
    bodyEn: string;
    isError: boolean;
    isResult: boolean;
}

class NewsForm extends React.Component<Props, State>{
    constructor(props: Props) {
        super(props);
        this.state = {
            loading: false,
            title: '',
            body: '',
            titleEn: '',
            bodyEn: '',
            isError: false,
            isResult: false
        }
    }
    onValueChange = (newValue: string, fieldName: string): void => {
        this.setState({
            ...this.state,
            [fieldName]: newValue as string,
        });
    }


    isFormInvalid = () => {
        return (isNullOrUndefined(this.state.title) || this.state.title.trim() == "") ||
            (isNullOrUndefined(this.state.body) || this.state.body.trim() == "")
    }

    render() {
        return (
            <div style={{ position: "relative" }}>
                <OverlayLoader size="60px" show={this.state.loading} />
                <div>
                    <table style={{ width: "100%" }}>
                        <tbody>
                            <tr>
                                <td>{nls.nls.news.newsTitle}</td>
                                <td><input className="form-control"
                                    value={this.state.title}
                                    onChange={(el) => this.onValueChange(el.target.value, FieldNames.title)} /></td>
                            </tr>
                            <tr>
                                <td>{nls.nls.news.newsBody}</td>
                                <td ><textarea rows={4} cols={50} style={{ maxHeight: 250, minHeight: 50 }} className="form-control"
                                    value={this.state.body}
                                    onChange={(el) => this.onValueChange(el.target.value, FieldNames.body)} /></td>
                            </tr>
                            <tr>
                                <td colSpan={2}>
                                    <hr style={{ width: "100%" }} />
                                </td>
                            </tr>
                            <tr>
                                <td>{nls.nls.news.newsTitleEn}</td>
                                <td><input className="form-control"
                                    value={this.state.titleEn}
                                    onChange={(el) => this.onValueChange(el.target.value, FieldNames.titleEn)} /></td>
                            </tr>
                            <tr>
                                <td>{nls.nls.news.newsBodyEn}</td>
                                <td ><textarea rows={4} cols={50} style={{ maxHeight: 250, minHeight: 50 }} className="form-control"
                                    value={this.state.bodyEn}
                                    onChange={(el) => this.onValueChange(el.target.value, FieldNames.bodyEn)} /></td>
                            </tr>
                        </tbody>
                    </table>
                    {this.getButtons()}
                </div>
                {this.state.isResult ?
                    this.state.isError ?
                        <div style={{ width: "100%", fontSize: "17px", color: "red", marginTop: 5, backgroundColor: "#3h3h3h" }}>
                            {nls.nls.news.saveError}
                        </div> :

                        <div style={{ width: "100%", fontSize: "17px", color: "green", marginTop: 5, backgroundColor: "#3h3h3h" }}>
                            {nls.nls.news.saveSuccees}
                        </div>
                    : null}
            </div>
        )
    }

    getButtons() {
        return (
            <div style={{ display: "flex" }}>
                <button
                    className="appBtn margin"
                    disabled={this.isFormInvalid()}
                    onClick={() => {
                        this.addNews();
                    }}>{nls.nls.news.save}</button>
                <button className="appBtn margin" onClick={() => {
                    this.props.onCancel();
                }}>{nls.nls.news.cancel}</button>
            </div>
        )
    }

    formatDate(date: Date) {
        if (date) {
            return date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate();
        }
        return undefined;
    }

    getNewsGraphic = (): IGraphic => {
        let graphic: Graphic;
        graphic = new Graphic({
            attributes: {
                title: this.state.title,
                body: this.state.body,
                title_en: this.state.titleEn,
                body_en: this.state.bodyEn,
                publishdate: this.formatDate(new Date()) || '',
                newsstatus: 1
            }
        });
        return graphic;
    }

    clearForm = () => {
        this.setState({ ...this.state, title: '', body: '' });
    }

    addNews = () => {
        this.setState({ ...this.state, loading: true, isError: false, isResult: false });

        const newsFeatureLayerInfo: IFeatureLayerInfo = getLayerInfos()[eitAppConfig.layers.NewsFeature];
        let feature = this.getNewsGraphic();
        featureLayersAPI.applyEdits(newsFeatureLayerInfo, [feature])
            .then(result => {
                let isSucceeded = result.addResults && result.addResults[0].success;
                this.setState({ ...this.state, loading: false, isError: !isSucceeded, isResult: true })
                if (isSucceeded) {
                    this.clearForm();
                    this.props.onSuccess();
                }
            })
            .catch(e => {
                this.setState({ ...this.state, loading: false, isError: true, isResult: true })
            })
    }
}

export default NewsForm;