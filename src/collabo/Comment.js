import React, {useContext, useState, forwardRef, useEffect} from 'react';
import {Button, Card, Col, Dropdown, Form, Row} from "react-bootstrap";
import {CheckLg, ThreeDotsVertical} from 'react-bootstrap-icons';
import { CommentsSidebarContext } from "../App";
import Autosuggest from 'react-autosuggest';
import CommentInput from "./CommentForm/CommentInput";
import CommentForm from "./CommentForm/CommentForm";

const dateHelper = (date) => {
    const formatNumber = (number) => {
        return number.toLocaleString('en-US', {
            minimumIntegerDigits: 2,
            useGrouping: false
        })
    };

    const [month, day, year] = [formatNumber(date.getMonth() + 1), formatNumber(date.getDate()), date.getFullYear()];
    const [hour, minutes, seconds] = [formatNumber(date.getHours()), formatNumber(date.getMinutes()), formatNumber(date.getSeconds())];

    return day + "." + month + "." + year + "@" + hour + ":" + minutes;
};

const CustomOptionToggle = React.forwardRef(({ children, onClick }, ref) => (
    <a
        href=""
        ref={ref}
        onClick={e => {
            e.preventDefault();
            onClick(e);
        }}
    >
        <ThreeDotsVertical color="gray" />
        {children}
    </a>
));


export default Comment = forwardRef((props, ref) => {

    const csc = useContext(CommentsSidebarContext);

    const comment = props.comment;
    const selected = props.selected;
    const selectedCard = props.selectedCard;
    const cardTop = props.cardTop;
    const position = props.position;
    const selectHandler = props.selectHandler;
    const changedHeightHandler = props.changedHeightHandler;

    const id = comment.id;
    const data = comment.data;

    const user = data.user || "Anonymous";
    const text = data.text || "";

    let style = {};

    const agentNames = [
        {
            name: '@agent'
        },
        {
            name: '@ai'
        }
    ];

    const date = dateHelper(new Date(data.date));

    const [top, setTop] = useState(position.top);
    const [isEdit, setIsEdit] = useState(false);
    const [editReply, setEditReply] = useState("");

    useEffect(() => {
        setTop(cardTop);
    }, [cardTop]);

    if (position) {
        style = { position: "absolute", top: top + "px" };
        console.log("selected?" + selected)
        if (selected) {
            style["left"] = "-15px";
        }
    }

    const replies = comment.replies.length === 0 ? null : comment.replies.map(reply => {
        console.log(reply);
        const date = dateHelper(new Date(reply.data.time));
        const user = reply.data.user;
        const html = reply.data.text;

        const editReplyForm = <CommentForm comment={reply}
                                           top={top}
                                           suggestions={agentNames}
                                           changedHeightHandler={changedHeightHandler}
                                           selectedCard={selectedCard}
                                           selectHandler={selectHandler}
                                           isReply={true}
                                           isEdit={true}
                                           isEditHandler={setIsEdit}
                                           editReplyHandler={setEditReply}
                                           commentId={id} />

        const options = <Dropdown >
                <Dropdown.Toggle as={CustomOptionToggle}>
                </Dropdown.Toggle>
                <Dropdown.Menu size="sm" title="">
                    <Dropdown.Header>Options</Dropdown.Header>
                    <Dropdown.Item onClick={e => {
                            setEditReply(reply.id);
                        }}>Edit</Dropdown.Item>
                    <Dropdown.Item onClick={e => {
                        csc.deleteReply(id, reply.id);
                        e.stopPropagation();
                        e.nativeEvent.stopImmediatePropagation();
                    }}>Delete</Dropdown.Item>
            </Dropdown.Menu>
        </Dropdown>

        return <div key={reply.id}>
            { options }
            <div>{reply.id}</div>
            <div>{user} {date}</div>
            {(editReply === reply.id && editReplyForm) || <div dangerouslySetInnerHTML={{__html: html}}></div>}
        </div>
    });


    const firstComment = !text ? null : <Card.Text dangerouslySetInnerHTML={{__html: text}}></Card.Text>;

    const commentField = <CommentForm comment={comment}
                                      top={top}
                                      suggestions={agentNames}
                                      changedHeightHandler={changedHeightHandler}
                                      isReply={firstComment}
                                      selectedCard={selectedCard}
                                      selectHandler={selectHandler}/>

    const editCommentForm = <CommentForm comment={comment}
                                         top={top}
                                         suggestions={agentNames}
                                         changedHeightHandler={changedHeightHandler}
                                         selectedCard={selectedCard}
                                         selectHandler={selectHandler}
                                         isReply={false}
                                         isEdit={true}
                                         isEditHandler={setIsEdit}/>

    const select = () => {
        if (!selected) {
            csc.setCurrentSelectedComment(id, user);
            selectHandler(id);
        } else {
            csc.unsetCurrentSelectedComment(id, user, true);
            selectHandler();
        }
    }

    const options = <Dropdown>
        <Dropdown.Toggle as={CustomOptionToggle}>
        </Dropdown.Toggle>
        <Dropdown.Menu size="sm" title="">
            <Dropdown.Header>Options</Dropdown.Header>
            <Dropdown.Item onClick={e => {
                setIsEdit(true);
                e.stopPropagation();
                e.nativeEvent.stopImmediatePropagation();
            }}>Edit</Dropdown.Item>
            <Dropdown.Item  onClick={e => {
                csc.deleteComment(id);
                e.stopPropagation();
                e.nativeEvent.stopImmediatePropagation();
            }}>Delete</Dropdown.Item>
        </Dropdown.Menu>
    </Dropdown>

    return (
        <Card ref={ref} id={id} className={"comment-card"} style={style} onClick={select}>
            { firstComment && <Button variant="light" onClick={e => {
                csc.approveComment(id);
                e.stopPropagation();
                e.nativeEvent.stopImmediatePropagation();
            }}><CheckLg color="royalBlue"/></Button> }
            { firstComment && options}
            <Card.Title>{ user } {id} </Card.Title>
            <Card.Subtitle className="mb-2 text-muted">{ date }</Card.Subtitle>
            { (isEdit && editCommentForm) || firstComment }
            <hr />
            <div>
                { replies }
            </div>
            <hr />
            { commentField }
        </Card>
    );
});

