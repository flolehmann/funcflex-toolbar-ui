import React from 'react';
import {FileEarmarkTextFill} from "react-bootstrap-icons";

import './Topbar.css';
import UserPresence from "./UserPresence";

function Topbar(props) {

    const documentName = props.documentName || "Demo Text Document";
    const description = props.description || "This document exists for demonstration purposes.";

    return (
        <div className={"topbar"}>
            <div className={"topbar-left"}>
                <div className={"document-icon"}>
                    <FileEarmarkTextFill color="royalblue" size={40} />
                </div>
                <div className={"inner"}>
                    <h1>{documentName}</h1>
                    <p className={"description"}>{description}</p>
                </div>
            </div>
            <div className={"topbar-right"}>
                <UserPresence />
            </div>
        </div>
    );
}

export default Topbar;