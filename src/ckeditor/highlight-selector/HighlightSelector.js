import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import Rect from '@ckeditor/ckeditor5-utils/src/dom/rect';
import { nanoid } from 'nanoid'
import Range from "@ckeditor/ckeditor5-engine/src/model/range";
import Selection from "@ckeditor/ckeditor5-engine/src/model/selection";
import LiveRange from "@ckeditor/ckeditor5-engine/src/model/liverange";
import Position from "@ckeditor/ckeditor5-engine/src/model/position";
import getSelectedContent from "@ckeditor/ckeditor5-engine/src/model/utils/getselectedcontent";

import imageIcon from '@ckeditor/ckeditor5-core/theme/icons/image.svg';
import eraserIcon from '@ckeditor/ckeditor5-core/theme/icons/eraser.svg';

import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';

import ClickObserver from '@ckeditor/ckeditor5-engine/src/view/observer/clickobserver';


export default class HighlightSelector extends Plugin {

    static get pluginName() {
        return 'HighlightSelector';
    }

    rects = {};
    caretRect = null;
    currentSelectedMarker = "";
    reactSidebarState = null;

    // undo and redo callback workaround
    // text
    undoCallback = null;
    redoCallback = null;

    text = "";
    previousText = "";

    init() {
        const editor = this.editor;

        editor.ui.componentFactory.add('addComment', locale => {
            const addCommentView = new ButtonView(locale);

            addCommentView.set( {
                label: 'Add Comment',
                icon: imageIcon,
                tooltip: true
            } );

            // Callback executed once the image is clicked.
            addCommentView.on('execute', () => {
                this.add("comment");
            } );

            return addCommentView;
        } );

        editor.ui.componentFactory.add('removeComment', locale => {
            const removeCommentView = new ButtonView(locale);

            removeCommentView.set( {
                label: 'Remove Comment',
                icon: eraserIcon,
                tooltip: true
            } );

            // Callback executed once the image is clicked.
            removeCommentView.on('execute', () => {
                this.remove("comment", "id" );
            } );

            return removeCommentView;
        } );

        editor.model.document.on('change', () => {
            this.previousText = this.text;
            this.text = editor.getData();
        } );

        editor.conversion.for('editingDowncast').markerToHighlight({
            model: "annotation",
            view: this.markerHighlightView.bind(this)
        });

        editor.conversion.for('dataDowncast').markerToData({
            model: 'annotation'
        });

        editor.conversion.for('upcast').dataToMarker( {
            view: 'annotation'
        });

        const undoCommand = editor.commands.get('undo');
        const redoCommand = editor.commands.get('redo');

        undoCommand.on('execute', eventInfo => {
            if (this.undoCallback) {
                this.undoCallback(this.text, this.previousText);
            }
        });

        redoCommand.on('execute', eventInfo => {
            if (this.redoCallback) {
                this.redoCallback(this.text, this.previousText);
            }
        });

        editor.model.on ('applyOperation', (eventInfo, args) => {
            //console.log("APPLY OP", eventInfo, args);
        });
    }

    markerHighlightView(data, conversionApi) {
        const [ , annotationType, annotationId, userId ] = data.markerName.split(':');
        const annotationAttributeId = this.createAnnotationAttribute(annotationType);
        const attributes = {}
        attributes[annotationAttributeId] = annotationId;
        attributes["data-annotation-type"] = annotationType;

        if (userId) {
            const userAttributeId = this.createUserAttribute();
            attributes[userAttributeId] = userId
        }

        let classes = ['annotation', String(annotationType).toLowerCase(), annotationType + "-" + annotationId]
        if (userId) {
            classes.push(annotationType + "-by-" + userId)
        }
        if (this.currentSelectedMarker === data.markerName) {
            classes.push("selected");
        }

        return {
            classes: classes,
            attributes: attributes
        };
    }

    add(annotationType, userId = null, onChangeEventCallback = null) {
        const editor = this.editor;
        let id = nanoid();
        editor.model.change( writer => {
            for (const range of editor.model.document.selection.getRanges()) {
                const marker = writer.addMarker(this.createAnnotationIdentifier(annotationType, id, userId), { range, usingOperation: false, affectsData: true  } );
                if (onChangeEventCallback) {
                    marker.on('change:range', (eventInfo, oldRange, data) => {
                        onChangeEventCallback(data.deletionPosition, annotationType, id, userId, this.reactSidebarState);
                    });
                }
            }
        });
        return id;
    }

