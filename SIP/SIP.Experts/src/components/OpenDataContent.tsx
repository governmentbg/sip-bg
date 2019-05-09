import * as React from 'react'
import { eitAppConfig } from "../eitAppConfig";
import { IEITAppStore, IUserInfo } from '../interfaces/reducers/IEITAppStore';
import { nls } from "./nls";

export default class OpenDataContent extends React.Component {
    handleClick = (el: any): void => {
        el.stopPropagation();
        el.preventDefault();
        window.open(el.currentTarget.text, "_blank");
    }

    render() {
        return (
            <div style={{ padding: 20, overflow: "auto", height: "100%"}}>
                <h5>{nls.nls.openData.openData.title}</h5>
                <ol>
                    <li>
                    {nls.nls.openData.openData.register1}
                         <p style={{ wordBreak: "break-all" }}>
                            <a href={nls.nls.openData.openData.register1}  onClick={this.handleClick}>
                                {`${eitAppConfig.layers.Register1ServiceUrl}/query?where=plannedactivitystatus%3D1&text=&objectIds=&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&relationParam=&outFields=*&returnGeometry=true&returnTrueCurves=false&maxAllowableOffset=&geometryPrecision=&outSR=&having=&returnIdsOnly=false&returnCountOnly=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&returnZ=false&returnM=false&gdbVersion=&historicMoment=&returnDistinctValues=false&resultOffset=&resultRecordCount=&queryByDistance=&returnExtentOnly=false&datumTransformation=&parameterValues=&rangeValues=&quantizationParameters=&f=pjson`}
                            </a>
                        </p>
                    </li>
                    <li>
                    {nls.nls.openData.openData.register2}
                     <p style={{ wordBreak: "break-all" }}>
                            <a href={nls.nls.openData.openData.register2} onClick={this.handleClick}>
                                {`${eitAppConfig.layers.Register2ServiceUrl}/query?where=1%3D1&text=&objectIds=&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&relationParam=&outFields=*&returnGeometry=true&returnTrueCurves=false&maxAllowableOffset=&geometryPrecision=&outSR=&having=&returnIdsOnly=false&returnCountOnly=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&returnZ=false&returnM=false&gdbVersion=&historicMoment=&returnDistinctValues=false&resultOffset=&resultRecordCount=&queryByDistance=&returnExtentOnly=false&datumTransformation=&parameterValues=&rangeValues=&quantizationParameters=&f=pjson`}
                            </a>
                        </p>
                    </li>
                </ol>
            </div>
        )
    }
}
