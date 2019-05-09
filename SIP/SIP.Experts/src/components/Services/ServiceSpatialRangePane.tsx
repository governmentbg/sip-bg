import * as React from "react";
import { connect } from 'react-redux';
import { IEITAppStore, IUserInfo } from "../../interfaces/reducers/IEITAppStore";
import OverlayLoader from "../../core/components/Loading/OverlayLoading";
import FloatingLabelInput from "../Widgets/FloatingLabelInput";
import { InputValueType } from "../Widgets/FloatingLabelInput";
import { nls } from "../nls";
import { mapDispatcher, tableDispatcher, mosaicLayoutDispatcher } from "../../core/actions/dispatchers";
import { IMapDispatcher, IFeatureTableDispatcher, IMosaicLayoutDispatcher } from "../../core/interfaces/dispatchers";
import { DrawType } from "../../core/enums/DrawType";
import { IGraphic, IGeometry, IFeatureLayerInfo, ITableConfig, } from '../../core/interfaces/models';
import { eitAppConfig } from "../../eitAppConfig";
import geometryEngine = require('esri/geometry/geometryEngine');
import Polygon = require("esri/geometry/Polygon");
import ServiceSpatialResult from "./ServiceSpatialResult";
import { IServiceWizardParameterDispatcher } from './ServiceWizardBase';
import { IServiceFormInternalState } from './ServiceWizardBase';
import "../../css/ribbon.scss";
import EITAppWindow from '../../enums/EITAppWindow';
import axios, { AxiosResponse } from "axios";
import Geoprocessor = require('esri/tasks/Geoprocessor');
import { isNullOrUndefined } from 'util';
import { object } from 'prop-types';
import { v4 as uuid } from 'uuid';

interface InternalState extends IServiceFormInternalState {
    isPreview: boolean;
    uniqueServiceID: string;
    username: string;
    spatialRange?: IGeometry;
    graphic?: IGraphic;
    data: Array<IGraphic>;
    vectorDataSelected: boolean;
    spatialRangeArea: number;
    amountDue: number;
    operator_keyword?: string;
    operator_types?: string;
}

interface ParentProps extends IServiceWizardParameterDispatcher {
    vectorDataChoiceAvailable: boolean;
    isPreview: boolean;
    previousState: Partial<InternalState>;
    serviceFee: number;
    vectorServiceFee: number;
    //getSpatialRange: (spatialRange: IGeometry | undefined) => void;
}

interface OwnProps {
    loading: boolean;
    layerInfos: { [url: string]: IFeatureLayerInfo };
    sizeOfButtons?: "L" | "M" | "S";
    vertical?: boolean;
    userInfo: IUserInfo;
}


interface DispatchProps extends IMapDispatcher, IFeatureTableDispatcher, IMosaicLayoutDispatcher {
}

type Props = DispatchProps & OwnProps & ParentProps;

class ServiceSpatialRangePane extends React.Component<Props, InternalState> {
    constructor(props: Props) {
        super(props);
        this.state = {
            loading: false,
            formIsValid: false,
            isPreview: !!this.props.isPreview,
            // ServiceParameters start
            uniqueServiceID: this.getUniqueServiceID(props),
            username: this.getUserName(props),
            spatialRange: this.getSpatialRange(props),
            vectorDataSelected: this.getVectorDataSelected(props),
            spatialRangeArea: this.getSpatialRangeArea(props),
            amountDue: this.getAmountDue(props),
            // ServiceParameters end
            graphic: this.props.previousState ? this.props.previousState.graphic : undefined,
            data: this.props.previousState ? this.props.previousState.data || [] : [],
            operator_keyword: undefined,
            operator_types: undefined,
        }
    }

    onStateChange = (partialState: Partial<InternalState>): void => {
        let newState: InternalState = {
            ...this.state,
            ...partialState,
            formIsValid: this.getFormIsValid({
                ...this.state,
                ...this.props.previousState,
                ...partialState,
            })
        }
        this.setState(newState);
        if (this.props.onStateChange) {
            this.props.onStateChange(newState);
        }
    }

    getFormIsValid = (state: InternalState): boolean => {
        return [3, 4].lastIndexOf(this.props.serviceNr) > -1 || !!state.spatialRange;
    }

