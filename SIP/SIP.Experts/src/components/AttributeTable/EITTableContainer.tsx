import { TableContainer, mapStateToProps, OwnProps, DispatchProps, ParentProps, TabWrap } from "../../core/components/AttributeTable/TableContainer";
import Collapsible from "../../core/components/Widgets/Collapsible/Collapsible";
import { FinalState } from 'react-table';
import { connect } from 'react-redux';
import PaginationLite from '../../core/components/AttributeTable/Paginations/PaginationLite';
import SimpleLoading from '../../core/components/AttributeTable/Loading/SimpleLoading';
import { errorDispatcher, tableDispatcher, mapDispatcher } from "../../core/actions/dispatchers";
import * as React from "react";
import { getLayerInfos } from "../../core/reducers/layerInfos";

import ZoomTo from "../../core/components/AttributeTable/Paginations/Tools/ZoomTo";
import ToggleWatchMap from "../../core/components/AttributeTable/Paginations/Tools/ToggleWatchMap";
import ExportXml from "../../core/components/AttributeTable/Paginations/Tools/ExportXml";
import { FeatureTableInfo } from '../../core/models/FeatureTableInfo';
import EITFeatureTable from "./EITFeatureTable";
import { nls } from "../nls";
import { TabPanel, Tabs, TabList } from 'react-tabs';

interface EITParentProps extends ParentProps {
	alwaysShowTabTitle: boolean;
}
class EITTableContainer extends TableContainer {

    componentDidMount() {
        if (this.props.tabInfo[Object.keys(this.props.tabInfo)[0]]) {
            let key = this.props.tabInfo[Object.keys(this.props.tabInfo)[0]].id;
            this.props.setSelected(key);
        }
    }
    componentWillReceiveProps(props: ParentProps) {
        if (this.props.tabInfo[Object.keys(this.props.tabInfo)[0]]) {
            let key = this.props.tabInfo[Object.keys(this.props.tabInfo)[0]].id;
            this.props.setSelected(key);
        }
    }

	protected renderTabs() {
		if(!(this.props as any).alwaysShowTabTitle && Object.keys(this.props.tabInfo).length == 1){
			let key = this.props.tabInfo[Object.keys(this.props.tabInfo)[0]].id;
			return <EITFeatureTable
				{...this.getFeatureTableProps(key)} key={key}
				reactTableProps={{...this.getFeatureTableComponents(1, this.props.tabInfo[key])}} >
			</EITFeatureTable>
		}
		return super.renderTabs()
	}
}

export default connect<OwnProps, DispatchProps, EITParentProps>(mapStateToProps, {...errorDispatcher, ...tableDispatcher, ...mapDispatcher})(EITTableContainer)