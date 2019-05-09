import * as React from 'react';
import Autocomplete, {
    QueryType, AutocompleteObject
} from "../../core/components/Widgets/Autocomplete";
import { eitAppConfig } from "../../eitAppConfig";
import { IGeometry } from "../../core/interfaces/models";
import Geometry = require("esri/geometry/Geometry");
import { IMapDispatcher, IMosaicLayoutDispatcher } from "../../core/interfaces/dispatchers";
import { connect } from 'react-redux';
import { mapDispatcher, mosaicLayoutDispatcher } from '../../core/actions/dispatchers';
import { Polygon } from 'esri/geometry';

export interface AdminSearchOnMapProps {

}

export interface AdminSearchOnMapState {

}

class AdminSearchOnMap extends React.Component<AdminSearchOnMapProps & IMapDispatcher & IMosaicLayoutDispatcher, AdminSearchOnMapState> {
    constructor(props: AdminSearchOnMapProps & IMapDispatcher & IMosaicLayoutDispatcher) {
        super(props);

    }
    autocompleteGeometrySetter(args: any): void {
        if (args) {
            this.props.zoomTo([args.geometry]);
        }
    }
    render() {
        let autocompleteCADLayers = {
            [eitAppConfig.layers.OutlineOfSettlements]: {
                alias: "Населени места",
                searchField: "searchdata",
                returnFields: "name,munname",
                displayPattern: "{name} (общ. {munname})"
            },
        };
        return (

            <div style={{ zIndex: 3, position: "relative", display: "flex" }}>
                <Autocomplete
                    key="adminSearch"
                    placeholder={"населено място"}
                    containerStyle={{ boxShadow: "0 1px 2px rgba(0, 0, 0, 0.3)", maxWidth: 300 }}
                    inputStyle={{ maxWidth: 300 }}
                    resultListContainerStyle={{ minWidth: 207 }}
                    onSelectHandler={(args: any) => this.autocompleteGeometrySetter(args)}
                    searchLayerInfo={autocompleteCADLayers}
                    searchType={QueryType.both}
                    size="M"
                    maxRecords={5}
                />
            </div>
        );
    }
}

export default connect<AdminSearchOnMapProps, IMapDispatcher & IMosaicLayoutDispatcher>(null, { ...mapDispatcher, ...mosaicLayoutDispatcher })(AdminSearchOnMap);