    componentWillMount() {
        this.onStateChange({
            ...this.state,
            ...this.props.previousState,
            formIsValid: this.getFormIsValid({
                ...this.state,
                ...this.props.previousState,
            }),
        });
        //if (!this.props.loading) {
        //    this.onDraw(DrawType.Rectangle);
        //}
    }
    componentWillUnmount() {
        this.props.deactivateDraw();
        if (this.state.graphic) {
            this.props.unMark();
        }
    }
    componentWillReceiveProps(props: Props) {
        if (this.state.username != this.getUserName(props)) {
            this.onStateChange({
                username: this.getUserName(props),
            });
        }
        // On current service change:
        if (this.state.uniqueServiceID != this.getUniqueServiceID(props)) {
            this.onStateChange({
                uniqueServiceID: this.getUniqueServiceID(props),
                spatialRange: this.getSpatialRange(props),
                vectorDataSelected: this.getVectorDataSelected(props),
                spatialRangeArea: this.getSpatialRangeArea(props),
                amountDue: this.getAmountDue(props),
            });
        }
        if (this.state.isPreview != props.isPreview) {
            this.onStateChange({
                ...props.previousState,
                isPreview: props.isPreview,
            });
        }
        //if (props.serviceNr == 4) {
            // TODO...
        //}
    }

    componentDidUpdate() {
        // if (!(this.state.graphic === this.props.previousState.graphic)) {
        //     if (this.state.spatialRange) {
        //         if (this.props.getSpatialRange) {
        //             this.props.getSpatialRange(this.state.spatialRange);
        //         }
        //     }
        // }
    }

    getUniqueServiceID = (props: Props): string => {
        if (props.previousState) {
            return props.previousState.uniqueServiceID || '';
        }
        return uuid();
    }
    getUserName = (props: Props): string => {
        return props.userInfo ? props.userInfo.username || "" : ""
    }
    getIsPrivilegedUser = (userInfo: IUserInfo) => {
        return userInfo.isAdmin || userInfo.isRegulator || userInfo.isMunicipality;
    }

    getSpatialRange = (props: Props): IGeometry | undefined => {
        if (props.previousState) {
            return props.previousState.spatialRange;
        }
        return undefined;
    }
    getVectorDataSelected = (props: Props): boolean => {
        if (props.previousState) {
            return props.previousState.vectorDataSelected || false;
        }
        return false;
    }
    getSpatialRangeArea = (props: Props): number => {
        if (props.previousState) {
            return props.previousState.spatialRangeArea || 0;
        }
        return 0;
    }

    getAmountDue = (props: Props): number => {
        if (props.previousState) {
            return props.previousState.amountDue || 0;
        }
        return 0;
    }

    getTableConfig = (geometry?: IGeometry): ITableConfig => {
        let layerInfo =  this.props.layerInfos[this.getFeatureLayerInfoId()];
        if(!layerInfo){
            throw new Error(`${this.getFeatureLayerInfoId()} not found. Please check failed and denied services`);
        }
        let where: string = "1 = 1";
        if (this.state.operator_types) {
            where += " and " + this.state.operator_types;
        }
        if (this.state.operator_keyword) {
            where += " and upper(name) like '%" + this.state.operator_keyword.toUpperCase() + "%'";
        }
        return {
            query: {
                outFields: ["*"],
                where: where,
                geometry: geometry
            },
            title: this.getResultTableTitle(),
            id: layerInfo.url,
            selectedIds: {} // if not specified the table will not be selectable
        };
    }

    showAndLoadTables = (tableConfig: ITableConfig) => {
        this.props.removeTabs([], []);
        this.props.showWindow(EITAppWindow.tables.toString());
        this.props.setTableVisibility({[tableConfig.id]: tableConfig.id});
        this.props.setQuerySyncFeatureTable([tableConfig]);
    }

    showAndLoadTablesAsync = (tableConfig: ITableConfig) => {
        this.props.removeTabs([], []);
        this.props.showWindow(EITAppWindow.tables.toString());
        this.props.setTableVisibility({[tableConfig.id]: tableConfig.id});
        this.props.setAsyncFeatureTableTabData([tableConfig]);
    }

    onDraw = (type: DrawType): void => {
        console.log('DrawType: ' + type);
        this.props.unMark();
        this.onStateChange({
            spatialRange: undefined,
            graphic: undefined,
            spatialRangeArea: 0,
            amountDue: 0,
        });
        this.props.activateDraw(type, true, () => { }, this.setSpatialRange);
    }

