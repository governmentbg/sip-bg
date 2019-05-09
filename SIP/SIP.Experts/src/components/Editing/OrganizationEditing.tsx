import * as React from "react";
import { connect } from "react-redux";
import { IFeatureLayerInfo, IGraphic, IGeometry } from '../../core/interfaces/models';
import { editsDispatcher, mapDispatcher } from "../../core/actions/dispatchers";
import { IEditsDispatcher, IMapDispatcher } from "../../core/interfaces/dispatchers";
import { DrawType } from "../../core/enums/DrawType";
import * as Datetime from "react-datetime";
import { eitAppConfig } from '../../eitAppConfig';
import { featureLayersAPI } from "../../core/actions/esri/helpers/featureLayersAPI";
import OverlayLoader from '../../core/components/Loading/OverlayLoading';
import { nls } from "../nls";
import GeometryService = require("esri/tasks/GeometryService");
import { appConfig } from '../../core/appConfig';
import BufferParameters = require("esri/tasks/support/BufferParameters");
import SpatialReference = require('esri/geometry/SpatialReference');
import { IEITAppStore } from '../../interfaces/reducers/IEITAppStore';
import Collapsible from '../../core/components/Widgets/Collapsible/Collapsible';
import { createNewGraphic } from "../../core/actions/helpers";
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';


export interface ParentProps {
    detailViewClassName: string;
}
export interface OwnProps {
    editingOrganization?: IGraphic;
    layerInfos: { [key: string]: IFeatureLayerInfo };
}

export interface DispatchProps extends IEditsDispatcher, IMapDispatcher {

}

type Props = OwnProps & DispatchProps & ParentProps;

export interface State {
    editingOrganization?: IGraphic;
    originalOrganization?: IGraphic;
    editingZone?: IGraphic;
    originalZone?: IGraphic;
    loading: boolean;
    errorMessage?: string;
    successMessage?: string;
    organizationHidden?: boolean;
    zoneHidden?: boolean;
    hyperlinksHidden?: boolean;
    hyperlinks?: Array<IGraphic>;
    hyperlinksToDelete: Array<IGraphic>;
    hyperlinksToAdd: Array<IGraphic>;

    termHypToAdd?: IGraphic;
    right20HypToAdd?: IGraphic;
    networkHypToAdd?: IGraphic;
    infrastructureHypToAdd?: IGraphic;
    tariffsHypToAdd?: IGraphic;
    powersHypToAdd?: IGraphic;
    proceduresHypToAdd?: IGraphic;

    // hyperlinkToAdd?: IGraphic;
}

export class OrganizationEditing extends React.Component<Props, State> {
    zoneLayerInfoId: string;
    organizationLayerInfoId: string;
    hyperlinksId: string;
    geometryService: GeometryService;

    constructor(props: Props) {
        super(props);
        this.organizationLayerInfoId = eitAppConfig.layers.OrganizationFeature0;
        this.zoneLayerInfoId = eitAppConfig.layers.OrganizationFeature1;
        this.hyperlinksId = eitAppConfig.layers.OrganizationHyperlinks;
        if (props.editingOrganization && props.layerInfos[this.zoneLayerInfoId] && props.layerInfos[this.hyperlinksId]) {
            this.state = { loading: true, hyperlinksToAdd: [], hyperlinksToDelete: [] }
        }
        else {
            this.state = { loading: false, hyperlinksToAdd: [], hyperlinksToDelete: [] }
        }
        this.triggetOpenCollapsible = this.triggetOpenCollapsible.bind(this);
    }

    componentDidMount() {
        if (this.props.editingOrganization && this.props.layerInfos[this.zoneLayerInfoId] && this.props.layerInfos[this.hyperlinksId]) {
            this.loadDependencies(this.props.editingOrganization, this.props.layerInfos[this.zoneLayerInfoId], this.props.layerInfos[this.hyperlinksId]);
        }
    }

