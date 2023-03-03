import {Button, FloatingLabel, Modal, Form, Container, Row, Col, Badge} from "react-bootstrap";
import React, {useEffect, useRef, useState} from "react";
import './AiRefinement.css';
import ContentEditable from "react-contenteditable";

export default function AiRefinement(props) {

    const {
        title,
        textBeforeOriginalText,
        originalText,
        textAfterOriginalText,
        ai,
        type,
        text,
        hasTakeOverWarning,
        isRefineActive,
        handleRefinement,
        ...rest
    } = props


    let refinement = text;

    if (isRefineActive) {
        refinement = <ContentEditable
            className={"content-editable, form-control"}
            style={{ minHeight: '350px' }}
            html={text} // innerHTML of the editable div
            onChange={e => {
                handleRefinement(e.target.value);
            }} // handle innerHTML change
            tagName='div' // Use a custom HTML tag (uses a div by default)
        />
    }

    const markerRef = useRef(null)
    const scrollToAnnotation = () => {
        if (markerRef.current) {
            markerRef.current.getElementsByClassName('annotation')[0].scrollIntoView({block: "center", inline: "nearest"});
        }
    };

    return (
        <Modal
            onShow={() => scrollToAnnotation()}
            contentClassName={"refinement-modal-content"}
            dialogClassName={"refinement-modal"}
            {...rest}
            size="lg"
            aria-labelledby="contained-modal-title-vcenter"
            centered
            onClick={e => {
                e.preventDefault();
                e.stopPropagation();
                e.nativeEvent.stopImmediatePropagation();
            }}
        >
            <Modal.Header closeButton>
                <Modal.Title id="contained-modal-title-vcenter">
                    {title}
                </Modal.Title>
            </Modal.Header>

            <Modal.Body>
                <Container className="vh-50 d-flex flex-column ">
                    <Row>
                        <Col xs={12} md={6}>
                            <Row>
                                <Col>
                                    <Badge bg="secondary">
                                        Original
                                    </Badge>
                                </Col>
                            </Row>
                            <div className="original-text" ref={markerRef} dangerouslySetInnerHTML={{ __html: originalText }}></div>
                        </Col>
                        <Col xs={12} md={6}>
                            <Row>
                                <Col>
                                    <Badge bg="warning" text="dark">
                                        AI Suggestion
                                    </Badge>
                                </Col>
                            </Row>
                            <Row className="h-100">
                                <Col className={"refinement-text"}>
                                    <div onClick={scrollToAnnotation} className="refinement">{ refinement }</div>
                                </Col>
                            </Row>
                        </Col>
                    </Row>
                </Container>
            </Modal.Body>
            <Modal.Footer>
                <Container>
                    <Row>
                        <Col xs={12} md={7}>
                            { hasTakeOverWarning &&
                            <p className={"warning"}>By taking over the AI suggestion, you are resolving the comment and closing the discussion.
                                The highlighted text in document will be overwritten.</p> }
                        </Col>
                        <Col xs={8} md={5} className={"button-bar"}>
                            {props.children}
                        </Col>
                    </Row>
                </Container>
            </Modal.Footer>
        </Modal>
    );
}