    setSpatialRange = (geometry: IGeometry): void => {
        if(([3, 4].indexOf(this.props.serviceNr) > -1)) {
            if (!(geometry as any).isSelfIntersecting) {
                this.showAndLoadTables(this.getTableConfig(geometry))
                this.onStateChange({
                    spatialRange: undefined,
                    graphic: undefined,
                });
                return;
            }
        }
        if (geometry) {
            let graphic = {
                geometry: geometry,
                attributes: {},
                symbol: {
                    type: "simple-fill",
                    color: [203, 239, 252],
                    style: "solid",
                    outline: {
                        color: [0, 0, 0],
                        width: 2
                    }
                }
            };
            let spatialRangeArea: number = Math.abs(geometryEngine.geodesicArea(geometry as Polygon, 'square-meters'));
            this.props.mark([], [graphic])
            this.onStateChange({
                spatialRange: geometry,
                graphic: graphic,
                spatialRangeArea: spatialRangeArea,
                amountDue: this.calculateAmountDue(spatialRangeArea),
            });
        }
    }

    onVectorDataCheckBoxValueChanged = (event: React.ChangeEvent<HTMLInputElement>): void => {
        let newValue: boolean = event.target.checked;
        this.onStateChange({
            vectorDataSelected: newValue,
        });
    }

    onValueChange = (newValue: InputValueType, fieldHasError: boolean, fieldName: string): void => {
        //if (fieldName == 'operator_keyword') {
        //    console.log('operator_keyword');
        //    console.log(newValue);
        //}
        this.onStateChange({
            ...this.state,
            [fieldName]: newValue as string,
        });
    }

    calculateAmountDue = (spatialRangeArea: number): number => {
        if (this.getIsPrivilegedUser(this.props.userInfo)) {
            return 0;
        }
        return this.props.serviceFee * this.getSqureKilometers(spatialRangeArea) +
            (this.state.vectorDataSelected ? this.props.vectorServiceFee * this.getSqureKilometers(spatialRangeArea) : 0);
    }

    getResultTableTitle = (): string => {
        switch (this.props.serviceNr) {
            case 3:
                return nls.nls.eitWidgetNames.adService3Wizard;
            case 4:
                return nls.nls.eitWidgetNames.adService4Wizard;
        }
        return "";
    }

    getFeatureLayerInfoId = (): string => {
        let featureLayerInfoId: string = "";
        switch (this.props.serviceNr) {
            case 3:
                featureLayerInfoId = eitAppConfig.layers.Register1ServiceUrl;
                break;
            case 4:
                featureLayerInfoId = eitAppConfig.layers.RegistersOrganizations;
                break;
        }
        return featureLayerInfoId;
    }

    onLoadingChange = (loading: boolean): void => {
        this.onStateChange({
            loading: loading,
        });
    }

    getSqureKilometers = (squareMeters: number): number => {
        return squareMeters / 1000000;
    }

    formatDouble = (value: number, fractionDigits: number): string => {
        return value.toLocaleString('en', { useGrouping: true, minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits }).replace(/,/g, ' ').replace('.', ',');
    }

    formatArea = (value: number): string => {
        return this.formatDouble(this.getSqureKilometers(value), 2) + ' ' + nls.nls.webGisModule.sqrKilometers;
        //return this.getSqureKilometers(value).toFixed(3).replace('.', ',') + ' ' + nls.nls.webGisModule.sqrKilometers;
    }

    formatAmount = (value: number): string => {
        return this.formatDouble(value, 2) + ' ' + nls.nls.serviceWizard.signingAndPayment.amountCurrency;
    }

    onAutoCompleteOrganizationSelection = (args: any): void => {
        if (args && args.attribute && args.attribute.length == 2) {
            //console.log('onAutoCompleteOrganizationSelection');
            //console.log(args.attribute[0].name.toString());
            this.onStateChange({
                operator_keyword: args.attribute[0].name.toString(),
            });
        }
        else {
            //this.onStateChange({
            //    operator_keyword: '',
            //});
        }
    }

