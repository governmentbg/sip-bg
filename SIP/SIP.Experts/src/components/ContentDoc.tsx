import * as React from 'react'
import { eitAppConfig } from '../eitAppConfig';
import FloatingLabelInput from './Widgets/FloatingLabelInput';
import { nls } from './nls';
import { isNullOrUndefined } from 'util';
import { Moment } from 'moment';
import OverlayLoader from '../core/components/Loading/OverlayLoading';
import request = require('esri/request');

interface State {
    keyWords: string,
    isMetadataPresent: boolean,
    showResult: boolean,
    revisionDate?: Moment,
    loading: boolean;
    isError: boolean;
}

interface Props {

}

export default class ContentDoc extends React.Component<Props, State> {

    constructor(props: Props) {
        super(props);

        this.state = {
            keyWords: "",
            isMetadataPresent: false,
            showResult: false,
            loading: false,
            isError: false
        }
    }

    onValueChange = (newValue: string | Moment, fieldHasError: boolean, type: string): void => {
        if (type == "date") {
            this.setState({
                ...this.state,
                revisionDate: newValue as Moment
            });
        } else {
            this.setState({
                ...this.state,
                keyWords: newValue as string,
                showResult: false,
            });
        }
    }

    formatDate(date: Moment | undefined) {
        if (date) {
            let d = new Date((date as Moment).valueOf());
            if (d && String(d) !== 'Invalid Date')
                return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
        }
        return undefined;
    }


    concatQueryParams(whereClause: string, newQueryParam: string) {
        if (newQueryParam && whereClause && newQueryParam.trim() !== '') {

            if (whereClause.trim() !== '') {
                whereClause += ` AND (${newQueryParam}) `
            }
            else {
                whereClause += ` ${newQueryParam} `
            }
        }
        return whereClause;
    }

    constructKeyWordClause = (): string => {
        const keyWordFieldsToSearch = [
            "keywords",
            "networkoperatorname",
        ];

        let kewWordQuery = "";
        if (this.state.keyWords && this.state.keyWords.trim() !== "") {

            for (let index = 0; index < keyWordFieldsToSearch.length; index++) {
                const element = keyWordFieldsToSearch[index];
                kewWordQuery += "(' '" + " ||concat(UPPER(" + element + ")," + "' ')" + " LIKE " + "'%" + this.state.keyWords.toUpperCase() + "%')";

                if (index < keyWordFieldsToSearch.length - 1) kewWordQuery += " OR ";
            }

        }
        return kewWordQuery;
    }

    constructTimePeriodClause = (): string => {
        let revisionDateClause = "";

        if (this.state.revisionDate) {
            let formatedDate = this.formatDate(this.state.revisionDate!);
            if (formatedDate)
                revisionDateClause += ` (revisiondate = timestamp '${formatedDate}')`;
        }

        return revisionDateClause
    }

    getWhereClause(): string {
        let whereClause = "1=1";

        whereClause = this.concatQueryParams(whereClause, this.constructKeyWordClause());
        whereClause = this.concatQueryParams(whereClause, this.constructTimePeriodClause());

        return whereClause;
    }

    handleSearch = () => {
        this.setState({
            ...this.state,
            loading: true,
            showResult: false,
            isMetadataPresent: false,
            isError: false,
        });
        request(eitAppConfig.layers.MetadataService + "/query", {
            query: {
                f: "json",
                where: this.getWhereClause(),
                outFields: ["*"],
                returnGeometry: false,
                returnCountOnly: true
            }
        })
            .then(({ data }) => {
                this.setState({
                    ...this.state,
                    isMetadataPresent: (data && data.count && data.count > 0),
                    showResult: true,
                    loading: false,
                })
            }).catch(e => {
                this.onError();
            })
    }

    onError = () => {
        this.setState({ ...this.state, isError: true, loading: false });
    }

    isFormInvalid = () => {
        return (isNullOrUndefined(this.state.keyWords) || this.state.keyWords.trim() == "") &&
            (isNullOrUndefined(this.state.revisionDate) || isNullOrUndefined(this.formatDate(this.state.revisionDate)))
    }

    render() {
        return (
            <div className="vertical-flex-container Bulletin"
                style={{ height: "100%" }}>
                <OverlayLoader size="60px" show={this.state.loading} />
                <div className="flex-item flex-auto horizontal-wrapping-flex-container">

                    <div className="flex-item flex-scalable vertical-flex-container" style={{ justifyContent: "center", minWidth: "100%" }}>
                        <FloatingLabelInput
                            type={"text"}
                            placeholder={nls.nls.openData.metadata.keyWords}
                            value={this.state.keyWords}
                            onValueChange={(newValue: string, hasError: boolean) => this.onValueChange(newValue, hasError, "text")}
                        />
                        <FloatingLabelInput
                            type={"date"}
                            placeholder={nls.nls.openData.metadata.revisionDate}
                            value={this.state.revisionDate}
                            closeOnSelect={true}
                            onValueChange={(newValue: string | Moment, hasError: boolean) => this.onValueChange(newValue, hasError, "date")}
                        />
                    </div>
                    <div className="flex-item flex-scalable vertical-flex-container" style={{ justifyContent: "center", minWidth: "100%" }}>
                        <button className="appBtn flex-item"
                            disabled={this.isFormInvalid()}
                            onClick={this.handleSearch}
                            style={{ minWidth: "150px", width: "97%", maxHeight: "30px", marginTop: "10px" }}>
                            <span>{nls.nls.openData.metadata.buttonSearch}</span>
                        </button>
                    </div>
                    <div className="flex-item flex-scalable vertical-flex-container">
                        {(this.state.showResult) ?
                            ((this.state.isMetadataPresent) ?
                                <p style={{ textIndent: "1em", marginTop: "5px", color: "green" }}>{nls.nls.openData.metadata.metadataPresent}</p>
                                : <p style={{ textIndent: "1em", marginTop: "5px", color: "red" }}>{nls.nls.openData.metadata.metadataNotPresent}</p>)
                            : (null)}
                        {this.state.isError ? <div className="flex-item" style={{ marginTop: 15 }}>
                            <p style={{ color: "red" }}>{nls.nls.openData.metadata.searchError}</p>
                        </div> : null}
                    </div>
                </div>
            </div>
        );
    }
}
