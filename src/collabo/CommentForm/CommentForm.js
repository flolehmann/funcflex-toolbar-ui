import React, {useContext, useEffect, useState} from 'react';

import '../CommentBallon.css';
import {Button, Col, Form, Row} from "react-bootstrap";
import CommentInput from "./CommentInput";
import {CommentsSidebarContext} from "../../App";

import './CommentForm.css';


function CommentForm(props) {

    const csc = useContext(CommentsSidebarContext);

    const comment = props.comment;
    const top = props.top;
    const suggestions = props.suggestions;
    const me = props.me;
    const changedHeightHandler = props.changedHeightHandler;
    const isReply = props.isReply || false;
    const isEdit = props.isEdit || false;
    const isEditHandler = props.isEditHandler;
    const editReplyHandler = props.editReplyHandler;
    const selectedCard = props.selectedCard;
    const selectHandler = props.selectHandler;
    const commentId = props.commentId;
    const className = props.className;

    const id = comment.id;
    const data = comment.data;

    const user = data.user || "Anonymous";
    const text = data.text || "";

    const [inputText, setInputText] = useState(text);
    const [resetTrigger, setResetTrigger] = useState("");
    const [isFocused, setIsFocused] = useState(false);
    const [isTyping, setIsTyping] = useState(false);

    useEffect(() => {
        changedHeightHandler({
            id: id,
            top: top
        });
    }, [isFocused]);

    useEffect(() => {
        const text = inputText.replace("<br>", "");
        if (text.length > 0) {
            setIsTyping(true);
        } else {
            setIsTyping(false);
        }
    }, [inputText])

    return <Form className={className}>
        <Form.Group className={"form-group"} controlId="formComment" onClick={e => {
            e.stopPropagation();
            e.nativeEvent.stopImmediatePropagation();
        }}>
            <CommentInput className={isReply ? "reply-input" : "comment-input"}
                          inputHtml={inputText}
                          resetTrigger={resetTrigger}
                          interactiveNames={suggestions}
                          me={me}
                          isTyping={isTyping}
                          onFocusHandler={e => {
                              setIsFocused(true);
                          }}
                          inputHandler={(text) => {
                                changedHeightHandler({
                                    id: id,
                                    top: top
                                });
                                setInputText(text);
                            }}
            />
        </Form.Group>
        {(isFocused || isEdit || text === "") && <Row>
            <Col className={"comment-control"}>
                <Button size="sm" variant="primary" disabled={!inputText.replace("<br>", "")} onClick={e => {
                    if (!isEdit) {
                        if (!isReply) {
                            csc.postComment(id, inputText);
                            setIsFocused(false);
                            setResetTrigger(inputText);
                        } else {
                            csc.postReply(id, inputText, user);
                            setIsFocused(false);
                            setResetTrigger(inputText);
                        }
                    } else {
                        if (!isReply) {
                            csc.editComment(id, inputText);
                            setIsFocused(false);
                            setResetTrigger(inputText);
                            isEditHandler(false);
                        } else {
                            csc.editReply(commentId, id, inputText);
                            setIsFocused(false);
                            setResetTrigger(inputText);
                            editReplyHandler("");
                        }
                    }
                    e.stopPropagation();
                    e.nativeEvent.stopImmediatePropagation();
                }}>{isEdit && "Save" || (isReply ? "Reply" : "Comment")}</Button>
                <Button size="sm" variant="outline-secondary" onClick={e => {
                    if (!isEdit) {
                        if (!isReply) {
                            if (selectedCard === id) {
                                selectHandler();
                            }
                            console.log("THE ID", id);
                            csc.cancelComment(id);
                            setIsFocused(false);
                            setResetTrigger(inputText);
                        } else {
                            setIsFocused(false);
                            setResetTrigger(inputText);
                        }
                    } else {
                        if (isReply) {
                            editReplyHandler("");
                        } else {
                            isEditHandler(false);
                        }
                        setIsFocused(false);
                        setResetTrigger(inputText);
                    }
                    e.stopPropagation();
                    e.nativeEvent.stopImmediatePropagation();
                }}>Cancel</Button>
            </Col>
        </Row> }
    </Form>

}

export default CommentForm;


