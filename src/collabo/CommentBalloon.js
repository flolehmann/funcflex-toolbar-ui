import React, {useState} from 'react';
import {ChatLeftFill} from "react-bootstrap-icons";

import './CommentBallon.css';
import {Button, Col, Form, Row} from "react-bootstrap";
import CommentInput from "./CommentForm/CommentInput";

function CommentBalloon(props) {

    // console.log(props.caretPosition);
    // console.log(props.isVisible);
    // console.log(props.caretPosition);

    const isVisible = props.isVisible && props.caretPosition;

    const top = props.caretPosition ? props.caretPosition.top : 0;
    const bottom = props.caretPosition ? props.caretPosition.bottom : 0;
    const left = props.ckEditorWidth ? props.ckEditorWidth : 0;

    const caretHeight = bottom - top;

    const balloonHeight = 40;

    const diffCaretBalloon = balloonHeight - caretHeight;
    const yOffsetBalloon = diffCaretBalloon / 2;
    const scrollYOffset = window.pageYOffset;

    return (
        <div onMouseDown={props.onMouseDown} className={"comment-balloon"}
             style={{
                 display: isVisible ? "flex" : "none",
                 position: "absolute",
                 zIndex: 2000,
                 width: "30px",
                 height: balloonHeight + "px",
                 top: (top - yOffsetBalloon + scrollYOffset) + "px",
                 left: (left - 15) + "px"
             }}>
            <ChatLeftFill />
        </div>
    );
}

export default CommentBalloon;