import React from "react";
import {Component} from 'react';
import Crossword from '@jaredreisinger/react-crossword';

const data = {
  across: {
    1: {
      clue: 'capital of australia',
      answer: 'canberra',
      row: 0,
      col: 0,
    },
    2: {
        clue: 'capital of el salvador',
        answer: 'sansalvador',
        row: 2,
        col: 1,
    },
    3: {
        clue: 'capital of ecuador',
        answer: 'quito',
        row: 5,
        col: 6,
    },
    4: {
        clue: 'capital of iraq',
        answer: 'baghdad',
        row: 7,
        col: 0,
    },
    5: {
        clue: 'capital of portugal',
        answer: 'lisbon',
        row: 9,
        col: 4,
    },
    6: {
        clue: 'capital of vietnam',
        answer: 'hanoi',
        row: 10,
        col: 0,
    }
  },
  down: {
    1: {
      clue: 'capital of the netherlands',
      answer: 'amsterdam',
      row: 0,
      col: 1,
    },
    2: {
      clue: 'capital of thailand',
      answer: 'bangkok',
      row: 0,
      col: 3,
    },
    3: {
      clue: 'capital of liechtenstein',
      answer: 'vaduz',
      row: 2,
      col: 7,
    },
    4: {
      clue: 'capital of russia',
      answer: 'moscow',
      row: 1,
      col: 10,
    },
    5: {
      clue: 'capital of east timor',
      answer: 'dili',
      row: 7,
      col: 4,
    }
  },
}
    
export default class CrosswordComponent extends Component {

  //constructor(props) {
      //super(props);
    //}
    
    render() {
      return (
        <div className="component first-component">
            <div className="content-block">
            {JSON.stringify(this.props.hermodClient)}
                <Crossword data={data} />;
            </div>
        </div>
      )
    }
     
}


 //across: {
    //1: {
      //clue: 'capital of australia',
      //answer: 'canberra',
      //row: 0,
      //col: 0,
    //},
    //2: {
        //clue: 'capital of el salvador',
        //answer: 'sansalvador',
        //row: 2,
        //col: 1,
    //},
    //3: {
        //clue: 'capital of ecuador',
        //answer: 'quito',
        //row: 5,
        //col: 6,
    //},
    //4: {
        //clue: 'capital of iraq',
        //answer: 'baghdad',
        //row: 7,
        //col: 0,
    //},
    //5: {
        //clue: 'capital of portugal',
        //answer: 'lisbon',
        //row: 9,
        //col: 4,
    //},
    //6: {
        //clue: 'capital of vietnam',
        //answer: 'hanoi',
        //row: 10,
        //col: 0,
    //}
  //},
  //down: {
    //1: {
      //clue: 'capital of the netherlands',
      //answer: 'amsterdam',
      //row: 0,
      //col: 1,
    //},
    //2: {
      //clue: 'capital of thailand',
      //answer: 'bangkok',
      //row: 0,
      //col: 1,
    //},
    //3: {
      //clue: 'capital of liechtenstein',
      //answer: 'vaduz',
      //row: 0,
      //col: 1,
    //},
    //4: {
      //clue: 'capital of russia',
      //answer: 'moscow',
      //row: 0,
      //col: 1,
    //},
    //5: {
      //clue: 'capital of east timor',
      //answer: 'dili',
      //row: 0,
      //col: 1,
    //}
  //},
