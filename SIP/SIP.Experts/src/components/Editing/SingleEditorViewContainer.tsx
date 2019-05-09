import * as React from "react";
import { IAppStore } from "../../core/interfaces/reducers/IAppStore";
import { connect } from "react-redux";
import { ISingleEditor } from "../../core/interfaces/reducers/IEdits";
import { IFeatureLayerInfo, IGraphic, IGeometry, IPoint } from '../../core/interfaces/models';
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
import MultiSelect from "../../core/components/Widgets/MultiSelect";
import { Point, Geometry, Polyline, Polygon } from 'esri/geometry';
import AttachmentsEditing, { AttachmentInfo } from '../Widgets/AttachmentsEditing';
import { IAttachmentResponse, IAddAttachmentResponse } from '../../core/interfaces/helpers';
import { featureLayersAttachmentsAPI } from '../../core/actions/helpers';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import { isNullOrUndefined } from 'util';


export interface ParentProps {
    detailViewClassName: string;
}
export interface OwnProps {
    singleEditor?: ISingleEditor;
    layerInfos: {[key: string]: IFeatureLayerInfo};
}

export interface DispatchProps extends IEditsDispatcher, IMapDispatcher {

}

type Props = OwnProps & DispatchProps & ParentProps;

export interface State {
    editingGraphic?: IGraphic;
    originalGraphic?: IGraphic;
    layerId?: string;
    loading: boolean;
    errorMessage?: string;
    successMessage?: string;
    editingCoordinatesString: string;
    inputErrors?: string;
    attachments: AttachmentInfo[];
}

export class SingleEditorViewContainer extends React.Component<Props, State> {
    constructor(props: Props){
        super(props);
        if(props.singleEditor){
            this.state = {
                editingCoordinatesString: "", 
                editingGraphic: props.singleEditor.graphic,
                layerId: props.singleEditor.layerInfoId, 
                originalGraphic: 
                {...props.singleEditor.originalGraphic, attributes: {...props.singleEditor.originalGraphic.attributes }, geometry: props.singleEditor.originalGraphic.geometry }, 
                loading: false, errorMessage: "", successMessage: "",
                attachments: []
            }
            this.redrawGraphic(props.singleEditor.graphic)
        }
        else{
            this.state = {editingCoordinatesString: "",loading: false, attachments: []}
        }
        for(let i = 0; i < eitAppConfig.infrastructureCodedValues.length; i++){
            this.infrastructureDomain[eitAppConfig.infrastructureCodedValues[i].name] = eitAppConfig.infrastructureCodedValues[i].code;
        }
        for (let i = 0; i < eitAppConfig.activityCodedValues.length; i++) {
            this.activityDomain[eitAppConfig.activityCodedValues[i].name] = eitAppConfig.activityCodedValues[i].code;
        }
    }
    infrastructureDomain: {[label: string]: number} = {};
    activityDomain: { [label: string]: number } = {};
    geometryService: GeometryService;

    updateGraphicValue = (fieldName: string, value: React.ReactText) => {
        // let graphic = this.props.singleEditor!.graphic;
        // graphic.attributes[fieldName] = value;
        // this.props.updateSingleEditorGraphic(graphic);
        if(this.state.editingGraphic){
            this.setState({...this.state, editingGraphic: {...this.state.editingGraphic, attributes: {...this.state.editingGraphic.attributes, [fieldName]: value} }});
        }
    }

    updateGraphicGeometry = (fieldName: string, value: React.ReactText) => {
        // let graphic = this.props.singleEditor!.graphic;
        // graphic.attributes[fieldName] = value;
        // this.props.updateSingleEditorGraphic(graphic);
        if(this.state.editingGraphic){
            this.setState({...this.state, editingGraphic: {...this.state.editingGraphic, attributes: {...this.state.editingGraphic.attributes, [fieldName]: value} }});
        }
    }

    getDateEditingControl = (fieldName: string, value: React.ReactText): JSX.Element => {
        let stringValue: any = "";
        if(value){
            stringValue = new Date(value)
        }
        
        return <Datetime 
                locale={eitAppConfig.locale}
                value={stringValue}
                inputProps={{
                    placeholder: nls.nls.singleEditor.chooseDate,
                    style: {width: "100%"}
                }}
                timeFormat={false}
                onChange={e => {
                    this.updateGraphicValue(fieldName, (!e || typeof e == "string" || !e.isValid()) ? "" : e.valueOf())
                }}
            />

    }

