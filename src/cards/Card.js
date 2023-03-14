import React, {forwardRef, useContext, useEffect, useRef, useState} from "react";
import {AnnotationStatus, CardSkills, CardStatus, CardType, LoggerContext, SidebarContext, UserContext} from "../App";
import {
    Badge,
    Button,
    Card,
    CloseButton,
    Dropdown,
    Fade,
    Form,
    Image, InputGroup,
    OverlayTrigger,
    Placeholder,
    Tooltip
} from "react-bootstrap";
import {LoggerEvents} from "../logger/logger";
import CopyToClipboard from "../collabo/CopyToClipboard";
import {
    CaretRight,
    CaretRightFill,
    CheckLg, InfoCircle, InfoCircleFill, JustifyLeft, LayoutSplit,
    Send,
    SendFill,
    SquareHalf,
    ThreeDots,
    ThreeDotsVertical, WindowSplit
} from "react-bootstrap-icons";
import AiRefinement from "../collabo/AiRefinement";
import CommentForm from "../collabo/CommentForm/CommentForm";
import {InsertionStatus} from "../collabo/Comment";
import {dateHelper} from "../utils/Utils";
import './Card.css';

const AnnotationCard = forwardRef((props, ref) => {

    const csc = useContext(SidebarContext);
    const usc = useContext(UserContext);

    const lc = useContext(LoggerContext);
    const logger = lc.logger;

    const card = props.card;

    const [prompt, setPrompt] = useState("");
    const [isPromptSent, setIsPromptSent] = useState(false);

    const textBeforeMarker = props.textBeforeMarker;
    const markerText = props.markerText;
    const originalText = props.originalText;
    const textAfterMarker = props.textAfterMarker
    const textSurroundingMarker = props.textSurroundingMarker;
    const selected = props.selected;
    const selectedCard = props.selectedCard;
    const cardTop = props.cardTop;
    const position = props.position;
    const selectHandler = props.selectHandler;
    const changedHeightHandler = props.changedHeightHandler;

    const type = card.type;
    const header = card.header || "Suggestion:";
    const id = card.id;
    const data = card.data;

    const isLoading = card.isLoading;
    const placeHolder = <>
        <Card.Title>
            <div className={"card-info-left"}>
                <div className={"user-data"}>
                    <div className={"user-name"}>{ CardSkills[type].loading }</div>
                </div>
            </div>
        </Card.Title>
        <div>
            <Placeholder as={Card.Text} animation="wave">
                <Placeholder xs={7} /> <Placeholder xs={4} />
                <Placeholder xs={4} /> <Placeholder xs={6} />
                <Placeholder xs={8} />
            </Placeholder>
        </div>
    </>
    const loadingIndicatorText = props.loadingIndicatorText || placeHolder;
    const loadingTitle = isLoading ? "Summarizing" : "Summarized"

    const user = data.user;
    const userName = data.user.name;

    const ai = card.ai;
    const suggestionId = card.suggestion && card.suggestion.id;

    let style = {};

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
    }, [card.isLoading]);

    if (position) {
        style = { position: "absolute", top: top + "px" };
        if (selected) {
            style["left"] = "-50px";
        }
    }

    const select = () => {
        if (!selected) {
            logger(LoggerEvents.CARD_SELECT, {"cardId": id, "cardType": type});
            csc.setCurrentSelectedCard(type, id, userName);
            selectHandler(id);
        } else {
            csc.unsetCurrentSelectedCard(type, id, userName, true);
            selectHandler();
        }
    }

    const closeButton = <CloseButton onClick={e => {
        csc.deleteCard(id);
        e.stopPropagation();
        e.nativeEvent.stopImmediatePropagation();
    }} />


    const renderTooltip = (props) => (
        <Tooltip id="button-tooltip" {...props}>
            {"Show Details" }
        </Tooltip>
    );

    const detailsButton = <OverlayTrigger
        placement="right"
        delay={{ show: 120, hide: 225 }}
        overlay={renderTooltip}
    >
        <Button className={"show-details-button"} variant={"light"} onClick={e => {
            e.preventDefault();
            e.stopPropagation();
            e.nativeEvent.stopImmediatePropagation();
            logger(LoggerEvents.SUGGESTION_VIEWDETAIL, {"cardId": id, "cardType": type});
            setAiRefinementShow(true);
        }}><ThreeDots /></Button>
    </OverlayTrigger>

    const insertSuggestionAfterMarker = refinedTextHtml => {
        const marker = csc.getMarker(type, id, userName);
        const range = csc.insertAfterMarkedText(refinedTextHtml, marker, false);
        return addSuggestionMarkerAtRange(range, user);
    }

    const addSuggestionMarkerAtRange = (range, user) => {
        return csc.addSuggestionMarkerAtRange(range, user);
    }

    const aiSuggestionIsRefined = refinedText !== "";
    const aiSuggestion = aiSuggestionIsRefined ? refinedText : ai && ai.prediction;

    const className = selected ? "sidebar-card selected" : "sidebar-card";

    const loadingIndicator = <div>{loadingIndicatorText}</div>

    const showDetails = insertionStatus !== InsertionStatus.INSERT_AFTER ? <div className={"ai-show-details"}>
        <OverlayTrigger
            placement="right"
            delay={{ show: 120, hide: 50 }}
            overlay={renderTooltip}
        >
            <Badge pill bg="secondary" text="light" onClick={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.nativeEvent.stopImmediatePropagation();
                    logger(LoggerEvents.SUGGESTION_VIEWDETAIL, {"cardId": id, "cardType": type});
                    setAiRefinementShow(true);
                }}>...</Badge>
        </OverlayTrigger>
    </div> : null;

    let appendButton = insertionStatus !== InsertionStatus.INSERT_AFTER ? <Button onClick={ e => {
        setAiRefinementShow(false);
        const suggestionId = insertSuggestionAfterMarker(aiSuggestion);
        csc.historyRecord(id, CardStatus.SUGGESTION_INSERT_AFTER);
        csc.insertSuggestion(id, suggestionId, userName);
        setInsertionStatus(InsertionStatus.INSERT_AFTER);
        const marker = csc.getMarker(type, id, userName);
        const markedText = csc.getMarkedText(marker);
        logger(LoggerEvents.SUGGESTION_INSERT_AFTER,
            {"text": aiSuggestion, "markedText": markedText},
            {"cardId": id, "cardType": type, "suggestionId": suggestionId});
    }}>Append</Button> : <Button onClick={ e => {
        csc.approveCard(id);
        logger(LoggerEvents.CARD_APPROVE, {"cardId": id, "cardType": type, "approvalType": "afterAppending"});
        e.stopPropagation();
        e.nativeEvent.stopImmediatePropagation();
    }}><CheckLg color="white"/> Approve</Button>

    let replaceButton = insertionStatus !== InsertionStatus.INSERT_AFTER ? <Button onClick={ e => {
            setAiRefinementShow(false);
            const marker = csc.getMarker(type, id, userName);
            const markedText = csc.getMarkedText(marker);
            csc.historyRecord(id, CardStatus.SUGGESTION_TAKE_OVER);
            csc.replaceMarkedTextHtml(aiSuggestion, marker);
            csc.setSelectedCardId();
            logger(LoggerEvents.SUGGESTION_TAKE_OVER,
                {"text": aiSuggestion, "markedText": markedText},
                {"cardId": id, "cardType": type, "suggestionId": suggestionId});
        }}>Replace</Button> : null;

    let buttonGroup = <div className="button-group">
        { appendButton }
        { type !== CardType.AI_EXTEND && replaceButton /* display only append button for extend/continue text */}
        <CopyToClipboard copyText={aiSuggestion} handleClick={() => {
            const marker = csc.getMarker(type, id, userName);
            const markedText = csc.getMarkedText(marker);
            logger(LoggerEvents.SUGGESTION_COPY_TO_CLIPBOARD,
                {"text": aiSuggestion, "markedText": markedText},
                {"cardId": id, "cardType": type, "suggestionId": suggestionId});
            csc.historyRecord(id, CardStatus.SUGGESTION_COPY_TO_CLIPBOARD);
        }}/>
    </div>


    const isLongText = () => aiTextRef.current && aiTextRef.current.clientHeight >= 110;

    //Make fading of text snippets dynamic
    const aiTextRef = useRef(null);
    let dynamicFadeClass = "";
    if (isLongText()) {
        dynamicFadeClass = "ai-text-fade";
    }

    let cardContent = loadingIndicator;
    if (!isLoading) {
        cardContent = <>
            <Card.Title>
                <div className={"card-info-left"}>
                    <div className={"user-data"}>
                        <div className={"user-name"}>{ CardSkills[type].done }</div>
                        <div className={"card-date"}>{ date }</div>
                    </div>
                </div>
                <div className={"card-info-right"}>
                    { closeButton }
                </div>
            </Card.Title>
            <div className={"ai-content"}>
                <div className={"prompt-text"}>{ prompt && <div> &bdquo;{prompt}&rdquo;</div> }</div>
                <div ref={aiTextRef} className={"ai-text " + dynamicFadeClass}>
                    { ai.prediction } { showDetails }
                </div>
            </div>
            <div>
                { buttonGroup  }
            </div>
            <AiRefinement
                hasTakeOverWarning={false}
                isRefineActive={false}
                type={CardSkills[type].done}
                title={CardSkills[type].type}
                ai={ai}
                text={refinedText !== "" ? refinedText : ai.prediction}
                user={user}
                show={aiRefinementShow}
                //textBeforeOriginalText={textBeforeMarker}
                originalText={originalText}
                //textAfterOriginalText={textAfterMarker}
                handleRefinement={(refinedText) => {setRefinedText(refinedText)}}
                onHide={() => {
                    logger(LoggerEvents.SUGGESTION_CLOSEDETAIL, {"cardId": id, "cardType": type});
                    setAiRefinementShow(false)
                }}
            >
                { buttonGroup }
            </AiRefinement>
        </>
    }

    const prompting = (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.nativeEvent.stopImmediatePropagation();
        logger(LoggerEvents.PROMPT_SEND, {"cardId": id, "cardType": type, "card": card, "prompt": prompt, "markedText": markerText})
        const marker = csc.getMarker(type, id, userName);
        const builtPrompt = csc.buildPrompt(marker, prompt);
        csc.toolIntelligence (id, type, marker, builtPrompt);
        setIsPromptSent(true);
    }

    if (type === CardType.AI_PROMPT && !isPromptSent) {
        cardContent = <>
                <Card.Title>
                    <div className={"card-info-left"}>
                        <div className={"user-data"}>
                            <div className={"user-name"}>{ CardSkills[type].type }</div>
                        </div>
                    </div>
                    <div className={"card-info-right"}>
                        { closeButton }
                    </div>
                </Card.Title>
            <Form onSubmit={ e => {
                prompting(e)
            }
            }>
                <Form.Group>
                    <InputGroup>
                    <Form.Control value={prompt}
                                  onClick={(e) => {
                                      if (selected) {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          e.nativeEvent.stopImmediatePropagation();
                                      }
                                  }}
                                  onKeyDown={e => logger(LoggerEvents.KEY_DOWN, e.nativeEvent,
                                      {"cardId": id, "cardType": type, "prompt_text": prompt, "marked_text": markerText})}
                                  onChange={(e) => {
                                      setPrompt(e.target.value)
                                  }}
                                  placeholder="Describe an action"
                    />
                    <Button variant="primary" onClick={e => {
                        prompting(e)
                    }}>
                        <CaretRightFill color="white"/>
                    </Button>
                </InputGroup>
                </Form.Group>
            </Form>
        </>
    }

    return (
        <Card ref={ref} id={id} className={className} style={style} onClick={select}>
            {cardContent}
        </Card>
    );
});

export default AnnotationCard;