    loadDependencies = (organization: IGraphic, zoneLayerInfo: IFeatureLayerInfo, hyperlinksLayerInfo: IFeatureLayerInfo) => {
        let proceduresHypToAdd = this.createNewHyperlink(hyperlinksLayerInfo, 1);
        let powersHypToAdd = this.createNewHyperlink(hyperlinksLayerInfo, 2);
        let tariffsHypToAdd = this.createNewHyperlink(hyperlinksLayerInfo, 3);
        let infrastructureHypToAdd = this.createNewHyperlink(hyperlinksLayerInfo, 4);
        let networkHypToAdd = this.createNewHyperlink(hyperlinksLayerInfo, 5);
        let right20HypToAdd = this.createNewHyperlink(hyperlinksLayerInfo, 6);
        let termHypToAdd = this.createNewHyperlink(hyperlinksLayerInfo, 7);
        this.setState({ ...this.state, loading: true, errorMessage: "", proceduresHypToAdd, powersHypToAdd, tariffsHypToAdd, infrastructureHypToAdd, networkHypToAdd, right20HypToAdd, termHypToAdd })
        featureLayersAPI.execute(zoneLayerInfo, {
            where: `organizationid = '${organization.attributes["id"]}'`,
            outFields: ["*"],
            returnGeometry: true
        }).then(results => {
            featureLayersAPI.execute(hyperlinksLayerInfo, {
                where: `organizationid = '${organization.attributes["id"]}'`,
                outFields: ["*"]
            })
                .then(hyperlinks => {
                    let originalOrganization = { ...organization, attributes: { ...organization.attributes }, geometry: organization.geometry }
                    let originalZone: IGraphic | undefined;
                    if(results.length > 0){
                        originalZone = { ...results[0], attributes: { ...results[0].attributes }, geometry: results[0].geometry }
                    }
                    this.setState({
                        ...this.state,
                        loading: false,
                        editingOrganization: organization,
                        editingZone: results[0],
                        originalOrganization: originalOrganization,
                        originalZone: originalZone,
                        hyperlinks: hyperlinks,
                        errorMessage: ""
                    })
                    this.redrawGraphics([organization, results[0]])
                })
                .catch(e => {
                    console.error(e);
                    this.setState({ ...this.state, loading: false })
                })
        }).catch(e => {
            console.error(e);
            this.setState({ ...this.state, loading: false })
        })
    }

    updateGraphicValue = (fieldName: string, value: React.ReactText, layerInfo: IFeatureLayerInfo, graphic: IGraphic) => {
        if (layerInfo.url == this.organizationLayerInfoId && this.state.editingOrganization) {
            this.setState({ ...this.state, editingOrganization: { ...this.state.editingOrganization, attributes: { ...this.state.editingOrganization.attributes, [fieldName]: value } } });
        }
        else if (layerInfo.url == this.zoneLayerInfoId && this.state.editingZone) {
            this.setState({ ...this.state, editingZone: { ...this.state.editingZone, attributes: { ...this.state.editingZone.attributes, [fieldName]: value } } });
        }
        else if (layerInfo.url == this.hyperlinksId) {
            let type = graphic.attributes["hyperlinktype"];
            let newState = { ...this.state }
            switch (type) {
                case 1:
                    newState.proceduresHypToAdd = { ...this.state.proceduresHypToAdd!, attributes: { ...this.state.proceduresHypToAdd!.attributes, [fieldName]: value } }
                    break;
                case 2:
                    newState.powersHypToAdd = { ...this.state.powersHypToAdd!, attributes: { ...this.state.powersHypToAdd!.attributes, [fieldName]: value } }
                    break;
                case 3:
                    newState.tariffsHypToAdd = { ...this.state.tariffsHypToAdd!, attributes: { ...this.state.tariffsHypToAdd!.attributes, [fieldName]: value } }
                    break;
                case 4:
                    newState.infrastructureHypToAdd = { ...this.state.infrastructureHypToAdd!, attributes: { ...this.state.infrastructureHypToAdd!.attributes, [fieldName]: value } }
                    break;
                case 5:
                    newState.networkHypToAdd = { ...this.state.networkHypToAdd!, attributes: { ...this.state.networkHypToAdd!.attributes, [fieldName]: value } }
                    break;
                case 6:
                    newState.right20HypToAdd = { ...this.state.right20HypToAdd!, attributes: { ...this.state.right20HypToAdd!.attributes, [fieldName]: value } }
                    break;
                case 7:
                    newState.termHypToAdd = { ...this.state.termHypToAdd!, attributes: { ...this.state.termHypToAdd!.attributes, [fieldName]: value } }
                    break;
            }

            this.setState(newState)
        }
    }

    updateGraphicGeometry = (fieldName: string, value: React.ReactText) => {
        if (this.state.editingOrganization) {
            this.setState({ ...this.state, editingOrganization: { ...this.state.editingOrganization, attributes: { ...this.state.editingOrganization.attributes, [fieldName]: value } } });
        }
    }

    getDateEditingControl = (fieldName: string, value: React.ReactText, layerInfo: IFeatureLayerInfo, graphic: IGraphic): JSX.Element => {
        let stringValue: any = "";
        if (value) {
            stringValue = new Date(value)
        }

        return <Datetime
            locale={eitAppConfig.locale}
            value={stringValue}
            inputProps={{
                placeholder: nls.nls.singleEditor.chooseDate,
                style: { width: "100%" }
            }}
            timeFormat={false}
            onChange={e => {
                this.updateGraphicValue(fieldName, (!e || typeof e == "string" || !e.isValid()) ? "" : e.valueOf(), layerInfo, graphic)
            }}
        />

    }

