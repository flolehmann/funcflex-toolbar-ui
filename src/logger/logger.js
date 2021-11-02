import {useEffect, useState} from "react";
import StudyAlignLib from "../studyAlign/study-align-lib";

export default function useLogger(loggerName, apiUrl, studyId) {

    const [name, setName] = useState(loggerName);
    const [sal, setSal] = useState(new StudyAlignLib(apiUrl, studyId));
    const [conditionId, setConditionId] = useState(0);
    const [isready, setIsReady] = useState(false);

    useEffect(() => {
        if (sal) {
            const url = new URL(window.location.href);
            const conditionId = url.searchParams.get("condition_id");
            const loggerKey = url.searchParams.get("logger_key");
            if (conditionId) {
                setConditionId(conditionId);
            }
            if (loggerKey) {
                sal.storeLoggerKey(loggerKey);
            }
            if (conditionId && loggerKey) {
                setIsReady(true);
            }
        }
    }, []);

    async function logger(eventName, data, metaData = {}) {
        const timestamp = Date.now();
        try {
            switch (eventName) {
                case LoggerEvents.USER_AGENT:
                    await sal.logGenericInteraction(conditionId, eventName, data, timestamp);
                    break;
                case LoggerEvents.MOUSE_CLICK:
                    await sal.logMouseInteraction(conditionId, eventName, data, timestamp, metaData);
                    break;
                case LoggerEvents.MOUSE_DBLCLICK:
                    await sal.logMouseInteraction(conditionId, eventName, data, timestamp, metaData);
                    break;
                case LoggerEvents.MOUSE_UP:
                    await sal.logMouseInteraction(conditionId, eventName, data, timestamp, metaData);
                    break;
                case LoggerEvents.MOUSE_DOWN:
                    await sal.logMouseInteraction(conditionId, eventName, data, timestamp, metaData);
                    break;
                case LoggerEvents.MOUSE_ENTER:
                    await sal.logMouseInteraction(conditionId, eventName, data, timestamp, metaData);
                    break;
                case LoggerEvents.MOUSE_LEAVE:
                    await sal.logMouseInteraction(conditionId, eventName, data, timestamp, metaData);
                    break;
                case LoggerEvents.MOUSE_OUT:
                    await sal.logMouseInteraction(conditionId, eventName, data, timestamp, metaData);
                    break;
                case LoggerEvents.MOUSE_OVER:
                    await sal.logMouseInteraction(conditionId, eventName, data, timestamp, metaData);
                    break;
                case LoggerEvents.KEY_DOWN:
                    await sal.logKeyboardInteraction(conditionId, eventName, data, timestamp, metaData);
                    break;
                case LoggerEvents.KEY_UP:
                    await sal.logKeyboardInteraction(conditionId, eventName, data, timestamp, metaData);
                    break;
                case LoggerEvents.KEY_PRESS:
                    await sal.logKeyboardInteraction(conditionId, eventName, data, timestamp, metaData);
                    break;
                case LoggerEvents.EDITOR_UNDO:
                    await sal.logGenericInteraction(conditionId, eventName, data, timestamp, metaData);
                    break;
                case LoggerEvents.EDITOR_REDO:
                    await sal.logGenericInteraction(conditionId, eventName, data, timestamp, metaData);
                    break;
                case LoggerEvents.TEXT_STATS:
                    await sal.logGenericInteraction(conditionId, eventName, data, timestamp, metaData);
                    break;
                case LoggerEvents.COMMENT_ADD:
                    await sal.logGenericInteraction(conditionId, eventName, data, timestamp, metaData);
                    break;
                case LoggerEvents.COMMENT_POST:
                    await sal.logGenericInteraction(conditionId, eventName, data, timestamp, metaData);
                    break;
                case LoggerEvents.COMMENT_CANCEL:
                    await sal.logGenericInteraction(conditionId, eventName, data, timestamp, metaData);
                    break;
                case LoggerEvents.COMMENT_EDIT:
                    await sal.logGenericInteraction(conditionId, eventName, data, timestamp, metaData);
                    break;
                case LoggerEvents.COMMENT_EDIT_TOGGLE:
                    await sal.logGenericInteraction(conditionId, eventName, data, timestamp, metaData);
                    break;
                case LoggerEvents.COMMENT_EDIT_CANCEL:
                    await sal.logGenericInteraction(conditionId, eventName, data, timestamp, metaData);
                    break;
                case LoggerEvents.COMMENT_DELETE:
                    await sal.logGenericInteraction(conditionId, eventName, data, timestamp, metaData);
                    break;
                case LoggerEvents.COMMENT_APPROVE:
                    await sal.logGenericInteraction(conditionId, eventName, data, timestamp, metaData);
                    break;
                case LoggerEvents.REPLY_START:
                    await sal.logGenericInteraction(conditionId, eventName, data, timestamp, metaData);
                    break;
                case LoggerEvents.REPLY_POST:
                    await sal.logGenericInteraction(conditionId, eventName, data, timestamp, metaData);
                    break;
                case LoggerEvents.REPLY_CANCEL:
                    await sal.logGenericInteraction(conditionId, eventName, data, timestamp, metaData);
                    break;
                case LoggerEvents.REPLY_AI:
                    await sal.logGenericInteraction(conditionId, eventName, data, timestamp, metaData);
                    break;
                case LoggerEvents.REPLY_EDIT:
                    await sal.logGenericInteraction(conditionId, eventName, data, timestamp, metaData);
                    break;
                case LoggerEvents.REPLY_EDIT_TOGGLE:
                    await sal.logGenericInteraction(conditionId, eventName, data, timestamp, metaData);
                    break;
                case LoggerEvents.REPLY_EDIT_CANCEL:
                    await sal.logGenericInteraction(conditionId, eventName, data, timestamp, metaData);
                    break;
                case LoggerEvents.REPLY_DELETE:
                    await sal.logGenericInteraction(conditionId, eventName, data, timestamp, metaData);
                    break;
                case LoggerEvents.SUGGESTION_INSERT_AFTER:
                    await sal.logGenericInteraction(conditionId, eventName, data, timestamp, metaData);
                    break;
                case LoggerEvents.SUGGESTION_TAKE_OVER:
                    await sal.logGenericInteraction(conditionId, eventName, data, timestamp, metaData);
                    break;
                case LoggerEvents.SUGGESTION_COPY_TO_CLIPBOARD:
                    await sal.logGenericInteraction(conditionId, eventName, data, timestamp, metaData);
                    break;
                case LoggerEvents.FINAL_TEXT:
                    await sal.logGenericInteraction(conditionId, eventName, data, timestamp, metaData);
                    break;
            }
        } catch (e) {
            console.log("LOGGER FAILED", e);
        }
    }

    function dispatch(eventName, data, metaData = {}) {
        if (conditionId === 0) {
            console.warn("Cannot useLogger since no condition_id has been provided.");
        }
        else if (!sal.readLoggerKey()) {
            console.warn("Cannot useLogger since no logger_key has been provided.");
        } else {
            logger(eventName, data, metaData);
        }
    }

    return [isready, sal, dispatch];
}

