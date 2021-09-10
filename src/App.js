import React, {useEffect, useReducer, useRef, useState} from 'react';

import { CKEditor } from '@ckeditor/ckeditor5-react';
import { nanoid } from 'nanoid'

// NOTE: Use the editor from source (not a build)!
import DecoupledEditor from '@ckeditor/ckeditor5-editor-decoupled/src/decouplededitor';

import Essentials from '@ckeditor/ckeditor5-essentials/src/essentials';
import Bold from '@ckeditor/ckeditor5-basic-styles/src/bold';
import Italic from '@ckeditor/ckeditor5-basic-styles/src/italic';
import Paragraph from '@ckeditor/ckeditor5-paragraph/src/paragraph';

import HighlightSelector from "./ckeditor/highlight-selector/HighlightSelector";

import Sidebar from "./collabo/Sidebar";
import {Col, Container, Row} from "react-bootstrap";

import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import "./ckeditor/highlight-selector/HighlightSelector.css";
import CommentBalloon from "./collabo/CommentBalloon";
import Topbar from "./collabo/Topbar";
import {detectIntent, generate, parseMessage, summarize, translateDeEn} from "./intelligence/Conversation";


const editorConfiguration = {
  plugins: [ Essentials, Bold, Italic, Paragraph, HighlightSelector ],
  toolbar: [ 'undo', 'redo', 'bold', 'italic', 'underline']
};

const data = '<p>Hello World</p> <p><span class="annotation comment comment-VqU-Nqt3KIfJpa1BlkKC9 comment-by-Human User" data-comment-id="VqU-Nqt3KIfJpa1BlkKC9" data-annotation-type="comment" data-user-id="Human User">Sehr gut</span></p>';

const prototypeConfig = {
  documentName: "Text Summary",
  documentDescription: "Delegate the agent to summarize the text using the interactive comments.",
};

const initialCommentState = {
    comments: {},
    newComments: {},
    cancelledComments: {},
    approvedComments: {},
    deletedComments: {},
    commentRects: {},
    selectedCommentId: ""
};

const initialMeState =  {
    id: "mocked-me-id",
    type: "human",
    name: "Human User",
    tag: "@human-user",
    picture: process.env.PUBLIC_URL + "avatar-user.png",
    online: true
};

const initialUserState = {
    users: [
        initialMeState,
        {
            id: "mocked-agent-id",
            type: "ai",
            name: "Agent",
            tag: "@agent",
            picture: process.env.PUBLIC_URL + "avatar-agent.png",
            online: false
        },
        {
            id: "mocked-test-id",
            type: "ai",
            name: "Tim Jung",
            tag: "@tim-jung",
            picture: process.env.PUBLIC_URL + "avatar-user.png",
            online: false
        }
    ],
    me: initialMeState
}


