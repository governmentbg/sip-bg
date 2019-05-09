import * as React from "react";
import { connect } from "react-redux";
import Autocomplete, {
  QueryType, AutocompleteObject
} from "../../core/components/Widgets/Autocomplete";
import QuickSearchButton from "../Widgets/QuickSearchButton";
import { eitAppConfig } from "../../eitAppConfig";
import { IEITAppStore, IUserInfo } from '../../interfaces/reducers/IEITAppStore';
import { nls } from "../nls";
import { isNullOrUndefined } from 'util';
import axios from 'axios';
import { userInfo } from 'os';
import QuickSearchMergeButton from '../Widgets/QuickSearchMergeButton';
import QuickSearchMultiUrlButton from '../Widgets/QuickSearchMultiUrlButton';

interface ParentProps {
}

interface OwnProps {
  userInfo: IUserInfo;
}

interface DispatchProps {
}

type Props = OwnProps & ParentProps & DispatchProps;

class MapTabSearchGroup extends React.Component<
  Props, {}
  > {
  state = {
    geometry: undefined,
    infrastructureTitle: undefined,
    infrastructureTypeId: 0,
    elementTypeTitle: undefined,
    selectedElementTypeId: '',
    keyWord: "",
    organizationTitle: undefined,
    organizationId: 0,
    elementTypes: [],
  };

  handleInfrastructureTypeChange = (el: any): void => {
    const infrastructureTypeId = parseInt(el.target.value);
    this.setState({
      infrastructureTypeId,
      infrastructureTitle: parseInt(el.target.value) === 0 ? undefined : el.target.selectedOptions[0].text,
      selectedElementTypeId: undefined,
      elementTypeTitle: undefined
    });

    if (!this.props.userInfo.isAdmin)
      this.getElementTypes(infrastructureTypeId);
  };


  getElementTypes(infrastructureTypeId: number) {
    if (isNullOrUndefined(infrastructureTypeId) || infrastructureTypeId === 0) this.setState({ elementTypes: [] });

    axios.get(`${eitAppConfig.layers.ElementType}/query`, {
      params: {
        where: `infrastructuretype=${infrastructureTypeId}`,
        outFields: 'id, description',
        f: "json",
        geometryType: "esriGeometryEnvelope",
        returnIdsOnly: false,
        returnCountOnly: false,
        returnGeometry: false
      }
    })
      .then(r => {
        const resultRaw = r.data.features;
        if (resultRaw && resultRaw.length > 0) {
          const result = resultRaw.map((f: any) => { return { ...f.attributes } })
          this.setState({ elementTypes: [{ "id": '0', "description": "-Вид обекти-" }, ...result] });
        }
        else {
          this.setState({ elementTypes: [] });
        }
      })
      .catch(err => { });
  }

  handleElementTypeChange = (el: any): void => {
    const selectedElementTypeId = el.target.value;
    this.setState({ selectedElementTypeId, elementTypeTitle: el.target.value === '0' ? undefined : el.target.selectedOptions[0].text });
  }

  getInfrastructureListItems() {
    const items = [];
    const obj = {
      0: "-Тип инфраструктура-",
      ...nls.nls.importData.infrastructureType
    };

    for (var key in obj) {
      items.push(
        <option key={key} value={key}>
          {obj[key]}
        </option>
      );
    }
    return items;
  }

  autocompleteGeometrySetter(autocompleteResult?: AutocompleteObject): void {
    if (autocompleteResult && autocompleteResult.geometry) {
      this.setState({ geometry: autocompleteResult.geometry as any });
    } else {
      this.setState({ geometry: undefined });
    }
  }

  autocompleteOrganizationSetter(autocompleteResult?: AutocompleteObject): void {
    if (autocompleteResult) {
      this.setState({ organizationId: autocompleteResult.attribute[0].id, organizationTitle: autocompleteResult.attribute[1].name });
    } else {
      this.setState({ organizationId: undefined, organizationTitle: undefined });
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

  constructElementTypeClause = (): string => {
    let elementQuery = "";
    if (this.state.selectedElementTypeId && this.state.selectedElementTypeId !== '0') {
      elementQuery += `elementtypeid='${this.state.selectedElementTypeId}'`;
    }
    return elementQuery;
  }

  constructKeyWordClause = (): string => {
    const keyWordFieldsToSearch = [
      "technicalchar",
      "elementtype",
      "locationdescription",
      "remark",
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

    whereClause = this.concatQueryParams(whereClause, this.constructElementTypeClause());
    whereClause = this.concatQueryParams(whereClause, this.constructOrganizationClause());
    whereClause = this.concatQueryParams(whereClause, this.constructKeyWordClause());

    //console.log(`%c where clause: ${whereClause}`, "color:red; font-size: 15px;")
    return whereClause;
  }

  getSearchLayers(): Array<string> {
    const allLayers = eitAppConfig.infrastructureCodedValues;
    const infrastructureTypeBaseUrl = eitAppConfig.appSpecific.mapServices.TechnicalInfrastructure;
    let subLayers: any[] = [];

    if (!isNullOrUndefined(this.state.infrastructureTypeId) && this.state.infrastructureTypeId !== 0) {
      allLayers.filter(l => l.code === this.state.infrastructureTypeId).forEach(el => {
        el.subLayers.forEach(element => {
          subLayers.push(`${infrastructureTypeBaseUrl}${element.id}`);
        });
      });
    } else {
      allLayers.forEach(el => {
        el.subLayers.forEach(element => {
          subLayers.push(`${infrastructureTypeBaseUrl}${element.id}`);
        });
      });
    }
    return subLayers;
  }

  isDisabled = () => {
    return !!(!this.state.infrastructureTypeId || this.state.infrastructureTypeId == 0);
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
          <div style={{ display: "flex", flexDirection: "row" }}>{nls.nls.ribbon.registry1.searchLabel}</div>
          <div style={{ display: "flex", flexDirection: "row" }}>
            <div style={{ flexDirection: "column" }}>

              <select
                className="autocomplete-input-s"
                onChange={el => this.handleInfrastructureTypeChange(el)}
                style={{ display: "flex", marginTop: 3, marginBottom: 3, marginRight: 5 }}
                title={this.state.infrastructureTitle} >
                {this.getInfrastructureListItems()}
              </select>

              {(!this.props.userInfo.isAdmin && !this.props.userInfo.isRegulator) ?
                <select
                  className="autocomplete-input-s"
                  style={{ width: 170, height: 20 }}
                  onChange={el => this.handleElementTypeChange(el)}
                  title={this.state.elementTypeTitle} >
                  {this.state.elementTypes.map(x => { return <option value={x["id"]} key={x["id"]}>{x["description"]}</option> })}
                </select> :
                <div style={{ width: 170, height: 20 }}>
                  <Autocomplete
                    key="mapTabOrganization"
                    placeholder={nls.nls.ribbon.registry1.searchOrganization}
                    needGeometry={false}
                    containerStyle={{ marginBottom: 5 }}
                    onSelectHandler={(args: any) => this.autocompleteOrganizationSetter(args)}
                    onChangeHandler={() => {
                      this.setState({ organizationId: '' });
                    }}
                    searchLayerInfo={autocompleteOrganizationNameLayer}
                    searchType={QueryType.both}
                    size="S"
                    title={this.state.organizationTitle}
                  />
                </div>}

            </div>

            <div style={{ flexDirection: "column" }}>
              <Autocomplete
                key="mapAdminOrganization"
                placeholder={nls.nls.ribbon.registry1.searchTeritory}
                containerStyle={{ marginRight: 5, marginBottom: 5 }}
                onSelectHandler={(args: any) => this.autocompleteGeometrySetter(args)}
                onChangeHandler={() => {
                  this.setState({ geometry: undefined });
                }}
                searchLayerInfo={autocompleteCADLayers}
                searchType={QueryType.both}
                size="S"
              />
              {/* <Autocomplete
                key="mapTabOrganization"
                placeholder={"организация"}
                containerStyle={{ marginBottom: 5 }}
                onSelectHandler={(args: any) => this.autocompleteOrganizationSetter(args)}
                onChangeHandler={() => {
                  this.setState({ organizationId: '' });
                }}
                searchLayerInfo={autocompleteOrganizationNameLayer}
                searchType={QueryType.both}
                size="S"
                title={this.state.organizationTitle}
              /> */}
              <input type="text"
                className="autocomplete-input-s"
                placeholder={nls.nls.ribbon.registry1.searchKeyWords}
                value={this.state.keyWord}
                onChange={this.handleKeyWordChange}
              />
            </div>
            <div style={{ flexDirection: "column" }}>
              <QuickSearchMultiUrlButton
                serviceUrls={this.getSearchLayers()}
                title={""}
                searchWhere={this.getWhereClause()}
                imageUrl={"public/eit/Ribbon/Search32.png"}
                searchType={"custom"}
                tooltip={""}
                geometry={this.state.geometry}
                size={"S"}
                disabled={this.isDisabled()}
              />
            </div>
          </div>
        </div>

        <div style={{ borderLeft: "3px solid #cbeffc" }} />
        <div style={{ flexDirection: "column" }}>
          <QuickSearchMultiUrlButton
            serviceUrls={this.getSearchLayers()}
            imageUrl="public/eit/Ribbon/SearchOnMap32.png"
            searchType="map"
            title={nls.nls.ribbon.registry1.searchOnMap}
            //tableTitle={nls.nls.ribbon.registry1.searchAllTableTitle}
            tooltip={nls.nls.ribbon.registry1.searchOnMapTooltip}
            vertical={true}
            disabled={this.isDisabled()}
          />
        </div>
      </React.Fragment>
    );
  }
}


const mapStateToProps = (state: IEITAppStore) => ({
  userInfo: state.eit.userInfo
})

export default connect<OwnProps, DispatchProps, ParentProps>(mapStateToProps, {})(MapTabSearchGroup);

