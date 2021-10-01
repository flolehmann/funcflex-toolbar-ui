import {Button, FloatingLabel, Modal, Form, Container, Row, Col} from "react-bootstrap";
import React, {useState} from "react";
import './AiRefinement.css';
import ContentEditable from "react-contenteditable";
import CopyToClipboard from "./CopyToClipboard";

export default function AiRefinement(props) {

    const copyToClipboard = props.copyToClipboard;
    const ai = props.ai;
    const onHide = props.onHide;
    const handleTakeOver = props.handleTakeOver;
    const user = props.user;

    const [refinedText, setRefinedText] = useState(ai.data.prediction);

    return (
        <Modal
            {...props}
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
                    Summary by { user.name }
                </Modal.Title>
            </Modal.Header>

            <Modal.Body>
                <ContentEditable
                    className={"content-editable, form-control"}
                    style={{ minHeight: '350px' }}
                    html={refinedText} // innerHTML of the editable div
                    onChange={e => setRefinedText(e.target.value)} // handle innerHTML change
                    tagName='div' // Use a custom HTML tag (uses a div by default)
                />

                {/*<FloatingLabel controlId="floatingTextarea2" label="Refine Summary">*/}
                {/*    <Form.Control*/}
                {/*        as="textarea"*/}
                {/*        placeholder={"Summary by" + user.name}*/}
                {/*        defaultValue={ai.data.prediction}*/}
                {/*        style={{ height: '350px' }}*/}
                {/*        onChange={e => setRefinedText(e.target.value)}*/}
                {/*    />*/}
                {/*</FloatingLabel>*/}
            </Modal.Body>
            <Modal.Footer>
                <Container>
                    <Row>
                        <Col xs={12} md={8}>
                            { !copyToClipboard &&
                            <p className={"warning"}>By taking over this text, you are approving the discussion and overwriting the marked text.</p> }
                        </Col>
                        <Col xs={6} md={4} className={"button-bar"}>
                            { !copyToClipboard && <Button onClick={() => handleTakeOver(refinedText)} variant="secondary">Take over</Button> }
                            { copyToClipboard && <CopyToClipboard copyText={refinedText} /> }
                        </Col>
                    </Row>
                </Container>
            </Modal.Footer>
        </Modal>
    );
}
