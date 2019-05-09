import * as React from "react";
import Autocomplete, {
  QueryType, AutocompleteObject
} from "../../core/components/Widgets/Autocomplete";
import QuickSearchButton from "../Widgets/QuickSearchButton";
import { eitAppConfig } from "../../eitAppConfig";
import * as Datetime from "react-datetime";
import { nls } from "../nls";
import { isNullOrUndefined } from 'util';

export interface Registry1SearchGroupProps { }

export interface Registry1SearchGroupState { }

class Registry1SearchGroup extends React.Component<
  Registry1SearchGroupProps,
  Registry1SearchGroupState
  > {
  state = {
    geometry: undefined,
    keyWord: '',
    organizationId: '',
    dateFrom: '',
    dateTo: ''
  };
  autocompleteGeometrySetter(autocompleteResult?: AutocompleteObject): void {
    if ( autocompleteResult && autocompleteResult.geometry) {
      this.setState({ geometry: autocompleteResult.geometry as any });
    } else {
      this.setState({ geometry: undefined });
    }
  }

  autocompleteOrganizationSetter(autocompleteResult?: AutocompleteObject): void {
    if ( autocompleteResult) {
      this.setState({ organizationId: autocompleteResult.attribute[0].id });
    } else {
      this.setState({ organizationId: undefined });
    }
  }

  handleKeyWordChange = (evn: any) => {
    this.setState({ keyWord: evn.target.value });
  };


  constructOrganizationClause = (): string => {
    let organizationQuery = "";
    if (this.state.organizationId) {
      organizationQuery += `networkoperatorid='${this.state.organizationId}'`;
    }
    return organizationQuery;
  }

  constructKeyWordClause = (): string => {
    const keyWordFieldsToSearch = [
      "elementtype",
      "technicalchar",
      "activityname",
      "constructiontype",
      "company",
      "infrastructuretypes"
    ];

    let kewWordQuery = "";
    if (this.state.keyWord && this.state.keyWord.trim() !== "") {

      for (let index = 0; index < keyWordFieldsToSearch.length; index++) {
        const element = keyWordFieldsToSearch[index];
        kewWordQuery += "(' '" + " ||concat(UPPER(" + element + ")," + "' ')" + " LIKE " + "'%" + this.state.keyWord.toUpperCase() + "%')";

        if (index < keyWordFieldsToSearch.length - 1) kewWordQuery += " OR ";
      }

    }
    return kewWordQuery;
  }

  constructTimePeriodClause = (): string => {
    let datePeriodClause = "";

    if (this.state.dateFrom && this.state.dateTo) {

      datePeriodClause += ` (activitystartdate BETWEEN timestamp '${this.state.dateFrom}' AND timestamp '${this.state.dateTo}')`;
      datePeriodClause += " AND ";
      datePeriodClause += ` (activityenddate BETWEEN timestamp '${this.state.dateFrom}' AND timestamp '${this.state.dateTo}')`;

    } else if (this.state.dateFrom) {

      datePeriodClause += ` (activitystartdate >= timestamp '${this.state.dateFrom}')`;
      datePeriodClause += " AND ";
      datePeriodClause += ` (activityenddate >= timestamp '${this.state.dateFrom}')`;

    } else if (this.state.dateTo) {

      datePeriodClause += ` (activitystartdate <= timestamp '${this.state.dateTo}')`;
      datePeriodClause += " AND ";
      datePeriodClause += ` (activityenddate <= timestamp '${this.state.dateTo}')`;

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
    let whereClause = "plannedactivitystatus=1";

    whereClause = this.concatQueryParams(whereClause, this.constructOrganizationClause());
    whereClause = this.concatQueryParams(whereClause, this.constructKeyWordClause());
    whereClause = this.concatQueryParams(whereClause, this.constructTimePeriodClause());

    //console.log(`%c where clause: ${whereClause}`, "color:red; font-size: 15px;")
    return whereClause;
  }

  isDisabled(): boolean {
    let res = isNullOrUndefined(this.state.geometry) &&
      (isNullOrUndefined(this.state.keyWord) || this.state.keyWord.trim() === '') &&
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
        return  date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " 00:00:00"
    }
    return date;
}
 formatDateEndString(date:Date) {
    return date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " 23:59:59"
}

  render() {
    let autocompleteCADLayers = {
      [eitAppConfig.layers.Landscapes]: {
        alias: "Землища",
        searchField: "searchdata",
        returnFields: "name",
        displayPattern: "{name}"
      },
      [eitAppConfig.layers.Municipalities]: {
        alias: "Общини",
        searchField: "searchdata",
        returnFields: "name",
        displayPattern: "{name}"
      }
    };

    let autocompleteOrganizationNameLayer = {
      [eitAppConfig.layers.RegistersOrganizations]: {
        alias: "Организации",
        searchField: "name",
        returnFields: "id,identificationcode,name",
        displayPattern: "{name}"
      }
    };

    return (
      <React.Fragment>
        <div
          style={{
            display: "block",
            // justifyContent: "space-between",
            flexWrap: "wrap",
            //alignItems: "center",
            flexDirection: "row",
            //maxWidth: 530
          }}
        >
          <div style={{ display: "flex", flexDirection: "row" }}>{nls.nls.ribbon.registry1.searchLabel}</div>
          <div style={{ display: "flex", flexDirection: "row" }}>
            <div style={{ flexDirection: "column" }}>
              <Autocomplete
                key="r1Organization"
                needGeometry={false}
                placeholder={nls.nls.ribbon.registry1.searchOrganization}
                containerStyle={{ marginRight: 5, marginBottom: 5 }}
                onSelectHandler={(args: any) =>
                  this.autocompleteOrganizationSetter(args)
                }
                onChangeHandler = {()=>{
                  this.setState({organizationId : ''});
                }}
                searchLayerInfo={autocompleteOrganizationNameLayer}
                searchType={QueryType.both}
                size="S"
              />
              <Datetime
                locale={eitAppConfig.locale}
                inputProps={{
                  placeholder: `${nls.nls.ribbon.registry1.searchStartPeriod}`,
                  className: "autocomplete-input-s",
                }}
                timeFormat={false}
                closeOnSelect={true}
                onChange={e => {
                  this.handleDateFromChange((!e || typeof e == "string" || !e.isValid()) ? undefined : this.formatDateStartString(e.toDate()))
                }}
              />

            </div>

            <div style={{ flexDirection: "column" }}>
              <Autocomplete
                key="r1AdminOrganization"
                placeholder={nls.nls.ribbon.registry1.searchTeritory}
                containerStyle={{ marginRight: 5, marginBottom: 5 }}
                onSelectHandler={(args: any) => this.autocompleteGeometrySetter(args)}
                onChangeHandler = {()=>{
                  this.setState({geometry : undefined});
                }}
                searchLayerInfo={autocompleteCADLayers}
                searchType={QueryType.both}
                size="S"
              />
              <Datetime
                locale={eitAppConfig.locale}
                inputProps={{
                  placeholder: `${nls.nls.ribbon.registry1.searchEndPeriod}`,
                  className: "autocomplete-input-s"
                }}
                timeFormat={false}
                closeOnSelect={true}
                onChange={e => {
                  this.handleDateToChange((!e || typeof e == "string" || !e.isValid()) ? undefined : this.formatDateEndString(e.toDate()))
                }}
              />
            </div>

            <div style={{ flexDirection: "column" }}>
              <input
                type="text"
                className="autocomplete-input-s"
                placeholder={nls.nls.ribbon.registry1.searchKeyWords}
                value={this.state.keyWord}
                onChange={this.handleKeyWordChange}
              />
            </div>
            <div style={{ flexDirection: "column" }}>
              <QuickSearchButton
                serviceUrl={eitAppConfig.layers.Register1ServiceUrl}
                title={""}
                tableTitle={nls.nls.ribbon.registry1.searchTableTitle}
                imageUrl={"public/eit/Ribbon/Search32.png"}
                searchType={"custom"}
                searchWhere={this.getWhereClause()}
                tooltip={""}
                size={"S"}
                geometry={this.state.geometry}
                disabled={this.isDisabled()}
              /></div>
          </div>
        </div>
        <div style={{ display: "flex" }}>


          <div style={{ borderLeft: "3px solid #cbeffc", height: "100%" }} />
          <QuickSearchButton
            serviceUrl={eitAppConfig.layers.Register1ServiceUrl}
            imageUrl="public/eit/Ribbon/SearchAll32.png"
            searchType="all"
            searchWhere="plannedactivitystatus=1"
            title={nls.nls.ribbon.registry1.searchAll}
            tableTitle={nls.nls.ribbon.registry1.searchAllTableTitle}
            tooltip={nls.nls.ribbon.registry1.searchAllTooltip}
            vertical={true}
          />
          <QuickSearchButton
            serviceUrl={eitAppConfig.layers.Register1ServiceUrl}
            imageUrl="public/eit/Ribbon/SearchOnMap32.png"
            searchType="map"
            searchWhere="plannedactivitystatus=1"
            title={nls.nls.ribbon.registry1.searchOnMap}
            tableTitle={nls.nls.ribbon.registry1.searchOnMapTableTitle}
            tooltip={nls.nls.ribbon.registry1.searchOnMap}
            vertical={true}
          />

        </div>
      </React.Fragment>
    );
  }

}

export default Registry1SearchGroup;
