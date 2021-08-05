import React, {useContext, useEffect, useState} from 'react';
import {ChatLeftFill} from "react-bootstrap-icons";

import '../CommentBallon.css';
import {Button, Col, Form, Row} from "react-bootstrap";
import CommentInput from "./CommentInput";
import {CommentsSidebarContext} from "../../App";

function CommentForm(props) {

    const csc = useContext(CommentsSidebarContext);

    const comment = props.comment;
    const top = props.top;
    const suggestions = props.suggestions;
    const changedHeightHandler = props.changedHeightHandler;
    const isReply = props.isReply || false;
    const isEdit = props.isEdit || false;
    const isEditHandler = props.isEditHandler;
    const editReplyHandler = props.editReplyHandler;
    const selectedCard = props.selectedCard;
    const selectHandler = props.selectHandler;
    const commentId = props.commentId;

    const id = comment.id;
    const data = comment.data;

    const user = data.user || "Anonymous";
    const text = data.text || "";

    const [inputText, setInputText] = useState(text);
    const [resetTrigger, setResetTrigger] = useState("");
    const [isFocused, setIsFocused] = useState(false);

    useEffect(() => {
        changedHeightHandler({
            id: id,
            top: top
        });
    }, [isFocused]);

    return <Form>
        <Form.Group className="mb-3" controlId="formComment" onClick={e => {
            e.stopPropagation();
            e.nativeEvent.stopImmediatePropagation();
        }}>
            <CommentInput className={isReply ? "reply-input" : "comment-input"}
                          inputHtml={inputText}
                          resetTrigger={resetTrigger}
                          interactiveNames={suggestions}
                          onFocusHandler={e => {
                              console.log(e)
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
            <Col>
                <Button size="sm" variant="primary" disabled={!inputText} onClick={e => {
                    if (!isEdit) {
                        if (!isReply) {
                            csc.postComment(id, inputText);
                            setIsFocused(false);
                            setResetTrigger(inputText);
                        } else {
                            console.log("CALL REPLY METHOD HERE!")
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
            </Col>
            <Col>
                <Button size="sm" variant="outline-secondary" onClick={e => {
                    if (!isEdit) {
                        if (!isReply) {
                            if (selectedCard === id) {
                                selectHandler();
                            }
                            csc.cancelComment(id);
                            setIsFocused(false);
                            setResetTrigger(inputText);
                        } else {
                            console.log("JUST RESET THE REPLY!");
                            setIsFocused(false);
                            setResetTrigger(inputText);
                        }
                    } else {
                        if (isReply) {
                            console.log("EDIT REPLY HANDLER")
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


