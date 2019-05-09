import * as React from 'react';
import RibbonButton from "./RibbonButton";
import RibbonPanel from "./RibbonPanel";
import RibbonGroup from "./RibbonGroup";


export default class SearchTools extends React.Component<{mobile: boolean}, {}> {
    render() {
        return (
            <RibbonPanel>
                <RibbonGroup groupName="" mobile={this.props.mobile}>
                    <div style={{ display: "flex", flexDirection: "column", msFlexPositive: 1, flexGrow: 1 }}>
                        <div style={{ display: "flex", flexDirection: "row" }}>
                            <div style={{maxHeight: "20px"}}>Ключови думи</div>
                            <input/>
                        </div>
                        <div style={{ display: "flex", flexDirection: "row" }}>
                            <div style={{maxHeight: "20px"}}>Тип</div>
                            <select>
                                <option value="all">Всички</option>
                                <option value="11">Пример</option>
                            </select>
                        </div>
                        <div style={{ display: "flex", flexDirection: "row" }}>
                            <div style={{maxHeight: "20px"}}>Обхват</div>
                            <select>
                                <option value="all">Всички</option>
                                <option value="11">Пример</option>
                            </select>
                        </div>
                    </div>
                    <RibbonButton
                        clickHandler={() => {}}
                        imageUrl=""
                        size="M"
                        vertical={true}>
                        <span>{"Търси"}</span>
                    </RibbonButton>
                </RibbonGroup>
            </RibbonPanel>
        );
    }
}