    getStringEditingControl = (fieldName: string, value: React.ReactText, maxLength?: number): JSX.Element => {
        if(maxLength && maxLength > 255){
            return <textarea rows={6} style={{width: "100%", resize: "none"}} value={value} onChange={(e) => {
                this.updateGraphicValue(fieldName, e.target.value)
            }}/>
        }
        else{
            return <input style={{width: "100%"}} value={value} onChange={(e) => {
                this.updateGraphicValue(fieldName, e.target.value)
            }}/>
        }
    }

    getDomainOptions = (codedValues: Array<{name: string; code: React.ReactText}>, value: React.ReactText) => {
        let options: Array<JSX.Element> = [
            <option style={{width: "100%"}} key={"a1b2c3d4"}>{nls.nls.singleEditor.choose}</option>
        ];
        codedValues.forEach((cv,i) => {
            options.push(<option key={i} value={cv.code} >{cv.name}</option>)
        })

        return options;
    }

    getDomainEditingControl = (fieldName: string, value: React.ReactText, codedValues: Array<{name: string; code: React.ReactText}>): JSX.Element => {
        return <select style={{width: "100%"}} value={value} onChange={(e) => {
            this.updateGraphicValue(fieldName, e.target.value)
        }}>
            {this.getDomainOptions(codedValues, value)}
        </select>
    }

    multiSelectClears: {[key: string]: () => void} = {}

    getEditingControl = (fieldName: string, graphic: IGraphic, layerInfo: IFeatureLayerInfo): JSX.Element => {
        let fieldInfo = layerInfo.popupInfo.fieldInfos[fieldName]
        let type = fieldInfo.type;
        let currentValue: React.ReactText = graphic.attributes[fieldName] || "";
        if (layerInfo.url == eitAppConfig.layers.RegistersFeatureJoint ||
            layerInfo.url == eitAppConfig.layers.RegistersFeatureActions) {
            if(fieldName == "infrastructuretypes"){
                return  <div style={{position: "relative", height: "50px"}}>
                            <div style={{position: "absolute", left: "0", right: "0", top: "0", bottom: "0"}}>
                                <MultiSelect 
                                data={this.infrastructureDomain} 
                                containerCss={{height: "100%"}} 
                                onSelectionChanged={(selection, seletionString, clear) => {
                                    this.multiSelectClears["infrastructuretypes"] = clear;
                                    this.updateGraphicValue(fieldName, seletionString)
                                }}/>
                            </div>
                        </div>
            }
        }
        if (layerInfo.url == eitAppConfig.layers.RegistersFeatureActions) {
            if (fieldName == "activitytypes") {
                return <div style={{ position: "relative", height: "50px" }}>
                    <div style={{ position: "absolute", left: "0", right: "0", top: "0", bottom: "0" }}>
                        <MultiSelect
                            data={this.activityDomain}
                            containerCss={{ height: "100%" }}
                            onSelectionChanged={(selection, seletionString, clear) => {
                                this.updateGraphicValue(fieldName, seletionString);
                                this.multiSelectClears["activitytypes"] = clear;
                            }} />
                    </div>
                </div>
            }
        }
        if(fieldInfo.domain && fieldInfo.domain.codedValues){
            return this.getDomainEditingControl(fieldName, currentValue, fieldInfo.domain.codedValues)
        }
        switch(type) {
            case "date":
                return this.getDateEditingControl(fieldName, currentValue);
            default:
                return this.getStringEditingControl(fieldName, currentValue, fieldInfo.length);
        }
    }

    getRequiredMessage = (field: string): string => {
        let requireMsg = "";
        const fieldName = field.trim().toLowerCase();

        switch(fieldName) {
            case "activityname": 
            case "activitytypes":
            case "infrastructuretypes":
            case "righttype":
                requireMsg = " *";
                break;
            default:
                requireMsg = "";
                break;
        }

        return requireMsg;
    }

