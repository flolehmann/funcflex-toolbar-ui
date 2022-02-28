import React, {useEffect, useRef, useState} from 'react';
import {ChatLeftFill} from "react-bootstrap-icons";

import './FloatingToolbar.css';

function FloatingToolbar(props) {

    const ref = useRef(null);
    const [toolbarHeight, setToolbarHeight] = useState(0);

    useEffect(() => {
        setToolbarHeight(ref.current.clientHeight)
    });

    const isVisible = props.isVisible && props.caretPosition;

    const top = props.caretPosition ? props.caretPosition.top : 0;
    const bottom = props.caretPosition ? props.caretPosition.bottom : 0;
    const left = props.ckEditorWidth ? props.ckEditorWidth : 0;

    const caretHeight = bottom - top;

    const diffToolbarCaret = toolbarHeight - caretHeight;
    const yOffsetToolbar = diffToolbarCaret / 2;
    const scrollYOffset = window.scrollY;

    return (
        <div ref={ref} className={"floating-toolbar"}
             style={{
                 display: isVisible ? "flex" : "none",
                 position: "absolute",
                 zIndex: 1000,
                 width: "40px",
                 top: (top - yOffsetToolbar - props.ckEditorOffsetTop + scrollYOffset) + "px",
                 left: (left - 20) + "px"
             }}>
            {props.children}
        </div>
    );
}

export default FloatingToolbar;