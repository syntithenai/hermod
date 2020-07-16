import React from "react";
import {Component} from 'react';
import { Button } from "react-bootstrap";
import {  Link, Redirect } from "react-router-dom";
//import Crossword from '@jaredreisinger/react-crossword';
import Crossword from './crossword'

const data = {
  across: {},
  down: {}
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
        this.loadCrossword();
    }
    
    componentDidUpdate(props,state) {
        if (this.props.hermodClient.connected !== props.hermodClient.connected 
            || this.state.forcereload !== state.forcereload) { // || (this.props.match && this.props.match.params && this.state._id.length > 0 && this.props.match.params.id != this.state._id)) {
			this.loadCrossword();
		}
		
	
    }
    
    onCorrect(e) {
        //console.log('oncorrect')
    }
    onLoadedCorrect(e) {
        //console.log('loadedcorrect')
    }
    onCrosswordCorrect(e) {
        //console.log('crosswordcorrect')
    }
    onCellChange(e) {
        //console.log('cellchange')
    }
    
     loadCrossword() {
        let that = this
        var stash = {}
        try {
            if (localStorage.getItem('crosswords')) {
                stash = JSON.parse(localStorage.getItem('crosswords'));
            }
        } catch(e) {
            
        }
        that.setState({_id:'',data:null, title:''})
        if (this.props.match && this.props.match.params && this.props.match.params.id && this.props.match.params.id.length > 0)  {
            if (stash.hasOwnProperty(this.props.match.params.id))  {
                var useStash = stash[this.props.match.params.id]
                var across = useStash.data.across
                var down = useStash.data.down
                if (this.props.data) useStash.data = this.props.data
                useStash.data.across = across 
                useStash.data.down = down
                that.setState(useStash) 
            } else {
                if (this.props.startWaiting) this.props.startWaiting()
                if (this.props.hermodClient && this.props.hermodClient.config && this.props.hermodClient.config.site) { 
                    fetch('/api/crossword?id='+this.props.match.params.id+"&site="+ this.props.hermodClient.config.site)
                    .then(function(response) {
                        return response.json()
                    }).then(function(crossword) {
                        var saveMe = {_id:crossword._id,data:crossword.data, title:crossword.title, author:crossword.author, copyright:crossword.copyright ? crossword.copyright.replace(/[^\w\s!?]/g,'') : '', copyright_link:crossword.copyright_link, link:crossword.link}
                        stash[crossword._id] = saveMe
                        localStorage.setItem('crosswords',JSON.stringify(stash))
                        that.setState(saveMe)
                    }).finally(function() {
                        if (that.props.stopWaiting) that.props.stopWaiting()  
                    })
                }
            }
            setTimeout(function() {
                if (that.props.api && that.props.api.client) {
                //console.log(['SETPROPS',that.props.api.client.sendMessage,that.props.site,that.props.match.params.id])
                    that.props.api.client.sendMessage(
                    'hermod/'+that.props.site+'/rasa/set_slots'
                    ,{slots:[{slot:'crossword',value:that.props.match.params.id}]}
                    )
                }
            },300)
        }
    }
    
    render() {
        let that = this;
        if (this.props.match.params.id) { 
          return (
            <div className="componentd dfirst-component" style={{ width:'100%'}}>
                <div className="acontent-block" style={{ width:'100%'}}>
                
                <Link style={{float:'left', marginRight:'0.2em'}}  to="/crosswords"><Button variant="success">Start a new crossword</Button></Link>
                <h3 style={{ clear:'both', marginRight:'0.2em', width:'100%'}}> <a target="_new" href={this.state.link}>{that.state.title}</a> </h3>
                <div>
                    <span>
                        {that.state.author &&  <span> by {that.state.author}</span>} 
                    </span>
                </div>   
                {(that.state.copyright && that.state.copyright_link) && <span> &copy; <a target="_new"  href={this.state.copyright_link}>{that.state.copyright}</a></span>}
                {(that.state.copyright && !that.state.copyright_link) && <span> &copy; {that.state.copyright}</span>}                

 {(that.state.data && that.props.hermodClient.connected) && <div style={{zIndex:1}} ><Crossword   data={that.state.data} 
                      storageKey={'guesses_'+this.props.match.params.id} 
                      ref={that.props.crosswordRef}
                      onCorrect={that.onCorrect}
                      onLoadedCorrect={that.onLoadedCorrect}
                      onCrosswordCorrect={that.onCrosswordCorrect}
                      onCellChange={that.onCellChange}
                    /></div>}
                </div>
            </div>
          )
      } else {
          return <Redirect to='/crosswords' />
      }
    }
     
}
