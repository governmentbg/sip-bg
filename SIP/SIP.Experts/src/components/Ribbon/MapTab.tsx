import * as React from "react";
import { connect } from "react-redux";
import RibbonGroup from "./RibbonGroup";
import RibbonPanel from "./RibbonPanel";
import RibbonButton from "./RibbonButton";
import ToggleWindowRibbonButton from "../Widgets/ToggleWindowRibbonButton";
import EITAppWindow from "../../enums/EITAppWindow";
import { IAppStore } from "../../core/interfaces/reducers/IAppStore";
import { IMapDispatcher } from "../../core/interfaces/dispatchers/IMapDispatcher";
import { IMapView, IExtent, IGeometry } from "../../core/interfaces/models";
import { mapDispatcher } from "../../core/actions/dispatchers";
import { nls } from "../nls";
import MeasureToolContainer from "../Widgets/MeasureToolContainer";
import MapTabSearchGroup from './MapTabSearchGroup';
import IdentifyTools from '../Widgets/IdentifyTools';
import { IEITAppStore } from '../../interfaces/reducers/IEITAppStore';
import eit from '../../reducers/eit';
import { DrawType } from '../../core/enums/DrawType';
import { activateMap } from '../../actions/dispatchers/eitMapDispatcher';
import { IMapAction } from '../../interfaces/dispatchers/IMapActions';


interface OwnProps {
  mapView: IMapView;
  extentContainer: Array<IExtent>;
  extentCurrentIndex: number;
  isLoggedUser: boolean;
  isMapActive: boolean;
  mobile: boolean;
}

interface DispatchProps extends IMapDispatcher, IMapAction { }

interface ParentProps { }

type Props = OwnProps & DispatchProps & ParentProps;


interface State { }

