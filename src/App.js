import React, {useEffect, useReducer, useRef, useState} from 'react';

import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import "./ckeditor/highlight-selector/HighlightSelector.css";

import { CKEditor } from '@ckeditor/ckeditor5-react';
import { nanoid } from 'nanoid'

// NOTE: Use the editor from source (not a build)!
import DecoupledEditor from '@ckeditor/ckeditor5-editor-decoupled/src/decouplededitor';

import Essentials from '@ckeditor/ckeditor5-essentials/src/essentials';
import Bold from '@ckeditor/ckeditor5-basic-styles/src/bold';
import Italic from '@ckeditor/ckeditor5-basic-styles/src/italic';
import Heading from '@ckeditor/ckeditor5-heading/src/heading';
import ListStyle from '@ckeditor/ckeditor5-list/src/liststyle';
import Alignment from '@ckeditor/ckeditor5-alignment/src/alignment';
import WordCount from '@ckeditor/ckeditor5-word-count/src/wordcount';

import HighlightSelector from "./ckeditor/highlight-selector/HighlightSelector";

import Sidebar from "./collabo/Sidebar";
import {Button, Col, Container, Row} from "react-bootstrap";

import Topbar from "./collabo/Topbar";
import {Intent} from "./intelligence/Conversation";
import {detectIntent, generate, prompt, summarize, translateDeEn} from "./intelligence/Apis";
import {Emulator, Task, TaskTrigger, TimeConfig} from "./intelligence/Emulator";
import useLogger, {LoggerEvents} from "./logger/logger";
import {
    ArrowsCollapse,
    ArrowsExpand,
    ChatLeftFill,
    CheckLg,
    InputCursorText,
    Save,
    Save2Fill,
    Translate
} from "react-bootstrap-icons";
import FloatingToolbar from "./floatingToolbar/FloatingToolbar";
import FloatingToolbarIcon from "./floatingToolbar/FloatingToolbarIcon";
import commentReducer from "./reducers/commentReducer";
import userReducer from "./reducers/userReducer";
import prototypeConfig from "./AppConfig";
import sidebarReducer from "./reducers/sidebarReducer";
import combineReducers from "./reducers/combineReducer";

const editorConfiguration = {
  plugins: [ Essentials, Bold, Italic, Heading, ListStyle, Alignment, WordCount, HighlightSelector ],
  toolbar: [ '|', 'undo', 'redo', '|', 'heading', '|', 'bold', 'italic', 'underline', '|', 'alignment', '|', 'bulletedList', 'numberedList']
};

const data = prototypeConfig.initialDocumentText || '<p>Hello World</p>';

const initialSidebarState = {
    cards: {},
    cardRects: {},
    selectedCard: {}
};

const initialCommentState = {
    comments: {},
    commentRects: {},
    selectedCommentId: ""
};

const initialMeState =  {
    id: "mocked-me-id",
    type: "you",
    name: "You",
    tag: "@you",
    picture: process.env.PUBLIC_URL + "/user2.svg",
    online: true
};

const aiAuthorTag = "@aiauthor";
const initialUserState = {
    users: [
        initialMeState,
        {
            id: "mocked-ai-author",
            type: "ai",
            name: "AI author",
            tag: aiAuthorTag,
            picture: process.env.PUBLIC_URL + "/agent2.svg",
            online: false
        }
    ],
    me: initialMeState
}

export const CardType = Object.freeze({
    "COMMENT": "COMMENT",
    "AI_EXTEND": "AI_EXTEND",
    "AI_SUMMARIZE": "AI_SUMMARIZE",
    "AI_TRANSLATE": "AI_TRANSLATE",
    "AI_PROMPT": "AI_PROMPT"
});

export const CardSkills = Object.freeze({
    "AI_EXTEND": {
       loading: "Extending...",
       done: "Extended",
        type :"Extend"
    },
    "AI_SUMMARIZE": {
       loading: "Summarizing...",
        done: "Summary",
        type: "Summary"
    },
    "AI_TRANSLATE": {
        loading: "Translating...",
        done: "Translation",
        type: "Translation"
    },
    "AI_PROMPT": {
        loading: "Prompting...",
        done: "Prompt",
        type: "Prompt"
    }
});

