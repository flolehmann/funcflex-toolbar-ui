import React, {Component, useReducer, useRef, useState} from 'react';

import { CKEditor } from '@ckeditor/ckeditor5-react';
import { nanoid } from 'nanoid'

// NOTE: Use the editor from source (not a build)!
import ClassicEditor from '@ckeditor/ckeditor5-editor-classic/src/classiceditor';
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

const editorConfiguration = {
  plugins: [ Essentials, Bold, Italic, Paragraph, HighlightSelector ],
  toolbar: [ 'bold', 'italic']
};

//const data = '<p>Hello <annotation-start name="comment:uzRaHkIJKE41z7vvzT9XL"></annotation-start>from CK<annotation-end name="comment:uzRaHkIJKE41z7vvzT9XL"></annotation-end>Edito<annotation-start name="comment:S2E4isI2NsvqAa6oE5ax7"></annotation-start>r 5!</p><p>h3h<annotation-end name="comment:S2E4isI2NsvqAa6oE5ax7"></annotation-end>3<annotation-start name="comment:NLnz9xWNvaXe806U24eqr:h3h3"></annotation-start> y<annotation-end name="comment:NLnz9xWNvaXe806U24eqr:h3h3"></annotation-end>0</p>';
//const comments = {};

const data = '<p> Hello World</p>';

const initialCommentState = {
    comments: {},
    newComments: {},
    cancelledComments: {},
    approvedComments: {},
    deletedComments: {},
    commentRects: {},
    selectedCommentId: ""
};

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

    let comment;
    let replyIndex;

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
            console.log("approve dem");
            console.log(comment);
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
        case 'postReply':
            comment = comments[id];
            comment.replies.push(reply);
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
            console.log(comment);
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

export const CommentsSidebarContext = React.createContext(null);

function App(){

    const ckEditorRef = useRef(null);
    const ckEditorWidth = ckEditorRef.current ? ckEditorRef.current.offsetWidth : 0;

    const [init, setInit] = useState(false);
    const [editor, setEditor] = useState(null);
    const [highlightSelector, setHighlightSelector] = useState(null);
    const [caretRect, setCaretRect] = useState(null);

    const [showCommentBalloon, setShowCommentBalloon] = useState(false);

    const [commentState, dispatch] = useReducer(commentReducer, initialCommentState);

    const initialize = () => {
        if (!init) {
            getPlugin();
            //setOnRender();
            //setOnChangeData();
            setOnChangeView();
            setCaretDetector();
            //setOnUpdateMarker();
            setClickObserver();
            setOnClickMarker();
            if (editor && highlightSelector) {
                console.log("Init done!")
                setInit(true);
            }
        }
    }

    console.log(commentState);

    const getPlugin = () => {
        console.log("getPlugin")
        if (!editor || highlightSelector) {
            return;
        }
        setHighlightSelector(editor.plugins.get('HighlightSelector'));
    }

    const addComment = () => {
        if (!highlightSelector) {
            return;
        }
        const user = "user";
        const id = highlightSelector.add("comment", user, onMarkerChange);
        const newComment = {
            id: id,
            data: {
                user: user,
                date: Date.now()
            },
            replies: [],
            deletedReplies: []
        }
        const commentRects = getCommentRects();
        dispatch({
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

        dispatch({
            type: 'postComment',
            payload: {
                newComment: newComment
            }
        });
    }

    const editComment = (id, text) => {
        dispatch({
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
        const user = cancelledComment.data.user;
        highlightSelector.remove("comment", id, user);
        const commentRects = getCommentRects();
        console.log("DISPATCH CANCEL COMMENT")
        dispatch({
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
        console.log(commentState);
        const comment = commentState.comments[id];
        const user = comment.data.user;

        highlightSelector.remove("comment", id, user);
        const commentRects = getCommentRects();
        dispatch({
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
        console.log(commentState);
        const comment = commentState.comments[id];
        const user = comment.data.user;

        highlightSelector.remove("comment", id, user);
        const commentRects = getCommentRects();
        dispatch({
            type: 'deleteComment',
            payload: {
                id: id,
                commentRects: commentRects
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

        dispatch({
            type: 'postReply',
            payload: {
                id: id,
                reply: reply
            }
        });
    }

    const editReply = (commentId, replyId, text) => {
        console.log(commentId, replyId, text)
        dispatch({
            type: 'editReply',
            payload: {
                commentId: commentId,
                replyId: replyId,
                text: text
            }
        })
    }

    const deleteReply = (commentId, replyId) => {
        dispatch({
            type: 'deleteReply',
            payload: {
                commentId: commentId,
                replyId: replyId
            }
        })

    }

    const onMarkerChange = (deletionPosition, annotationType, id, user) => {
        if (deletionPosition) {
            console.log(deletionPosition)
            console.log("DELETED MARKER YO UPDATING!")
            highlightSelector.remove(annotationType, id, user);
            updateCommentRects();
        }
    }

    const getCommentRects = () => {
        if (!highlightSelector) {
            return;
        }
        let start = Date.now();
        highlightSelector.computeRects("comment")
        //console.log(Date.now() - start);
        let rects = highlightSelector.getRects();
        return rects["comment"];
    }

    const updateCommentRects = () => {
        const commentRects = getCommentRects();
        //console.log(commentRects);
        //console.log(commentState)
        dispatch({
            type: 'updateCommentRects',
            payload: {
                commentRects: commentRects
            }
        });
    }

    const setSelectedCommentId = (selectedCommentId) => {
        console.log("DISPATCHING", "setSelectedCommentId", selectedCommentId);
        dispatch({
            type: 'selectCommentMarker',
            payload: {
                selectedCommentId: selectedCommentId
            }
        })
    }

    const getCaretRect = (rect) => {
        setCaretRect(rect);
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

    const setOnRemoveMarker = () => {
        if (!highlightSelector) {
            return;
        }

        highlightSelector.setOnRemoveMarker(() => console.log("ON REMOVE MARKER CALLED BACK!"))
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
        console.log("setOnClickMarker")
        highlightSelector.setOnClickMarker(setSelectedCommentId);
    }

    const commentBalloon = <CommentBalloon onMouseDown={addComment}
                                           isVisible={showCommentBalloon}
                                           ckEditorWidth={ckEditorWidth}
                                           caretPosition={caretRect} />;

    initialize();

    return (
        <Container fluid>
            <Row>
                <Col xs={8}>
                    <div className="App" ref={ckEditorRef}>
                        { commentBalloon }
                        <div className="document-editor">
                            <div className="document-editor__toolbar"></div>
                                <div className="document-editor__editable-container">
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
                                              const data = editor.getData();
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
                                </div>
                        </div>
                    </div>
                </Col>
                <Col xs={4}>
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
                        setCurrentSelectedComment: setCurrentSelectedComment,
                        unsetCurrentSelectedComment: unsetCurrentSelectedComment
                    }}>
                        <Sidebar commentRectsLength={Object.keys(commentState.commentRects).length}/>
                    </CommentsSidebarContext.Provider>
                </Col>
            </Row>
        </Container>
    );

}

export default App;