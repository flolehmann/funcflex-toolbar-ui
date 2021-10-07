import {Button, Overlay, Tooltip} from "react-bootstrap";
import React, {useState, useRef} from 'react';

import {Files} from 'react-bootstrap-icons';

function CopyToClipboard(props) {

    const copyText = props.copyText;
    const handleClick = props.handleClick;

    const [show, setShow] = useState(false);
    const target = useRef(null);

    return (
        <>
            <Button variant="primary" size="sm" ref={target} onClick={e => {
                let promise = navigator.clipboard.writeText(copyText);
                promise.then(value => {
                    setShow(true);
                    setTimeout(() => setShow(false), 1200);
                });
                if (handleClick) {
                    handleClick();
                };
                e.preventDefault();
                e.stopPropagation();
                e.nativeEvent.stopImmediatePropagation();
            }}><Files size={18}/></Button>
            <Overlay target={target.current} show={show} placement="right">
                {(props) => (
                    <Tooltip id="copytoclipboard-tooltip" {...props}>
                        Copied to clipoard!
                    </Tooltip>
                )}
            </Overlay>
        </>
    );
}

export default CopyToClipboard;