    getStringEditingControl = (fieldName: string, value: React.ReactText, layerInfo: IFeatureLayerInfo, graphic: IGraphic, maxLength?: number): JSX.Element => {
        if (maxLength && maxLength > 255) {
            return <textarea rows={6} style={{ width: "100%", resize: "none" }} value={value} onChange={(e) => {
                this.updateGraphicValue(fieldName, e.target.value, layerInfo, graphic)
            }} />
        }
        else {
            return <input style={{ width: "100%" }} value={value} onChange={(e) => {
                this.updateGraphicValue(fieldName, e.target.value, layerInfo, graphic)
            }} />
        }
    }

    getDomainOptions = (codedValues: Array<{ name: string; code: React.ReactText }>, value: React.ReactText) => {
        let options: Array<JSX.Element> = [
            <option style={{ width: "100%" }} key={"a1b2c3d4"} value="">{nls.nls.singleEditor.choose}</option>
        ];
        codedValues.forEach((cv, i) => {
            options.push(<option key={i} value={cv.code} >{cv.name}</option>)
        })

        return options;
    }

    getDomainEditingControl = (fieldName: string, value: React.ReactText, codedValues: Array<{ name: string; code: React.ReactText }>, layerInfo: IFeatureLayerInfo, graphic: IGraphic): JSX.Element => {
        return <select style={{ width: "100%" }} value={value} onChange={(e) => {
            this.updateGraphicValue(fieldName, e.target.value, layerInfo, graphic)
        }}>
            {this.getDomainOptions(codedValues, value)}
        </select>
    }

    getEditingControl = (fieldName: string, graphic: IGraphic, layerInfo: IFeatureLayerInfo): JSX.Element => {
        let fieldInfo = layerInfo.popupInfo.fieldInfos[fieldName]
        let type = fieldInfo.type;
        let currentValue: React.ReactText = graphic.attributes[fieldName] || "";
        if (!!fieldInfo.domain && (fieldName == "organizationtype" || fieldName == "organizationstatus")) {
            let stringValue: string = "";
            fieldInfo.domain.codedValues.forEach((cv, i) => {
                if (cv.code == currentValue) {
                    stringValue = cv.name;
                }
            });
            return <div style={{ position: "relative", height: "50px" }}>
                <div style={{ position: "absolute", left: "0", right: "0", top: "0", bottom: "0" }}>
                    <input style={{ width: "100%" }} disabled={true} value={stringValue} />
                </div>
            </div>
        }
        if (fieldInfo.domain && fieldInfo.domain.codedValues) {
            return this.getDomainEditingControl(fieldName, currentValue, fieldInfo.domain.codedValues, layerInfo, graphic)
        }
        switch (type) {
            case "date":
                return this.getDateEditingControl(fieldName, currentValue, layerInfo, graphic);
            default:
                return this.getStringEditingControl(fieldName, currentValue, layerInfo, graphic, fieldInfo.length);
        }
    }

    renderFeatures = (layerInfo: IFeatureLayerInfo, graphic?: IGraphic): Array<JSX.Element> => {
        let fields: Array<JSX.Element> = [];
        if(!graphic){
            return [];
        }
        if (layerInfo.url != this.hyperlinksId) {
            for (let key in layerInfo.popupInfo.fieldInfos) {
                if (layerInfo.popupInfo.fieldInfos[key].editable && layerInfo.popupInfo.fieldInfos[key].visible) {
                    fields.push(<tr key={key}>
                        <td style={{ width: "50%" }}>{layerInfo.popupInfo.fieldInfos[key].label}</td>
                        <td style={{ textAlign: "right", width: "50%" }}><b>{this.getEditingControl(key, graphic, layerInfo)}</b></td>
                    </tr>)
                }
            }
        }
        else {
            fields.push(
                <tr key={1}><td><input style={{ width: "100%" }} value={graphic.attributes["name"]} onChange={(e) => {
                    this.updateGraphicValue("name", e.target.value, layerInfo, graphic)
                }} placeholder={layerInfo.popupInfo.fieldInfos["name"].label} /></td></tr>,
                <tr key={2}><td><textarea rows={5} style={{ width: "100%", resize: "none" }} value={graphic.attributes["hyperlinkurl"]} onChange={(e) => {
                    this.updateGraphicValue("hyperlinkurl", e.target.value, layerInfo, graphic)
                }} placeholder={layerInfo.popupInfo.fieldInfos["hyperlinkurl"].label} /></td></tr>
                ,
                <tr key={3}><td><textarea rows={5} style={{ width: "100%", resize: "none" }} value={graphic.attributes["description"]} onChange={(e) => {
                    this.updateGraphicValue("description", e.target.value, layerInfo, graphic)
                }} placeholder={layerInfo.popupInfo.fieldInfos["description"].label} /></td></tr>
            )
        }


        return fields;
    }

    renderTable = (fields: Array<JSX.Element>): JSX.Element => {
        return (
            <table style={{ width: "100%" }}>
                <tbody>
                    {fields}
                </tbody>
            </table>

        )
    }

