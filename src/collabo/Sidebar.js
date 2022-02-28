import React, {useCallback, useContext, useEffect, useRef, useState} from 'react';
import Comment from "./Comment";
import './Sidebar.css';
import {CardType, SidebarContext} from "../App";

function Sidebar(props) {

    const [cardNodes, setCardNodes] = useState({});

    const csc = useContext(SidebarContext);
    const sidebarState = csc.sidebarState;
    const setSelectedCardId = csc.setSelectedCardId;

    const [selectedCard, setSelectedCard] = useState("");

    const [sortedCardsRects, setSortedCardsRects] = useState({});
    const [cards, setCards] = useState({});

    const [cardChangedHeight, setCardChangedHeight] = useState ({});

    const cardRectsLength = props.cardRectsLength;
    const sidebarOffsetTop = props.sidebarOffsetTop;

    useEffect(() => {
        // sort cards by card's top position
        const sorted = Object.entries(sidebarState.cardRects)
        .sort(([,a],[,b]) => {
            return a.top - b.top
        })
        .reduce((r, [k, v]) => ({ ...r, [k]: v }), {});
        setSortedCardsRects(sorted);
        setCards({ ...sidebarState.cards });
    }, [sidebarState.cardRects, cardRectsLength, sidebarState.cards]);

    useEffect(() => {
        // remove nodes of deleted cards
        for (const id of Object.keys(cardNodes)) {
            if (!(id in sidebarState.cardRects)) {
                delete cardNodes[id];
            }
        }
    }, [cards]);

    useEffect(() => {
        selectCard(sidebarState.selectedCardId);
    }, [sidebarState.selectedCardId]);

    const selectCard = (id) => {
        if (id) {
            setSelectedCard(id);
            setSelectedCardId(id);
        } else {
            setSelectedCard("");
            setSelectedCardId();
        }
    };

    // ref callback from cards
    const onRefChangeCard = useCallback(node => {
        if (node) {
            const id = node.attributes.getNamedItem("id").value;

            // check if node is already in card node or old node is disconnected and needs update
            if (!(id in cardNodes) || (id in cardNodes && !cardNodes[id].isConnected)) {
                setCardNodes({...cardNodes, [id]: node});
            }
        }
    });

    let cardsList = [];
    const sortedCardsIds = Object.keys(sortedCardsRects);
    const selectedCardIndex = sortedCardsIds.indexOf(selectedCard);
    const isCardSelected = selectedCard !== "";

    let priorSelectedCards = [];

    let priorCardTop = null;
    const scrollYOffset = window.pageYOffset;


    const sortedCardIdsBeforeSelected = sortedCardsIds.splice(0, selectedCardIndex);
    const max = sortedCardIdsBeforeSelected.length - 1;

    console.log("sortedCardsRects", sortedCardsRects);

    // if selected card, take cardIds before selected card and iterate backwards
    if (isCardSelected && sidebarState.cardRects[selectedCard] && sidebarState.cardRects[sortedCardIdsBeforeSelected[max]]) {
        priorCardTop = 0;

        // iterate cards above selected card
        for (let i = max; i >= 0; i--) {
            const id = sortedCardIdsBeforeSelected[i];

            let cardTop;

            // sortedCardsIds[0] is selected card
            // first element above selected card must take selected card's top position
            if (i === max
                && sortedCardsIds[0] in cardNodes
                && sortedCardIdsBeforeSelected[i] in cardNodes
            ) {
                const ownRect = sidebarState.cardRects[id];
                const ownRef = cardNodes[id];

                const selectedCardRect = sidebarState.cardRects[selectedCard];
                // default top position, in case ref to own node does not exist yet
                cardTop = selectedCardRect.top + scrollYOffset - sidebarOffsetTop;

                // if ref to own node exist, adjust positioning
                if (ownRef) {
                    if (((selectedCardRect.top + scrollYOffset - sidebarOffsetTop) - (ownRect.top + scrollYOffset - sidebarOffsetTop) - 10) >= ownRef.offsetHeight) {
                        cardTop = ownRect.top + scrollYOffset - sidebarOffsetTop;
                    } else {
                        cardTop = selectedCardRect.top + scrollYOffset - sidebarOffsetTop - 10 - ownRef.offsetHeight;
                    }
                }
            }

            // all other cards above the selected card (starting from the 2nd) use the prior card's top position
            if (i < max && sortedCardIdsBeforeSelected[i + 1] in cardNodes) {

                const ownRect = sidebarState.cardRects[id];
                const ownRef = cardNodes[id];

                if (!ownRect) {
                    continue;
                }

                cardTop = ownRect.top + scrollYOffset - sidebarOffsetTop;

                if (ownRef) {
                    if ((priorCardTop - (ownRect.top + scrollYOffset - sidebarOffsetTop) + 10) >= ownRef.offsetHeight) {
                        cardTop = ownRect.top + scrollYOffset - sidebarOffsetTop;
                    } else {
                        cardTop = priorCardTop - 10 - ownRef.offsetHeight;
                    }
                }
            }

            priorCardTop = cardTop;

            const marker = csc.getMarker(cards[id].type, cards[id].id, cards[id].data.user.name);

            if (marker) {
                const card = <Comment
                    ref={onRefChangeCard}
                    key={id}
                    comment={cards[id]}
                    markerText={csc.getMarkedText(marker)}
                    selected={selectedCard === id}
                    selectedCard={selectedCard}
                    cardTop={cardTop}
                    position={sidebarState.cardRects[id]}
                    selectHandler={selectCard}
                    changedHeightHandler={(card) => {
                        setCardChangedHeight(card);
                    }}
                />
                priorSelectedCards.push(card);
            }
        }
    }

    for (let i = 0; i < sortedCardsIds.length; i++) {
        const id = sortedCardsIds[i];

        if (!sidebarState.cardRects[id]) {
            continue;
        }

        let cardTop = sidebarState.cardRects[id].top - sidebarOffsetTop;

        const ownRect = sidebarState.cardRects[id];

        if (i > 0 && sortedCardsIds[i - 1] in cardNodes) {
            // ensure to take the recent top position
            const priorCardPosition = cardNodes[sortedCardsIds[i - 1]];
            if (ownRect.top + scrollYOffset - sidebarOffsetTop < (priorCardTop + priorCardPosition.offsetHeight)) {
                cardTop = priorCardTop + priorCardPosition.offsetHeight + 10;
            } else {
                cardTop += scrollYOffset;
            }
        }

        if (i === 0) {
            cardTop += scrollYOffset;
        }

        priorCardTop = cardTop;

        const marker = csc.getMarker(cards[id].type, id, cards[id].data.user.name);

        if (marker) {
            const card = <Comment
                ref={onRefChangeCard}
                key={id}
                comment={cards[id]}
                markerText={csc.getMarkedText(marker)}
                selected={selectedCard === id}
                selectedCard={selectedCard}
                cardTop={cardTop}
                position={ownRect}
                selectHandler={selectCard}
                changedHeightHandler={(card) => {
                    setCardChangedHeight(card);
                }}
            />
            cardsList.push(card);
        }
    }

    if (isCardSelected) {
        cardsList = [...cardsList, ...priorSelectedCards];
    }

    return (
      <div className={"sidebar"}>
          { cardsList }
      </div>
    );
}

export default Sidebar;