export const CardStatus = Object.freeze({
    "NEW": "NEW",
    "POSTED": "POSTED",
    "LOADING": "LOADING",
    "CANCELLED": "CANCELLED",
    "APPROVED": "APPROVED",
    "DELETED": "DELETED",
    "SUGGESTION_TAKE_OVER": "SUGGESTION_TAKE_OVER",
    "SUGGESTION_INSERT_AFTER": "SUGGESTION_INSERT_AFTER",
    "SUGGESTION_COPY_TO_CLIPBOARD": "SUGGESTION_COPY_TO_CLIPBOARD"
});

export const CommentAction = Object.freeze({
    "ADD": "ADD",
    "POST": "POST",
    "REDO": "REDO",
    "UNDO": "UNDO",
    "CANCEL": "CANCEL",
    "APPROVE": "APPROVE",
    "DELETE": "DELETE"
});

export const SidebarContext = React.createContext(null);
export const UserContext = React.createContext(null);
export const LoggerContext = React.createContext(null);

const emulator = new Emulator();

export const Condition = Object.freeze({
    "DEFAULT": "DEFAULT", // Text editing Only, no intelligence
    "AIC": "AIC" // AI Comment
});

function App() {

    const ckEditorRef = useRef(null);
    const sidebarRef = useRef(null);

    let ckEditorWidth = 0;
    let ckEditorOffsetTop = 0;
    if (ckEditorRef.current) {
        const style = ckEditorRef.current.currentStyle || window.getComputedStyle(ckEditorRef.current);
        const paddingLeft = parseFloat(style.paddingLeft);
        ckEditorWidth = ckEditorRef.current.offsetWidth - paddingLeft;
        ckEditorOffsetTop = ckEditorRef.current.offsetTop;
    }

    let sidebarOffsetTop = sidebarRef.current ? sidebarRef.current.offsetTop : 0;

    const [condition, setCondition] = useState("default");
    const [init, setInit] = useState(false);
    const [editor, setEditor] = useState(null);
    const [highlightSelector, setHighlightSelector] = useState(null);
    const [caretRect, setCaretRect] = useState(null);

    const [showFloatingToolbar, setShowFloatingToolbar] = useState(false);

    const [sidebarState, sidebarDispatch] = useReducer(sidebarReducer, initialSidebarState);
    const [userState, userDispatch] = useReducer(userReducer, initialUserState);


    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const studyId = urlParams.has("study_id") ? urlParams.get("study_id") : 0;

    const [isReady, studyAlignLib, logger] = useLogger("appLogger", "URL_TO_LOGGING", studyId);

    const [wordCount, setWordCount] = useState(0);
    const [charCount, setCharCount] = useState(0);

    const initialize = () => {
        if (!init) {
            getParams();
            getPlugin();
            //setOnRender();
            //setOnChangeData();
            setOnChangeView();
            setOnUndoRedo();
            setCaretDetector();
            displayFloatingToolbar();
            setOnUpdateMarker();
            setClickObserver();
            setOnClickMarker();
            if (editor && highlightSelector) {
                console.log("Init done!");
                setInit(true);
            }
        }
    }

    const getParams = () => {
        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);
        if (urlParams.has("condition") && urlParams.get("condition") === Condition.AIC) {
            setCondition(Condition.AIC);
        }
    }

    const getPlugin = () => {
        if (!editor || highlightSelector) {
            return;
        }
        setHighlightSelector(editor.plugins.get('HighlightSelector'));
    }

    const addAiCard = (type) => {
        if (!highlightSelector) {
            return;
        }
        const user = userState.me;
        const id = highlightSelector.add(type, user.name, onMarkerChange);
        const card = {
            type: type,
            id: id,
            state: CardStatus.NEW,
            data: {
                user: user,
                date: Date.now()
            },
            isLoading: true,
            ai: null,
            suggestion: null,
            history: [
                {
                    state: CardStatus.NEW,
                    time: Date.now()
                }
            ]
        }

        const cardRects = getCardRects();
        sidebarDispatch({
            type: 'addCard',
            payload: {
                card: card,
                cardRects: cardRects,
                selectedCardId: CardType.AI_PROMPT ? id : null
            }
        });
        const marker = getMarker(type, id, user.name);
        const markedText = getMarkerText(marker);
        logger(LoggerEvents.CARD_ADD, {"cardId": id, "type": type, "card": card, "markedText": markedText});
        if (type !== CardType.AI_PROMPT) {
            toolIntelligence(id, type, marker)
        }
    }

    const postComment = (id, text) => {
        const comment = sidebarState.cards[id];
        comment.data.text = text;
        sidebarDispatch({
            type: 'postComment',
            payload: {
                card: comment
            }
        });
        logger(LoggerEvents.COMMENT_POST, {"commentId": id, "comment": comment});
        commentIntelligence(id, text, comment);
    }

    const commentIntelligence = async (id, text, comment) => {
        //const matches = parseMessage(text, "@agent");
        const matches = true;
        if (matches) {
            const agent = userState.users.filter(user => user.tag === aiAuthorTag)[0];
            // infer intent from comment
            try {
                const intentResult = await detectIntent(text);

                // get marked text from editor
                const marker = getMarker(id, comment.data.user.name);
                const markedText = getMarkerText(marker);
                const ranges = marker.getRange();

                // display "Agent typing..."
                const typing = () => {
                    typingReply(id, agent)
                };

                const timeConfig = new TimeConfig(2000, 4000, 8000, 15000);
                switch (intentResult.intent.name) {
                    case Intent.SUMMARIZE:
                        const summaryMethod = () => {
                            const summaryResult = summarize(markedText).then(result => {
                                const ai = {
                                    skill: "summarization",
                                    data: result
                                };
                                // TODO: Replace static text by rasa response
                                postAiReply(id, "Here is the summarized text", agent, ai);
                            });
                        };
                        emulator.addTask(new Task(TaskTrigger.TIME, marker, intentResult.intent.name, typing, summaryMethod, timeConfig));
                        break;
                    case Intent.TRANSLATE:
                        const translateMethod = () => {
                            translateDeEn(markedText).then(result => {
                                const ai = {
                                    skill: "translation_de_en",
                                    data: result
                                };
                                // TODO: Replace static text by rasa response
                                postAiReply(id, "I have translated the text from german to english", agent, ai);
                            });
                        }
                        emulator.addTask(new Task(TaskTrigger.TIME, marker, intentResult.intent.name, typing, translateMethod, timeConfig));
                        break;
                    case Intent.EXTEND:
                        const extendMethod = () => {
                            generate(markedText).then(result => {
                                const ai = {
                                    skill: "generation",
                                    data: result
                                };
                                // TODO: Replace static text by rasa response
                                postAiReply(id, "I have extended the text for you", agent, ai);
                            });
                        }
                        emulator.addTask(new Task(TaskTrigger.TIME, marker, intentResult.intent.name, typing, extendMethod, timeConfig));
                        break;
                }
            } catch (err) {
                console.log("INTENT DETECTION FAILED", err);
            }
        }
    }

    const buildPrompt = (marker, input) => {
        const markedText = getMarkerText(marker);

        const naivePrompt = input + ": " + markedText;

        return  naivePrompt;
    }

    const toolIntelligence = async (id, type, marker, promptInput = null) => {
        try {
            // get marked text from editor
            const markedText = getMarkerText(marker);

            // display loading indicator
            const loading = () => {
                sidebarDispatch({
                    type: 'setIsLoading',
                    payload: {
                        id: id,
                        isLoading: true
                    }
                });
            };

            const getOpenAIResponse = result => {return {prediction: result.choices[0].text}};

            const timeConfig = new TimeConfig(0, 1, 1, 1000);
            switch (type) {
                case CardType.AI_SUMMARIZE:
                    const summaryMethod = () => {
                        const summaryResult = summarize(markedText).then(result => {
                        // prompt(buildPrompt(marker, "summarize:")).then(result => {
                        //     logger(LoggerEvents.OPEN_AI_RESULT, {"cardId": id, "cardType": type, "result": result});
                            //addAiResult(id, getOpenAIResponse(result));
                            logger(LoggerEvents.T5_SUMMARY_AI_RESULT, {"cardId": id, "cardType": type, "result": result});
                            addAiResult(id, result);
                        });
                    };
                    emulator.addTask(new Task(TaskTrigger.TIME, marker, type, loading, summaryMethod, timeConfig));
                    break;
                case CardType.AI_TRANSLATE:
                    const translateMethod = () => {
                        translateDeEn(markedText).then(result => {
                        // prompt(buildPrompt(marker, "translate from german to english")).then(result => {
                        //     logger(LoggerEvents.OPEN_AI_RESULT, {"cardId": id, "cardType": type, "result": result});
                        //     addAiResult(id, getOpenAIResponse(result));
                            logger(LoggerEvents.OPUS_TRANSLATE_AI_RESULT, {"cardId": id, "cardType": type, "result": result});
                            addAiResult(id, result);
                        });
                    }
                    emulator.addTask(new Task(TaskTrigger.TIME, marker, type, loading, translateMethod, timeConfig));
                    break;
                case CardType.AI_EXTEND:
                    const extendMethod = () => {
                        //generate(markedText).then(result => {
                        prompt(buildPrompt(marker, "extend")).then(result => {
                            // result.prediction = result.prediction.slice(markedText.length)
                            // const firstCharPunctuation = result.prediction.search(/[.,\/#!$%\^&\*;:{}=\-_`~()]/)
                            // if (firstCharPunctuation === 0) {
                            //     result.prediction = result.prediction.slice(1)
                            // }
                            logger(LoggerEvents.OPEN_AI_RESULT, {"cardId": id, "cardType": type, "result": result});
                            addAiResult(id, getOpenAIResponse(result));
                        });
                    }
                    emulator.addTask(new Task(TaskTrigger.TIME, marker, type, loading, extendMethod, timeConfig));
                    break;
                case CardType.AI_PROMPT:
                    const promptMethod = () => {
                        prompt(promptInput).then(result => {
                            logger(LoggerEvents.OPEN_AI_RESULT, {"cardId": id, "cardType": type, "result": result});
                            addAiResult(id, getOpenAIResponse(result));
                        });
                    }
                    emulator.addTask(new Task(TaskTrigger.TIME, marker, type, loading, promptMethod, timeConfig));
                    break;
            }
        } catch (err) {
            console.log("INTENT DETECTION FAILED", err);
        }
    }

    const editComment = (id, text) => {
        sidebarDispatch({
            type: 'editComment',
            payload: {
                id: id,
                text: text
            }
        });
        logger(LoggerEvents.COMMENT_EDIT, {"commentId": id, "text": text});
    }

    const cancelComment = (id) => {
        if (!highlightSelector) {
            return null;
        }
        const cancelledComment = sidebarState.comments[id];
        const user = cancelledComment.data.user.name;
        highlightSelector.remove("comment", id, user);
        const commentRects = getCardRects(CardType.COMMENT);
        sidebarDispatch({
            type: 'cancelComment',
            payload: {
                id: id,
                commentRects: commentRects
            }
        });
        logger(LoggerEvents.COMMENT_CANCEL, {"commentId": id});
    }

    const approveCard = (id) => {
        if (!highlightSelector) {
            return null;
        }
        const card = sidebarState.cards[id];
        const user = card.data.user.name;

        removeSuggestion(card);
        highlightSelector.remove(card.type, id, user);

        //const cardRects = getCardRects(CardType.COMMENT);
        sidebarDispatch({
            type: 'approveCard',
            payload: {
                id: id
            }
        });
    }

    const deleteCard = (id) => {
        if (!highlightSelector) {
            return null;
        }
        const deletedCard = sidebarState.cards[id];
        const card = sidebarState.cards[id];
        const user = card.data.user.name;

        removeSuggestion(card);
        highlightSelector.remove(deletedCard.type, id, user);

        const cardRects = getCardRects();
        sidebarDispatch({
            type: 'deleteCard',
            payload: {
                id: id,
                cardRects: cardRects
            }
        });
        logger(LoggerEvents.CARD_CLOSE, {"cardId": id, "cardType": card.type, "card": card});
    }

    const historyRecord = (id, commentStatus) => {
        sidebarDispatch({
            type: 'historyRecord',
            payload: {
                id: id,
                commentStatus: commentStatus
            }
        });
    }

    const typingReply = (id, user) => {
        sidebarDispatch({
            type: 'typingReply',
            payload: {
                id: id,
                user: user
            }
        });
    }

    const postReply = (id, text, user) => {
        const replyId = nanoid();
        const reply = {
            id: replyId,
            state: CardStatus.POSTED,
            data: {
                user: user,
                text: text,
                time: Date.now()
            },
            replies: [],
            history: [
                {
                    state: CardStatus.POSTED,
                    time: Date.now()
                }
            ]
        };

        sidebarDispatch({
            type: 'postReply',
            payload: {
                id: id,
                reply: reply
            }
        });
        logger(LoggerEvents.REPLY_POST, {"commentId": id, "replyId": replyId, "reply": reply});
    }

    const addAiResult = (id, data) => {
        sidebarDispatch({
            type: 'addAiResult',
            payload: {
                id: id,
                ai: data
            }
        });
    }

    const postAiReply = (id, text, user, ai) => {
        const replyId = nanoid();
        const reply = {
            id: replyId,
            state: CardStatus.POSTED,
            data: {
                user: user,
                text: text,
                time: Date.now(),
                ai: ai
            },
            replies: [],
            history: [
                {
                    state: CardStatus.POSTED,
                    time: Date.now()
                }
            ]
        };

        sidebarDispatch({
            type: 'postReply',
            payload: {
                id: id,
                reply: reply
            }
        });

        logger(LoggerEvents.REPLY_AI, {"commentId": id, "replyId": replyId, "reply": reply});
    }

    const editReply = (commentId, replyId, text) => {
        sidebarDispatch({
            type: 'editReply',
            payload: {
                commentId: commentId,
                replyId: replyId,
                text: text
            }
        });
        logger(LoggerEvents.REPLY_EDIT, {"commentId": commentId, "replyId": replyId, "text": text});
    }

    const deleteReply = (commentId, replyId) => {
        sidebarDispatch({
            type: 'deleteReply',
            payload: {
                commentId: commentId,
                replyId: replyId
            }
        });
        logger(LoggerEvents.REPLY_DELETE, {"commentId": commentId, "replyId": replyId});
    }

    // reactSidebarState is set via useEffect on highlightSelector to make it available
    // in callbacks from inside highlightSelector
    const onMarkerChange = (deletionPosition, cardType, id, user, reactSidebarState) => {
        if (deletionPosition) {
            const card = reactSidebarState && reactSidebarState.cards[id];
            removeSuggestion(card);
            highlightSelector.remove(cardType, id, user);
            updateCardRects();
        }
    }

    const getCardRects = () => {
        if (!highlightSelector) {
            return;
        }
        // DECOUPLING CARDS
        for (const property in CardType) {
            highlightSelector.computeRects(String(CardType[property]).toLowerCase())
        }
        let rects = highlightSelector.getFlattenedRects();
        return rects;
    }

    const updateCardRects = () => {
        const cardRects = getCardRects();
        sidebarDispatch({
            type: 'updateCardRects',
            payload: {
                cardRects: cardRects
            }
        });
    }

    const setSelectedCardId = (selectedCardId) => {
        const card = sidebarState.cards[selectedCardId];

        if (card) {
            logger(LoggerEvents.MARKER_SELECT, {"cardId": card.id, "cardType": card.type});
        }

        sidebarDispatch({
            type: 'selectCardMarker',
            payload: {
                selectedCardId: selectedCardId
            }
        });
    }

    const insertSuggestion = (cardId, suggestionId, user) => {
        sidebarDispatch({
            type: 'insertSuggestion',
            payload: {
                cardId: cardId,
                suggestionId: suggestionId,
                user: user
            }
        });
    }

    const removeSuggestion = (card) => {
        if (card && card.suggestion) {
            highlightSelector.remove("suggestion", card.suggestion.id, card.suggestion.user)
        }
    }

    const setUserOnline = (userId, online) => {
        userDispatch({
            type: 'setOnline',
            payload: {
                id: userId,
                online: online
            }
        });
    };

    const getCaretRect = (rect) => {
        setCaretRect(rect);
    }

    const addSuggestionMarkerAtRange = (range, user) => {
        if (!highlightSelector) {
            return;
        }
        return highlightSelector.addAtRange(range,"suggestion", user.name, onMarkerChange)
    }

    const getMarker = (type, id, user) => {
        if (!highlightSelector) {
            return;
        }
        return highlightSelector.getMarker(type, id, user);
    }

    const getMarkerText = (marker) => {
        if (!highlightSelector) {
            return;
        }
        return highlightSelector.getMarkerText(marker);
    }

    const getOriginalTextDom = (marker) => {
        if (!highlightSelector) {
            return;
        }
        return highlightSelector.getOriginalTextDom(marker);
    }

    const getTextBeforeMarker = (marker, charsBefore = 50) => {
        if (!highlightSelector) {
            return;
        }
        return highlightSelector.getTextBeforeMarker(marker, charsBefore);
    }

    const getTextAfterMarker = (marker, charsAfter = 50) => {
        if (!highlightSelector) {
            return;
        }
        return highlightSelector.getTextAfterMarker(marker, charsAfter);
    }

    const getMarkerTextPlusSurroundingText = (marker, charsSurrounding = 50) => {
        if (!highlightSelector) {
            return;
        }
        return highlightSelector.getMarkerTextPlusSurroundingText(marker, charsSurrounding);
    }

    const replaceMarkedText = (text, marker) => {
        if (!highlightSelector) {
            return;
        }
        return highlightSelector.replaceMarkedText(text, marker);
    }

    const replaceMarkedTextHtml = (html, marker) => {
        if (!highlightSelector) {
            return;
        }
        return highlightSelector.replaceMarkedTextHtml(html, marker);
    }

    const insertAfterMarkedText = (text, marker, insertElement = false) => {
        if (!highlightSelector) {
            return;
        }
        return highlightSelector.insertAfterMarkedText(text, marker, insertElement);
    }

    const createParagraphWithText = (text) => {
        if (!highlightSelector) {
            return;
        }
        return highlightSelector.createParagraphWithText(text);
    }

    const setCurrentSelectedCard = (type, id, user) => {
        if (!highlightSelector) {
            return;
        }
        highlightSelector.setCurrentSelectedCard(type, id, user);
    }

    const unsetCurrentSelectedCard = (type, id, user, refresh = false) => {
        if (!highlightSelector) {
            return;
        }
        highlightSelector.unsetCurrentSelectedCard(type, id, user, true);
    }

    const setOnRender = () => {
        if (!highlightSelector) {
            return;
        }
        highlightSelector.setOnRender(updateCardRects)
    }

    const setOnChangeData = () => {
        if (!highlightSelector) {
            return;
        }
        highlightSelector.setOnChangeData(updateCardRects)
    }

    const setOnChangeView = () => {
        if (!highlightSelector) {
            return;
        }
        highlightSelector.setOnChangeView(updateCardRects)
    }

    const setOnUndoRedo = () => {
        if (!highlightSelector) {
            return;
        }

        const undoCallback = (text, previousText) => logger(LoggerEvents.EDITOR_UNDO, {"text": text, "previousText": previousText});
        const redoCallback = (text, previousText) => logger(LoggerEvents.EDITOR_REDO, {"text": text, "previousText": previousText});
        highlightSelector.setOnUndoRedo(undoCallback, redoCallback)
    }

    const setOnUpdateMarker = () => {
        if (!highlightSelector) {
            return;
        }

        highlightSelector.setOnUpdateMarkers(() => console.log("onUpdateMarkers callback"))
    }

    const setOnRemoveMarker = () => {
        if (!highlightSelector) {
            return;
        }

        highlightSelector.setOnRemoveMarker(() => console.log("onRemoveMarker callback"))
    }

    const setCaretDetector = () => {
        if (!highlightSelector) {
            return;
        }
        highlightSelector.setCaretDetector(getCaretRect);
    }

    const displayFloatingToolbar = () => {
        if (!highlightSelector) {
            return;
        }
        highlightSelector.setShowFloatingToolbar(setShowFloatingToolbar);
    }

    const setClickObserver = () => {
        if (!highlightSelector) {
            return;
        }
        highlightSelector.setClickObserver();
    }

    const setOnClickMarker = () => {
        if (!highlightSelector) {
            return;
        }
        highlightSelector.setOnClickMarker(setSelectedCardId);
    }

    const runStats = () => {
        if (editor) {
            editor.plugins.get('WordCount').on('update', (event, stats) => {
                setCharCount(stats.characters);
                setWordCount(stats.words);
            });
        }
    }

    const extendIcon = <FloatingToolbarIcon tooltipText={"Extend text"}
                                            onMouseDown={() => {
                                                setShowFloatingToolbar(false);
                                                addAiCard(CardType.AI_EXTEND);
                                            }}>
        <ArrowsExpand />
    </FloatingToolbarIcon>


    const summarizeIcon = <FloatingToolbarIcon tooltipText={"Summarize text"}
                                               onMouseDown={() => {
                                                   setShowFloatingToolbar(false);
                                                   addAiCard(CardType.AI_SUMMARIZE)}}>
        <ArrowsCollapse />
    </FloatingToolbarIcon>

    const translateIcon = <FloatingToolbarIcon tooltipText={"Translate text"}
                                               onMouseDown={() => {
                                                   setShowFloatingToolbar(false);
                                                   addAiCard(CardType.AI_TRANSLATE)}}>
        <Translate />
    </FloatingToolbarIcon>

    const promptIcon = <FloatingToolbarIcon tooltipText={"Prompt function"}
                                            onMouseDown={() => {
                                                setShowFloatingToolbar(false);
                                                addAiCard(CardType.AI_PROMPT)}}>
        <InputCursorText />
    </FloatingToolbarIcon>

    const floatingToolbar = <FloatingToolbar isVisible={showFloatingToolbar}
                                             ckEditorWidth={ckEditorWidth}
                                             ckEditorOffsetTop={ckEditorOffsetTop}
                                             caretPosition={caretRect}>
        {extendIcon}
        {summarizeIcon}
        {translateIcon}
        {promptIcon}
    </FloatingToolbar>;

    initialize();

    useEffect(() => {
        const timer = setTimeout(() => setUserOnline("mocked-ai-author", true), 5000);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        emulator.start();
    }, []);

    useEffect(() => {
        if (isReady) {
            logger(LoggerEvents.USER_AGENT, window.navigator.userAgent);
        }
    }, [isReady]);

    useEffect(() => {
        // unselect card, if floating toolbar gets displayed
        // floating toolbar's visibility is defined by showFloatingToolbar and an existing caretRect
        if (showFloatingToolbar && caretRect !== null && sidebarState.selectedCardId) {
            const card = sidebarState.cards[sidebarState.selectedCardId] ||
                (sidebarState.newCards && sidebarState.newCards[sidebarState.selectedCardId]);
            if (card) {
                unsetCurrentSelectedCard(card.type, card.id, card.data.user.name, true);
                setSelectedCardId();
            }
        }
    }, [caretRect]);

    useEffect(() => {
        if (highlightSelector) {
            highlightSelector.setReactSidebarState(sidebarState);
        }
    }, [sidebarState]);

    useEffect(() => {
        if (sidebarState.selectedCardId !== "") {
            setShowFloatingToolbar(false);
        }
    }, [sidebarState.selectedCardId]);

    // useEffect(async () => {
    //     const url = new URL(window.location.href);
    //     const participantToken = url.searchParams.get("participant_token");
    //     if (wordCount >= prototypeConfig.wordCountLimit) {
    //         try {
    //             await studyAlignLib.updateNavigator(participantToken, "condition", "done");
    //         } catch (e) {
    //             console.warn("StudyAlign Navigator could not be updated");
    //         }
    //     }
    //
    //     if (wordCount < prototypeConfig.wordCountLimit) {
    //         try {
    //             await studyAlignLib.updateNavigator(participantToken, "condition", "in_progress");
    //         } catch (e) {
    //             console.warn("StudyAlign Navigator could not be updated");
    //         }
    //     }
    // }, [wordCount]);

    runStats();
    const stats = `Word count: ${wordCount}`;

    const saveToProceed = async () => {
        const url = new URL(window.location.href);
        const participantToken = url.searchParams.get("participant_token");
        try {
            await studyAlignLib.updateNavigator(participantToken, "condition", "done");
        } catch (e) {
            console.warn("StudyAlign Navigator could not be updated");
        }
    };

    const saveButton = wordCount >= prototypeConfig.wordCountLimit ? <Button size="sm" variant="primary" onClick={() => {
        logger(LoggerEvents.FINAL_TEXT, {"text": editor.getData()});
        saveToProceed();
    }}><CheckLg size={16} style={{position: "relative", top: "-1px", marginRight: "5px"}}/> Save Text To Proceed</Button> : null;

    return (
        <LoggerContext.Provider value={{
            studyAlignLib: studyAlignLib,
            logger: logger
        }}>
            <UserContext.Provider value={{
                userState: userState
            }}>
                <div className="App">
                    <div className="document-editor">
                        <Topbar documentName={prototypeConfig.documentName}
                                description={prototypeConfig.documentDescription}
                                infoBadgeText={stats}
                                infoModalText={prototypeConfig.infoModalText}
                                infoModalTitle={prototypeConfig.infoModalTitle}
                                saveButton={saveButton}
                        />
                        <div className="document-editor__toolbar"></div>
                        <div className="document-editor__editable-container">
                            <Container>
                                <Row>
                                    <Col ref={ckEditorRef} style={{position: "relative"}} xs={8}>
                                        { floatingToolbar }
                                        <div id="ckEditorWrapper"
                                             onClick={e =>logger(LoggerEvents.MOUSE_CLICK, e.nativeEvent)}
                                             onKeyDown={e => logger(LoggerEvents.KEY_DOWN, e.nativeEvent, {"text": editor.getData()})}>
                                          <CKEditor
                                              editor={ DecoupledEditor }
                                              config={ editorConfiguration }
                                              data={data}
                                              onReady={editor => {
                                                // You can store the "editor" and use when it is needed.
                                                console.log( 'Editor is ready to use!', editor );
                                                setEditor(editor);
                                                  // Add these two lines to properly position the toolbar
                                                  const toolbarContainer = document.querySelector( '.document-editor__toolbar' );
                                                  toolbarContainer.appendChild( editor.ui.view.toolbar.element );
                                              } }
                                              onChange={ ( event, editor ) => {
                                                  console.log(editor.getData());
                                                  logger(LoggerEvents.TEXT_STATS, {"characters": charCount, "words": wordCount});
                                              } }
                                              onBlur={ ( event, editor ) => {
                                              } }
                                              onFocus={ ( event, editor ) => {
                                                  if (emulator.running) {
                                                      //emulator.stop();
                                                  }
                                              } }
                                          />
                                        </div>
                                    </Col>
                                    <Col ref={sidebarRef} style={{position: "relative"}} xs={4}>
                                        <SidebarContext.Provider value={{
                                            sidebarState: sidebarState,
                                            cancelComment: cancelComment,
                                            postComment: postComment,
                                            editComment: editComment,
                                            approveCard: approveCard,
                                            deleteCard: deleteCard,
                                            historyRecord: historyRecord,
                                            postReply: postReply,
                                            editReply: editReply,
                                            deleteReply: deleteReply,
                                            setSelectedCardId: setSelectedCardId,
                                            insertSuggestion: insertSuggestion,
                                            setCurrentSelectedCard: setCurrentSelectedCard,
                                            unsetCurrentSelectedCard: unsetCurrentSelectedCard,
                                            getMarker: getMarker,
                                            getMarkedText: getMarkerText,
                                            getOriginalTextDom: getOriginalTextDom,
                                            getTextBeforeMarker: getTextBeforeMarker,
                                            getTextAfterMarker: getTextAfterMarker,
                                            getMarkerTextPlusSurroundingText: getMarkerTextPlusSurroundingText,
                                            replaceMarkedText: replaceMarkedText,
                                            replaceMarkedTextHtml: replaceMarkedTextHtml,
                                            insertAfterMarkedText: insertAfterMarkedText,
                                            createParagraphWithText: createParagraphWithText,
                                            addSuggestionMarkerAtRange: addSuggestionMarkerAtRange,
                                            toolIntelligence: toolIntelligence,
                                            buildPrompt: buildPrompt
                                        }}>
                                            <Sidebar sidebarOffsetTop={sidebarOffsetTop} cardRectsLength={Object.keys(sidebarState.cardRects).length}/>
                                        </SidebarContext.Provider>
                                    </Col>
                                </Row>
                            </Container>
                        </div>
                    </div>
                </div>
            </UserContext.Provider>
        </LoggerContext.Provider>
    );

}

export default App;