    renderButtons = (): JSX.Element => {
        return <div style={{ display: "flex" }}>
            <button className="appBtn margin" onClick={this.cancel}>{nls.nls.singleEditor.cancel}</button>
            <button className="appBtn margin" onClick={this.save}>{nls.nls.singleEditor.save}</button>
        </div>
    }

    getDrawType = (layerInfo: IFeatureLayerInfo) => {
        let geometryType = layerInfo.getGeometryType();
        if (geometryType == "point") {
            return DrawType.Point;
        }
        else if (geometryType == "polyline") {
            return DrawType.Polyline;
        }
        else {
            return DrawType.Polygon;
        }
    }

    componentWillUnmount() {
        this.props.unMark()
    }

    setNewGeometry = (geometry: IGeometry, editingGraphic: IGraphic, layerInfo: IFeatureLayerInfo) => {
        if (layerInfo.url == this.organizationLayerInfoId) {
            let graphic = { ...editingGraphic, geometry: geometry, attributes: editingGraphic.attributes }
            this.setState({ ...this.state, editingOrganization: graphic })
            this.redrawGraphics([graphic, this.state.editingZone])
        }
        else {
            let graphic = { ...editingGraphic, geometry: geometry, attributes: editingGraphic.attributes }
            this.setState({ ...this.state, editingZone: graphic })
            this.redrawGraphics([graphic, this.state.editingOrganization!])
        }
    }

    getGeometrySetterControls = (layerInfo: IFeatureLayerInfo, graphic?: IGraphic): JSX.Element => {
        let drawType = this.getDrawType(layerInfo);
        if(!graphic){
            return <div></div>
        }
        return layerInfo.isTable ? <div></div> :
            <div style={{marginBottom: "20px"}}>
                <br /><br />
                <div style={{ marginTop: "20px", marginBottom: "20px", fontSize: " 16px", lineHeight: "22px", fontWeight: "bold" }}>{nls.nls.singleEditor.editLocation}</div>
                {/* <div>{nls.nls.singleEditor.byDrawing}</div> */}
                <Tabs>
                    <TabList>
                        <Tab className={"coordinates-tabs__tab"} selectedClassName={"coordinates-tabs__tab--selected"} disabledClassName={"coordinates-tabs__tab--disabled"}>
                            <span title={nls.nls.singleEditor.byDrawing}>{nls.nls.singleEditor.byDrawing}</span>
                        </Tab>
                        <Tab className={"coordinates-tabs__tab"} selectedClassName={"coordinates-tabs__tab--selected"} disabledClassName={"coordinates-tabs__tab--disabled"}>
                            <span title={nls.nls.singleEditor.orByCoordinates}>{nls.nls.singleEditor.orByCoordinates}</span>
                        </Tab>
                    </TabList>

                    <TabPanel className={"coordinates-tabs__tab-panel"} selectedClassName={"coordinates-tabs__tab-panel--selected"}>
                        {drawType == DrawType.Polygon ?
                            <div style={{ display: "flex" }}>
                                <button title={nls.nls.singleEditor.drawPolygon} className="appBtn margin" onClick={() => {
                                    this.props.activateDraw(drawType, true, () => { }, (geometry: IGeometry) => {
                                        this.setNewGeometry(geometry, graphic, layerInfo)
                                    })
                                }}>
                                    <img src="public/eit/DrawingTools/Polygon32.png" />
                                </button>
                                <button title={nls.nls.singleEditor.drawPolyline} className="appBtn margin" onClick={() => {
                                    this.props.activateDraw(DrawType.Polyline, true, () => { }, (geometry: IGeometry) => {
                                        this.buffer(geometry, graphic, layerInfo)
                                    })
                                }}><img src="public/eit/DrawingTools/Polyline32.png" /></button>
                                <button title={nls.nls.singleEditor.drawPoint} className="appBtn margin" onClick={() => {
                                    this.props.activateDraw(DrawType.Point, true, () => { }, (geometry: IGeometry) => {
                                        this.buffer(geometry, graphic, layerInfo)
                                    })
                                }}><img src="public/eit/DrawingTools/Point32.png" /></button>
                            </div>
                            :
                            <div style={{ display: "flex" }}>
                                <button title={drawType == DrawType.Point ? nls.nls.singleEditor.drawPolygon : nls.nls.singleEditor.drawPoint} className="appBtn margin" onClick={() => {
                                    this.props.activateDraw(drawType, true, () => { }, (geometry: IGeometry) => {
                                        this.setNewGeometry(geometry, graphic, layerInfo)
                                    })
                                }}>
                                    {drawType == DrawType.Point ? <img src="public/eit/DrawingTools/Point32.png" /> : <img src="public/eit/DrawingTools/Polyline32.png" />}
                                </button>
                            </div>}
                    </TabPanel>
                    <TabPanel className={"coordinates-tabs__tab-panel"} selectedClassName={"coordinates-tabs__tab-panel--selected"}>
                        {/* <div>{nls.nls.singleEditor.orByCoordinates}</div> */}
                        <textarea style={{ width: "100%" }} rows={2} placeholder={nls.nls.singleEditor.writeCoordinates}></textarea>
                        <div style={{ display: "flex" }}>
                            <button title={nls.nls.organizationEditing.validateCoordinates} className="appBtn margin" onClick={() => {
                                this.props.activateDraw(DrawType.Polyline, true, () => { }, (geometry: IGeometry) => {
                                    this.buffer(geometry, graphic, layerInfo)
                                })
                            }}><span>{"Валидирай координатите"}</span></button> 
                            {/* <img src="public/eit/Common/validate.png" /></button> */}
                            <button title={nls.nls.organizationEditing.zoomTo} className="appBtn margin" onClick={() => {
                                if (this.state.editingOrganization && this.state.editingOrganization.geometry) {
                                    this.props.zoomTo([this.state.editingOrganization.geometry]),
                                        this.props.unMark();
                                    this.props.mark([this.state.editingOrganization.geometry], [])
                                }
                                
                                // this.props.activateDraw(DrawType.Point, true, () => { }, (geometry: IGeometry) => {
                                //     this.buffer(geometry, graphic, layerInfo)
                                // })
                            }}><img src="public/eit/Ribbon/Search32.png" /></button>
                        </div>
                    </TabPanel>
                </Tabs>
            </div>


    }

