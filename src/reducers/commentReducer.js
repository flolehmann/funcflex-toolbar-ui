import {CommentStatus} from "../App";

function commentReducer(state, action) {
    const id = action.payload.id || action.payload.commentId || null;
    const comment = action.payload.comment || null;
    const commentRects = action.payload.commentRects;
    const reply = action.payload.reply || null;
    const replyId = action.payload.replyId || null;
    const text = action.payload.text || null;
    const commentStatus = action.payload.commentStatus || null;

    const cards = state.cards;
    //const replies = state.comment.replies;

    const selectedCommentId = action.payload.selectedCommentId || "";

    const suggestionId = action.payload.suggestionId || null;

    const user = action.payload.user;

    let tempComment;
    let replyIndex;
    let userIndex;
    console.log(state, action);

    switch (action.type) {
        case 'postComment':
            comment.state = CommentStatus.POSTED
            comment.history = [...comment.history, {
                state: CommentStatus.POSTED,
                time: Date.now()
            }];
            return { ...state,
                cards: {
                    ...state.cards, [comment.id]: comment
                }
            };
        case 'editComment':
            tempComment = { ...cards[id] };
            tempComment.data.text = text;
            return { ...state,
                cards: {...cards, [id]: tempComment}
            };
        case 'cancelComment':
            tempComment = { ...cards[id] };
            tempComment.state = CommentStatus.CANCELLED;
            tempComment.history = [...tempComment.history, {
                state: CommentStatus.CANCELLED,
                time: Date.now()
            }];
            return { ...state,
                cards: {
                    ...state.cards, [tempComment.id]: tempComment
                },
                commentRects: commentRects || state.commentRects
            };
        case 'approveComment':
            tempComment = { ...cards[id] };
            tempComment.state = CommentStatus.APPROVED;
            tempComment.history = [...tempComment.history, {
                state: CommentStatus.APPROVED,
                time: Date.now()
            }];
            return { ...state,
                cards: {
                    ...state.cards, [tempComment.id]: tempComment
                },
                commentRects: commentRects || state.commentRects
            };
        case 'deleteComment':
            tempComment = { ...cards[id] };
            tempComment.state = CommentStatus.DELETED;
            tempComment.history = [...tempComment.history, {
                state: CommentStatus.DELETED,
                time: Date.now()
            }];
            return { ...state,
                cards: {
                    ...state.cards, [tempComment.id]: tempComment
                },
                commentRects: commentRects || state.commentRects
            };
        case 'historyRecord':
            tempComment = { ...cards[id] };
            tempComment.state = commentStatus;
            tempComment.history = [...tempComment.history, {
                state: commentStatus,
                time: Date.now()
            }];
            return { ...state,
                cards: {
                    ...state.cards, [tempComment.id]: tempComment
                }
            };
        case 'typingReply':
            tempComment = { ...cards[id] };
            tempComment.typing = [...tempComment.typing, user];
            return { ...state,
                cards: {...cards, [id]: tempComment}
            };
        case 'removeTyping':
            tempComment = { ...cards[id] };
            userIndex = comment.typing.findIndex(u => u.id === user.id);
            tempComment.typing.splice(userIndex, 1);
            return { ...state,
                cards: {...cards, [id]: tempComment}
            };
        case 'postReply':
            tempComment = { ...cards[id] };
            tempComment.replies = [ ...tempComment.replies, reply];
            userIndex = tempComment.typing.findIndex(u => u.id === reply.data.user.id);
            tempComment.typing.splice(userIndex, 1);
            return { ...state,
                cards: {
                    ...state.cards, [id]: tempComment
                }
            };
        case 'editReply':
            tempComment = { ...cards[id] };
            replyIndex = tempComment.replies.findIndex(reply => reply.id === replyId);
            const editReply = { ...tempComment.replies[replyIndex] };
            editReply.data.text = text;
            tempComment.replies[replyIndex] = editReply;
            return { ...state,
                cards: {
                    ...state.cards, [id]: tempComment
                }
            };
        case 'deleteReply':
            tempComment = { ...cards[id] };
            replyIndex = tempComment.replies.findIndex(reply => reply.id === replyId);
            const deletedReply = { ...tempComment.replies[replyIndex] };
            deletedReply.state = CommentStatus.DELETED;
            deletedReply.history = [...deletedReply.history, {
                state: CommentStatus.DELETED,
                time: Date.now()
            }];
            tempComment.replies[replyIndex] = deletedReply;
            return { ...state,
                cards: {
                    ...state.cards, [id]: tempComment
                }
            };
        case 'addSuggestion':
            tempComment = { ...cards[id] };
            tempComment.suggestion = {
                id: suggestionId,
                user: user
            }
            return { ...state,
                cards: {...cards, [id]: tempComment}
            };
        default:
            //throw new Error();
    }
};

export default commentReducer;