const commentReducer = (state, action) => {
    const id = action.payload.id || action.payload.commentId || null;
    const canceledCommentId = action.payload.canceledCommentId || null;
    const newComment = action.payload.newComment || null;
    const commentRects = action.payload.commentRects;
    const reply = action.payload.reply || null;
    const replyId = action.payload.replyId || null;
    const text = action.payload.text || null;

    const comments = state.comments;
    const replies = state.comments.replies;
    const newComments = state.newComments;

    const selectedCommentId = action.payload.selectedCommentId || "";

    const user = action.payload.user;

    let comment;
    let replyIndex;
    let userIndex;

    switch (action.type) {
        case 'addComment':
            return { ...state,
                newComments: { ...state.newComments, [newComment.id]: newComment },
                commentRects: commentRects || state.commentRects,
            };
        case 'postComment':
            delete newComments[newComment.id]
            return { ...state,
                comments: {
                    ...state.comments, [newComment.id]: newComment
                },
                newComments: newComments
            };
        case 'editComment':
            comment = comments[id];
            comment.data.text = text;
            return { ...state,
                comments: {...comments, [id]: comment}
            };
        case 'cancelComment':
            delete newComments[canceledCommentId]
            return { ...state,
                newComments: newComments,
                commentRects: commentRects || state.commentRects
            };
        case 'approveComment':
            comment = comments[id];
            delete comments[id];
            return { ...state,
                comments: comments,
                approvedComments: {
                    ...state.approvedComments, [id]: comment,
                },
                commentRects: commentRects || state.commentRects
            };
        case 'deleteComment':
            comment = comments[id];
            delete comments[id];
            return { ...state,
                comments: comments,
                deletedComments: {
                    ...state.deletedComments, [id]: comment,
                },
                commentRects: commentRects || state.commentRects
            };
        case 'typingReply':
            comment = comments[id];
            comment.typing.push(user);
            return { ...state,
                comments: {...comments, [id]: comment}
            };
        case 'removeTyping':
            comment = comments[id];
            userIndex = comment.typing.findIndex(u => u.id === user.id);
            comment.typing.splice(userIndex, 1);
            return { ...state,
                comments: {...comments, [id]: comment}
            };
        case 'postReply':
            comment = comments[id];
            comment.replies.push(reply);
            userIndex = comment.typing.findIndex(u => u.id === reply.data.user.id);
            comment.typing.splice(userIndex, 1);
            return { ...state,
                comments: {
                    ...state.comments, [comment.id]: comment
                }
            };
        case 'editReply':
            comment = comments[id];
            replyIndex = comment.replies.findIndex(reply => reply.id === replyId);
            const editReply = comment.replies[replyIndex];
            editReply.data.text = text;
            comment.replies[replyIndex] = editReply;
            return { ...state,
                comments: {
                    ...state.comments, [comment.id]: comment
                }
            };
        case 'deleteReply':
            comment = comments[id];
            replyIndex = comment.replies.findIndex(reply => reply.id === replyId);
            const deletedReply = comment.replies[replyIndex];
            comment.replies.splice(replyIndex, 1);
            comment.deletedReplies.push(deletedReply);
            return { ...state,
                comments: {
                    ...state.comments, [comment.id]: comment
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

function App(){

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

    const [init, setInit] = useState(false);
    const [editor, setEditor] = useState(null);
    const [highlightSelector, setHighlightSelector] = useState(null);
    const [caretRect, setCaretRect] = useState(null);

    const [showCommentBalloon, setShowCommentBalloon] = useState(false);

    const [commentState, commentDispatch] = useReducer(commentReducer, initialCommentState);
    const [userState, userDispatch] = useReducer(userReducer, initialUserState);


    const initialize = () => {
        if (!init) {
            getPlugin();
            //setOnRender();
            //setOnChangeData();
            setOnChangeView();
            setCaretDetector();
            setOnUpdateMarker();
            setClickObserver();
            setOnClickMarker();
            if (editor && highlightSelector) {
                console.log("Init done!")
                setInit(true);
            }
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
            data: {
                user: user,
                date: Date.now()
            },
            replies: [],
            deletedReplies: [],
            typing: []
        }
        const commentRects = getCommentRects();
        commentDispatch({
            type: 'addComment',
            payload: {
                newComment: newComment,
                commentRects: commentRects
            }
        });
    }

    const postComment = (id, text) => {
        const newComment = commentState.newComments[id];
        newComment.data.text = text;
        commentDispatch({
            type: 'postComment',
            payload: {
                newComment: newComment
            }
        });

        // add intelligence
        const matches = parseMessage(text, "@agent");
        if (matches) {
            console.log("MATCHES", matches);
            //infer intent from comment
            const intent = detectIntent(text);
            const agent = userState.users.filter(user => user.tag === "@agent")[0];
            intent.then(result => {
                console.log(newComment);
                //get marked text from editor
                const marker = getMarker(id, newComment.data.user.name);
                const markedText = getMarkerText(marker);
                const ranges = marker.getRange();

                commentDispatch({
                    type: 'typingReply',
                    payload: {
                        id: id,
                        user: agent
                    }
                });

                //replaceMarkedText("LOL", marker);
                if (result.intent.name === "summarize") {
                    const summary = summarize(markedText);
                    summary.then(result => {

                        console.log(result)
                        const ai = {
                            skill: "summarization",
                            data: result
                        };

                        // TODO: Replace static text by rasa response
                        postAiReply(id, "Here is the summarized text", agent, ai);
                    });
                } else if (result.intent.name === "translateDeEn") {
                    const translatedDeEn = translateDeEn(markedText);
                    translatedDeEn.then(result => {
                        console.log(result);
                        const ai = {
                            skill: "translation_de_en",
                            data: result
                        };
                        // TODO: Post as skill reply
                    });
                } else if (result.intent.name === "generate") {
                    const generated = generate(markedText);
                    generated.then(result => {
                        console.log(result);
                        const ai = {
                            skill: "generation",
                            data: result
                        };
                        // TODO: Post as skill reply
                    });
                }
            });
        }
    }

    const editComment = (id, text) => {
        commentDispatch({
            type: 'editComment',
            payload: {
                id: id,
                text: text
            }
        })
    }

    const cancelComment = (id) => {
        if (!highlightSelector) {
            return null;
        }
        const cancelledComment = commentState.newComments[id];
        const user = cancelledComment.data.user.name;
        highlightSelector.remove("comment", id, user);
        const commentRects = getCommentRects();
        commentDispatch({
            type: 'cancelComment',
            payload: {
                canceledCommentId: id,
                commentRects: commentRects
            }
        });
    }

    const approveComment = (id) => {
        if (!highlightSelector) {
            return null;
        }
        const comment = commentState.comments[id];
        const user = comment.data.user.name;

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

        highlightSelector.remove("comment", id, user);
        const commentRects = getCommentRects();
        commentDispatch({
            type: 'deleteComment',
            payload: {
                id: id,
                commentRects: commentRects
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
        const reply = {
            id: nanoid(),
            data: {
                user: user,
                text: text,
                time: Date.now()
            },
            replies: [],
        };

        commentDispatch({
            type: 'postReply',
            payload: {
                id: id,
                reply: reply
            }
        });
    }

    const postAiReply = (id, text, user, ai) => {
        const reply = {
            id: nanoid(),
            data: {
                user: user,
                text: text,
                time: Date.now(),
                ai: ai
            },
            replies: [],
        };

        commentDispatch({
            type: 'postReply',
            payload: {
                id: id,
                reply: reply
            }
        });
    }

    const editReply = (commentId, replyId, text) => {
        commentDispatch({
            type: 'editReply',
            payload: {
                commentId: commentId,
                replyId: replyId,
                text: text
            }
        })
    }

    const deleteReply = (commentId, replyId) => {
        commentDispatch({
            type: 'deleteReply',
            payload: {
                commentId: commentId,
                replyId: replyId
            }
        })

    }

    const onMarkerChange = (deletionPosition, annotationType, id, user) => {
        console.log("ON MARKER CHANGE", deletionPosition);
        if (deletionPosition) {
            console.log("REMOVING MARKER");
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

    const addAfterMarkedText = (text, marker) => {
        if (!highlightSelector) {
            return;
        }
        return highlightSelector.insertAfterMarkedText(text, marker);
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

    const commentBalloon = <CommentBalloon onMouseDown={addComment}
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
        // unselect comment, if comment balloon gets displayed
        // comment ballon's visibility is defined by showCommentBalloon and an existing caretRect
        if (showCommentBalloon && caretRect !== null && commentState.selectedCommentId) {
            const comment = commentState.comments[commentState.selectedCommentId] || commentState.newComments[commentState.selectedCommentId];
            if (comment) {
                unsetCurrentSelectedComment(comment.id, comment.data.user.name, true);
                setSelectedCommentId();
            }
        }
    }, [caretRect]);

    console.log("COMMENTSTATE", commentState);

    return (
        <UserContext.Provider value={{
            userState: userState
        }}>
            <div className="App">
                <div className="document-editor">
                    <Topbar documentName={prototypeConfig.documentName} description={prototypeConfig.documentDescription}/>
                    <div className="document-editor__toolbar"></div>
                    <div className="document-editor__editable-container">
                        <Container>
                            <Row>
                                <Col ref={ckEditorRef} style={{position: "relative"}} xs={8}>
                                    { commentBalloon }
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
                                              console.log("on change")
                                              console.log(event);
                                              console.log(editor.model.markers);
                                              const data = editor.getData();
                                              console.log("DATA", data);
                                          } }
                                          onBlur={ ( event, editor ) => {
                                            console.log( 'Blur.', editor );
                                              setShowCommentBalloon(false);
                                          } }
                                          onFocus={ ( event, editor ) => {
                                            console.log( 'Focus.', editor );
                                              setShowCommentBalloon(true);
                                          } }
                                      />
                                </Col>
                                <Col ref={sidebarRef} style={{position: "relative"}} xs={4}>
                                    <CommentsSidebarContext.Provider value={{
                                        commentState: commentState,
                                        cancelComment: cancelComment,
                                        postComment: postComment,
                                        editComment: editComment,
                                        approveComment: approveComment,
                                        deleteComment: deleteComment,
                                        postReply: postReply,
                                        editReply: editReply,
                                        deleteReply: deleteReply,
                                        setSelectedCommentId: setSelectedCommentId,
                                        setCurrentSelectedComment: setCurrentSelectedComment,
                                        unsetCurrentSelectedComment: unsetCurrentSelectedComment,
                                        getMarker: getMarker,
                                        getMarkedText: getMarkerText,
                                        replaceMarkedText: replaceMarkedText,
                                        replaceMarkedTextHtml: replaceMarkedTextHtml
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
    );

}

export default App;