    triggetOpenCollapsible = (contentId: string) => {
        if (contentId == "organization") {
            this.setState({ ...this.state, organizationHidden: !this.state.organizationHidden })
        }
        else if (contentId == "zone") {
            this.setState({ ...this.state, zoneHidden: !this.state.zoneHidden })
        }
        else {
            this.setState({ ...this.state, hyperlinksHidden: !this.state.hyperlinksHidden })
        }
    }

    createNewHyperlink = (hyperlinkLayerInfo: IFeatureLayerInfo, type: number): IGraphic => {
        let graphic = createNewGraphic(hyperlinkLayerInfo);
        graphic.attributes["hyperlinktype"] = type;
        return graphic;
    }

    getStateHyperlinkFromType = (type: number) => {
        switch (type) {
            case 1:
                return this.state.proceduresHypToAdd;
            case 2:
                return this.state.powersHypToAdd;
            case 3:
                return this.state.tariffsHypToAdd;
            case 4:
                return this.state.infrastructureHypToAdd;
            case 5:
                return this.state.networkHypToAdd;
            case 6:
                return this.state.right20HypToAdd;
            case 7:
                return this.state.termHypToAdd;
        }
    }

    addHyperlink = (type: number) => {
        let hyperlinkToAdd = this.getStateHyperlinkFromType(type);
        if (hyperlinkToAdd && this.props.layerInfos[this.hyperlinksId]) {
            if (hyperlinkToAdd.attributes["name"] && hyperlinkToAdd.attributes["hyperlinkurl"] && hyperlinkToAdd.attributes["hyperlinktype"]) {
                let newState = { ...this.state, addHyperlinkWarning: "", hyperlinksToAdd: [...this.state.hyperlinksToAdd, hyperlinkToAdd] }
                switch (type) {
                    case 1:
                        newState.proceduresHypToAdd = this.createNewHyperlink(this.props.layerInfos[this.hyperlinksId], type);
                        break;
                    case 2:
                        newState.powersHypToAdd = this.createNewHyperlink(this.props.layerInfos[this.hyperlinksId], type);
                        break;
                    case 3:
                        newState.tariffsHypToAdd = this.createNewHyperlink(this.props.layerInfos[this.hyperlinksId], type);
                        break;
                    case 4:
                        newState.infrastructureHypToAdd = this.createNewHyperlink(this.props.layerInfos[this.hyperlinksId], type);
                        break;
                    case 5:
                        newState.networkHypToAdd = this.createNewHyperlink(this.props.layerInfos[this.hyperlinksId], type);
                        break;
                    case 6:
                        newState.right20HypToAdd = this.createNewHyperlink(this.props.layerInfos[this.hyperlinksId], type);
                        break;
                    case 7:
                        newState.termHypToAdd = this.createNewHyperlink(this.props.layerInfos[this.hyperlinksId], type);
                        break;
                }

                this.setState(newState)
            }
            else {
                let newState = { ...this.state }
                let graphic = this.getStateHyperlinkFromType(type);
                if (graphic) {
                    graphic.attributes["warning"] = !hyperlinkToAdd.attributes["name"] ? nls.nls.organizationEditing.addNameWarning : nls.nls.organizationEditing.addLinkWarning
                    switch (type) {
                        case 1:
                            newState.proceduresHypToAdd = graphic
                            break;
                        case 2:
                            newState.powersHypToAdd = graphic
                            break;
                        case 3:
                            newState.tariffsHypToAdd = graphic
                            break;
                        case 4:
                            newState.infrastructureHypToAdd = graphic
                            break;
                        case 5:
                            newState.networkHypToAdd = graphic
                            break;
                        case 6:
                            newState.right20HypToAdd = graphic
                            break;
                        case 7:
                            newState.termHypToAdd = graphic
                            break;
                    }
                    this.setState(newState)
                }
            }
        }
    }

