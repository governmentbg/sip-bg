import FeatureTable from "../../core/components/AttributeTable/FeatureTable";
import { FinalState, RowInfo, Column } from "react-table";
import DetailView from "../DetailView/DetailView";
import * as React from "react";
import { eitAppConfig } from "../../eitAppConfig";
import ServicePreviewButton from "../DetailView/ServicePreviewButton";

export default class EITFeatureTable extends FeatureTable {
    protected attachDetailViewProperties(tableProps: Partial<FinalState>) {
		tableProps.SubComponent = (row: RowInfo) => {
			return (
				<div>
					<DetailView graphic={row.original} layerInfo={this.layerInfo} />
				</div>
			);
		}
    }

    protected getTableProperties() {
        let tableProps = super.getTableProperties();
        if (this.hasServicePreviewButton()) {
            tableProps.columns!.splice(0, 0, this.getServicePreviewButton())
        }

        return tableProps;
    }

    protected hasServicePreviewButton(): boolean {
        return this.layerInfo.url == eitAppConfig.layers.MergedServiceRegister;
    }

    protected getServicePreviewControl(): (cellInfo: any) => JSX.Element {
        return (cellInfo: any) =>
            <ServicePreviewButton cellInfo={cellInfo}/>
    }

    protected getServicePreviewButton(): Column {
        return {
            Header: "",
            id: "$requestPreview",
            accessor: "ServicePreview",
            Cell: this.getServicePreviewControl(),
            width: 35,
            filterable: false,
            sortable: false,
            resizable: false,
        }
    }

	render(){
		return (
			super.render()
		)
	}
}