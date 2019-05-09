import * as React from "react";

interface Props {
  imageUrl: string;
  vertical?: boolean;
  size?: "S" | "M" | "L";
  tooltip?: string;
  children: any;
  clickHandler?: any;
  disabled?: boolean;
  usedClassesForImage?: string;
  id?: string;
}

const RibbonButton = (props: Props) => {
  var imgSizeStyle: React.CSSProperties = { opacity: props.disabled ? 0.5 : 1 };
  var buttonStyle: any = props.vertical
    ? { flexDirection: "column" }
    : { flexDirection: "row" };
  switch (props.size) {
    case "L":
      imgSizeStyle.width = "60px";
      break;
    case "M":
      imgSizeStyle.width = "40px";
      break;
    default:
      imgSizeStyle.width = "30px";
      break;
  }

  return (
      <div title={props.tooltip}>
        <div
          className={props.disabled ? "ribbon-button-disabled" : "ribbon-button"}
          style={buttonStyle}
          onClick={props.clickHandler}>
          {props.usedClassesForImage ? 
            <span className={props.usedClassesForImage}  style={imgSizeStyle} />
           : 
            <img src={props.imageUrl} style={imgSizeStyle} />
          }
          <div
            className={"ribbonButtonText"}
            style={{ width: props.vertical ? "100%" : "" }}>
            {props.children}
          </div>
        </div>
    </div>
  );
};

export default RibbonButton;