    removeHyperlinkFromAdds = (graphic: IGraphic) => {
        let filteredHyperlinks: Array<IGraphic> = [];
        if (this.state.hyperlinksToAdd) {
            for (let i = 0; i < this.state.hyperlinksToAdd.length; i++) {
                if (this.state.hyperlinksToAdd[i] != graphic) {
                    filteredHyperlinks.push(this.state.hyperlinksToAdd[i]);
                }
            }
        }
        this.setState({ ...this.state, hyperlinksToAdd: [...filteredHyperlinks] })
    }

    removeHyperlink = (graphic: IGraphic) => {
        let filteredHyperlinks: Array<IGraphic> = [];
        if (this.state.hyperlinks) {
            for (let i = 0; i < this.state.hyperlinks.length; i++) {
                if (this.state.hyperlinks[i] != graphic) {
                    filteredHyperlinks.push(this.state.hyperlinks[i]);
                }
            }
        }
        this.state.hyperlinksToDelete.push(graphic);
        this.setState({ ...this.state, hyperlinks: [...filteredHyperlinks], hyperlinksToDelete: [...this.state.hyperlinksToDelete] })
    }

    getHyperlinkLine = (hyperlink: IGraphic, onRemove: (graphic: IGraphic) => void): JSX.Element => {
        return <div className="hyperlinkContainer" >
            <p>{hyperlink.attributes["description"]} <a target="_blank" href={hyperlink.attributes.hyperlinkurl ? hyperlink.attributes.hyperlinkurl.toString() : ""}>{hyperlink.attributes["name"]}</a></p>

            <img src="public/icons/remove.svg" title={nls.nls.organizationEditing.removeLink} onClick={() => {
                onRemove(hyperlink)
            }} />
        </div>
    }

    renderHyperlinks = (hyperlinkLayerInfo: IFeatureLayerInfo): JSX.Element => {
        let hyperlinks: Array<JSX.Element> = [];

        hyperlinkLayerInfo.popupInfo.fieldInfos["hyperlinktype"].domain!.codedValues.forEach((c, j) => {
            let type = parseInt(c.code.toString());
            let editingGraphic = this.getStateHyperlinkFromType(type);

            let typeHyperlinks: Array<JSX.Element> = [];
            if (this.state.hyperlinks) {
                for (let i = 0; i < this.state.hyperlinks.length; i++) {
                    if (this.state.hyperlinks[i].attributes["hyperlinktype"] == c.code) {
                        typeHyperlinks.push(<div key={i}>{this.getHyperlinkLine(this.state.hyperlinks[i], this.removeHyperlink)}</div>)
                    }
                }
            }
            if (this.state.hyperlinksToAdd.length > 0) {
                let i = typeHyperlinks.length;
                let counter = 0;
                while (this.state.hyperlinksToAdd[counter]) {
                    if (this.state.hyperlinksToAdd[counter].attributes["hyperlinktype"] == c.code) {
                        typeHyperlinks.push(
                            <div key={i}>{this.getHyperlinkLine(this.state.hyperlinksToAdd[counter], this.removeHyperlinkFromAdds)}</div>)
                    }
                    i++;
                    counter++;
                }
            }
            hyperlinks.push(<div key={j} className="hyperlinkTypeContainer">
                <div style={{ textAlign: "center", fontSize: "15px" }}><b>{c.name}</b></div>
                {typeHyperlinks}
                <div className="newHyperlinkTitle">{nls.nls.organizationEditing["e" + type]}</div>
                {this.renderTable(this.renderFeatures(hyperlinkLayerInfo, editingGraphic))}
                <div style={{ textAlign: "center", color: "red" }}>{!!editingGraphic ? (editingGraphic.attributes["warning"] || "") : ""}</div>
                <div><img
                    src="public\eit\Feedback\AddAttachment32.png" title={nls.nls.organizationEditing["e" + type]}
                    style={{ "cursor": "pointer", width: "25px", height: "25px", float: "right", margin: "5px" }}
                    onClick={() => {
                        this.addHyperlink(type)
                    }} /></div>
            </div>)
        })

        return <div>{hyperlinks}</div>
    }

