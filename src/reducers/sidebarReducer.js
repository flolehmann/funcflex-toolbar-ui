import {CommentStatus} from "../App";

function sidebarReducer(state, action) {
    const id = action.payload.id || action.payload.cardId || null;
    const card = action.payload.card || null;
    const cardRects = action.payload.cardRects;
    const reply = action.payload.reply || null;
    const replyId = action.payload.replyId || null;
    const text = action.payload.text || null;
    const cardStatus = action.payload.cardStatus || null;

    const cards = state.cards;
    const replies = state.cards.replies;

    const selectedCardId = action.payload.selectedCardId || "";

    const suggestionId = action.payload.suggestionId || null;

    const user = action.payload.user;

    let tempCard;
    let replyIndex;
    let userIndex;

    switch (action.type) {
        case 'addCard':
            return { ...state,
                cards: { ...state.cards, [card.id]: card },
                cardRects: cardRects || state.cardRects,
            };
        case 'deleteCard':
            tempCard = { ...cards[id] };
            tempCard.state = CommentStatus.DELETED;
            tempCard.history = [...tempCard.history, {
                state: CommentStatus.DELETED,
                time: Date.now()
            }];
            return { ...state,
                comments: {
                    ...state.comments, [tempCard.id]: tempCard
                },
                commentRects: cardRects || state.commentRects
            };
        case 'updateCardRects':
            // fast and naive comparison of cardRects
            const a = JSON.stringify(cardRects);
            const b = JSON.stringify(state.cardRects);
            if (a === b) {
                return state;
            }
            return {
                ...state,
                cardRects: cardRects
            };
        case 'selectCardMarker':
            return {
                ...state,
                selectedCardId: selectedCardId
            }
        //COMMENT RELATED CASES:
        case 'postComment':
            card.state = CommentStatus.POSTED
            card.history = [...card.history, {
                state: CommentStatus.POSTED,
                time: Date.now()
            }];
            return { ...state,
                cards: {
                    ...state.cards, [card.id]: card
                }
            };
        case 'editComment':
            tempCard = { ...cards[id] };
            tempCard.data.text = text;
            return { ...state,
                cards: {...cards, [id]: tempCard}
            };
        case 'cancelComment':
            tempCard = { ...cards[id] };
            tempCard.state = CommentStatus.CANCELLED;
            tempCard.history = [...tempCard.history, {
                state: CommentStatus.CANCELLED,
                time: Date.now()
            }];
            return { ...state,
                cards: {
                    ...state.cards, [tempCard.id]: tempCard
                },
                cardRects: cardRects || state.commentRects
            };
        case 'approveComment':
            tempCard = { ...cards[id] };
            tempCard.state = CommentStatus.APPROVED;
            tempCard.history = [...tempCard.history, {
                state: CommentStatus.APPROVED,
                time: Date.now()
            }];
            return { ...state,
                cards: {
                    ...state.cards, [tempCard.id]: tempCard
                },
                commentRects: cardRects || state.commentRects
            };
        case 'deleteComment':
            tempCard = { ...cards[id] };
            tempCard.state = CommentStatus.DELETED;
            tempCard.history = [...tempCard.history, {
                state: CommentStatus.DELETED,
                time: Date.now()
            }];
            return { ...state,
                cards: {
                    ...state.cards, [tempCard.id]: tempCard
                },
                commentRects: cardRects || state.commentRects
            };
        case 'historyRecord':
            tempCard = { ...cards[id] };
            tempCard.state = cardStatus;
            tempCard.history = [...tempCard.history, {
                state: cardStatus,
                time: Date.now()
            }];
            return { ...state,
                cards: {
                    ...state.cards, [tempCard.id]: tempCard
                }
            };
        case 'typingReply':
            tempCard = { ...cards[id] };
            tempCard.typing = [...tempCard.typing, user];
            return { ...state,
                cards: {...cards, [id]: tempCard}
            };
        case 'removeTyping':
            tempCard = { ...cards[id] };
            userIndex = card.typing.findIndex(u => u.id === user.id);
            tempCard.typing.splice(userIndex, 1);
            return { ...state,
                cards: {...cards, [id]: tempCard}
            };
        case 'postReply':
            tempCard = { ...cards[id] };
            tempCard.replies = [ ...tempCard.replies, reply];
            userIndex = tempCard.typing.findIndex(u => u.id === reply.data.user.id);
            tempCard.typing.splice(userIndex, 1);
            return { ...state,
                cards: {
                    ...state.cards, [id]: tempCard
                }
            };
        case 'editReply':
            tempCard = { ...cards[id] };
            replyIndex = tempCard.replies.findIndex(reply => reply.id === replyId);
            const editReply = { ...tempCard.replies[replyIndex] };
            editReply.data.text = text;
            tempCard.replies[replyIndex] = editReply;
            return { ...state,
                cards: {
                    ...state.cards, [id]: tempCard
                }
            };
        case 'deleteReply':
            tempCard = { ...cards[id] };
            replyIndex = tempCard.replies.findIndex(reply => reply.id === replyId);
            const deletedReply = { ...tempCard.replies[replyIndex] };
            deletedReply.state = CommentStatus.DELETED;
            deletedReply.history = [...deletedReply.history, {
                state: CommentStatus.DELETED,
                time: Date.now()
            }];
            tempCard.replies[replyIndex] = deletedReply;
            return { ...state,
                cards: {
                    ...state.cards, [id]: tempCard
                }
            };
        case 'addSuggestion':
            tempCard = { ...cards[id] };
            tempCard.suggestion = {
                id: suggestionId,
                user: user
            }
            return { ...state,
                cards: {...cards, [id]: tempCard}
            };
        default:
            throw new Error();
    }
};

export default sidebarReducer;