    renderFeatures = (graphic: IGraphic, layerInfo: IFeatureLayerInfo): Array<JSX.Element> => {
        let fields: Array<JSX.Element> = [];
        for(let key in graphic.attributes) {
            if(layerInfo.popupInfo.fieldInfos[key].visible && layerInfo.popupInfo.fieldInfos[key].editable) { 
                if(eitAppConfig.layers.RegistersFeatureActions == layerInfo.url && key == "locationdescription") {
                    continue;
                }
                if (layerInfo.popupInfo.fieldInfos[key].fieldName === "activitydescription") {
                    layerInfo.popupInfo.fieldInfos[key].label = "Описание на дейностите"
                }
                if (layerInfo.popupInfo.fieldInfos[key].fieldName != "userid") {
                    const requireMsg = this.getRequiredMessage(layerInfo.popupInfo.fieldInfos[key].fieldName);
                    fields.push(<tr key={key}>
                    <td style={{ width: "50%" }}>{layerInfo.popupInfo.fieldInfos[key].label + requireMsg}</td>
                    <td style={{ textAlign: "right", width: "50%" }}>{this.getEditingControl(key, graphic, layerInfo)}</td>
                </tr>)
                }
                
            }
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
        return <div style={{display: "flex"}}>
                <button className="appBtn margin" onClick={this.cancel}>{nls.nls.singleEditor.cancel}</button>
                <button className="appBtn margin" onClick={this.save}>{nls.nls.singleEditor.save}</button>
            </div>
    }

    getDrawType = (layerInfo: IFeatureLayerInfo) => {
        let geometryType = layerInfo.getGeometryType();
        if(geometryType == "point"){
            return DrawType.Point;
        }
        else if(geometryType == "polyline"){
            return DrawType.Polyline;
        }
        else {
            return DrawType.Polygon;
        }
    }

    componentWillUnmount(){
        this.props.unMark()
    }

    setNewGeometry = (geometry?: IGeometry) => {
        if(this.state.editingGraphic){
            let graphic = {...this.state.editingGraphic, geometry: geometry, attributes: this.state.editingGraphic.attributes}
            this.setState({...this.state, editingGraphic: graphic})
            this.redrawGraphic(graphic)
        }
    }

    setStringGeometry = (layerInfo: IFeatureLayerInfo) => {
        this.setState({...this.state, inputErrors: ""});
        let type = layerInfo.getGeometryType();
        let lineStrings: Array<string> = this.cleanCoordinatesString(this.state.editingCoordinatesString);
        let geometry: Geometry;
        if(!lineStrings || lineStrings.length == 0){
            this.setNewGeometry(undefined)
            return;
        }
        //
        let coordinates = [];
        for(let i = 0; i < lineStrings.length; i++){
            let regex = this.getLineStringValidatorRegex();
            let coord = this.parseLineString(lineStrings[i], regex);
            if(coord.length != 2){
                this.setState({...this.state, inputErrors: `Грешка на ред ${i + 1}`});
                return;
            }
            coordinates.push(coord);
        }
        
        //////////////
        if(type == "point"){
            if(coordinates.length > 1){
                this.setState({...this.state, inputErrors: "Координатите са повече от една"});
                return;
            }
            geometry = new Point({x: coordinates[0][0], y: coordinates[0][1], spatialReference: new SpatialReference({wkid: 25835})})
        }
        else if(type == "polyline"){
            if(coordinates.length < 2){
                this.setState({...this.state, inputErrors: "Моля, въведете минимум 2 броя координати"});
                return;
            }
            geometry = new Polyline({paths: [coordinates], spatialReference: new SpatialReference({wkid: 25835})})
        }
        else if(type == "polygon"){
            if(coordinates.length < 3){
                this.setState({...this.state, inputErrors: "Моля, въведете минимум 3 броя координати"});
                return;
            }
            geometry = new Polygon({rings: [coordinates], spatialReference: new SpatialReference({wkid: 25835})})
        }
        else{
            throw new Error(`${type} not implemented`)
        }
        if(geometry){
            let geometryService = new GeometryService({url: eitAppConfig.urls.geometryServiceUrl});
            geometryService.project({geometries: [geometry], outSpatialReference: new SpatialReference({wkid: 102100})} as any).then(result => {
                this.setNewGeometry(result[0]);
                this.props.unMark();
                this.props.mark(result, []);
                this.props.zoomTo(result)
            }).catch(error => console.error(error))
        }

    }

    numberTestString = "[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?";
    speMap = {
        space: " ",
        tab: "\t",
        comma: ",",
        commaSpace: ", ",
        commaTab: ",\t",
    }

    cleanCoordinatesString = (coordinatesString: string): Array<string> => {
        let result: Array<string> = [];
        let emptySkipped = false;
        let lastEmptySkipped = 0;
        let split = coordinatesString.split("\n");
        for(let i = 0; i < split.length; i++){
            let line = split[i].trim();
            if(line){
                if(emptySkipped){
                    result  = [];
                    split.forEach((l,j) => {
                        if(j == lastEmptySkipped){
                            result.push("Error");
                        }
                        else{
                            result.push("1 1");
                        }
                    });
                    break;
                }
                else{
                    result.push(line);
                }
            }
            else{
                lastEmptySkipped = i;
                emptySkipped = true;
            }
        }


        return result;
    }

    parseLineString = (lineString: string, regexes: {[key: string]: RegExp}): Array<number> => {
        let coordinates: Array<number> = [];
        for(let key in regexes){
            if(regexes[key].test(lineString)){
                let point = lineString.split(this.speMap[key])
                coordinates = [parseFloat(point[0]), parseFloat(point[1])]
            }
        }
        return coordinates;
    }

    getLineStringValidatorRegex = (): {[key: string]: RegExp} => {
        return {
            space: new RegExp(`^${this.numberTestString} ${this.numberTestString}$`, "g"),
            tab: new RegExp(`^${this.numberTestString}\t${this.numberTestString}$`, "g"),
            comma: new RegExp(`^${this.numberTestString},${this.numberTestString}$`, "g"),
            commaSpace: new RegExp(`^${this.numberTestString}, ${this.numberTestString}$`, "g"),
            commaTab: new RegExp(`^${this.numberTestString},\t${this.numberTestString}$`, "g"),
        }
    }

    getGeometrySetterControls = (layerInfo: IFeatureLayerInfo, graphic: IGraphic): JSX.Element => {
        let drawType = this.getDrawType(layerInfo);
        let locDescFld = "locationdescription";
        return layerInfo.isTable ? <div></div> : <div style={{marginBottom: "30px"}}>
            <br /><br />
            {/* <hr style={{border: "0", height: "1px",  background: "#333", backgroundImage: " linear-gradient(to right, #ccc, #333, #ccc)"}}></hr> */}
            <div>
            <p className="flex-item flex-auto" style={{ marginTop: "20px", marginBottom: "20px",  fontSize:" 16px", lineHeight: "22px", fontWeight: "bold" }}>{nls.nls.singleEditor.editLocation}</p>
            </div>
            <Tabs>
                <TabList> 
                    <Tab className={"coordinates-tabs__tab"} selectedClassName={"coordinates-tabs__tab--selected"} disabledClassName={"coordinates-tabs__tab--disabled"} >
                        <span title={nls.nls.singleEditor.byDrawing}>{nls.nls.singleEditor.byDrawing}</span>
                    </Tab>
                    <Tab className={"coordinates-tabs__tab"} selectedClassName={"coordinates-tabs__tab--selected"} disabledClassName={"coordinates-tabs__tab--disabled"}>
                        <span title={nls.nls.singleEditor.orByCoordinates}>{nls.nls.singleEditor.orByCoordinates}</span>
                    </Tab>
                </TabList>
                <TabPanel className={"coordinates-tabs__tab-panel"} selectedClassName={"coordinates-tabs__tab-panel--selected"}>
                    {/* <div>
                        <p className="flex-item flex-auto" style={{ marginTop: "20px", fontSize: " 14px", lineHeight: "18px" }}>{nls.nls.singleEditor.byDrawing}</p>
                    </div> */}
                    {
                        drawType == DrawType.Polygon ?
                            <div style={{ display: "flex" }}>
                                <button
                                    title={nls.nls.organizationEditing.drawPolygon} className="appBtn margin"
                                    onClick={() => {
                                        this.props.activateDraw(drawType, true, () => { }, this.setNewGeometry)
                                    }}
                                >
                                    <img src="public/eit/DrawingTools/Polygon32.png" />
                                </button>
                                <button title={nls.nls.organizationEditing.drawPolygonLine} className="appBtn margin" onClick={() => {
                                    this.props.activateDraw(DrawType.Polyline, true, () => { }, this.buffer)
                                }}><img src="public/eit/DrawingTools/Polyline32.png" /></button>
                                <button title={nls.nls.organizationEditing.drawPolygonPoint} className="appBtn margin" onClick={() => {
                                    this.props.activateDraw(DrawType.Point, true, () => { }, this.buffer)
                                }}><img src="public/eit/DrawingTools/Point32.png" /></button>
                            </div>
                            :
                            <div style={{ display: "flex" }}>
                                <button title={drawType == DrawType.Point ? nls.nls.organizationEditing.drawLine : nls.nls.organizationEditing.drawPoint} className="appBtn margin" onClick={() => {
                                    this.props.activateDraw(drawType, true, () => { }, this.setNewGeometry)
                                }}>
                                    {drawType == DrawType.Point ? <img src="public/eit/DrawingTools/Point32.png" /> : <img src="public/eit/DrawingTools/Polyline32.png" />}
                                </button>
                            </div>
                    }
                </TabPanel>
                <TabPanel className={"coordinates-tabs__tab-panel"} selectedClassName={"coordinates-tabs__tab-panel--selected"}>
                    {/* <div>
                        <p className="flex-item flex-auto" style={{ marginTop: "20px", fontSize: " 14px", lineHeight: "18px" }}>{nls.nls.singleEditor.orByCoordinates}</p>
                    </div> */}
                    <textarea
                        title={"Пример: \n195914.6 4768583.5\n195014.3 4764583.2\n195514.1 4761583.0"}
                        style={{ width: "100%", lineHeight: "14px"}}
                        value={this.state.editingCoordinatesString}
                        onChange={(e) => this.setState({ ...this.state, editingCoordinatesString: e.target.value })}
                        rows={5}
                        placeholder={nls.nls.singleEditor.writeCoordinates}></textarea>
                    {eitAppConfig.layers.RegistersFeatureActions == layerInfo.url ?
                        <div style={{ display: "flex", height: "50px" }}>
                            <div>{layerInfo.popupInfo.fieldInfos[locDescFld].label}</div>
                            {this.getEditingControl(locDescFld, graphic, layerInfo)}
                        </div> : <div></div>}
                    <div style={{ textAlign: "center", color: "red" }}>{this.state.inputErrors}</div>
                    <div style={{ display: "flex", marginTop: "20px"}}>
                        <button title={nls.nls.organizationEditing.validateCoordinates} className="appBtn margin" onClick={() => {
                            this.setStringGeometry(layerInfo);
                        }}><span>{"Валидирай координатите"}</span></button>
                        {/* <img src="public/eit/Common/validate.png"/></button>*/}
                        <button title={nls.nls.organizationEditing.zoomTo} className="appBtn margin" onClick={() => {
                            if (this.state.editingGraphic && this.state.editingGraphic.geometry) {
                                this.props.zoomTo([this.state.editingGraphic.geometry]),
                                    this.props.unMark();
                                this.props.mark([this.state.editingGraphic.geometry], [])
                            }
                        }}><img src="public/eit/Ribbon/Search32.png" /></button>
                    </div>
                    {/* <hr style={{ border: "0", height: "1px", background: "#333", backgroundImage: " linear-gradient(to right, #ccc, #333, #ccc)" }}></hr> */}
                </TabPanel>
            </Tabs>
        </div>
            
    }

    renderAttachments(): JSX.Element {
        const maxAttachments: number = 3;
        const inputAttachments: string = nls.nls.feedback.inputAttachments.replace('{0}', maxAttachments.toString());
        return (
            <AttachmentsEditing
            maxNumber={maxAttachments}
            attachments={this.state.attachments}
            label={inputAttachments}
            onAttachmentsChange={ this.onAttachmentsChange }/>
        )
    }
    onAttachmentsChange = (newAttachments: AttachmentInfo[]): void =>{
        this.setState({
            attachments : newAttachments,
        });
    }
    
    addAttachmentsToFeature = (featureLayerInfo: IFeatureLayerInfo, feature: IGraphic): Promise<IAddAttachmentResponse[]> => {
        let attachmentFiles: Array<File> = new Array<File>();
        this.state.attachments.forEach(attachment => {
            if (!isNullOrUndefined(attachment.file)){
                attachmentFiles.push(attachment.file);
            }
        });
        return featureLayersAttachmentsAPI.addAttachmentsToFeature(featureLayerInfo, feature, attachmentFiles, "objectid");
    }

    renderTableAndButton = (graphic: IGraphic, layerInfo: IFeatureLayerInfo): JSX.Element => {
        return <div className={this.props.detailViewClassName}>
                    <div style={{fontSize: "16px", textAlign: "center", padding: "5px"}}>{
                        layerInfo.url == eitAppConfig.layers.RegistersFeatureJoint ? nls.nls.ribbon.registry2.createNewАnnouncement : layerInfo.url == eitAppConfig.layers.RegistersFeatureActions ? nls.nls.ribbon.registry1.createNewАctivity : // this need to be refactored
                        (!!graphic.attributes[layerInfo.idFieldName] ? nls.nls.singleEditor.editing : nls.nls.singleEditor.new) + layerInfo.title }</div>
                    <OverlayLoader size="60px" show={this.state.loading}/>
                    {this.renderTable(this.renderFeatures(graphic, layerInfo))}
                    {this.state.errorMessage ? <div style={{textAlign: "center", color: "red"}}>{this.state.errorMessage}</div> : null}
                    {this.state.successMessage ? <div style={{textAlign: "center", color: "green"}}>{this.state.successMessage}</div> : null}
                    {this.getGeometrySetterControls(layerInfo, graphic)}
                    {layerInfo.url == eitAppConfig.layers.RegistersFeatureJoint ? this.renderAttachments() : null}
                    {this.renderButtons()}
                    
                </div>
    }

    buffer = (geometry: IGeometry) => {
        if(!this.geometryService){
            this.geometryService = new GeometryService({ url: appConfig.urls.geometryServiceUrl });
        }
        let sp = new SpatialReference({wkid: geometry.spatialReference.wkid})
        var params = new BufferParameters({
            distances: [50],
            unit: "meters",
            geodesic: true,
            bufferSpatialReference: sp,
            outSpatialReference: sp,
            geometries: [geometry]
          });
        this.geometryService.buffer(params).then(r => {
            this.setNewGeometry(r[0])
        }).catch(e => {
            console.error(e)
        })
    }

    redrawGraphic = (graphic: IGraphic) => {
        this.props.unMark()
        if(graphic && graphic.geometry){
            this.props.mark([], [graphic])
        }
    }

    componentWillReceiveProps(props: Props){
        if(props.singleEditor){
            for(let key in this.multiSelectClears){
                this.multiSelectClears[key]();
            }

            this.setState({ editingGraphic: props.singleEditor.graphic, layerId: props.singleEditor.layerInfoId, 
                originalGraphic: 
                {...props.singleEditor.originalGraphic, attributes: {...props.singleEditor.originalGraphic.attributes }, geometry: props.singleEditor.originalGraphic.geometry },
                 loading: false, errorMessage: "", successMessage: ""});
            this.redrawGraphic(props.singleEditor.graphic);
        }
    }

    render(){
        if(this.state.successMessage && this.state.layerId && this.state.editingGraphic){
            let layerInfo = this.props.layerInfos[this.state.layerId];
            return (<div>
                <div style={{textAlign: "center", color: "green"}}>{this.state.successMessage}</div>
                <button className="appBtn margin" onClick={this.cancel}> <div style={{fontSize: "16px", textAlign: "center", padding: "5px"}}>{
                        layerInfo.url == eitAppConfig.layers.RegistersFeatureJoint ? nls.nls.ribbon.registry2.createNewАnnouncement : this.state.layerId == eitAppConfig.layers.RegistersFeatureActions ? nls.nls.ribbon.registry1.createNewАctivity : // this need to be refactored
                        (!!this.state.editingGraphic.attributes[layerInfo.idFieldName] ? nls.nls.singleEditor.editing : nls.nls.singleEditor.new) +  layerInfo.title }</div></button>
            </div>)
        }
        return (
            this.state.editingGraphic && this.state.layerId
            ? 
            this.renderTableAndButton(this.state.editingGraphic, this.props.layerInfos[this.state.layerId])
            : 
            <div style={{padding: "5px"}}>
                {nls.nls.singleEditor.noObj}
            </div>
        )
    }

    cancel = (): void => {
        if(this.props.singleEditor){
            for(let key in this.multiSelectClears){
                this.multiSelectClears[key]();
            }
            this.setState({editingGraphic: {...this.props.singleEditor.originalGraphic, attributes: {...this.props.singleEditor.originalGraphic.attributes }, geometry: this.props.singleEditor.originalGraphic.geometry }, loading: false, errorMessage: "", successMessage: "", editingCoordinatesString: ""})
            this.redrawGraphic(this.props.singleEditor.originalGraphic)
        }
    }

    save = (): void => {
        if(this.state.editingGraphic && this.state.layerId){
            if(this.state.layerId == eitAppConfig.layers.RegistersFeatureActions){
                if(!this.state.editingGraphic.attributes["activityname"]){
                    this.setState({...this.state, errorMessage: nls.nls.singleEditor.enterActionName, successMessage: ""})
                    return;
                }
                if(!this.state.editingGraphic.attributes["activitytypes"]){
                    this.setState({...this.state, errorMessage: nls.nls.singleEditor.enterActivityType, successMessage: ""})
                    return;
                }
                
            }
            else if(this.state.layerId == eitAppConfig.layers.RegistersFeatureJoint) {
                if(!this.state.editingGraphic.attributes["infrastructuretypes"]){
                    this.setState({...this.state, errorMessage: nls.nls.singleEditor.enterInfrastructureTypes, successMessage: ""})
                    return;
                }
                if(!this.state.editingGraphic.attributes["righttype"]){
                    this.setState({...this.state, errorMessage: nls.nls.singleEditor.enterRightType, successMessage: ""})
                    return;
                }
            }
            let graphic = this.state.editingGraphic;
            let layerInfo = this.props.layerInfos[this.state.layerId];
            let adds: Array<IGraphic> = [];
            let updates: Array<IGraphic> = [];
            if(graphic.attributes[layerInfo.idFieldName]){
                updates.push(graphic)
            }
            else{
                adds.push(graphic)
            }
            this.setState({...this.state, loading: true, errorMessage: "", successMessage: ""})
            featureLayersAPI.applyEdits(layerInfo, adds, updates)
            .then(r => {
                if((adds.length > 0 && r.addResults[0].success) || r.updateResults[0].success){
                    if(adds.length > 0){
                        graphic.attributes[layerInfo.idFieldName] = r.addResults[0].objectId;
                    }
                    if(layerInfo.url == eitAppConfig.layers.RegistersFeatureJoint){
                        this.addAttachmentsToFeature(layerInfo, graphic).then(r => {
                            this.setState({...this.state, editingGraphic: graphic, originalGraphic: graphic, loading: false, successMessage: nls.nls.singleEditor.afterSuccessMsg})
                        })
                        .catch(e => {
                            console.error(e);
                            this.setState({...this.state, loading: false, errorMessage: nls.nls.general.errorOccured})
                        })
                    }
                    else{
                        this.setState({...this.state, editingGraphic: graphic, originalGraphic: graphic, loading: false, successMessage: nls.nls.singleEditor.afterSuccessMsg})
                    }
                    
                }
                else{
                    this.setState({...this.state, loading: false, errorMessage: nls.nls.general.errorOccured})
                }
            })
            .catch(e => {
                this.setState({...this.state, loading: false, errorMessage: nls.nls.general.errorOccured })
            })
        }
    }
} 

export const mapStateToProps = (state: IAppStore) => ({
    singleEditor: state.edits.singleEditor,
    layerInfos: state.layerInfos.featureLayerInfos
})

export default connect<OwnProps, DispatchProps, ParentProps>(mapStateToProps, {...editsDispatcher, ...mapDispatcher})(SingleEditorViewContainer)