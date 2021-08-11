import React, {useCallback, useEffect, useRef, useState} from 'react';
import {ChatLeftFill} from "react-bootstrap-icons";

import ContentEditable from 'react-contenteditable'

import './CommentInput.css';

const useRefCallback = (value, deps) => {
    const ref = React.useRef(value);

    React.useEffect(() => {
        ref.current = value;
    }, deps ?? [value]);

    const result = React.useCallback(args => {
        ref.current?.(args);
    }, []);

    return result;
};

function CommentInput(props) {

    const inputHandler = props.inputHandler;
    const interactiveNames = props.interactiveNames;
    const me = props.me;
    const disabled = props.disabled || false;
    const resetTrigger = props.resetTrigger || "";
    let className = props.className || "";
    const onFocusHandler = props.onFocusHandler;
    const inputHtml = props.inputHtml || "";
    const isTyping = props.isTyping || false;

    const contentEditable = useRef();
    const [html, setHtml] =  useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [suggestionsSearch, setSuggestionsSearch] = useState("");
    const [lastKeyPressed, setLastKeyPressed] = useState("");
    const [caretPos, setCaretPos] = useState(0);
    const [newCaretPos, setNewCaretPos] = useState(-1);
    const [textAnchorNode, setTextAnchorNode] = useState(null);
    const [listCursor, setListCursor] = useState(0);

    useEffect(() => {
        if (lastKeyPressed === "@") {
            let sel = window.getSelection();
            let node = sel.anchorNode;
            if (sel.anchorNode.nodeName === "DIV") {
                node = sel.anchorNode.firstChild;
            }
            //setCaretPos(getCaretPos(sel.anchorNode) - 1);
            setCaretPos(getCaretPos(node));
            setTextAnchorNode(node);
        }
    }, [lastKeyPressed]);

    useEffect(() => {
        if (inputHtml.length > 0) {
            setHtml(inputHtml)
        }

        if (me) {
            const meIndex = interactiveNames.findIndex(name => name.tag === me.tag);
            interactiveNames.splice(meIndex, 1);
        }

    }, []);

    useEffect(() => {
        if (lastKeyPressed === "Enter" || lastKeyPressed === "Tab" || lastKeyPressed === "Click") {
            if (newCaretPos !== -1) {
                const range = document.createRange();
                const sel = window.getSelection();
                const anchorNode = sel.anchorNode;
                // get nextSibling since we added a new text node before

                let suggetionNode;
                if (anchorNode.firstChild && anchorNode.firstChild.nodeValue.includes(suggestionsSearch)) {
                    suggetionNode = anchorNode.firstChild;
                } else if (anchorNode.nextSibling && anchorNode.nextSibling.nodeValue.includes(suggestionsSearch)) {
                    suggetionNode = anchorNode.nextSibling;
                }


                console.log(anchorNode.firstChild);
                //const suggetionNode = anchorNode.nextSibling;
                console.log(suggetionNode);
                console.log(newCaretPos);
                range.setStart(suggetionNode, newCaretPos)
                range.collapse(true)
                sel.removeAllRanges()
                sel.addRange(range)


                setNewCaretPos(-1);
                setLastKeyPressed("");
            }
        }
    }, [html, newCaretPos]);

    useEffect(() => {
        if (lastKeyPressed === "@") {
            console.log(suggestionsSearch)
            const suggestions = getSuggestions(suggestionsSearch);
            if (suggestions.length > 0) {
                setSuggestions(suggestions);
            } else {
                setSuggestions([]);
            }

        }
        inputHandler(html);
    }, [html]);

    useEffect(() => {
        if (resetTrigger.length > 0) {
            console.log("CHANGED INPUT HTML! RESET!");
            reset();
        }
    }, [resetTrigger]);

    const reset = () => {
        setHtml("");
        setSuggestions([]);
        setSuggestionsSearch("");
        setLastKeyPressed("");
        setCaretPos(-1);
        setNewCaretPos(-1);
        setTextAnchorNode(null);
        setListCursor(0);
    }

    const getSuggestions = value => {
        const inputValue = value.toLowerCase();
        const inputLength = inputValue.length;
        return inputLength === 0 ? interactiveNames : interactiveNames.filter(interactiveName => {
            const inputSearch = "@" + value;
            const interactiveNameSlice = interactiveName.tag.toLowerCase().slice(0, inputSearch.length);
            return inputSearch === interactiveNameSlice;
        });
    };

    const insertSuggestionIntoHtml2 = (suggestion, isClickSelection = false) => {
        let sel, range;
        if (window.getSelection) {
            sel = window.getSelection();
            let anchorNode = textAnchorNode
            //let caret = getCaretPos(anchorNode);
            let caret = getCaretPos(anchorNode);
            range = document.createRange();
            // content-editable or text node?
            range.setStart(anchorNode, caretPos);
            if (!isClickSelection) {
                range.setEnd(anchorNode, caret);
            } else {
                range.setEnd(anchorNode, caretPos + suggestionsSearch.length + 1)
            }

            sel.removeAllRanges()
            sel.addRange(range)

            if (sel.rangeCount) {
                range = sel.getRangeAt(0);
                range.deleteContents();
                range.insertNode(document.createTextNode(suggestion.tag + " "));
                setHtml(contentEditable.current.innerHTML);
                setNewCaretPos(suggestion.tag.length + 1);
            }
        }

    }

    const renderSuggestion = (key, id, suggestion, selected) => {
        const style = selected ? {backgroundColor: "red"} : {};
        return <div key={key} style={style} onClick={(e) => {
            handleOnClick(id, suggestion);
            e.preventDefault();
            return
        }
        }>
            {suggestion.tag}
        </div>
    };

    // Taken from: https://stackoverflow.com/questions/4811822/get-a-ranges-start-and-end-offsets-relative-to-its-parent-container/4812022#4812022
    const getCaretPos = element => {
        let caretOffset = 0;
        let doc = element.ownerDocument || element.document;
        let win = doc.defaultView || doc.parentWindow;
        let sel;
        if (typeof win.getSelection != "undefined") {
            sel = win.getSelection();
            if (sel.rangeCount > 0) {
                let range = win.getSelection().getRangeAt(0);
                let preCaretRange = range.cloneRange();
                preCaretRange.selectNodeContents(element);
                preCaretRange.setEnd(range.endContainer, range.endOffset);
                caretOffset = preCaretRange.toString().length;
            }
        } else if ( (sel = doc.selection) && sel.type != "Control") {
            let textRange = sel.createRange();
            let preCaretTextRange = doc.body.createTextRange();
            preCaretTextRange.moveToElementText(element);
            preCaretTextRange.setEndPoint("EndToEnd", textRange);
            caretOffset = preCaretTextRange.text.length;
        }
        console.log(sel);
        return caretOffset;
    }

    const handleOnClick = (id, suggestion) => {
        console.log(id, suggestion);
        insertSuggestionIntoHtml2(suggestions[id], true);
        setSuggestions([]);
        setLastKeyPressed("Click");
        setSuggestionsSearch("");
        setListCursor(0);
        setTextAnchorNode(null);
    };

    const handleKeyDown = useRefCallback(e => {
        //38 up
        //40 down
        //9 tab
        //13 enter
        //32 backspace
        //81 @

        // check for @ input and get caret pos
        if (e.key === "@") {
            console.log("set last key pressed");
            setLastKeyPressed("@");
        }

        if (suggestions) {
            if (e.code === "ArrowUp" && listCursor > 0) {
                setListCursor(listCursor - 1);
                e.preventDefault();
                return
            } else if (e.code === "ArrowDown" && listCursor < suggestions.length - 1) {
                setListCursor(listCursor + 1);
                e.preventDefault();
                return
            }

            if (listCursor >= 0 && listCursor <= suggestions.length -1) {
                if (e.code === "Enter" || e.code === "Tab") {
                    insertSuggestionIntoHtml2(suggestions[listCursor]);
                    setSuggestions([]);
                    setLastKeyPressed(e.code);
                    setSuggestionsSearch("");
                    setListCursor(0);
                    setTextAnchorNode(null);
                    e.preventDefault();
                    return
                }
            }

            if (lastKeyPressed === "@") {
                console.log("SCurr", lastKeyPressed, e.key);
                console.log(suggestionsSearch);
                if (e.key.length === 1) {
                    console.log("foo")
                    setSuggestionsSearch(suggestionsSearch + e.key);
                }
                //else if (e.key === "@") {
                //     console.log("bar")
                //     setSuggestionsSearch("");
                // }

                if (e.code === "Backspace" && suggestionsSearch.length > 0) {
                    setSuggestionsSearch(suggestionsSearch.slice(0, -1));
                }

                if (e.code === "Backspace" && suggestionsSearch.length === 0) {
                    setSuggestions([]);
                    setLastKeyPressed(e.code);
                    setSuggestionsSearch("");
                }
            }

        }
    }, [html, suggestions, listCursor, contentEditable]);

    const handleChange = useRefCallback(e => {
        setHtml(e.target.value);
    }, [suggestions, lastKeyPressed, newCaretPos]);

    const generateSuggestionsList = () => {
        const list = [];
        for (let i = 0; i < suggestions.length; i++) {
            list.push(renderSuggestion("suggestion-" + i, i, suggestions[i], listCursor === i))
        }
        return list;
    };

    const suggestionsList = generateSuggestionsList();

    if (isTyping) {
        className += " typing";
    }

    return <div className={className}>
        <ContentEditable
            className={"content-editable"}
            innerRef={contentEditable}
            html={html} // innerHTML of the editable div
            disabled={disabled}       // use true to disable editing
            onChange={handleChange} // handle innerHTML change
            onKeyDown={handleKeyDown}
            onFocus={onFocusHandler}
            tagName='div' // Use a custom HTML tag (uses a div by default)
        />
        {suggestions &&
            <div>
                {suggestionsList}
            </div>
        }
    </div>
}

export default CommentInput;