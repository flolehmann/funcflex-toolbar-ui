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

import CommentBalloon from "./collabo/CommentBalloon";
import Topbar from "./collabo/Topbar";
import {detectIntent, generate, Intent, summarize, translateDeEn} from "./intelligence/Conversation";
import {Emulator, Task, TaskTrigger, TimeConfig} from "./intelligence/Emulator";
import useLogger, {LoggerEvents} from "./logger/logger";
import {CheckLg, Save, Save2Fill} from "react-bootstrap-icons";

const editorConfiguration = {
  plugins: [ Essentials, Bold, Italic, Heading, ListStyle, Alignment, WordCount, HighlightSelector ],
  toolbar: [ '|', 'undo', 'redo', '|', 'heading', '|', 'bold', 'italic', 'underline', '|', 'alignment', '|', 'bulletedList', 'numberedList']
};

const prototypeConfig = {
  wordCountLimit: 300,
  initialDocumentText: "<b>To-do:</b><p>- Write a blog post about tomato plants</p><p>- Summarize your post (wrap-up / tldr)</p>",
  documentName: "Blog post about tomato plants + Summary (tldr)",
  documentDescription: "The agent can support you with summarizing, extending, and translating text. Use the comment function for that.",
  infoModalTitle: "Task Briefing",
  infoModalText: `<p>Here you will use an online text editor with AI skills.</p>

<p>The AI skills support you with summarizing, extending, and translating text within the editor. By commenting parts of the text with to-dos an agent will take over these tasks. See the screenshots below for a short demonstration.</p>

<video controls style="width: 100%">
    <source src="http://dev.lehmannsuperior.de/collabwritingai/briefing-slides.webm"
            type="video/webm">
    Sorry, your browser doesn't support embedded videos.
</video>

<hr />

<p>You will have to write an informal blog post for a gardening blog. The main topic is tomato plants. In the same document you will have to write a short summary about your blog post for impatient readers, known as "wrap up" or "too long did not read".</p>

<p><b>Information on the task:</b></p>

<p><b>Task:</b> Write a blog post and a summary of that for a gardening blog.</p>

<p><b>Topic:</b> Tomato plants.</p>

<p><b>Language:</b> English.</p>

<p><b>Text length:</b> The blog post must have a length between 300 - 350 words. Additionally, your summary should be concise with a length of three to five sentences maximum.</p>

<p><b>Quality:</b> The quality of the text should be moderate / reasonable. It must not be perfect, yet you should avoid making a lot of mistakes. Try to be efficient and effective at the same time! The task does not assess your writing skills.</p>

<p><b>Time:</b> You should try to finish the task within 20 - 30 minutes.</p>

<p><b>Keywords:</b> The blog post should include the keywords as follow: Tomato, origin, summer, water, balcony, growing, fruit, taste.</p>

<p><b>Resources:</b> Your are allowed to use the following resources for writing your blog post:</p>
<ul>
\t<li><a href="https://de.wikipedia.org/wiki/Tomate" target="_blank">https://de.wikipedia.org/wiki/Tomate</a></li>
\t<li><a href="https://www.mein-schoener-garten.de/pflanzen/gemuse/tomaten" target="_blank">https://www.mein-schoener-garten.de/pflanzen/gemuse/tomaten</a></li>
<li><a href="https://www.gartentipps.com/tomaten-auf-dem-balkon-ziehen-wertvolle-tipps-zum-anbau.html" target="_blank">https://www.gartentipps.com/tomaten-auf-dem-balkon-ziehen-wertvolle-tipps-zum-anbau.html</a></li>
<li><a href="https://www.plantura.garden/gartentipps/gemuseratgeber/tomaten-anbau-auf-terrasse-und-balkon" target="_blank">https://www.plantura.garden/gartentipps/gemuseratgeber/tomaten-anbau-auf-terrasse-und-balkon</a></li>
\t<li><a href="https://www.poetschke.de/beratung/tomate-ratgeber/" target="_blank">https://www.poetschke.de/beratung/tomate-ratgeber/</a></li>
<li><a href="https://www.native-plants.de/blog/tomatenpflanzen-selbst-ziehen/" target="_blank">https://www.native-plants.de/blog/tomatenpflanzen-selbst-ziehen/</a></li>
</ul>`,
};

const data = prototypeConfig.initialDocumentText || '<p>Hello World</p>';

