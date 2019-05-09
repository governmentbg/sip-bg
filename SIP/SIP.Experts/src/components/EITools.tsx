import * as React from 'react'
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import LayerListView from "../core/components/Esri/Widgets/LayerListView";
import LegendView from "../core/components/Esri/Widgets/LegendView";
import Print from '../core/components/Esri/Widgets/Print';
import { nls } from "./nls";
import { connect } from 'react-redux';
import { ITabsDispatcher } from "../core/interfaces/dispatchers/ITabsDispatcher";
import { tabsDispatcher } from "../core/actions/common/dispatchers/tabs";
import { IAppStore } from '../core/interfaces/reducers/IAppStore';

interface OwnProps {
    selectedTab: number;
}
interface DispatchProps extends ITabsDispatcher {
}
type Props = OwnProps & DispatchProps;

// interface State {
// tabIndex: number
// }


class EITools extends React.Component<Props> {

    constructor(props: Props) {
        super(props);
    }

    hide() {
        let esriPrint = document.getElementsByClassName('esri-print__layout-tab-list')[0]
        if (esriPrint) {
            (esriPrint as any).style.display = 'none';
        }
    }
    render() {
        return (
            <Tabs selectedIndex={this.props.selectedTab} onSelect={(tabIndex) => {
                this.props.changeIndex(tabIndex);
            }}>
                <TabList>
                    <Tab>{nls.nls.widgetTitles.legend}</Tab>
                    <Tab>{nls.nls.widgetTitles.layers}</Tab>
                    <Tab>{nls.nls.widgetTitles.print}</Tab>
                </TabList>
                <TabPanel forceRender={true}>
                    <LegendView />
                </TabPanel>
                <TabPanel forceRender={true}>
                    <LayerListView />
                </TabPanel>
                <TabPanel forceRender={true}>
                    <Print />
                    {this.hide()}
                </TabPanel>
            </Tabs>
        )
    }
}

const mapStateToProps = (state: IAppStore) => {
    return ({
        selectedTab: state.tabs.index
    })
}


export default connect<OwnProps, ITabsDispatcher>(mapStateToProps, { ...tabsDispatcher })(EITools);
