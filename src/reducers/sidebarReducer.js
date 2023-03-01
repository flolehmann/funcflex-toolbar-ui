import {CardStatus} from "../App";

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

    const ai = action.payload.ai || null;
    const suggestionId = action.payload.suggestionId || null;

    const user = action.payload.user;

    const isLoading = action.payload.isLoading || false;

    let tempCard;
    let replyIndex;
    let userIndex;

    switch (action.type) {
        case 'addCard':
            return { ...state,
                cards: { ...state.cards, [card.id]: card },
                cardRects: cardRects || state.cardRects,
                selectedCardId: selectedCardId || state.selectedCardId
            };
        case 'deleteCard':
            tempCard = { ...cards[id] };
            tempCard.state = CardStatus.DELETED;
            tempCard.history = [...tempCard.history, {
                state: CardStatus.DELETED,
                time: Date.now()
            }];
            return { ...state,
                cards: {
                    ...state.cards, [tempCard.id]: tempCard
                },
                cardRects: cardRects || state.cardRects
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
        // AI CARD RELTAED CASES:
        case 'setIsLoading':
            tempCard = { ...cards[id] };
            tempCard.isLoading = isLoading;
            return { ...state,
                cards: {...cards, [id]: tempCard}
            };
        //COMMENT RELATED CASES:
        case 'postComment':
            card.state = CardStatus.POSTED
            card.history = [...card.history, {
                state: CardStatus.POSTED,
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
            tempCard.state = CardStatus.CANCELLED;
            tempCard.history = [...tempCard.history, {
                state: CardStatus.CANCELLED,
                time: Date.now()
            }];
            return { ...state,
                cards: {
                    ...state.cards, [tempCard.id]: tempCard
                },
                cardRects: cardRects || state.commentRects
            };
        case 'approveCard':
            tempCard = { ...cards[id] };
            tempCard.state = CardStatus.APPROVED;
            tempCard.history = [...tempCard.history, {
                state: CardStatus.APPROVED,
                time: Date.now()
            }];
            return { ...state,
                cards: {
                    ...state.cards, [tempCard.id]: tempCard
                },
                cardRects: cardRects || state.cardRects
            };
        case 'deleteComment':
            tempCard = { ...cards[id] };
            tempCard.state = CardStatus.DELETED;
            tempCard.history = [...tempCard.history, {
                state: CardStatus.DELETED,
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
            deletedReply.state = CardStatus.DELETED;
            deletedReply.history = [...deletedReply.history, {
                state: CardStatus.DELETED,
                time: Date.now()
            }];
            tempCard.replies[replyIndex] = deletedReply;
            return { ...state,
                cards: {
                    ...state.cards, [id]: tempCard
                }
            };
        case 'addAiResult':
            tempCard = { ...cards[id] };
            tempCard.ai = ai;
            tempCard.isLoading = false;
            console.log("ADDED AI RESULT")
            return { ...state,
                cards: {...cards, [id]: tempCard}
            };
        case 'insertSuggestion':
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