class MapTab extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.identifyByPolygon = this.identifyByPolygon.bind(this)
    this.identifyByRectangle = this.identifyByRectangle.bind(this)
  }

  componentWillMount() {
    if (!this.props.isMapActive) {
      this.props.activateMap(true);
    }
  }

  changeBaseMap(baseMapType: string) {
    let map = this.props.mapView.mapView.map;
    switch (baseMapType) {
      case "imageryWithLabels":
        map.basemap = "hybrid";
        break;

      case "lightGrayCanvas":
        map.basemap = "gray";
        break;

      case "openStreetMap":
        map.basemap = "osm";
        break;

      case "topographic":
        map.basemap = "topo";
        break;

      case "empty":
        map.basemap = "";
        break;
    }
  }

  showLayers() { }

  showLegend() { }

  identifyByRectangle() {
    this.props.activateDraw(DrawType.Rectangle, true, () => { }, (geometry: IGeometry) => {
      if (!(geometry as any).isSelfIntersecting) {
        this.props.identifyToTables(geometry);
      }
    })
  }

  identifyByPolygon() {
    this.props.activateDraw(DrawType.Polygon, true, () => { }, (geometry: IGeometry) => {
      if (!(geometry as any).isSelfIntersecting) {
        this.props.identifyToTables(geometry);
      }
    })
  }

  previousExtent() {
    if (this.props.extentCurrentIndex > 0) {
      let extentContainer = this.props.extentContainer;
      let extentCurrentIndex = this.props.extentCurrentIndex;
      let previousExtentIndex = extentCurrentIndex - 1;
      let previousExtent = extentContainer[previousExtentIndex];
      this.props.isForExtentContainerHandler(false);
      this.props.previousExtent(previousExtentIndex);
      this.props.zoomTo([previousExtent]);
    }
  }

  nextExtent() {
    if (
      this.props.extentContainer &&
      this.props.extentContainer.length - 1 > this.props.extentCurrentIndex
    ) {
      let extentContainer = this.props.extentContainer;
      let extentCurrentIndex = this.props.extentCurrentIndex;
      let nextExtentIndex: number;
      if (extentContainer.length - 1 !== extentCurrentIndex) {
        nextExtentIndex = extentCurrentIndex + 1;
      } else {
        nextExtentIndex = extentContainer.length - 1;
      }
      let nextExtent = extentContainer[nextExtentIndex];
      this.props.isForExtentContainerHandler(false);
      this.props.nextExtent(nextExtentIndex);
      this.props.zoomTo([nextExtent]);
    }
  }

  initialExtent() {
    let homeButtonWidget =
      this.props.mapView && (this.props.mapView as any).homeButtonWidget;
    if (homeButtonWidget) {
      homeButtonWidget.go();
    }
  }

  importData() { }

  render() {
    return (
      <RibbonPanel>
        <RibbonGroup mobile={this.props.mobile} groupName={"Инструменти"}>
          <div style={{ flexDirection: "column", display: "flex", flexGrow: 1 }}>
            <RibbonButton clickHandler={this.identifyByRectangle} imageUrl={"public/eit/Ribbon/IdentifyByRectangle32.png"}
              tooltip={"Зарежда регистър на обекти,\nкоито пресичат изчертаната зона на картата."} size={"S"}>
              {"Правоъгълник"}
            </RibbonButton>
            <div style={{ marginTop: -10 }}>
              <RibbonButton clickHandler={this.identifyByPolygon} imageUrl={"public/eit/Ribbon/IdentifyByPolygon32.png"}
                tooltip={"Зарежда регистър на обекти,\nкоито пресичат изчертаната зона на картата."} size={"S"}>
                {"Полигон"}
              </RibbonButton>
            </div>
          </div>
          {/* <IdentifyTools sizeOfButtons="S" /> */}
          <MeasureToolContainer vertical={false} sizeOfButtons="S" />
        </RibbonGroup>
        <RibbonGroup mobile={this.props.mobile} groupName="Базови карти">
          <RibbonButton
            clickHandler={() => this.changeBaseMap("openStreetMap")}
            imageUrl="public/eit/MapTab/openstreets.png"
            size="L"
            vertical={true}
          >
            <span>{"OpenStreetMap"}</span>
          </RibbonButton>
          <RibbonButton
            clickHandler={() => this.changeBaseMap("topographic")}
            imageUrl="public/eit/MapTab/topographic.png"
            size="L"
            vertical={true}
          >
            <span>{"Topographic"}</span>
          </RibbonButton>
          <RibbonButton
            clickHandler={() => this.changeBaseMap("imageryWithLabels")}
            imageUrl="public/eit/MapTab/imaginerywithlabels.png"
            size="L"
            vertical={true}
          >
            <span>{"Imagery with Labels"}</span>
          </RibbonButton>
          <RibbonButton
            clickHandler={() => this.changeBaseMap("lightGrayCanvas")}
            imageUrl="public/eit/MapTab/lightgreycanvas.png"
            size="L"
            vertical={true}
          >
            <span>{"Light Gray Canvas"}</span>
          </RibbonButton>
          <RibbonButton
            clickHandler={() => this.changeBaseMap("empty")}
            imageUrl="public/eit/MapTab/nobasemap.png"
            size="L"
            vertical={true}
          >
            <span>{"No basemap"}</span>
          </RibbonButton>
        </RibbonGroup>

        {this.props.isLoggedUser ? (
          <RibbonGroup mobile={this.props.mobile} groupName={nls.nls.webGisModule.mapData}>
            <ToggleWindowRibbonButton
              window={EITAppWindow.importData}
              imageUrl="public/eit/Ribbon/ImportData32.png"
              size="S"
              vertical={true}
              tooltip={nls.nls.eitWidgetNames.importData} />
          </RibbonGroup>)
          : (null)
        }

        {this.props.isLoggedUser ? (
          <RibbonGroup mobile={this.props.mobile} groupName="Търсене">
            <MapTabSearchGroup />
          </RibbonGroup>)
          : (null)
        }
      </RibbonPanel>
    );
  }
}

const mapStateToProps = (state: IEITAppStore) => {
  return {
    mapView: state.map.mapView as any,
    extentContainer: state.map.extentContainer,
    extentCurrentIndex: state.map.extentCurrentIndex,
    isLoggedUser: !!state.eit.userInfo.username,
    isMapActive: state.eit.eitMap.isMapActive,
    mobile: state.application.mobile
  };
};

export default connect<OwnProps, DispatchProps>(
  mapStateToProps,
  { ...mapDispatcher, activateMap }
)(MapTab);
