import React, {useContext, useState, forwardRef, useEffect} from 'react';
import {Button, ButtonGroup, Card, Col, Dropdown, Form, Image, OverlayTrigger, Row, Tooltip} from "react-bootstrap";
import {CheckLg, ThreeDotsVertical} from 'react-bootstrap-icons';
import {SidebarContext, CardStatus, LoggerContext, UserContext} from "../App";
import CommentForm from "./CommentForm/CommentForm";
import './Comment.css';
import AiRefinement from "./AiRefinement";
import CopyToClipboard from "./CopyToClipboard";
import {LoggerEvents} from "../logger/logger";
import {dateHelper} from "../utils/Utils";


const CustomOptionToggle = React.forwardRef(({ children, onClick }, ref) => (
    <Button variant="outline-light"
            ref={ref}
            onClick={e => {
                e.preventDefault();
                e.stopPropagation();
                e.nativeEvent.stopImmediatePropagation();
                onClick(e);
            }}
    >
        <ThreeDotsVertical color="gray" />
        {children}
    </Button>
));

export const InsertionStatus = Object.freeze({
    "NONE": "NONE",
    "INSERT_AFTER": "INSERT_AFTER",
    "TAKE_OVER": "TAKE_OVER",
    "COPY_TO_CLIPBOARD": "COPY_TO_CLIPBOARD"
});


