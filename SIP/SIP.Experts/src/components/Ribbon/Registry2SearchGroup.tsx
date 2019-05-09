import * as React from "react";
import Autocomplete, {
  QueryType, AutocompleteObject
} from "../../core/components/Widgets/Autocomplete";
import QuickSearchButton from "../Widgets/QuickSearchButton";
import { eitAppConfig } from "../../eitAppConfig";
export interface Registry2SearchGroupProps { }
import { nls } from "../nls";
export interface Registry2SearchGroupState { }
import * as Datetime from "react-datetime";
import { isNullOrUndefined } from 'util';

class Registry2SearchGroup extends React.Component<
  Registry2SearchGroupProps,
  Registry2SearchGroupState
  > {
  state = {
    keyWord: '',
    organizationId: '',
    dateFrom: '',
    dateTo: ''
  }


  autocompleteOrganizationSetter(autocompleteResult?: AutocompleteObject): void {
    if (autocompleteResult) {
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
      "locationdescription",
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
      datePeriodClause += ` (publicationdate BETWEEN date '${this.state.dateFrom}' AND date '${this.state.dateTo}')`;
      // datePeriodClause += ` (rightdateentry BETWEEN timestamp '${this.state.dateFrom}' AND timestamp '${this.state.dateTo}')`;
      // datePeriodClause += " AND ";
      // datePeriodClause += ` (rightenddate BETWEEN timestamp '${this.state.dateFrom}' AND timestamp '${this.state.dateTo}')`;

    } else if (this.state.dateFrom) {
      datePeriodClause += ` (publicationdate >= date '${this.state.dateFrom}')`;
      // datePeriodClause += ` (rightdateentry >= timestamp '${this.state.dateFrom}')`;
      // datePeriodClause += " AND ";
      // datePeriodClause += ` (rightenddate >= timestamp '${this.state.dateFrom}')`;

    } else if (this.state.dateTo) {
      datePeriodClause += ` (publicationdate <= date '${this.state.dateTo}')`;
      // datePeriodClause += ` (rightdateentry <= timestamp '${this.state.dateTo}')`;
      // datePeriodClause += " AND ";
      // datePeriodClause += ` (rightenddate <= timestamp '${this.state.dateTo}')`;

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
    whereClause = this.concatQueryParams(whereClause, this.constructKeyWordClause());
    whereClause = this.concatQueryParams(whereClause, this.constructTimePeriodClause());

    //console.log(`%c where clause: ${whereClause}`, "color:red; font-size: 15px;")
    return whereClause;
  }

  isDisabled(): boolean {
    let res =
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
      return date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " 00:00:00"
    }
    return date;
  }
  formatDateEndString(date: Date) {
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
        returnFields: "id,name",
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
          <div style={{ display: "flex", flexDirection: "row" }}>{"Търсене по:"}</div>
          <div style={{ display: "flex", flexDirection: "row" }}>
            <div style={{ flexDirection: "column" }}>
              <Autocomplete
                key="r2Organization"
                placeholder={"организация"}
                needGeometry={false}
                containerStyle={{ marginRight: 5, marginBottom: 5 }}
                onSelectHandler={(args: any) => this.autocompleteOrganizationSetter(args)}
                onChangeHandler={() => {
                  this.setState({ organizationId: '' });
                }}
                searchLayerInfo={autocompleteOrganizationNameLayer}
                searchType={QueryType.both}
                size="S"
              />
              <Datetime
                locale={eitAppConfig.locale}

                inputProps={{
                  placeholder: "начало на периода",
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

              <input type="text"
                className="autocomplete-input-s"
                placeholder="ключова дума"
                value={this.state.keyWord}
                onChange={this.handleKeyWordChange}
              />
              <Datetime
                locale={eitAppConfig.locale}
                inputProps={{
                  placeholder: "край на периода",
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
              <QuickSearchButton
                serviceUrl={eitAppConfig.layers.Register2ServiceUrl}
                title={""}
                tableTitle={"Резултати от търсенето"}
                imageUrl={'public/eit/Ribbon/Search32.png'}
                searchType={"all"}
                searchWhere={this.getWhereClause()}
                tooltip={""}
                disabled={this.isDisabled()}
                size={"S"}
              />
            </div>
          </div>
        </div>
        <div style={{ display: "flex" }}>


          <div style={{ borderLeft: "3px solid #cbeffc", height: "100%" }}></div>
          <QuickSearchButton
            serviceUrl={eitAppConfig.layers.Register2ServiceUrl}
            imageUrl="public/eit/Ribbon/SearchAll32.png"
            searchType="all"
            title={nls.nls.ribbon.registry2.searchAll}
            tableTitle={nls.nls.ribbon.registry2.searchAllTableTitle}
            tooltip={nls.nls.ribbon.registry2.searchAllTooltip}
            vertical={true} />
        </div>
      </React.Fragment>
    );
  }
}

export default Registry2SearchGroup;
