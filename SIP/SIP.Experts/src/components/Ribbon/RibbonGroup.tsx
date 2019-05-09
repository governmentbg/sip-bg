import * as React from 'react';

interface Props {
    viewType?: any;
    children?: any;
    groupName: string;
    searchChildren?: any;
    mobile: boolean;
}

export default (props: Props) => {
    return (
        <div className="ribbon-group">
            <div className="ribbon-group-content" style={{maxHeight: props.mobile ? "unset" : "84px"}}>{props.children}</div>
            <div className="ribbon-group-name">{props.groupName}</div>
        </div>
    )
}