export default Comment = forwardRef((props, ref) => {

    const csc = useContext(SidebarContext);
    const usc = useContext(UserContext);

    const lc = useContext(LoggerContext);
    const logger = lc.logger;

    const comment = props.comment;
    const markerText = props.markerText;
    const selected = props.selected;
    const selectedCard = props.selectedCard;
    const cardTop = props.cardTop;
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

    const typing = comment.typing;

    const suggestionId = comment.suggestionId;

    let style = {};

    const suggestions = [...usc.userState.users];
    const me = usc.userState.me;

    const date = dateHelper(new Date(data.date));

    const [top, setTop] = useState(position.top);
    const [isEdit, setIsEdit] = useState(false);
    const [editReply, setEditReply] = useState("");
    const [aiRefinementShow, setAiRefinementShow] = useState(false);
    const [refinedText, setRefinedText] = useState("");
    const [insertionStatus, setInsertionStatus] = useState(InsertionStatus.NONE);

    useEffect(() => {
        setTop(cardTop);
    }, [cardTop]);

    useEffect(() => {
        // re-renders sidebar, if replies change, or someone is typing
        changedHeightHandler({top: top, id:id});
    }, [comment.replies, comment.typing]);

    if (position) {
        style = { position: "absolute", top: top + "px" };
        if (selected) {
            style["left"] = "-50px";
        }
    }

    const replies = !(comment.replies && comment.replies.length === 0) ? null : comment.replies.map(reply => {
        // skip deleted replies
        if (reply.state === CardStatus.DELETED) {
            return null;
        }
        const date = dateHelper(new Date(reply.data.time));
        const user = reply.data.user;
        const userName = user.name;
        const html = reply.data.text;
        const ai = reply.data.ai; // used for ai skills

        const handleTakeOver = (refinedTextHtml) => {
            setAiRefinementShow(false);
            const marker = csc.getMarker(id, commentUserName);
            csc.replaceMarkedTextHtml(refinedTextHtml, marker);
            csc.setSelectedCommentId();
        }

        const insertSuggestionAfterMarker = refinedTextHtml => {
            const marker = csc.getMarker(id, commentUserName);
            const range = csc.insertAfterMarkedText(refinedTextHtml, marker, false);
            return addSuggestionMarkerAtRange(range, user);
        }

        const addSuggestionMarkerAtRange = (range, user) => {
            console.log("RANGE", range, "USER", user)
            return csc.addSuggestionMarkerAtRange(range, user);
        }

        const createParagraphWithText = text => {
             return csc.createParagraphWithText(text);
        }

        const renderTooltip = (props) => (
            <Tooltip id="button-tooltip" {...props}>
                Copied to clipoard!
            </Tooltip>
        );

        const aiSuggestionIsRefined = refinedText !== "";
        const aiSuggestion = aiSuggestionIsRefined ? refinedText : ai && ai.data.prediction;

        let buttonGroup = <div className="button-group">
            <Button onClick={ e => {
                setAiRefinementShow(false);
                const suggestionId = insertSuggestionAfterMarker(aiSuggestion);
                csc.historyRecord(id, CardStatus.SUGGESTION_INSERT_AFTER);
                csc.addSuggestion(id, suggestionId, user);
                setInsertionStatus(InsertionStatus.INSERT_AFTER);
                const marker = csc.getMarker(id, commentUserName);
                const markedText = csc.getMarkedText(marker);
                logger(LoggerEvents.SUGGESTION_INSERT_AFTER,
                    {"text": aiSuggestion, "markedText": markedText},
                    {"commentId": id, "refinedByUser": aiSuggestionIsRefined, "suggestionId": suggestionId});
            }}>Insert after</Button>

            <OverlayTrigger key={"bottom"}
                            placement={"bottom"}
                            overlay={
                                <Tooltip>
                                    By taking over the suggestion, you are resolving the comment and closing the discussion.
                                    The highlighted text in the document will be overwritten.
                                </Tooltip>
                            }>
                <Button onClick={ e => {
                    setAiRefinementShow(false);
                    const marker = csc.getMarker(id, commentUserName);
                    const markedText = csc.getMarkedText(marker);
                    csc.historyRecord(id, CardStatus.SUGGESTION_TAKE_OVER);
                    csc.replaceMarkedTextHtml(aiSuggestion, marker);
                    csc.setSelectedCommentId();
                    logger(LoggerEvents.SUGGESTION_TAKE_OVER,
                        {"text": aiSuggestion, "markedText": markedText},
                        {"commentId": id, "refinedByUser": aiSuggestionIsRefined, "suggestionId": suggestionId});
                }}>Take over</Button>
            </OverlayTrigger>

            <CopyToClipboard copyText={aiSuggestion} handleClick={() => {
                const marker = csc.getMarker(id, commentUserName);
                const markedText = csc.getMarkedText(marker);
                logger(LoggerEvents.SUGGESTION_COPY_TO_CLIPBOARD,
                    {"text": aiSuggestion, "markedText": markedText},
                    {"commentId": id, "refinedByUser": aiSuggestionIsRefined, "suggestionId": suggestionId});
                csc.historyRecord(id, CardStatus.SUGGESTION_COPY_TO_CLIPBOARD);
            }}/>
        </div>

        if (insertionStatus === InsertionStatus.INSERT_AFTER) {
            buttonGroup = <div className="button-group">
                <OverlayTrigger key={"bottom"}
                                placement={"bottom"}
                                overlay={
                                    <Tooltip>
                                        Mark resolved and hide discussion
                                    </Tooltip>
                                }>
                    <Button onClick={ e => {
                        csc.approveComment(id);
                        logger(LoggerEvents.COMMENT_APPROVE, {"commentId": id, "type": "afterInsertAfter"});
                        e.stopPropagation();
                        e.nativeEvent.stopImmediatePropagation();
                    }}><CheckLg color="white"/> Approve</Button>
                </OverlayTrigger>
            </div>
        }

        const showDetails = insertionStatus !== InsertionStatus.INSERT_AFTER ? <div className={"ai-show-details"}>
            <span onClick={e => {
                setAiRefinementShow(true);
                e.preventDefault();
                e.stopPropagation();
                e.nativeEvent.stopImmediatePropagation();
            }}>... show details</span>
        </div> : null;

        let aiRefinementTitle;
        let aiType;

        if (ai && ai.skill) {
            switch (ai.skill) {
                case "summarization":
                    aiType = "Summary";
                    aiRefinementTitle = "Summary by " + user.name;
                    break;
                case "translation_de_en":
                    aiType = "Translation";
                    aiRefinementTitle = "Translation from German to English by " + user.name;
                    break;
                case "generation":
                    aiType = "Extension";
                    aiRefinementTitle = "Extended version by " + user.name;
                    break;
            }
        }

        const aiField = ai && <div className={"ai"}>
            <div className={"ai-content"}>
                <div className={"ai-text"}>
                    {ai.data.prediction}
                </div>
                { showDetails }
            </div>
            { buttonGroup }
            <AiRefinement
                hasTakeOverWarning={true}
                isRefineActive={false}
                type={aiType}
                title={aiRefinementTitle}
                ai={ai}
                text={refinedText !== "" ? refinedText : ai.data.prediction}
                user={user}
                show={aiRefinementShow}
                originalText={markerText}
                handleRefinement={(refinedText) => {setRefinedText(refinedText)}}
                onHide={() => setAiRefinementShow(false)}
            >
                { buttonGroup }
            </AiRefinement>
        </div>

        const editReplyForm = <CommentForm comment={reply}
                                           top={top}
                                           suggestions={suggestions}
                                           me={me}
                                           changedHeightHandler={changedHeightHandler}
                                           selectedCard={selectedCard}
                                           selectHandler={selectHandler}
                                           isReply={true}
                                           isEdit={true}
                                           isEditHandler={setIsEdit}
                                           editReplyHandler={setEditReply}
                                           commentId={id} />

        const options = <Dropdown >
                <Dropdown.Toggle as={CustomOptionToggle}>
                </Dropdown.Toggle>
                <Dropdown.Menu size="sm" title="">
                    <Dropdown.Item onClick={e => {
                            setEditReply(reply.id);
                            logger(LoggerEvents.REPLY_EDIT_TOGGLE, {"commentId": id, "replyId": reply.id});
                        }}>Edit</Dropdown.Item>
                    <Dropdown.Item onClick={e => {
                        csc.deleteReply(id, reply.id);
                        e.stopPropagation();
                        e.nativeEvent.stopImmediatePropagation();
                    }}>Delete</Dropdown.Item>
            </Dropdown.Menu>
        </Dropdown>


        return <div className={"reply"} key={reply.id}>
            <div className={"reply-title"}>
                <div className={"comment-info-left"}>
                    <div className={"avatar"}>
                        <Image src={user.picture} roundedCircle/>
                    </div>
                    <div className={"user-data"}>
                        <div className={"user-name"}>{ userName }</div>
                        <div className={"comment-date"}>{ date }</div>
                    </div>
                </div>
                <div className={"comment-info-right"}>
                    { (me.id === user.id) && options }
                </div>
            </div>
            {(editReply === reply.id && editReplyForm) || <div dangerouslySetInnerHTML={{__html: html}}></div>}
            { aiField }
        </div>
    });

    const firstComment = !text ? null : <Card.Text dangerouslySetInnerHTML={{__html: text}}></Card.Text>;

    const commentField = <CommentForm comment={comment}
                                      top={top}
                                      suggestions={suggestions}
                                      me={me}
                                      changedHeightHandler={changedHeightHandler}
                                      isReply={firstComment}
                                      selectedCard={selectedCard}
                                      selectHandler={selectHandler}/>

    const editCommentForm = <CommentForm comment={comment}
                                         top={top}
                                         suggestions={suggestions}
                                         me={me}
                                         changedHeightHandler={changedHeightHandler}
                                         selectedCard={selectedCard}
                                         selectHandler={selectHandler}
                                         isReply={false}
                                         isEdit={true}
                                         isEditHandler={setIsEdit}/>

    const select = () => {
        if (!selected) {
            csc.setCurrentSelectedCard(type, id, userName);
            selectHandler(id);
        } else {
            csc.unsetCurrentSelectedCard(type, id, userName, true);
            selectHandler();
        }
    }

    const options = <Dropdown>
        <Dropdown.Toggle as={CustomOptionToggle}>
        </Dropdown.Toggle>
        <Dropdown.Menu size="sm" title="">
            <Dropdown.Item onClick={e => {
                setIsEdit(true);
                logger(LoggerEvents.COMMENT_EDIT_TOGGLE, {"commentId": id});
                e.stopPropagation();
                e.nativeEvent.stopImmediatePropagation();
            }}>Edit</Dropdown.Item>
            <Dropdown.Item  onClick={e => {
                csc.deleteComment(id);
                e.stopPropagation();
                e.nativeEvent.stopImmediatePropagation();
            }}>Delete</Dropdown.Item>
        </Dropdown.Menu>
    </Dropdown>

    const className = selected ? "comment-card selected" : "comment-card";

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


    const typingNames = typing && typing.map(user => user.name);
    const typingNotification = typingNames && typingNames.length > 0 && <div className={"typing-names"}>
        {typingNames.join(", ")} typing ...
    </div>;

    return (
        <Card ref={ref} id={id} className={className} style={style} onClick={select}>
            <Card.Title>
                <div className={"comment-info-left"}>
                    <div className={"avatar"}>
                        <Image src={user.picture} roundedCircle/>
                    </div>
                    <div className={"user-data"}>
                        <div className={"user-name"}>{userName}</div>
                        <div className={"comment-date"}>{ date }</div>
                    </div>
                </div>
                <div className={"comment-info-right"}>
                    { firstComment && approveButton }
                    { firstComment && options}
                </div>
            </Card.Title>
            <div className={"first-comment"}>
                { (isEdit && editCommentForm) || firstComment }
            </div>
            <div>
                { replies }
            </div>
            { typingNotification }
            { commentField }
        </Card>
    );
});