    render() {
        let amountDue: number = this.state.amountDue; // this.calculateAmountDue(this.state.spatialRangeArea);
        let autocompleteOrganizationLayers = {
            [eitAppConfig.layers.RegistersOrganizations]: {
                alias: "Община",
                searchField: "name||' '||shortname",
                returnFields: "name,id",
                displayPattern: "{name}",
                whereClause: this.state.operator_types ? this.state.operator_types : "1 = 1",
            },
        };
        return (
            <div className="vertical-flex-container"
                style={{ width: "100%", height: "100%", paddingRight: "10px" }}>
                <OverlayLoader size="60px" show={this.state.loading} />
                {!this.state.isPreview ?
                    <div className="flex-auto vertical-flex-container">
                        <p className="flex-item flex-auto" style={{marginTop: "20px"}}>{nls.nls.serviceWizard.spatialRange.instrumentsByService[this.props.serviceNr]}</p>
                    </div> :
                    null
                }
                {
                    this.props.serviceNr == 4?
                        <React.Fragment>
                            <FloatingLabelInput
                                className="flex-item flex-auto"
                                placeholder={nls.nls.serviceWizard.spatialRange.organizationType}
                                /* selectorItems={{ '': '', '(1,4,9)': 'Мрежови оператор', '(4)': 'Община', '(2,9)': 'Компетентен орган', '(3)': 'Регулаторен орган', '(2,3,9)': 'Компетентен/Регулаторен орган' }} */
                                selectorItems={nls.nls.serviceWizard.spatialRange.organizationTypes}
                                value={this.state.operator_types}
                                onValueChange={(newValue: InputValueType, hasError: boolean) => this.onValueChange(newValue, hasError, 'operator_types')} />
                            <FloatingLabelInput
                                className="flex-item flex-auto"
                                placeholder={nls.nls.serviceWizard.spatialRange.organizationName}
                                autoComplete={true}
                                value={this.state.operator_keyword}
                                onValueChange={(newValue: InputValueType, hasError: boolean) => this.onValueChange(newValue, hasError, 'operator_keyword')}
                                autoCompleteSearchLayerInfo={autocompleteOrganizationLayers}
                                onAutoCompleteSelection={this.onAutoCompleteOrganizationSelection} />
                            
                            <div className="flex-auto horizontal-wrapping-flex-container"
                            style={{ paddingBottom: "10px", paddingTop: "10px" }}>
                            <button className="flex-item appBtn"
                                onClick={(event: React.MouseEvent<HTMLElement>) => this.showAndLoadTablesAsync(this.getTableConfig(undefined))}
                                style={{ height: "30px", flexGrow: 0, flexBasis: "165px", marginBottom: "10px" }}>
                                    <img src="public/eit/Ribbon/Search32.png" style={{ width: "20px", height: "20px" }} />
                                    <span>&nbsp;{nls.nls.serviceWizard.spatialRange.searchEverywhere}</span>
                            </button>
                            </div>
                            {/* <hr style={{border: "0", height: "1px",  background: "#333", backgroundImage: " linear-gradient(to right, #ccc, #333, #ccc)"}}></hr> */}
                            <div className="flex-auto vertical-flex-container">
                                <p className="flex-item flex-auto" style={{ marginTop: "20px", fontSize: " 16px", lineHeight: "22px" }}>{nls.nls.serviceWizard.spatialRange.AOI}</p>
                            </div>
                        </React.Fragment> :
                        null
                }
                {!this.state.isPreview ?
                    <React.Fragment>
                        <div className="flex-auto horizontal-wrapping-flex-container"
                            style={{ paddingBottom: "10px", paddingTop: "10px" }}>
                            <button className="flex-item flex-auto appBtn"
                                onClick={(event: React.MouseEvent<HTMLElement>) => this.onDraw(DrawType.Rectangle)}
                                style={{ height: "30px", flexGrow: 0, flexBasis: "150px", marginBottom: "10px" }}>
                                <img src="public/eit/DrawingTools/Rectangle32.png" style={{ width: "20px", height: "20px" }} />
                                <span>&nbsp;{nls.nls.serviceWizard.spatialRange.drawRectangle}</span>
                            </button>
                            {(this.props.serviceNr > 2) ? 
                            (<button className="flex-item appBtn"
                                onClick={(event: React.MouseEvent<HTMLElement>) => this.onDraw(DrawType.Circle)}
                                style={{ height: "30px", flexGrow: 0, flexBasis: "150px", marginBottom: "10px" }}>
                                <img src="public/eit/DrawingTools/Point32.png" style={{ width: "20px", height: "20px" }} />
                                <span>&nbsp;{nls.nls.serviceWizard.spatialRange.drawCircle}</span>
                            </button>)
                            : (null)
                            }
                            <button className="flex-item appBtn"
                                onClick={(event: React.MouseEvent<HTMLElement>) => this.onDraw(DrawType.Polygon)}
                                style={{ height: "30px", flexGrow: 0, flexBasis: "150px", marginBottom: "10px" }}>
                                <img src="public/eit/DrawingTools/Polygon32.png" style={{ width: "20px", height: "20px" }} />
                                <span>&nbsp;{nls.nls.serviceWizard.spatialRange.drawPolygon}</span>
                            </button>
                            
                        </div>
                    </React.Fragment>
                    : null
                }
                <div className="flex-auto vertical-flex-container">
                    {
                        this.props.isPreview ?
                            <div className="flex-auto horizontal-wrapping-flex-container"
                                style={{ paddingBottom: "0px", marginTop: "25px", flexWrap: "nowrap", justifyContent: "flex-start" }}>
                                <p className="flex-item flex-auto">{nls.nls.serviceWizard.spatialRange.previewTitle}</p>
                            </div>
                            : null
                    }
                    {
                        [1, 2].indexOf(this.props.serviceNr) > -1 ?
                            <div className="flex-auto horizontal-wrapping-flex-container"
                                style={{ paddingBottom: "10px", paddingTop: "5px", flexWrap: "nowrap", justifyContent: "flex-start" }}>
                                <p className="flex-item flex-auto">{nls.nls.serviceWizard.spatialRange.description}{this.formatArea(this.state.spatialRangeArea)}</p>
                                {
                                    this.props.isPreview ?
                                        <img style={{
                                            height: "25px", width: "25px",
                                            opacity: (this.state.spatialRange ? 1 : 0.5),
                                            cursor: (this.state.spatialRange ? "pointer" : "")
                                        }} src="public/icons/zoomTo.svg"
                                            onClick={() => {
                                                if (this.state.spatialRange) {
                                                    this.props.zoomTo!([this.state.spatialRange]);
                                                    if (this.props.unMark) {
                                                        this.props.unMark();
                                                    }
                                                    if (this.props.mark) {
                                                        this.props.mark([this.state.spatialRange], []);
                                                    }
                                                }
                                            }} />
                                        : null
                                }
                            </div>
                            : null
                    }
                    {
                        this.props.vectorDataChoiceAvailable ?
                            <div className="flex-auto vertical-flex-container"
                                style={{ marginBottom: "10px", marginTop: "10px", fontSize: "1.2em" }}>
                                <FloatingLabelInput
                                    className="flex-item flex-auto"
                                    placeholder={nls.nls.serviceWizard.spatialRange.vectorDataCheckBox}
                                    type='checkbox'
                                    value={this.state.vectorDataSelected}
                                    key={'vectorDataSelected'}
                                    isDisabled={this.props.isPreview}
                                    onValueChange={(newValue: InputValueType, hasError: boolean) => this.onValueChange(newValue, hasError, 'vectorDataSelected')} />
                            </div>
                            :
                            null
                    }
                    {
                        (amountDue > 0) ? // this.props.serviceFee > 0 && amountDue > 0 && !this.state.isPreview) ?
                            <div className="flex-auto vertical-flex-container"
                                style={{ paddingBottom: "10px", paddingTop: "10px" }}>
                                <p className="flex-item flex-auto">{nls.nls.serviceWizard.signingAndPayment.amounDue}{this.formatAmount(amountDue)}.</p>
                            </div>
                            : null
                    }
                </div>
                {/* {
                    ([3, 4].indexOf(this.props.serviceNr) > -1) && this.state.graphic ?
                        <React.Fragment>
                            <p className="flex-item flex-auto" style={{ flexShrink: 0, fontSize: "95%", textIndent: "1em" }}>{this.getResultTableTitle()}</p>
                            <div className="flex-scalable" style={{ flexShrink: 0, height:"100%"}}>
                                <ServiceSpatialResult
                                        className="flex-item"
                                        featureLayerInfoId={this.getFeatureLayerInfoId()}
                                        graphic={this.state.graphic}
                                        where={this.state.where}
                                        onLoadingChange={this.onLoadingChange} />
                            </div>
                        </React.Fragment>
                        : null
                } */}
            </div>
        )
    }
}

const mapStateToProps = (state: IEITAppStore) => ({
    layerInfos: state.layerInfos.featureLayerInfos,
    loading: !state.map.webMapImported,
    userInfo: state.eit.userInfo,
})

export default connect<OwnProps, DispatchProps, any>(mapStateToProps, { ...mapDispatcher, ...tableDispatcher, ...mosaicLayoutDispatcher })(ServiceSpatialRangePane);
