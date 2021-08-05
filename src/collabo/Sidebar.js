import React, {useCallback, useContext, useEffect, useRef, useState} from 'react';
import Comment from "./Comment";
import './Sidebar.css';
import {CommentsSidebarContext} from "../App";

function Sidebar(props) {

    const [commentNodes, setCommentNodes] = useState({});

    const csc = useContext(CommentsSidebarContext);
    const commentState = csc.commentState;

    const [selectedComment, setSelectedComment] = useState("");

    const [sortedCommentRects, setSortedCommentRects] = useState({});
    const [comments, setComments] = useState({});

    const [commentChangedheight, setCommentChangedHeight] = useState ({});

    const commentRectsLength = props.commentRectsLength;

    useEffect(() => {
        // sort comments by CommentCard's top position
        console.log("SORT COMMENTS")
        const sorted = Object.entries(commentState.commentRects)
        .sort(([,a],[,b]) => {
            return a.top - b.top
        })
        .reduce((r, [k, v]) => ({ ...r, [k]: v }), {});
        setSortedCommentRects(sorted);
        // merge comments and newComments
        setComments({...commentState.comments, ...commentState.newComments});
    }, [commentState.commentRects, commentRectsLength, commentState.comments, commentState.newComments]);

    useEffect(() => {
        // remove nodes of deleted comments
        for (const id of Object.keys(commentNodes)) {
            if (!(id in commentState.commentRects)) {
                console.log("DELETE REF", id, commentNodes[id]);
                delete commentNodes[id];
            }
        }
    }, [comments]);

    useEffect(() => {
        selectCard(commentState.selectedCommentId);
    }, [commentState.selectedCommentId]);

    const selectCard = (id) => {
        if (id) {
            setSelectedComment(id);
        } else {
            setSelectedComment("");
        }
    };

    // ref callback from commentcards
    const onRefChangeComment = useCallback(node => {
        if (node) {
            const id = node.attributes.getNamedItem("id").value;

            // check if node is already in comment node or old node is disconnected and needs update
            if (!(id in commentNodes) || (id in commentNodes && !commentNodes[id].isConnected)) {
                setCommentNodes({...commentNodes, [id]: node});
            }
        }
    });

    let commentCards = [];
    const sortedCommentIds = Object.keys(sortedCommentRects);
    const selectedCommentIndex = sortedCommentIds.indexOf(selectedComment);
    const isCommentSelected = selectedComment !== "";

    let priorSelectedCommentCards = [];

    let priorCommentTop = null;
    const scrollYOffset = window.pageYOffset;


    const sortedCommentIdsBeforeSelected = sortedCommentIds.splice(0, selectedCommentIndex);
    const max = sortedCommentIdsBeforeSelected.length - 1;

    // if selected comment, take commentIds before selected card and iterate backwards
    if (isCommentSelected && commentState.commentRects[selectedComment] && commentState.commentRects[sortedCommentIdsBeforeSelected[max]]) {
        priorCommentTop = 0;

        // iterate comments above selected comment
        for (let i = max; i >= 0; i--) {
            const id = sortedCommentIdsBeforeSelected[i];

            let cardTop;

            // sortedCommentIds[0] is selected comment card
            // first element above selected card must take selected comment card's top position
            if (i === max
                && sortedCommentIds[0] in commentNodes
                && sortedCommentIdsBeforeSelected[i] in commentNodes
            ) {
                const ownRect = commentState.commentRects[id];
                const ownRef = commentNodes[id];

                const selectedCommentRect = commentState.commentRects[selectedComment];
                // default top position, in case ref to own node does not exist yet
                cardTop = selectedCommentRect.top + scrollYOffset;

                // if ref to own node exist, adjust positioning
                if (ownRef) {
                    if (((selectedCommentRect.top + scrollYOffset) - (ownRect.top + scrollYOffset) - 10) >= ownRef.offsetHeight) {
                        cardTop = ownRect.top + scrollYOffset;
                    } else {
                        cardTop = selectedCommentRect.top + scrollYOffset - 10 - ownRef.offsetHeight;
                    }
                }
            }

            // all other comments above the selected card (starting from the 2nd) use the prior comment's top position
            if (i < max && sortedCommentIdsBeforeSelected[i + 1] in commentNodes) {

                const ownRect = commentState.commentRects[id];
                const ownRef = commentNodes[id];

                if (!ownRect) {
                    continue;
                }

                cardTop = ownRect.top + scrollYOffset;

                if (ownRef) {
                    if ((priorCommentTop - (ownRect.top + scrollYOffset) + 10) >= ownRef.offsetHeight) {
                        cardTop = ownRect.top + scrollYOffset;
                    } else {
                        cardTop = priorCommentTop - 10 - ownRef.offsetHeight;
                    }
                }
            }

            const commentCard = <Comment
                ref={onRefChangeComment}
                key={id}
                comment={comments[id]}
                selected={selectedComment === id}
                selectedCard={selectedComment}
                cardTop={cardTop}
                position={commentState.commentRects[id]}
                selectHandler={selectCard}
                changedHeightHandler={(comment) => {
                    setCommentChangedHeight(comment);
                }}
            />

            priorCommentTop = cardTop;

            priorSelectedCommentCards.push(commentCard);
        }
    }

    for (let i = 0; i < sortedCommentIds.length; i++) {
        const id = sortedCommentIds[i];

        if (!commentState.commentRects[id]) {
            continue;
        }

        let cardTop = commentState.commentRects[id].top;

        const ownRect = commentState.commentRects[id];

        if (i > 0 && sortedCommentIds[i - 1] in commentNodes) {
            // ensure to take the recent top position
            const priorCommentPosition = commentNodes[sortedCommentIds[i - 1]];

            if (ownRect.top + scrollYOffset < (priorCommentTop + priorCommentPosition.offsetHeight)) {
                cardTop = priorCommentTop + priorCommentPosition.offsetHeight + 10;
            } else {
                cardTop += scrollYOffset;
            }
        }

        if (i === 0) {
            cardTop += scrollYOffset;
        }

        const commentCard = <Comment
            ref={onRefChangeComment}
            key={id}
            comment={comments[id]}
            selected={selectedComment === id}
            selectedCard={selectedComment}
            cardTop={cardTop}
            position={ownRect}
            selectHandler={selectCard}
            changedHeightHandler={(comment) => {
                setCommentChangedHeight(comment);
            }}
        />

        priorCommentTop = cardTop;

        commentCards.push(commentCard);
    }

    if (isCommentSelected) {
        commentCards = [...commentCards, ...priorSelectedCommentCards];
    }

    return (
      <div className={"sidebar"}>
          { commentCards }
      </div>
    );
}

export default Sidebar;