export const LoggerEvents = Object.freeze({
    // Procedure specific events
    "USER_AGENT": "USER_AGENT",
    // Generic interaction events
    "MOUSE_CLICK": "click",
    "MOUSE_DBLCLICK": "dblclick",
    "MOUSE_UP": "mouseup",
    "MOUSE_DOWN": "mousedown",
    "MOUSE_ENTER": "mouseenter",
    "MOUSE_LEAVE": "mouseleave",
    "MOUSE_OUT": "mouseout",
    "MOUSE_OVER": "mouseover",
    "KEY_DOWN": "keydown",
    "KEY_UP": "keyup",
    "KEY_PRESS": "keypress",
    // Editor specific interactions
    "EDITOR_UNDO": "EDITOR_UNDO",
    "EDITOR_REDO": "EDITOR_REDO",
    "TEXT_STATS": "TEXT_STATS", //charCount, wordCount
    // Experiment specific events
    "COMMENT_ADD": "COMMENT_ADD",
    "COMMENT_POST": "COMMENT_POST",
    "COMMENT_CANCEL": "COMMENT_CANCEL",
    "COMMENT_EDIT": "COMMENT_EDIT", // comment is edited (saved)
    "COMMENT_EDIT_TOGGLE": "COMMENT_EDIT_TOGGLE", // editing of comment is toggle via sub menu
    "COMMENT_EDIT_CANCEL": "COMMENT_EDIT_CANCEL",
    "COMMENT_DELETE": "COMMENT_DELETE",
    "COMMENT_APPROVE": "COMMENT_APPROVE", // comment is approved; there are 2 types: 1) primary approval via icon button on the top of the comment, 2) approval after ai suggestion was "inserted after"
    "REPLY_START": "REPLY_START", // reply text field is focused
    "REPLY_POST": "REPLY_POST", // new reply is saved
    "REPLY_CANCEL": "REPLY_CANCEL", // reply is cancelled
    "REPLY_AI": "REPLY_AI",
    "REPLY_EDIT": "REPLY_EDIT", // reply is edited (saved)
    "REPLY_EDIT_TOGGLE": "REPLY_EDIT_TOGGLE", // editing of reply is toggle via sub menu
    "REPLY_EDIT_CANCEL": "REPLY_EDIT_CANCEL",
    "REPLY_DELETE": "REPLY_DELETE",
    "SUGGESTION_INSERT_AFTER": "SUGGESTION_INSERT_AFTER",
    "SUGGESTION_TAKE_OVER": "SUGGESTION_TAKE_OVER",
    "SUGGESTION_COPY_TO_CLIPBOARD": "SUGGESTION_COPY_TO_CLIPBOARD",
    "FINAL_TEXT": "FINAL_TEXT"
});