    addAtRange(range, annotationType, userId = null, onChangeEventCallback = null) {
        const editor = this.editor;
        let id = nanoid();
        editor.model.change( writer => {
            const marker = writer.addMarker(this.createAnnotationIdentifier(annotationType, id, userId), { range, usingOperation: false, affectsData: true  } );
            if (onChangeEventCallback) {
                marker.on('change:range', (eventInfo, oldRange, data) => {
                    onChangeEventCallback(data.deletionPosition, annotationType, id, userId);
                });
            }
        });
        return id;
    }

    remove(annotationType, annotationId, userId = null) {
        const editor = this.editor;
        const annotationIdentifier = this.createAnnotationIdentifier(annotationType, annotationId, userId);
        editor.model.change(writer => {
            const markerName = annotationIdentifier;
            writer.removeMarker(markerName);
        });

        if (annotationIdentifier === this.currentSelectedMarker) {
            this.unsetCurrentSelectedCard(annotationType, annotationId, userId);
        }

        return this.rects;
    }

    update(annotationType, annotationId, userId = null, options) {
        const editor = this.editor;
        const markerIdentifier = this.createAnnotationIdentifier(annotationType, annotationId, userId);
        const marker = editor.model.markers.get(markerIdentifier);

        if (!marker) {
            return;
        }

        if (options) {
            editor.model.change(writer => writer.updateMarker(markerIdentifier, options));
        } else {
            editor.model.change(writer => writer.updateMarker(markerIdentifier));
        }
    }

    getMarker(annotationType, annotationId, userId = null) {
        const editor = this.editor;
        const annotationIdentifier = this.createAnnotationIdentifier(annotationType, annotationId, userId);
        const markers = editor.model.markers;
        const marker = markers.get(annotationIdentifier);
        return marker;
    }

    getMarkerText(marker) {
        const result = [];
        const range = marker.getRange();
        for ( const item of range.getItems() ) {
            if (item.is("textProxy")) {
                result.push(item.data);
            }
        }
        return result.join(" ");
    }

    getRangeBeforeMarker(marker, charsBefore = 30, startShift = false) {
        const startPosition = marker.getStart();

        let shiftedPosition = startPosition.getShiftedBy(startPosition.offset * -1);
        if (charsBefore > startPosition.offset || startShift) {
            // check if there is an element before
            if (startPosition.parent.previousSibling) {
                //shift position path up to element before
                shiftedPosition = new Position(startPosition.root, [startPosition.parent.previousSibling.getPath()[0], 0])
                // element is long!
                if (shiftedPosition.parent.maxOffset >= charsBefore) {
                     shiftedPosition = shiftedPosition.getShiftedBy(charsBefore)
                }
            }
        }

        const range = new Range(shiftedPosition, marker.getStart());
        return range;
    }

    isPreviousTextLong(marker, chars = 30) {
        const startPosition = marker.getStart();
        return startPosition.offset >= chars;
    }

    isNextTextLong(marker, chars = 30) {
        const endPosition = marker.getEnd();
        return endPosition.parent.maxOffset - endPosition.offset >= chars;
    }

    modelElementToDomCopy(modelElement) {
        const editor = this.editor;
        const domConverter = editor.editing.view.domConverter;
        const viewElement = editor.editing.mapper.toViewElement(modelElement);
        const dom = domConverter.mapViewToDom(viewElement);
        const domCopy = dom.cloneNode(true);
        return domCopy;
    }

    getElementPreviousMarkerContainingElement(marker, chars = 30) {
        if (!this.isPreviousTextLong(marker, chars)) {
            const commonAncestor = marker.getRange().getCommonAncestor();
            const previousSibling = commonAncestor.previousSibling;
            if (previousSibling) {
                const domPreviousSiblingCopy = this.modelElementToDomCopy(previousSibling);
                return domPreviousSiblingCopy;
            }
        }
        return null;
    }

    getElementNextMarkerContainingElement(marker, chars = 30) {
        if (!this.isNextTextLong(marker, chars)) {
            const commonAncestor = marker.getRange().getCommonAncestor();
            const nextSibling = commonAncestor.nextSibling;
            if (nextSibling) {
                const domNextSiblingCopy = this.modelElementToDomCopy(nextSibling);
                return domNextSiblingCopy;
            }
        }
        return null;
    }

    hasMultipleAncestors(marker) {
        const ancestors = marker.getRange().getContainedElement();
        return ancestors.length > 1;
    }