    renderTableAndButton = (
        organizationGraphic: IGraphic, organizationLayerInfo: IFeatureLayerInfo,
        zoneLayerInfo: IFeatureLayerInfo,
        hyperlinkLayerInfo: IFeatureLayerInfo, zoneGraphic?: IGraphic
    ): JSX.Element => {
        return <div className={this.props.detailViewClassName}>
            <OverlayLoader size="60px" show={this.state.loading} />
            <Collapsible
                mobile={true}
                contentId={"organization"}
                toggleOpen={this.triggetOpenCollapsible}
                triggerComponent=
                {(<div className="tableHeader tableHeaderColor1">
                    <span className="tableCollapeTitle">{nls.nls.organizationEditing.organization}</span>
                    <span style={{ marginLeft: "auto", transform: "rotate(90deg)", fontSize: "25px" }}>{!this.state.organizationHidden ?  "«" : "»"}</span>
                </div>)}
                open={(!this.state.organizationHidden ? true : false)}
                height={"auto"}
                triggerHeight={"40px"}
            >
                {this.renderTable(this.renderFeatures(organizationLayerInfo, organizationGraphic))}
                {this.getGeometrySetterControls(organizationLayerInfo, organizationGraphic)}
            </Collapsible>
            {zoneGraphic ? <Collapsible
                mobile={true}
                contentId={"zone"}
                toggleOpen={this.triggetOpenCollapsible}
                triggerComponent=
                {(<div className="tableHeader tableHeaderColor1">
                    <span className="tableCollapeTitle">{nls.nls.organizationEditing.zoneOfResponsibility}</span>
                    <span style={{ marginLeft: "auto", transform: "rotate(90deg)", fontSize: "25px" }}>{!this.state.zoneHidden ?  "«" : "»"}</span>
                </div>)}
                open={(!this.state.zoneHidden ? true : false)}
                height={"auto"}
                triggerHeight={"40px"}
            >
                {this.renderTable(this.renderFeatures(zoneLayerInfo, zoneGraphic))}
                {this.getGeometrySetterControls(zoneLayerInfo, zoneGraphic)}
            </Collapsible> : null}
            

            <Collapsible
                mobile={true}
                contentId={"hyperlinks"}
                toggleOpen={this.triggetOpenCollapsible}
                triggerComponent=
                {(<div className="tableHeader tableHeaderColor1">
                    <span className="tableCollapeTitle">{nls.nls.organizationEditing.hyperlinks}</span>
                    <span style={{ marginLeft: "auto", transform: "rotate(90deg)", fontSize: "25px" }}>{!this.state.hyperlinksHidden ?  "«" : "»"}</span>
                </div>)}
                open={(!this.state.hyperlinksHidden ? true : false)}
                height={"auto"}
                triggerHeight={"40px"}
                contentStyle={{ backgroundColor: "#817e7e" }}
            >
                {this.renderHyperlinks(hyperlinkLayerInfo)}

            </Collapsible>

            {this.state.errorMessage ? <div style={{ textAlign: "center", color: "red" }}>{this.state.errorMessage}</div> : null}
            {this.state.successMessage ? <div style={{ textAlign: "center", color: "green" }}>{this.state.successMessage}</div> : null}
            {this.renderButtons()}
        </div>
    }

    buffer = (geometry: IGeometry, graphic: IGraphic, layerInfo: IFeatureLayerInfo) => {
        if (!this.geometryService) {
            this.geometryService = new GeometryService({ url: appConfig.urls.geometryServiceUrl });
        }
        let sp = new SpatialReference({ wkid: geometry.spatialReference.wkid })
        var params = new BufferParameters({
            distances: [50],
            unit: "meters",
            geodesic: true,
            bufferSpatialReference: sp,
            outSpatialReference: sp,
            geometries: [geometry]
        });
        this.geometryService.buffer(params).then(r => {
            this.setNewGeometry(r[0], graphic, layerInfo)
        }).catch(e => {
            console.error(e)
        })
    }

    redrawGraphics = (graphics: Array<IGraphic | undefined>) => {
        this.props.unMark()
        let gs = graphics.filter(i => !!i) as Array<IGraphic>;
        if (graphics && graphics.length) {
            this.props.mark([], gs)
        }
    }

    componentWillReceiveProps(props: Props) {
        if (props.editingOrganization && props.layerInfos[this.zoneLayerInfoId] && props.layerInfos[this.hyperlinksId]) {
            this.loadDependencies(props.editingOrganization, props.layerInfos[this.zoneLayerInfoId], props.layerInfos[this.hyperlinksId]);
        }
    }

    render() {
        return (
            this.state.editingOrganization && this.props.layerInfos[this.organizationLayerInfoId] && this.props.layerInfos[this.zoneLayerInfoId] &&
                this.props.layerInfos[this.hyperlinksId]
                ?
                this.renderTableAndButton(
                    this.state.editingOrganization, this.props.layerInfos[this.organizationLayerInfoId],
                    this.props.layerInfos[this.zoneLayerInfoId], this.props.layerInfos[this.hyperlinksId], this.state.editingZone)
                :
                <div style={{ padding: "5px" }}>
                    {nls.nls.singleEditor.noObj}
                </div>
        )
    }

