import React, {useContext, useState, forwardRef, useEffect} from 'react';
import {
    Button,
    ButtonGroup,
    Card,
    CloseButton,
    Col,
    Dropdown,
    Form,
    Image,
    OverlayTrigger,
    Row,
    Tooltip
} from "react-bootstrap";
import {CheckLg, ThreeDotsVertical} from 'react-bootstrap-icons';
import {SidebarContext, AnnotationStatus, LoggerContext, UserContext} from "../App";
import CommentForm from "./CommentForm/CommentForm";
import AiRefinement from "./AiRefinement";
import CopyToClipboard from "./CopyToClipboard";
import {LoggerEvents} from "../logger/logger";
import {dateHelper} from "../utils/Utils";

export const InsertionStatus = Object.freeze({
    "NONE": "NONE",
    "INSERT_AFTER": "INSERT_AFTER",
    "TAKE_OVER": "TAKE_OVER",
    "COPY_TO_CLIPBOARD": "COPY_TO_CLIPBOARD"
});

const Annotation = forwardRef((props, ref) => {

    const csc = useContext(SidebarContext);
    const usc = useContext(UserContext);

    const lc = useContext(LoggerContext);
    const logger = lc.logger;

    const comment = props.comment;
    const markerText = props.markerText;
    const selected = props.selected;
    const selectedAnnotation = props.selectedAnnotation;
    const annotationTop = props.annotationTop;
    const position = props.position;
    const selectHandler = props.selectHandler;
    const changedHeightHandler = props.changedHeightHandler;

    const type = comment.type;
    const id = comment.id;
    const data = comment.data;

    const user = data.user;
    const userName = data.user.name;
    const commentUserName = userName;
    const text = data.text || "";

    const suggestionId = comment.suggestionId;

    let style = {};

    const suggestions = [...usc.userState.users];
    const me = usc.userState.me;

    const date = dateHelper(new Date(data.date));

    const [top, setTop] = useState(position.top);
    const [insertionStatus, setInsertionStatus] = useState(InsertionStatus.NONE);

    useEffect(() => {
        setTop(annotationTop);
    }, [annotationTop]);

    if (position) {
        style = { position: "absolute", top: top + "px" };
        if (selected) {
            style["left"] = "-50px";
        }
    }

    const select = () => {
        if (!selected) {
            csc.setCurrentSelectedCard(type, id, userName);
            selectHandler(id);
        } else {
            csc.unsetCurrentSelectedCard(type, id, userName, true);
            selectHandler();
        }
    }

    const closeButton = <CloseButton onClick={e => {
                csc.deleteAnnotation(id);
                e.stopPropagation();
                e.nativeEvent.stopImmediatePropagation();
            }} />

    const className = selected ? "annotation-card selected" : "annotation-card";

    const approveButton = <OverlayTrigger key={"bottom"}
                                          placement={"bottom"}
                                          overlay={
                                              <Tooltip>
                                                Mark resolved and hide discussion
                                              </Tooltip>
                                          }>
        <Button variant="light" onClick={e => {
            csc.approveComment(id);
            logger(LoggerEvents.COMMENT_APPROVE, {"commentId": id, "type": "primary"});
            e.stopPropagation();
            e.nativeEvent.stopImmediatePropagation();
        }}><CheckLg color="royalBlue"/></Button>
    </OverlayTrigger>


    return (
        <Card ref={ref} id={id} className={className} style={style} onClick={select}>
            <Card.Title>
                <div className={"annotation-info-left"}>
                    Extending...
                </div>
                <div className={"annotation-info-right"}>
                    { closeButton }
                </div>
            </Card.Title>
            <div className={"annotation-content"}>
                { "DISPLAY" }
            </div>
        </Card>
    );
});

export default Annotation;