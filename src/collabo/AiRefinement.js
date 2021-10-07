import {Button, FloatingLabel, Modal, Form, Container, Row, Col} from "react-bootstrap";
import React, {useState} from "react";
import './AiRefinement.css';
import ContentEditable from "react-contenteditable";

export default function AiRefinement(props) {

    const {
        title,
        originalText,
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

    return (
        <Modal
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
                <Container>
                    <Row>
                        <Col xs={12} md={2}>
                            Original:
                        </Col>
                        <Col xs={12} md={10}>
                            { originalText }
                        </Col>
                    </Row>
                </Container>
                <hr />
                <Container>
                    <Row>
                        <Col xs={12} md={2}>
                            { type }:
                        </Col>
                        <Col xs={12} md={10}>
                            { refinement }
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