    getElementContainingMarker(marker, chars = 30) {
        const commonAncestor = marker.getRange().getCommonAncestor();
        const domAncestorCopy = this.modelElementToDomCopy(commonAncestor);
        const [ , annotationType, annotationId, userId ] = marker.name.split(':');
        return domAncestorCopy;

        // retrieve id / class as parameter

        const markerSpans = domAncestorCopy.querySelectorAll(".annotation");
        markerSpans.forEach(span => {
            //span.className = "";
            //span.textContent = "HAHAHAHHHAHA"
        });

        //domAncestorCopy.textContent = "- Write a blog post about";

        // const range = new Range(shiftedStartPosition, shiftedEndPosition);
        //
        // for ( const item of range.getItems() ) {
        // }
    }

    // getTextBeforeMarker(marker, charsBefore = 30) {
    //     const result = [];
    //     const range = this.getRangeBeforeMarker(marker, charsBefore);
    //     const liveRange = LiveRange.fromRange(range);
    //     console.log("START ITEM ITER BEFORE")
    //     for ( const item of liveRange.getItems() ) {
    //         console.log("ITEM", item)
    //         if (item.is("textProxy")) {
    //             result.push(item.data);
    //         }
    //         else {
    //             result.push("LINE_BREAK")
    //         }
    //     }
    //     return result;
    // }

    getRootDomCopy(marker) {
       const root = marker.getRange().root;
       const domRootCopy = this.modelElementToDomCopy(root);
       return domRootCopy;
    }

    getOriginalTextDom(marker) {
        const domRootCopy = this.getRootDomCopy(marker);
        //remove classList and id
        domRootCopy.classList = "";
        domRootCopy.id = "";
        //remove all classes from marker spans
        const [ , annotationType, annotationId, userId ] = marker.name.split(':');
        const markerClass = annotationType + "-" + annotationId;
        const markerSpans = domRootCopy.querySelectorAll("span.annotation:not(."+ markerClass + ")");
        markerSpans.forEach(span => {
            span.classList = "";
        });
        const rootDomString = new String(domRootCopy.innerHTML);
        return rootDomString;
    }

    getTextSnippet(marker, charsAround = 30) {
        const elementContainingMarker = this.getElementContainingMarker(marker, charsAround);
        const previousElementContainingMarker = this.getElementPreviousMarkerContainingElement(marker, charsAround);
        const nextElementContainingMarker = this.getElementNextMarkerContainingElement(marker, charsAround);
        const result = []
        previousElementContainingMarker && result.push(previousElementContainingMarker);
        result.push(elementContainingMarker);
        nextElementContainingMarker && result.push(nextElementContainingMarker);
        return result;
    }

    getTextBeforeMarker(marker, charsBefore = 30) {
        const editor = this.editor;
        const data = this.editor.data;
        const domConverter = editor.editing.view.domConverter;

        const domRoot = this.getRefinementText(marker);

        //this.getElementContainingMarker(marker,charsBefore);
        //const yo = this.getTextSnippet(marker, charsBefore);

        const rangeBefore = this.getRangeBeforeMarker(marker, charsBefore, true);

        const viewRangeBefore = editor.editing.mapper.toViewRange(rangeBefore);

        const viewRangeMarker = editor.editing.mapper.toViewRange(marker.getRange())

        for ( const item of rangeBefore.getItems() ) {
            const viewElement =  editor.editing.mapper.toViewElement(item);
        }
        //
        // const content = getSelectedContent(editor.model, selection);
        //
        // let sHtmlSelection = this.editor.data.stringify(content);
        return "content";
    }

    getRangeAfterMarker(marker, charsAfter = 30) {
        const result = [];
        const editor = this.editor;

        const endPosition = marker.getEnd();

        let shiftedPosition = endPosition.getShiftedBy(endPosition.parent.maxOffset - endPosition.offset);
        if (charsAfter + endPosition.offset > endPosition.parent.maxOffset) {
            // check if there is a element after
            if (endPosition.parent.nextSibling) {
                //shift position to element after
                shiftedPosition = new Position(endPosition.root, [endPosition.parent.nextSibling.getPath()[0], 0])
                // element is long!
                if (shiftedPosition.parent.maxOffset >= charsAfter) {
                    shiftedPosition = shiftedPosition.getShiftedBy(charsAfter)
                } else {
                    shiftedPosition = shiftedPosition.getShiftedBy(shiftedPosition.parent.maxOffset)
                }
            }
        }

        const range = new Range(marker.getEnd(), shiftedPosition);
        return range;
    }

