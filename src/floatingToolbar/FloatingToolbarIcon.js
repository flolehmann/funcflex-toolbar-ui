import React, {useState} from 'react';
import {ChatLeftFill} from "react-bootstrap-icons";

import './FloatingToolbar.css';
import {OverlayTrigger, Tooltip} from "react-bootstrap";

function FloatingToolbarIcon(props) {

    const tooltipText = props.tooltipText;

    const renderTooltip = (props) => (
        <Tooltip id="button-tooltip" {...props}>
            {tooltipText}
        </Tooltip>
    );

    return (
        <OverlayTrigger
            placement="right"
            delay={{ show: 120, hide: 225 }}
            overlay={renderTooltip}
        >
            <div onMouseDown={props.onMouseDown} className={"icon"}>
                {props.children}
            </div>
        </OverlayTrigger>
    );
}

export default FloatingToolbarIcon;