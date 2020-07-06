import React from "react";
import {Component} from 'react';
import { Button } from "react-bootstrap";
import { BrowserRouter as Router, Link, Redirect } from "react-router-dom";
//import Crossword from '@jaredreisinger/react-crossword';
import Crossword from './crossword'
import  { useCallback, useRef, useState } from 'react';

const data = {
  across: {},
  down: {}
}

const ddata = {
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

    constructor(props) {
      super(props);
      this.state = {_id:'',title:'',data:data, forcereload: 0}
      this.onCorrect = this.onCorrect.bind(this)
      this.onLoadedCorrect = this.onLoadedCorrect.bind(this)
      this.onCrosswordCorrect = this.onCrosswordCorrect.bind(this)
      this.onCellChange = this.onCellChange.bind(this)
      this.loadCrossword = this.loadCrossword.bind(this)
    }
    
    componentDidMount() {
        let that = this;
        console.log(['ATUPmnt',this.props.match])
        // wait for config to load
         setTimeout(function() {console.log('TRIGGER') ; that.setState({forcereload:23})},500)
	}
    
    componentDidUpdate(props,state) {
        console.log(['ATUPDATE'])
        console.log(state.forcereload)
        console.log(this.state.forcereload)
        console.log(props.api.connected)
        console.log(this.props.api.connected)
        //console.log(this.props.match.params.id)
        if (props.hermodClient.connected != props.hermodClient.connected || this.state.forcereload != state.forcereload) { // || (this.props.match && this.props.match.params && this.state._id.length > 0 && this.props.match.params.id != this.state._id)) {
		//	this.loadSubscribers();
        console.log(['ATUPDATErea'])
			this.loadCrossword();
		}
		
	
    }
    
    //fillCrossword(e) {
        ////for (var column in this.state.data) {
            ////console.log(this.state.data[column])
            ////for (var row in this.state.data[column]) {
                ////console.log(this.state.data[column][row])
            ////}
        ////}
        //if (this.props.crosswordRef.current) this.props.crosswordRef.current.fillAnswer('across','1','canberra');
        
    //}
    
    onCorrect(e) {
        console.log('oncorrect')
    }
    onLoadedCorrect(e) {
        console.log('loadedcorrect')
    }
    onCrosswordCorrect(e) {
        console.log('crosswordcorrect')
    }
    onCellChange(e) {
        console.log('cellchange')
    }
    
     loadCrossword() {
         console.log('LOADCW')
         let that = this
        
        var stash = {}
        try {
            if (localStorage.getItem('crosswords')) {
                stash = JSON.parse(localStorage.getItem('crosswords'));
            }
        } catch(e) {
            
        }
        console.log(this.props)            
        console.log('SEARCHcw')
        that.setState({_id:'',data:null, title:''})
        if (this.props.match && this.props.match.params && this.props.match.params.id && this.props.match.params.id.length > 0)  {
            console.log('SEARCHcwISD'+this.props.match.params.id)
            if (stash.hasOwnProperty(this.props.match.params.id))  {
               that.setState(stash[this.props.match.params.id]) 
            } else {
                if (this.props.startWaiting) this.props.startWaiting()
                console.log(this.props.hermodClient)
                if (this.props.hermodClient && this.props.hermodClient.config && this.props.hermodClient.config.site) { 
                    fetch('/api/crossword?id='+this.props.match.params.id+"&site="+ this.props.hermodClient.config.site)
                    .then(function(response) {
                        //console.log(response.text())
                        return response.json()
                    }).then(function(crossword) {
                         console.log('LOADED CW******************************')
                        console.log(crossword)
                        var saveMe = {_id:crossword._id,data:crossword.data, title:crossword.title, author:crossword.author, copyright:crossword.copyright ? crossword.copyright.replace(/[^\w\s!?]/g,'') : '', copyright_link:crossword.copyright_link, link:crossword.link}
                        stash[crossword._id] = saveMe
                        localStorage.setItem('crosswords',JSON.stringify(stash))
                        that.setState(saveMe)
                    }).finally(function() {
                        if (that.props.stopWaiting) that.props.stopWaiting()  
                    })
                }
            }
            console.log(['SENDMESSAGE',that.props,that.props.api,that.props.site,{slots:[{crossword:that.props.match.params.id}]}])
            if (that.props.api && that.props.api.client) {
                that.props.api.client.sendMessage(
                'hermod/'+that.props.site+'/rasa/set_slots'
                ,{slots:[{slot:'crossword',value:that.props.match.params.id}]}
                )
            }
        }
    }
    
    render() {
        let that = this;
        if (this.props.match.params.id) { 
          return (
            <div className="componentd dfirst-component" style={{ width:'100%'}}>
                <div className="acontent-block" style={{ width:'100%'}}>
                {that.state.link && <a style={{  float:'left' ,marginLeft:'0.2em'}} target="_new" href={that.state.link}><Button>Download</Button></a>}
                
                <Link style={{float:'right', marginRight:'0.2em'}}  to="/crosswords"><Button variant="success">Start a new crossword</Button></Link>
                <h3 style={{ clear:'both', marginRight:'0.2em', width:'100%'}}>{that.state.title} </h3>
                <div>
                </div>   
                {that.state.copyright &&  
                    <span>
                        {that.state.author &&  <span> by {that.state.author}</span>} 
                        <span> &copy; <a target="_new"  href={this.state.copyright_link}>{that.state.copyright}</a></span>
                    </span>
                }
                

                {!that.state.copyright &&  
                    <span>
                        {that.state.author &&  <span> by <a target="_new" href={this.state.copyright_link}>{that.state.author}></a></span>} 
                    </span>
                }
                

 {(that.state.data && that.props.hermodClient.connected) && <Crossword style={{zIndex:1}}  data={that.state.data} 
                      storageKey={'guesses_'+this.props.match.params.ids} 
                      ref={that.props.crosswordRef}
                      onCorrect={that.onCorrect}
                      onLoadedCorrect={that.onLoadedCorrect}
                      onCrosswordCorrect={that.onCrosswordCorrect}
                      onCellChange={that.onCellChange}
                    />}
                </div>
            </div>
          )
      } else {
          return <Redirect to='/crosswords' />
      }
    }
     
}
//onCorrect={that.onCorrect}
                  //onLoadedCorrect={that.onLoadedCorrect}
                  //onCrosswordCorrect={that.onCrosswordCorrect}
                  //onCellChange={that.onCellChange}

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
