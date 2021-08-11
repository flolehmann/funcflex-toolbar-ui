import React, {useContext, useState} from 'react';
import {ChatLeftFill, FileEarmarkText, FileEarmarkTextFill} from "react-bootstrap-icons";

import './UserPresence.css';
import {Col, Container, Image, OverlayTrigger, Tooltip, Row, Fade} from "react-bootstrap";
import {UserContext} from "../App";

function UserPresence(props) {

    const usc = useContext(UserContext);
    const users = usc.userState.users || props.users || [];
    const me = usc.userState.me || props.me || {};

    const userPictures = users.map(user => {
        if ((user.id !== me.id )) {
            return <Fade in={user.online} key={user.id}>
                {user.online ? <div className="user-presence-avatar">
                    <OverlayTrigger
                        key={"bottom"}
                        placement={"bottom"}
                        overlay={
                            <Tooltip>
                                <strong>{user.name}</strong> is also online!
                            </Tooltip>
                        }
                    >
                        <Image src={user.picture} roundedCircle/>
                    </OverlayTrigger>
                </div> : <div></div>}
            </Fade>
        }
    });

    return (
        <div className={"user-presence"}>
            {userPictures}
            <div className="user-presence-avatar me">
                <OverlayTrigger
                    key={"bottom"}
                    placement={"bottom"}
                    overlay={
                        <Tooltip>
                            <strong>{me.name}</strong> (you)
                        </Tooltip>
                    }
                >
                    <Image src={me.picture} roundedCircle />
                </OverlayTrigger>
            </div>
        </div>
    );
}

export default UserPresence;