    cancel = (): void => {
        if (this.state.originalOrganization) {
            this.loadDependencies(this.state.originalOrganization, this.props.layerInfos[this.zoneLayerInfoId], this.props.layerInfos[this.hyperlinksId])
        }
    }

    applyHyperlinkEdits = (hyperlinksLayerInfo: IFeatureLayerInfo, orgGraphic: IGraphic, hyperlinks: Array<IGraphic>, zoneGraphic?: IGraphic) => {
        featureLayersAPI.applyEdits(hyperlinksLayerInfo, this.state.hyperlinksToAdd, [], this.state.hyperlinksToDelete)
            .then(r => {
                if ((this.state.hyperlinksToAdd.length > 0 && r.addResults[0].success) ||
                    this.state.hyperlinksToDelete.length > 0 && r.deleteResults[0].success) {
                    this.onSuccessEdits(orgGraphic, hyperlinks, zoneGraphic);
                }
                else {
                    this.setState({ ...this.state, loading: false, errorMessage: nls.nls.general.errorOccured })
                }
            })
            .catch(e => {
                this.setState({ ...this.state, loading: false, errorMessage: nls.nls.general.errorOccured })
            })
    }

    onSuccessEdits = (orgGraphic: IGraphic, hyperlinks: Array<IGraphic>, zoneGraphic?: IGraphic) => {
        this.setState({
            ...this.state,
            editingOrganization: orgGraphic,
            originalOrganization: orgGraphic,
            editingZone: zoneGraphic,
            originalZone: zoneGraphic,
            loading: false,
            successMessage: nls.nls.singleEditor.afterSuccessMsg,
            hyperlinks: hyperlinks.concat(this.state.hyperlinksToAdd),
            hyperlinksToAdd: [],
            hyperlinksToDelete: []
        })
        this.loadDependencies(orgGraphic, this.props.layerInfos[this.zoneLayerInfoId], this.props.layerInfos[this.hyperlinksId]);
    }

    save = (): void => {
        if (this.state.editingOrganization) {
            let orgGraphic = this.state.editingOrganization;
            let orgLayerInfo = this.props.layerInfos[this.organizationLayerInfoId];
            let zoneGraphic = this.state.editingZone;
            let zoneLayerInfo = this.props.layerInfos[this.zoneLayerInfoId];
            let hyperlinks = this.state.hyperlinks || [];
            let hyperlinksLayerInfo = this.props.layerInfos[this.hyperlinksId];

            this.setState({ ...this.state, loading: true, errorMessage: "", successMessage: "" })
            featureLayersAPI.applyEdits(orgLayerInfo, [], [orgGraphic])
                .then(r => {
                    if (r.updateResults[0].success) {
                        if(zoneGraphic){
                            featureLayersAPI.applyEdits(zoneLayerInfo, [], [zoneGraphic])
                            .then(r => {
                                if (r.updateResults[0].success) {
                                    if (this.state.hyperlinksToAdd.length > 0 || this.state.hyperlinksToDelete.length > 0) {
                                        this.applyHyperlinkEdits(hyperlinksLayerInfo, orgGraphic, hyperlinks, zoneGraphic);
                                    }
                                    else {
                                        this.onSuccessEdits(orgGraphic, hyperlinks, zoneGraphic);
                                    }
                                }
                                else {
                                    this.setState({ ...this.state, loading: false, errorMessage: nls.nls.general.errorOccured })
                                }
                            })
                            .catch(e => {
                                this.setState({ ...this.state, loading: false, errorMessage: nls.nls.general.errorOccured })
                            })
                        }
                        else{
                            if (this.state.hyperlinksToAdd.length > 0 || this.state.hyperlinksToDelete.length > 0) {
                                this.applyHyperlinkEdits(hyperlinksLayerInfo, orgGraphic, hyperlinks);
                            }
                            else {
                                this.onSuccessEdits(orgGraphic, hyperlinks);
                            }
                        }
                        
                    }
                    else {
                        this.setState({ ...this.state, loading: false, errorMessage: nls.nls.general.errorOccured })
                    }
                })
                .catch(e => {
                    this.setState({ ...this.state, loading: false, errorMessage: nls.nls.general.errorOccured })
                })
        }
    }
}

export const mapStateToProps = (state: IEITAppStore) => ({
    editingOrganization: state.eit.organizationEdits.organization,
    layerInfos: state.layerInfos.featureLayerInfos
})

export default connect<OwnProps, DispatchProps, ParentProps>(mapStateToProps, { ...editsDispatcher, ...mapDispatcher })(OrganizationEditing)