    // getTextAfterMarker(marker, charsAfter = 30) {
    //     const result = [];
    //     const range = this.getRangeAfterMarker(marker, charsAfter);
    //     const liveRange = LiveRange.fromRange(range);
    //     console.log("START ITEM ITER AFTER")
    //     for ( const item of liveRange.getItems() ) {
    //         console.log("ITEM", item)
    //         if (item.is("textProxy")) {
    //             result.push(item.data);
    //         } else {
    //             result.push("LINE_BREAK")
    //         }
    //     }
    //     return result;
    // }


    getTextAfterMarker(marker, charsAfter = 30) {
        const editor = this.editor;
        const data = this.editor.data;
        const rangeAfter = this.getRangeAfterMarker(marker, charsAfter);

        let selection;

        editor.model.change(writer => {
            const range = writer.createRange(rangeAfter.start, rangeAfter.end);
            selection = writer.createSelection(range);
        } );

        const content = getSelectedContent(editor.model, selection);
        return content;
    }

    getMarkerTextPlusSurroundingText(marker, charsSurrouding = 30) {
        const editor = this.editor;
        const data = this.editor.data;
        const rangeBefore = this.getRangeBeforeMarker(marker, charsSurrouding);
        const rangeAfter = this.getRangeAfterMarker(marker, charsSurrouding);
        let selection;

        editor.model.change( writer => {
            const range = writer.createRange(rangeBefore.start, rangeAfter.end);
            selection = writer.createSelection(range);
        } );

        const content = getSelectedContent(editor.model, selection);
        for ( const child of content.getChildren() ) {
            console.log(child)
        }
        return content;
    }


    // getMarkerTextPlusSurroundingText(marker) {
    //     const editor = this.editor;
    //     const result = [];
    //     const markerRange = marker.getRange();
    //     const range = new Range(marker.getStart().getShiftedBy(-20), marker.getEnd().getShiftedBy(20));
    //
    //     const liveRange = LiveRange.fromRange(range);
    //     for ( const item of liveRange.getItems() ) {
    //         if (item.is("textProxy")) {
    //             result.push(item.data);
    //         }
    //     }
    //     console.error(result);
    //     return result.join(" ");
    // }

    replaceMarkedText(text, marker) {
        const editor = this.editor;
        const range = marker.getRange();
        editor.model.change( writer => {
            editor.model.insertContent(writer.createText(text), range);
        });
    }

    replaceMarkedTextHtml(html, marker) {
        const editor = this.editor;
        const range = marker.getRange();
        const viewFragment = editor.data.processor.toView( html );
        const modelFragment = editor.data.toModel( viewFragment );
        editor.model.insertContent(modelFragment, range);
    }

    insertAfterMarkedText (text, marker, insertElement = false) {
        let range;
        const editor = this.editor;
        editor.model.change( writer => {
            if (insertElement) {
                writer.insert( text, marker.getEnd(), 'after');
            } else {
                //writer.insertText( text, marker.getEnd(), 'after' );
                const spaceRange = editor.model.insertContent(writer.createText(" "), marker.getEnd(), 'after');
                range = editor.model.insertContent( writer.createText(text), spaceRange.end, 'after');
            }
        });
        return range;
    }

    createParagraphWithText(text) {
        let paragraph;
        const editor = this.editor;
        editor.model.change( writer => {
            paragraph = writer.createElement( 'paragraph' );
            writer.insertText( text, paragraph );
        });
        return paragraph;
    }

    createAnnotationIdentifier(annotationType, id, userId = null) {
        let annotationId = "annotation" + ":" + annotationType + ":" + id
        if (userId) {
            annotationId = annotationId + ":" + userId;
        }
        return annotationId;
    }

    createAnnotationAttribute(annotationType) {
        return "data-" + String(annotationType).toLowerCase() + "-id";
    }

    createUserAttribute() {
        return "data-user-id";
    }

    computeRects(annotationType) {
        const annotations = Array.from(document.getElementById('ckEditorWrapper').getElementsByClassName(annotationType));
        const result = {};
        for (let i = 0; i < annotations.length; i++) {
            let dataAnnotationType = annotations[i].attributes["data-annotation-type"].value;
            let attributeName = this.createAnnotationAttribute(dataAnnotationType);
            let id = annotations[i].attributes[attributeName].value;
            if (!(id in result)) {
                result[id] = new Rect(annotations[i]);
            }
        }
        if (!(annotationType in this.rects)) {
            this.rects[annotationType] = {};
        }
        this.rects[annotationType] = result;
    }

    getRects() {
        return this.rects;
    }

    getFlattenedRects() {
        let rects = {};
        for (const type in this.rects) {
            rects = {...rects, ...this.rects[type]}
        }
        return rects;
    }

    setCaretRect() {
        const range = document.getSelection().getRangeAt(0);
        this.caretRect = new Rect(range);
    }

