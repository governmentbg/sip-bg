import * as React from 'react';
import RibbonPanel from './RibbonPanel';
import RibbonGroup from "./RibbonGroup";
import Autocomplete, {
    QueryType, AutocompleteObject
} from "../../core/components/Widgets/Autocomplete";
import QuickSearchButton from "../Widgets/QuickSearchButton";
import { eitAppConfig } from "../../eitAppConfig";
import * as Datetime from "react-datetime";
import { nls } from "../nls";
import FloatingLabelInput, { InputValueType } from '../Widgets/FloatingLabelInput';
import axios from "axios";
import 'bootstrap/dist/css/bootstrap.css'
import RibbonButton from './RibbonButton';

import '../../css/app.scss'
import { isNullOrUndefined } from 'util';
export interface SystemLogsTabProps {
    mobile: boolean;
}

export interface SystemLogsTabState {
    userid: string;
    organizationId: string;
    dateFrom: string;
    dateTo: string;
}

class SystemLogsTab extends React.Component<SystemLogsTabProps, SystemLogsTabState> {

    constructor(props: SystemLogsTabProps) {
        super(props);
        this.state = { userid: '', organizationId: '', dateFrom: '', dateTo: '' }
    }
    autocompleteOrganizationSetter(autocompleteResult?: AutocompleteObject): void {
        if (autocompleteResult) {
            this.setState({ organizationId: autocompleteResult.attribute[0].id });
        } else {
            this.setState({ organizationId: '' });
        }
    }

    autocompleteUsernameSetter(autocompleteResult?: AutocompleteObject): void {
        if (autocompleteResult) {
            this.setState({ userid: autocompleteResult.attribute[0].id });
        } else {
            this.setState({ userid: '' });
        }
    }


    constructOrganizationClause = (): string => {
        let organizationQuery = "";
        if (this.state.organizationId) {
            organizationQuery += `organizationid='${this.state.organizationId}'`;
        }
        return organizationQuery;
    }

    constructUsernameClause = (): string => {
        let usernameQuery = "";
        if (this.state.userid) {
            usernameQuery += `userid = '${this.state.userid}'`;
        }
        return usernameQuery;
    }

