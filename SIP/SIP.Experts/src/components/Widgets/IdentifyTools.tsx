import * as React from "react";
import { DrawType } from "../../core/enums/DrawType";
import { nls } from "../nls";
import QuickSearchMapTool from "../Widgets/QuickSearchMapTool";
import { eitAppConfig } from "../../eitAppConfig";

export interface Props {
    sizeOfButtons?: "L" | "M" | "S";
    vertical?: boolean;
}

export interface State {

}

class IdentifyTools extends React.Component<Props, State> {
    render() {
        return (
            <div style={{ flexDirection: this.props.vertical? "row":"column", display: "flex", flexGrow: 1 }}>
                <QuickSearchMapTool
                    serviceUrl={eitAppConfig.layers.Register1ServiceUrl}
                    imageUrl="public/eit/Ribbon/IdentifyByRectangle32.png"
                    drawType={DrawType.Rectangle}
                    //searchWhere="plannedactivitystatus=1"
                    title={nls.nls.ribbon.registry1.searchIdentifyRectagle}
                    tooltip={nls.nls.ribbon.registry1.searchIdentifyRectagleTooltip}
                    vertical={this.props.vertical? true: false}
                    size={this.props.sizeOfButtons ||  "M"}
                     />
                      <div style={{marginTop:-10}}></div>
                <QuickSearchMapTool
                    serviceUrl={eitAppConfig.layers.Register1ServiceUrl}
                    imageUrl="public/eit/Ribbon/IdentifyByPolygon32.png"
                    drawType={DrawType.Polygon}
                    //searchWhere="plannedactivitystatus=1"
                    title={nls.nls.ribbon.registry1.searchIdentifyPolygon}
                    tooltip={nls.nls.ribbon.registry1.searchIdentifyPolygonTooltip}
                    vertical={this.props.vertical? true: false}
                    size={this.props.sizeOfButtons ||  "M"} 
                    />
            </div>
        );
    }
}

export default IdentifyTools;