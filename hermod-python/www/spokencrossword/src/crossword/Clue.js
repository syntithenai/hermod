import React, { useCallback, useContext ,useState} from 'react';
import PropTypes from 'prop-types';
import {Button,Modal} from 'react-bootstrap';
import styled, { ThemeContext } from 'styled-components';

import { CrosswordContext } from './context';

const ClueWrapper = styled.div.attrs((props) => ({
  className: `clue${props.correct ? ' correct' : ''}`,
}))`
  cursor: default;
  background-color: ${(props) =>
    props.highlight ? props.highlightBackground : 'transparent'};
`;

export default function Clue({
  direction,
  number,
  children,
  correct,
  ...props
}) {
  const [show, setShow] = useState('false');
  const handleClose = () => setShow('false');
  const handleShow = () => setShow('true');
  
  const [showAnswer, setShowAnswer] = useState('false');
  const handleCloseAnswer = () => setShowAnswer('false');
  const handleShowAnswer = () => setShowAnswer('true');
  
  const [showImage, setShowImage] = useState('false');
  const handleCloseImage = () => setShowImage('false');
  const handleShowImage = () => setShowImage('true');

  const { highlightBackground } = useContext(ThemeContext);
  const {
    focused,
    selectedDirection,
    selectedNumber,
    onClueSelected,
  } = useContext(CrosswordContext);

  const handleClick = useCallback(
    (event) => {
      event.preventDefault();
      if (onClueSelected) {
        onClueSelected(direction, number);
      }
    },
    [direction, number, onClueSelected]
  );

  return (
    <ClueWrapper
      highlightBackground={highlightBackground}
      highlight={
        focused && direction === selectedDirection && number === selectedNumber
      }
      correct={correct}
      {...props}
      onClick={handleClick}
      aria-label={`clue-${number}-${direction}`}
    >
        {(props.clue_data.medialink && props.clue_data.autoshow_media === "true") && <div><img src={props.clue_data.medialink} alt='Clue' style={{float:'right',height:'2.5em'}}/></div>}
      {props.clue_data.infolink && <Button style={{marginRight:'0.2em',zIndex:'500'}}  onClick={function(e) { window.open(props.clue_data.infolink) }} ><img src='/svg/external-link.svg' alt="More Information" style={{height  :'1.1em'}} /></Button>}
      {props.clue_data.answer &&  <Button style={{marginRight:'0.2em'}} onClick={handleShowAnswer} ><img src='/svg/question-mark.svg' alt="Answer" style={{height  :'1.1em'}} /></Button>}
      {props.clue_data.extraclue &&  <Button style={{marginRight:'0.2em'}} onClick={handleShow} ><img src='/svg/bell.svg' alt="Memory Aid" style={{height  :'1.1em'}} /></Button>}
      {(props.clue_data.medialink && props.clue_data.autoshow_media !== "true") && <Button style={{marginRight:'0.2em'}} onClick={handleShowImage} ><img src='/svg/image.svg' alt="Show Clue" style={{height  :'1.1em'}} /></Button>}
     
     {showAnswer==="true" &&      
      <Modal animation={false} show={showAnswer==="true"} onHide={handleCloseAnswer}>
        <Modal.Header closeButton>
          <Modal.Title>Answer</Modal.Title>
        </Modal.Header>
        <Modal.Body>{props.clue_data.answer}</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseAnswer}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>}
     
     {show==="true" &&      
      <Modal animation={false} show={show==="true"} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Memory Aid</Modal.Title>
        </Modal.Header>
        <Modal.Body>{props.clue_data.extraclue}</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>}
      
      {showImage==="true" &&      
      <Modal show={showImage==="true"}  animation={false}  onHide={handleCloseImage}>
        <Modal.Header closeButton>
          <Modal.Title>Image</Modal.Title>
        </Modal.Header>
        <Modal.Body><img alt="Clue"  src={props.clue_data.medialink} style={{width:'60%'}} /></Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseImage}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>}
        {number}: {children}
        
    </ClueWrapper>
  );
}

Clue.propTypes = {
  /** direction of the clue: "across" or "down"; passed back in onClick */
  direction: PropTypes.string.isRequired,
  /** number of the clue (the label shown); passed back in onClick */
  number: PropTypes.string.isRequired,
  /** clue text */
  children: PropTypes.node,
  /** whether the answer/guess is correct */
  correct: PropTypes.bool,
};

Clue.defaultProps = {
  children: undefined,
  correct: undefined,
};