    constructTimePeriodClause = (): string => {
        let datePeriodClause = "";

        if (this.state.dateFrom && this.state.dateTo) {
            datePeriodClause += ` (activitytime BETWEEN timestamp '${this.state.dateFrom}' AND timestamp '${this.state.dateTo}')`;
        } else if (this.state.dateFrom) {
            datePeriodClause += ` (activitytime >= timestamp '${this.state.dateFrom}')`;
        } else if (this.state.dateTo) {
            datePeriodClause += ` (activitytime <= timestamp '${this.state.dateTo}')`;
        }

        return datePeriodClause
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

    getWhereClause(): string {
        let whereClause = "1=1";

        whereClause = this.concatQueryParams(whereClause, this.constructOrganizationClause());
        whereClause = this.concatQueryParams(whereClause, this.constructUsernameClause());
        whereClause = this.concatQueryParams(whereClause, this.constructTimePeriodClause());

        return whereClause;
    }

    isDisabled(): boolean {
        let res = (isNullOrUndefined(this.state.userid) || this.state.userid.trim() === '') &&
            (isNullOrUndefined(this.state.organizationId) || this.state.organizationId.trim() === '') &&
            (isNullOrUndefined(this.state.dateFrom) || this.state.dateFrom.trim() === '') &&
            (isNullOrUndefined(this.state.dateTo) || this.state.dateTo.trim() === '');

        return res;
    }

    handleDateFromChange(dateFrom: any): any {
        this.setState({ dateFrom });
    }

    handleDateToChange(dateTo: any): any {
        this.setState({ dateTo });
    }

    formatDateStartString(date: Date) {
        if (date) {
            return date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " 00:00:00"
        }
        return date;
    }

    formatDateEndString(date: Date) {
        return date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " 23:59:59"
    }

    resetForm = () => {
        this.setState({ userid: '', organizationId: '', dateFrom: '', dateTo: '' });
    }

    render() {
        let autocompleteOrganizationNameLayer = {
            [eitAppConfig.layers.RegistersOrganizations]: {
                alias: "Организации",
                searchField: "name",
                returnFields: "id,identificationcode,name",
                displayPattern: "{name}"
            }
        };

        let autocompleteUsersLayer = {
            [eitAppConfig.layers.Users]: {
                alias: "Потребители",
                searchField: "autorizedpersonname",
                returnFields: "id,autorizedpersonname,username",
                displayPattern: "{autorizedpersonname}({username})"
            }
        };

        const style = {
            display: "block",
            width: "200px",
            padding: "0.375rem 0.75rem",
            fontSize: "0.8rem",
            lineHeight: "1.5",
            color: "#495057",
            backgroundColor: "#fff",
            backgroundClip: "padding-box",
            border: "1px solid #afc8e1",
            borderRadius: "0.25rem",
            transition: "border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out",
            height: "30px",
            marginTop: "5px"
        }

        return (
            <RibbonPanel>
                <RibbonGroup groupName="Филтри" mobile={this.props.mobile}>

                    <div className="form-row" style={{ width: "100%", display: "flex", marginLeft: 10, position: "relative" }} >
                        <div><label style={{ textTransform: "uppercase", position: "fixed" }}>Филтриране по:</label>
                            <hr style={{ backgroundColor: "cyan", width: 500, position: "fixed", marginBottom: 10 }} />
                            <hr style={{ backgroundColor: "cyan", width: 470, position: "fixed", marginTop: 23 }} />
                            <hr style={{ backgroundColor: "cyan", width: 440, position: "fixed", marginTop: 26 }} />
                        </div>
                        <div style={{ display: "flex", bottom: 0, position: "absolute" }}>
                            <Datetime
                                locale={eitAppConfig.locale}
                                inputProps={{
                                    placeholder: "- Дата от -",
                                    style: { ...style, marginBottom: 3, height: "30px" },
                                    className: "custom-placeholder",
                                    title: "Дата на действието след тази дата"
                                }}
                                closeOnSelect={true}
                                timeFormat={false}
                                onChange={e => {
                                    this.handleDateFromChange((!e || typeof e == "string" || !e.isValid()) ? undefined : this.formatDateStartString(e.toDate()))
                                }}
                            />

                            <Datetime
                                locale={eitAppConfig.locale}
                                inputProps={{
                                    placeholder: "- Дата до -",
                                    style: { ...style, height: "30px", marginLeft: 5 },
                                    className: "custom-placeholder",
                                    title: "Дата на действието преди тази дата"
                                }}
                                closeOnSelect={true}
                                timeFormat={false}
                                onChange={e => {
                                    this.handleDateToChange((!e || typeof e == "string" || !e.isValid()) ? undefined : this.formatDateEndString(e.toDate()))
                                }}
                            />

                            {/* <input type="text"
                                className="custom-placeholder"
                                placeholder="- Потребител -"
                                style={{ ...style, marginBottom: 3, marginLeft: 5 }}
                                title="Потребителско име"
                                onChange={(e) => {
                                    this.setState({ username: e.target.value })
                                }}
                            /> */}
                              <Autocomplete
                                key="slUsers"
                                needGeometry={false}
                                placeholder={"- Потребител -"}
                                title={"Име или фамилия на потребителя"}
                                containerStyle={{ marginRight: 5, }}
                                onSelectHandler={(args: any) =>
                                    this.autocompleteUsernameSetter(args)
                                }
                                onChangeHandler={() => {
                                    this.setState({ userid: '' });
                                }}
                                searchLayerInfo={autocompleteUsersLayer}
                                searchType={QueryType.both}
                                size="M"
                                labelStyle={{ display: "none" }}
                                inputStyle={{ fontSize: "0.8rem", marginLeft: 5, marginTop: 5, width: 200, maxWidth: 200, padding: "0.375rem 0.75rem" }}
                                resultListContainerStyle={{marginLeft: 5, width: 200, maxWidth: 200}}
                            />

                            <Autocomplete
                                key="slOrganization"
                                needGeometry={false}
                                placeholder={"- Oрганизация -"}
                                title={"Име на организация"}
                                containerStyle={{ marginRight: 5, }}
                                onSelectHandler={(args: any) =>
                                    this.autocompleteOrganizationSetter(args)
                                }
                                onChangeHandler={() => {
                                    this.setState({ organizationId: '' });
                                }}
                                searchLayerInfo={autocompleteOrganizationNameLayer}
                                searchType={QueryType.both}
                                size="M"
                                labelStyle={{ display: "none" }}
                                inputStyle={{ fontSize: "0.8rem", marginLeft: 35, marginTop: 5, width: 200, maxWidth: 200, padding: "0.375rem 0.75rem" }}
                                resultListContainerStyle={{marginLeft: 35, width: 200, maxWidth: 200}}
                            />
                            <div style={{ marginLeft: 55 }}>
                                <QuickSearchButton
                                    vertical={false}
                                    serviceUrl={eitAppConfig.layers.SystemLog}
                                    tableTitle={"Системен журнал"}
                                    imageUrl="public/eit/Ribbon/Search32.png"
                                    searchType={"all"}
                                    searchWhere={this.getWhereClause()}
                                    orderByFields={['objectid desc']}
                                    tooltip={"Търсене в системния журнал"}
                                    size={"S"} />
                            </div>
                        </div>
                    </div>
                </RibbonGroup>
            </RibbonPanel>
        );
    }
}

export default SystemLogsTab;