const initialCommentState = {
    comments: {},
    commentRects: {},
    selectedCommentId: ""
};

const initialMeState =  {
    id: "mocked-agent-id",
    type: "you",
    name: "You",
    tag: "@you",
    picture: process.env.PUBLIC_URL + "/user2.svg",
    online: true
};

const initialUserState = {
    users: [
        initialMeState,
        {
            id: "mocked-ai-author",
            type: "ai",
            name: "AIauthor",
            tag: "@aiauthor",
            picture: process.env.PUBLIC_URL + "/agent2.svg",
            online: false
        }
    ],
    me: initialMeState
}

export const CommentStatus = Object.freeze({
    "NEW": "NEW",
    "POSTED": "POSTED",
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

const commentReducer = (state, action) => {
    const id = action.payload.id || action.payload.commentId || null;
    const comment = action.payload.comment || null;
    const commentRects = action.payload.commentRects;
    const reply = action.payload.reply || null;
    const replyId = action.payload.replyId || null;
    const text = action.payload.text || null;
    const commentStatus = action.payload.commentStatus || null;

    const comments = state.comments;
    const replies = state.comments.replies;

    const selectedCommentId = action.payload.selectedCommentId || "";

    const suggestionId = action.payload.suggestionId || null;

    const user = action.payload.user;

    let tempComment;
    let replyIndex;
    let userIndex;

    switch (action.type) {
        case 'addComment':
            return { ...state,
                comments: { ...state.comments, [comment.id]: comment },
                commentRects: commentRects || state.commentRects,
            };
        case 'postComment':
            comment.state = CommentStatus.POSTED
            comment.history = [...comment.history, {
                state: CommentStatus.POSTED,
                time: Date.now()
            }];
            return { ...state,
                comments: {
                    ...state.comments, [comment.id]: comment
                }
            };
        case 'editComment':
            tempComment = { ...comments[id] };
            tempComment.data.text = text;
            return { ...state,
                comments: {...comments, [id]: tempComment}
            };
        case 'cancelComment':
            tempComment = { ...comments[id] };
            tempComment.state = CommentStatus.CANCELLED;
            tempComment.history = [...tempComment.history, {
                state: CommentStatus.CANCELLED,
                time: Date.now()
            }];
            return { ...state,
                comments: {
                    ...state.comments, [tempComment.id]: tempComment
                },
                commentRects: commentRects || state.commentRects
            };
        case 'approveComment':
            tempComment = { ...comments[id] };
            tempComment.state = CommentStatus.APPROVED;
            tempComment.history = [...tempComment.history, {
                state: CommentStatus.APPROVED,
                time: Date.now()
            }];
            return { ...state,
                comments: {
                    ...state.comments, [tempComment.id]: tempComment
                },
                commentRects: commentRects || state.commentRects
            };
        case 'deleteComment':
            tempComment = { ...comments[id] };
            tempComment.state = CommentStatus.DELETED;
            tempComment.history = [...tempComment.history, {
                state: CommentStatus.DELETED,
                time: Date.now()
            }];
            return { ...state,
                comments: {
                    ...state.comments, [tempComment.id]: tempComment
                },
                commentRects: commentRects || state.commentRects
            };
        case 'historyRecord':
            tempComment = { ...comments[id] };
            tempComment.state = commentStatus;
            tempComment.history = [...tempComment.history, {
                state: commentStatus,
                time: Date.now()
            }];
            return { ...state,
                comments: {
                    ...state.comments, [tempComment.id]: tempComment
                }
            };
        case 'typingReply':
            tempComment = { ...comments[id] };
            tempComment.typing = [...tempComment.typing, user];
            return { ...state,
                comments: {...comments, [id]: tempComment}
            };
        case 'removeTyping':
            tempComment = { ...comments[id] };
            userIndex = comment.typing.findIndex(u => u.id === user.id);
            tempComment.typing.splice(userIndex, 1);
            return { ...state,
                comments: {...comments, [id]: tempComment}
            };
        case 'postReply':
            tempComment = { ...comments[id] };
            tempComment.replies = [ ...tempComment.replies, reply];
            userIndex = tempComment.typing.findIndex(u => u.id === reply.data.user.id);
            tempComment.typing.splice(userIndex, 1);
            return { ...state,
                comments: {
                    ...state.comments, [id]: tempComment
                }
            };
        case 'editReply':
            tempComment = { ...comments[id] };
            replyIndex = tempComment.replies.findIndex(reply => reply.id === replyId);
            const editReply = { ...tempComment.replies[replyIndex] };
            editReply.data.text = text;
            tempComment.replies[replyIndex] = editReply;
            return { ...state,
                comments: {
                    ...state.comments, [id]: tempComment
                }
            };
        case 'deleteReply':
            tempComment = { ...comments[id] };
            replyIndex = tempComment.replies.findIndex(reply => reply.id === replyId);
            const deletedReply = { ...tempComment.replies[replyIndex] };
            deletedReply.state = CommentStatus.DELETED;
            deletedReply.history = [...deletedReply.history, {
                state: CommentStatus.DELETED,
                time: Date.now()
            }];
            tempComment.replies[replyIndex] = deletedReply;
            return { ...state,
                comments: {
                    ...state.comments, [id]: tempComment
                }
            };
        case 'updateCommentRects':
            // fast and naive comparison of commentRects
            const a = JSON.stringify(commentRects);
            const b = JSON.stringify(state.commentRects);
            if (a === b) {
                return state;
            }
            return {
                ...state,
                commentRects: commentRects
            };
        case 'selectCommentMarker':
            return {
                ...state,
                selectedCommentId: selectedCommentId
            }
        case 'addSuggestion':
            tempComment = { ...comments[id] };
            tempComment.suggestion = {
                id: suggestionId,
                user: user
            }
            return { ...state,
                comments: {...comments, [id]: tempComment}
            };
        default:
            throw new Error();
    }
};


const userReducer = (state, action) => {
    const id = action.payload.id || action.payload.userId || null;
    const newUser = action.payload.user || action.payload.newUser || null;
    const newMe = action.payload.me || null;
    const newOnline = action.payload.online || false;

    const users = state.users;
    const me = state.me;

    let userIndex;

    switch (action.type) {
        case 'setOnline':
            userIndex = users.findIndex(user => user.id === id);
            users[userIndex].online = newOnline;
            return { ...state,
                users: [...users]
            }
        case 'adduser':
            return { ...state,
            users: [...users, newUser]
        };
        case 'setMe':
            return { ...state,
                me: newMe
            };
        default:
            throw new Error();
    }
};

export const CommentsSidebarContext = React.createContext(null);
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

    const [showCommentBalloon, setShowCommentBalloon] = useState(false);

    const [commentState, commentDispatch] = useReducer(commentReducer, initialCommentState);
    const [userState, userDispatch] = useReducer(userReducer, initialUserState);

    const [isReady, studyAlignLib, logger] = useLogger("appLogger", "https://hciaitools.uni-bayreuth.de/study-align", 1);

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
            setShowBalloon();
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

    const addComment = () => {
        if (!highlightSelector) {
            return;
        }
        const user = userState.me;
        const id = highlightSelector.add("comment", user.name, onMarkerChange);
        const newComment = {
            id: id,
            state: CommentStatus.NEW,
            data: {
                user: user,
                date: Date.now()
            },
            replies: [],
            //deletedReplies: [],
            typing: [],
            suggestion: null,
            history: [
                {
                    state: CommentStatus.NEW,
                    time: Date.now()
                }
            ]
        }
        const commentRects = getCommentRects();
        commentDispatch({
            type: 'addComment',
            payload: {
                comment: newComment,
                commentRects: commentRects
            }
        });
        const marker = getMarker(id, user.name);
        const markedText = getMarkerText(marker);
        logger(LoggerEvents.COMMENT_ADD, {"commentId": id, "comment": newComment, "markedText": markedText});
    }

    const postComment = (id, text) => {
        const comment = commentState.comments[id];
        comment.data.text = text;
        commentDispatch({
            type: 'postComment',
            payload: {
                comment: comment
            }
        });
        logger(LoggerEvents.COMMENT_POST, {"commentId": id, "comment": comment});
        intelligence(id, text, comment);
    }

    const intelligence = async (id, text, comment) => {
        //const matches = parseMessage(text, "@agent");
        const matches = true;
        if (matches) {
            const agent = userState.users.filter(user => user.tag === "@agent")[0];
            // infer intent from comment
            try {
                const intentResult = await detectIntent(text);
                console.log("INTENT RECOGNIZED", intentResult);

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

    const editComment = (id, text) => {
        commentDispatch({
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
        const cancelledComment = commentState.comments[id];
        const user = cancelledComment.data.user.name;
        highlightSelector.remove("comment", id, user);
        const commentRects = getCommentRects();
        commentDispatch({
            type: 'cancelComment',
            payload: {
                id: id,
                commentRects: commentRects
            }
        });
        logger(LoggerEvents.COMMENT_CANCEL, {"commentId": id});
    }

    const approveComment = (id) => {
        if (!highlightSelector) {
            return null;
        }
        const comment = commentState.comments[id];
        const user = comment.data.user.name;

        removeSuggestion(comment);
        highlightSelector.remove("comment", id, user);

        const commentRects = getCommentRects();
        commentDispatch({
            type: 'approveComment',
            payload: {
                id: id,
                commentRects: commentRects
            }
        });
    }

    const deleteComment = (id) => {
        if (!highlightSelector) {
            return null;
        }
        const comment = commentState.comments[id];
        const user = comment.data.user.name;

        removeSuggestion(comment);
        highlightSelector.remove("comment", id, user);

        const commentRects = getCommentRects();
        commentDispatch({
            type: 'deleteComment',
            payload: {
                id: id,
                commentRects: commentRects
            }
        });
        logger(LoggerEvents.COMMENT_DELETE, {"commentId": id});
    }

    const historyRecord = (id, commentStatus) => {
        commentDispatch({
            type: 'historyRecord',
            payload: {
                id: id,
                commentStatus: commentStatus
            }
        });
    }

    const typingReply = (id, user) => {
        commentDispatch({
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
            state: CommentStatus.POSTED,
            data: {
                user: user,
                text: text,
                time: Date.now()
            },
            replies: [],
            history: [
                {
                    state: CommentStatus.POSTED,
                    time: Date.now()
                }
            ]
        };

        commentDispatch({
            type: 'postReply',
            payload: {
                id: id,
                reply: reply
            }
        });
        logger(LoggerEvents.REPLY_POST, {"commentId": id, "replyId": replyId, "reply": reply});
    }

    const postAiReply = (id, text, user, ai) => {
        const replyId = nanoid();
        const reply = {
            id: replyId,
            state: CommentStatus.POSTED,
            data: {
                user: user,
                text: text,
                time: Date.now(),
                ai: ai
            },
            replies: [],
            history: [
                {
                    state: CommentStatus.POSTED,
                    time: Date.now()
                }
            ]
        };

        commentDispatch({
            type: 'postReply',
            payload: {
                id: id,
                reply: reply
            }
        });
        logger(LoggerEvents.REPLY_AI, {"commentId": id, "replyId": replyId, "reply": reply});
    }

    const editReply = (commentId, replyId, text) => {
        commentDispatch({
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
        commentDispatch({
            type: 'deleteReply',
            payload: {
                commentId: commentId,
                replyId: replyId
            }
        });
        logger(LoggerEvents.REPLY_DELETE, {"commentId": commentId, "replyId": replyId});
    }

    // reactCommentState is set via useEffect on highlightSelector to make it available
    // in callbacks from inside highlightSelector
    const onMarkerChange = (deletionPosition, annotationType, id, user, reactCommentState) => {
        if (deletionPosition) {
            const comment = reactCommentState && reactCommentState.comments[id];
            removeSuggestion(comment);
            highlightSelector.remove(annotationType, id, user);
            updateCommentRects();
        }
    }

    const getCommentRects = () => {
        if (!highlightSelector) {
            return;
        }
        highlightSelector.computeRects("comment")
        let rects = highlightSelector.getRects();
        return rects["comment"];
    }

    const updateCommentRects = () => {
        const commentRects = getCommentRects();
        commentDispatch({
            type: 'updateCommentRects',
            payload: {
                commentRects: commentRects
            }
        });
    }

    const setSelectedCommentId = (selectedCommentId) => {
        commentDispatch({
            type: 'selectCommentMarker',
            payload: {
                selectedCommentId: selectedCommentId
            }
        });
    }

    const addSuggestion = (commentId, suggestionId, user) => {
        commentDispatch({
            type: 'addSuggestion',
            payload: {
                commentId: commentId,
                suggestionId: suggestionId,
                user: user
            }
        });
    }

    const removeSuggestion = (comment) => {
        if (comment && comment.suggestion) {
            highlightSelector.remove("suggestion", comment.suggestion.id, comment.suggestion.user.name)
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

    const getMarker = (id, user) => {
        if (!highlightSelector) {
            return;
        }
        return highlightSelector.getMarker("comment", id, user);
    }

    const getMarkerText = (marker) => {
        if (!highlightSelector) {
            return;
        }
        return highlightSelector.getMarkerText(marker);
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

    const setCurrentSelectedComment = (id, user) => {
        if (!highlightSelector) {
            return;
        }
        highlightSelector.setCurrentSelectedAnnotation("comment", id, user);
    }

    const unsetCurrentSelectedComment = (id, user, refresh = false) => {
        if (!highlightSelector) {
            return;
        }
        highlightSelector.unsetCurrentSelectedAnnotation("comment", id, user, true);
    }

    const setOnRender = () => {
        if (!highlightSelector) {
            return;
        }
        highlightSelector.setOnRender(updateCommentRects)
    }

    const setOnChangeData = () => {
        if (!highlightSelector) {
            return;
        }
        highlightSelector.setOnChangeData(updateCommentRects)
    }

    const setOnChangeView = () => {
        if (!highlightSelector) {
            return;
        }

        highlightSelector.setOnChangeView(updateCommentRects)
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

    const setShowBalloon = () => {
        if (!highlightSelector) {
            return;
        }
        highlightSelector.setShowBalloon(setShowCommentBalloon);
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
        highlightSelector.setOnClickMarker(setSelectedCommentId);
    }

    const runStats = () => {
        if (editor) {
            editor.plugins.get('WordCount').on('update', (event, stats) => {
                setCharCount(stats.characters);
                setWordCount(stats.words);
            });
        }
    }

    const commentBalloon = <CommentBalloon onMouseDown={() => {
                                                setShowCommentBalloon(false);
                                                addComment()}}
                                           isVisible={showCommentBalloon}
                                           ckEditorWidth={ckEditorWidth}
                                           ckEditorOffsetTop={ckEditorOffsetTop}
                                           caretPosition={caretRect} />;

    initialize();

    useEffect(() => {
        const timer = setTimeout(() => setUserOnline("mocked-agent-id", true), 5000);
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
        // unselect comment, if comment balloon gets displayed
        // comment ballon's visibility is defined by showCommentBalloon and an existing caretRect
        if (showCommentBalloon && caretRect !== null && commentState.selectedCommentId) {
            const comment = commentState.comments[commentState.selectedCommentId] ||
                (commentState.newComments && commentState.newComments[commentState.selectedCommentId]);
            if (comment) {
                unsetCurrentSelectedComment(comment.id, comment.data.user.name, true);
                setSelectedCommentId();
            }
        }
    }, [caretRect]);

    useEffect(() => {
        if (highlightSelector) {
            highlightSelector.setReactCommentState(commentState);
        }
    }, [commentState]);

    useEffect(() => {
        if (commentState.selectedCommentId !== "") {
            setShowCommentBalloon(false);
        }
    }, [commentState.selectedCommentId]);

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
                                        { commentBalloon }
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
                                        <CommentsSidebarContext.Provider value={{
                                            commentState: commentState,
                                            cancelComment: cancelComment,
                                            postComment: postComment,
                                            editComment: editComment,
                                            approveComment: approveComment,
                                            deleteComment: deleteComment,
                                            historyRecord: historyRecord,
                                            postReply: postReply,
                                            editReply: editReply,
                                            deleteReply: deleteReply,
                                            setSelectedCommentId: setSelectedCommentId,
                                            addSuggestion: addSuggestion,
                                            setCurrentSelectedComment: setCurrentSelectedComment,
                                            unsetCurrentSelectedComment: unsetCurrentSelectedComment,
                                            getMarker: getMarker,
                                            getMarkedText: getMarkerText,
                                            replaceMarkedText: replaceMarkedText,
                                            replaceMarkedTextHtml: replaceMarkedTextHtml,
                                            insertAfterMarkedText: insertAfterMarkedText,
                                            createParagraphWithText: createParagraphWithText,
                                            addSuggestionMarkerAtRange: addSuggestionMarkerAtRange
                                        }}>
                                            <Sidebar sidebarOffsetTop={sidebarOffsetTop} commentRectsLength={Object.keys(commentState.commentRects).length}/>
                                        </CommentsSidebarContext.Provider>
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