    getCaretRect() {
        return this.caretRect;
    }

    setCaretDetector(callback) {
        const editor = this.editor;

        editor.editing.view.document.on('selectionChange', (eventInfo, data) => {
            const selection = editor.model.document.selection;
            const range = Array.from(selection.getFirstRange());

            if (range.length > 0) {
                this.setCaretRect();
            } else {
                this.caretRect = null;
            }

            callback(this.caretRect);
        });
    }

    setShowFloatingToolbar(callback) {
        const editor = this.editor;
        editor.editing.view.document.on('selectionChange', (eventInfo, data) => {
            if (data.newSelection.getFirstPosition().compareWith(data.newSelection.getLastPosition()) === "before") {
                if (data.newSelection.getFirstPosition().offset > 0 || data.newSelection.getLastPosition().offset > 0) {
                    callback(true);
                } else {
                    callback(false);
                }
            }
        });
    }

    setOnRender(callback) {
        const editor = this.editor;
        editor.editing.view.on( 'render', () => {
            // Rendering to the DOM is complete.
            callback();
        } );
    }

    setOnChangeData(callback) {
        const editor = this.editor;
        editor.model.document.on( 'change', () => {
            callback();
        } );
    }

    setOnChangeView(callback) {
        const editor = this.editor;
        editor.editing.view.on( 'change', () => {
            callback();
        } );
    }

    setOnUndoRedo(undoCallback, redoCallback) {
        this.undoCallback = undoCallback;
        this.redoCallback = redoCallback;
    }

    setOnUpdateMarkers(callback) {
        const editor = this.editor;
        editor.model.markers.on('update', (eventInfo, marker, oldRange, newRange) => {
           callback();
        });
    }

    setClickObserver() {
        const editor = this.editor;
        const view = editor.editing.view;
        view.addObserver(ClickObserver);
    }

    setOnClickMarker(callback) {
        const editor = this.editor;
        const view = editor.editing.view;
        const viewDocument = view.document;

        editor.listenTo(viewDocument, 'click', (event, data) => {
            const domTarget = data.domTarget;
            let annotation;

            if (!domTarget.attributes.getNamedItem("data-annotation-type")) {
                annotation = this.searchTreeUpwards(domTarget);

            } else {
                annotation = domTarget;
            }

            if (annotation) {
                const annotationType = annotation.attributes.getNamedItem("data-annotation-type");

                if (!annotationType) {
                    return
                }

                const idAttribute = this.createAnnotationAttribute(annotationType.value);
                const userAttribute = this.createAnnotationAttribute("user");

                const id = annotation.attributes.getNamedItem(idAttribute);
                const user = annotation.attributes.getNamedItem(userAttribute);
                const isSelected = annotation.classList.contains("selected");

                let updateId = this.setCurrentSelectedCard(annotationType.value, id.value, user.value, isSelected);

                if (callback) {
                    callback(updateId);
                }
            }

            event.stop();
        });
    }

    setCurrentSelectedCard(annotationType, id, user, isSelected = false) {
        const annotationIdentifier = this.createAnnotationIdentifier(annotationType, id, user);

        // reset old marker
        if (isSelected || (this.currentSelectedMarker !== "" &&
            this.currentSelectedMarker !== annotationIdentifier)) {
            const [ , annotationType, annotationId, userId ] = this.currentSelectedMarker.split(':');
            this.unsetCurrentSelectedCard(annotationType, annotationId, userId);
            this.update(annotationType, annotationId, userId);
        }

        // set new marker
        if (!isSelected && this.currentSelectedMarker !== annotationIdentifier) {
            this.currentSelectedMarker = annotationIdentifier;
            this.update(annotationType, id, user);
            return id;
        }
    }

    unsetCurrentSelectedCard(annotationType, id, user, refresh = false) {
        this.currentSelectedMarker = "";
        if (refresh) {
            this.update(annotationType, id, user);
        }
    }

    searchTreeUpwards(domTarget, searchClass = "annotation", limit = 5) {
        let currentParent;

        if (domTarget.parentNode.classList.contains("ck")) {
            return null;
        }

        for (let i = 0; i < limit; i++) {
            if (i === 0) {
                currentParent = domTarget.parentNode;
            } else {
                currentParent = currentParent.parentNode;
            }

            if (currentParent.attributes.getNamedItem("data-annotation-type")) {
                return currentParent
            }
        }

        return currentParent;
    }

    setReactSidebarState(reactSidebarState) {
        this.reactSidebarState = reactSidebarState;
    }
}
