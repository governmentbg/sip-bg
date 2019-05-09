import * as React from "react";
import { connect } from "react-redux";
import { IEITAppStore } from "../../interfaces/reducers/IEITAppStore";
import { IMapView, IGeometry } from "../../core/interfaces/models";
import { mapDispatcher } from "../../core/actions/dispatchers";
import { IMapDispatcher } from "../../core/interfaces/dispatchers";
import { DrawType } from "../../core/enums/DrawType";
import RibbonButton from "../Ribbon/RibbonButton";
import { Polyline, Polygon, Geometry, Point } from "esri/geometry";
import Draw = require("esri/views/2d/draw/Draw");
import Graphic = require("esri/Graphic");
import GeometryEngine = require("esri/geometry/geometryEngine");
import MapView = require("esri/views/MapView");
import { nls } from "../nls";

interface OwnProps {
  mapView: IMapView;
}

interface ParentProps {
    sizeOfButtons?: "L" | "M" | "S";
    vertical?: boolean;
}

interface DispatchProps extends IMapDispatcher {}

type Props = DispatchProps & ParentProps & OwnProps;

interface State {}

class MeasureToolContainer extends React.Component<Props, State> {
  draw: Draw;
  drawType: string;
  constructor(props: Props) {
    super(props);

    this.handleClick = this.handleClick.bind(this);
    this.drawPolygon = this.drawPolygon.bind(this);
    this.labelAreas = this.labelAreas.bind(this);
    this.drawPolyline = this.drawPolyline.bind(this);
    this.labelLineLength = this.labelLineLength.bind(this);
    this.measureArea = this.measureArea.bind(this);
    this.measureDistance = this.measureDistance.bind(this);
  }
  measureDistance() {
    this.drawType = "polyline";
    this.handleClick();
  }

  measureArea() {
    this.drawType = "polygon";
    this.handleClick();
  }
  calculateDistance(
    firstPointX: number,
    secondPointX: number,
    firstPointY: number,
    secondPointY: number
  ) {
    let dX = secondPointX - firstPointX;
    let dY = secondPointY - firstPointY;
    return Math.sqrt(dX * dX + dY * dY);
  }

  createDrawAction() {
    let mapView = this.props.mapView.mapView as MapView;
    this.draw = new Draw({
      view: mapView
    });
    // this.draw.complete();
    // this.draw.reset();
    return this.draw.create(this.drawType);
  }

  handleClick() {
    if (this.draw) {
      this.draw.destroy();
    }
    let drawAction = this.createDrawAction();
    if (this.drawType === DrawType.Polygon) {
      drawAction.on("vertex-add", this.drawPolygon);
      drawAction.on("cursor-update", this.drawPolygon);
      drawAction.on("vertex-remove", this.drawPolygon);
      drawAction.on("redo", this.drawPolygon);
      drawAction.on("undo", this.drawPolygon);
      drawAction.on("draw-complete", this.drawPolygon);
    } else if (this.drawType === DrawType.Polyline) {
      drawAction.on("vertex-add", this.drawPolyline);
      drawAction.on("cursor-update", this.drawPolyline);
      drawAction.on("vertex-remove", this.drawPolyline);
      drawAction.on("redo", this.drawPolyline);
      drawAction.on("undo", this.drawPolyline);
      drawAction.on("draw-complete", (evt: any) => {
        this.drawPolyline(evt);
        // console.log('darwend')
        // console.log(this.draw.destroyed)
        // this.draw.destroy();
      });
    }
  }

  drawComplete(drawTypeFunc: Function) {
    drawTypeFunc();

  }

  drawPolygon(event: any) {
    let vertices = event.vertices;
    console.log(vertices)
    //remove existing graphic
    this.props.mapView.mapView.graphics.removeAll();

    let polygon = new Polygon({
      rings: vertices,
      spatialReference: this.props.mapView.mapView.spatialReference
    });

    let graphic = new Graphic({
      geometry: polygon,
      symbol: {
        type: "simple-fill",
        color: [203, 239, 252],
        style: "solid",
        outline: {
          color: [0, 0, 0],
          width: 2
        }
      }
    });

    this.props.mapView.mapView.graphics.add(graphic);

    let area = GeometryEngine.geodesicArea(polygon, "square-meters");
    if (area < 0) {
      let simplifiedPolygon = GeometryEngine.simplify(polygon) as Polygon;
      if (simplifiedPolygon) {
        area = GeometryEngine.geodesicArea(simplifiedPolygon, "square-meters");
      }
    }
    if (area === -0) {
      area = 0;
    }
    this.labelAreas(polygon, area);
  }

