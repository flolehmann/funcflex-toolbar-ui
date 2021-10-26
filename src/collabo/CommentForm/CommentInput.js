import React, {useCallback, useContext, useEffect, useRef, useState} from 'react';
import ContentEditable from 'react-contenteditable'

import './CommentInput.css';
import {Image} from "react-bootstrap";

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
    //const interactiveNames = props.interactiveNames;
    const me = props.me;
    const disabled = props.disabled || false;
    const resetTrigger = props.resetTrigger || "";
    let className = props.className || "";
    const onFocusHandler = props.onFocusHandler;
    const inputHtml = props.inputHtml || "";
    const isTyping = props.isTyping || false;
    const keyDownCallback = props.keyDownCallback;

    const contentEditable = useRef();
    const [html, setHtml] =  useState("<br>");
    const [interactiveNames, setInteractiveNames] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [suggestionsSearch, setSuggestionsSearch] = useState("");
    const [isSuggestionSearchActive, setIsSuggestionSearchActive] = useState(false);
    const [lastKeyPressed, setLastKeyPressed] = useState("");
    const [caretPos, setCaretPos] = useState(0);
    const [newCaretPos, setNewCaretPos] = useState(-1);
    const [textAnchorNode, setTextAnchorNode] = useState(null);
    const [listCursor, setListCursor] = useState(0);

    // Initialisation, e.g. remove your own name from suggestions list (interactiveNames)
    useEffect(() => {
        if (inputHtml.length > 0) {
            setHtml(inputHtml)
        }

        // copy interactiveNames to keep userstate immutable
        const interactiveNamesTemp = [...props.interactiveNames];
        if (me) {
            const meIndex = interactiveNamesTemp.findIndex(name => name.tag === me.tag);
            interactiveNamesTemp.splice(meIndex, 1);
        }
        setInteractiveNames(interactiveNamesTemp);
    }, []);

    // If last key pressed was an @, start the suggestion search.
    // Here we need to get the anchorNode, and caretPosition before the @ char.
    useEffect(() => {
        if (lastKeyPressed === "@") {
            let sel = window.getSelection();
            let node = sel.anchorNode;
            setCaretPos(getCaretPos(node) - 1);
            setTextAnchorNode(node);
            setIsSuggestionSearchActive(true);
            setLastKeyPressed("");
        }
        // Input handler callback, e.g. used to update comment heights and positions within the sidebar
        inputHandler(html);
    }, [html]);

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

                range.setStart(suggetionNode, newCaretPos)
                range.collapse(true)
                sel.removeAllRanges()
                sel.addRange(range)

                setNewCaretPos(-1);
                setLastKeyPressed("");
            }
        }
    }, [html, newCaretPos]);

    // Search suggestions
    useEffect(() => {
        if (isSuggestionSearchActive) {
            const suggestions = getSuggestions(suggestionsSearch);
            if (suggestions.length > 0) {
                setSuggestions(suggestions);
            } else {
                setSuggestions([]);
            }
        }
    }, [html, isSuggestionSearchActive]);

    useEffect(() => {
        if (resetTrigger.length > 0) {
            reset();
        }
    }, [resetTrigger]);

    const reset = () => {
        setHtml("");
        setIsSuggestionSearchActive(false);
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

    const insertSuggestionIntoHtml = (suggestion, isClickSelection = false) => {
        let sel, range;
        if (window.getSelection) {
            sel = window.getSelection();
            let anchorNode = textAnchorNode;
            let caret = getCaretPos(anchorNode);
            range = document.createRange();
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
        let className = !selected ? "suggestion-row" : "suggestion-row selected";
        return <div key={key} className={className} onClick={(e) => {
            handleOnClick(id, suggestion);
            e.preventDefault();
            return
        }}>
            <div className={"avatar"}>
                <Image src={suggestion.picture} roundedCircle/>
            </div>
            <div className={"user-data"}>
                <div className={"tag"}>{ suggestion.tag }</div>
                <div className={"name"}>{ suggestion.name }</div>
            </div>
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
        return caretOffset;
    }

    const handleOnClick = (id, suggestion) => {
        insertSuggestionIntoHtml(suggestions[id], true);
        setIsSuggestionSearchActive(false);
        setSuggestions([]);
        setLastKeyPressed("Click");
        setSuggestionsSearch("");
        setListCursor(0);
        setTextAnchorNode(null);
    };

    const handleKeyDown = useRefCallback(e => {

        if (keyDownCallback) {
            keyDownCallback(e);
        }

        // check for @ input and get caret pos
        if (e.key === "@") {
            setLastKeyPressed("@");
            setSuggestionsSearch("");
            setListCursor(0);
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
                    insertSuggestionIntoHtml(suggestions[listCursor]);
                    setIsSuggestionSearchActive(false);
                    setSuggestions([]);
                    setLastKeyPressed(e.code);
                    setSuggestionsSearch("");
                    setListCursor(0);
                    setTextAnchorNode(null);
                    e.preventDefault();
                    return
                }
            }

            if (isSuggestionSearchActive) {
                if (e.key.length === 1 && e.key !== "@") {
                    setSuggestionsSearch(suggestionsSearch + e.key);
                }
                if (e.code === "Backspace" && suggestionsSearch.length > 0) {
                    setSuggestionsSearch(suggestionsSearch.slice(0, -1));
                }
                if (e.code === "Backspace" && suggestionsSearch.length === 0) {
                    setSuggestions([]);
                    setLastKeyPressed(e.code);
                    setSuggestionsSearch("");
                    setIsSuggestionSearchActive(false);
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
            disabled={disabled} // use true to disable editing
            onChange={handleChange} // handle innerHTML change
            onKeyDown={handleKeyDown}
            onFocus={onFocusHandler}
            tagName='div' // Use a custom HTML tag (uses a div by default)
        />
        {suggestions && suggestionsList.length > 0 &&
            <div className={"suggestion-list"}>
                {suggestionsList}
            </div>
        }
    </div>
}

export default CommentInput;