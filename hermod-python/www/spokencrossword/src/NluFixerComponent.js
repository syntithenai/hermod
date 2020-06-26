import React from "react";
import {Component} from 'react';

    
export default class NluFixerComponent extends Component {

   constructor(props) {
      super(props);
      
    }
    
    render() {
        
      return []  
      return (
        <div style={{height:'1em', textAlign:'left'}} className="nluFixerComponent">
            nlu fixer
            <form onSubmit={function() { return false} } style={{display:'inline'}}>
                <select>
                <option></option>
                <option>ask_date</option>
                <option>ask_time</option>
                <option>tell_me_about</option>
                <option>ask_attribute</option>
                <option>search_youtube</option>
                <option>show_picture</option>
                </select>
            </form>
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