  labelAreas(geom: Polygon, area: number) {
    const format = new Intl.NumberFormat("bg-BG", {useGrouping: true, maximumSignificantDigits: 2});
    const areaFormated = format.format(area);
    let graphic = new Graphic({
      geometry: geom.centroid,
      symbol: {
        type: "text",
        color: "black",
        haloColor: "black",
        haloSize: "1px",
        //text: area.toFixed(2) + " " + nls.nls.webGisModule.sqrMeters,
        text: areaFormated + " " + nls.nls.webGisModule.sqrMeters,
        xoffset: 3,
        yoffset: 3,
        font: {
          size: 14,
          family: "sans-serif"
        }
      }
    });
    this.props.mapView.mapView.graphics.add(graphic);
  }

  drawPolyline(event: any) {
    let vertices = event.vertices;

    //remove existing graphic
    this.props.mapView.mapView.graphics.removeAll();

    let polyline = new Polyline({
      paths: vertices,
      spatialReference: this.props.mapView.mapView.spatialReference
    });

    let graphic = new Graphic({
      geometry: polyline,
      symbol: {
        type: "simple-line",
        color: [0, 0, 0],
        width: 2
      }
    });
    this.props.mapView.mapView.graphics.add(graphic);
    let leng = GeometryEngine.geodesicLength(polyline, "meters");
    this.labelLineLength(polyline, leng);
  }

  labelLineLength(geom: Polyline, leng: number) {
    let labelGeometry = this.calculateLineCenter(geom.paths);
    if (labelGeometry) {
      let graphic = new Graphic({
        geometry: labelGeometry,
        symbol: {
          type: "text",
          color: "black",
          haloColor: "black",
          haloSize: "1px",
          text: leng.toFixed(2) + " " + nls.nls.webGisModule.meters,
          xoffset: 3,
          yoffset: 3,
          font: {
            size: 14,
            family: "sans-serif"
          }
        }
      });
      this.props.mapView.mapView.graphics.add(graphic);
    }
  }

  calculateLineCenter(
    linePaths: Array<Array<Array<number>>>
  ): Point | undefined {
    let point: Point;

    let paths = linePaths[linePaths.length - 1];
    let lastPoint = paths[paths.length - 1];
    let beforeLastPoint = paths[paths.length - 2];

    if (!beforeLastPoint) {
      return;
    }

    point = new Point({
      x: (beforeLastPoint[0] + lastPoint[0]) / 2.0,
      y: (beforeLastPoint[1] + lastPoint[1]) / 2.0,
      spatialReference: this.props.mapView.mapView.spatialReference
    });

    return point;
  }

  render() {
    return (
      <div style={{ flexDirection: this.props.vertical? "row":"column", display: "flex", flexGrow: 1 }}>
        <RibbonButton
          clickHandler={this.measureDistance}
          imageUrl="public/eit/DrawingTools/MeasureTool32.png"
          tooltip={nls.nls.ribbon.measureDistance}
          vertical={this.props.vertical ? true : false }
          size={this.props.sizeOfButtons ||  "M"}
        >
          {nls.nls.webGisModule.measureDistance}
        </RibbonButton>
        <div style={{marginTop:-10}}>
        <RibbonButton
          clickHandler={this.measureArea}
          imageUrl="public/eit/DrawingTools/MeasureAreaTool32.png"
          tooltip={nls.nls.ribbon.measureArea}
          size={this.props.sizeOfButtons ||  "M"}
          vertical={this.props.vertical? true: false}
        >
          {nls.nls.webGisModule.measureArea}
        </RibbonButton>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state: IEITAppStore) => ({
  mapView: state.map.mapView,
});

export default connect<OwnProps, DispatchProps, ParentProps>(
  mapStateToProps,
  { ...mapDispatcher }
)(MeasureToolContainer);
