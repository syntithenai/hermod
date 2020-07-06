import React, {Component} from 'react';
import 'whatwg-fetch'
import { Button } from "react-bootstrap";
import { BrowserRouter as Router, Link } from "react-router-dom";

export default class CrosswordListComponent extends Component {
    
    constructor(props) {
      super(props);
      this.state = {
         crosswords: [],
         searchFor: ''  ,
         difficulty: '' 
       }
       this.searchCrosswords = this.searchCrosswords.bind(this)
       this.updateSearchFor = this.updateSearchFor.bind(this)
       this.sendForm = this.sendForm.bind(this)
       this.updateSearchFor =this.updateSearchFor.bind(this)
       this.searchTimeout = null
    }

    
      componentDidMount() {
        console.log('APP dMOUNT')
        let that = this;
           var crosswords = []
           if (localStorage.getItem('crossword_list_entry')) {
               
               try {
                   crosswords = JSON.parse(localStorage.getItem('crossword_list_entry'))
                   this.setState({crosswords: crosswords})
               } catch (e) {
                    this.searchCrosswords().then(function() {
                        localStorage.setItem('crossword_list_entry',JSON.stringify(that.state.crosswords))
                    })
               }
            }
            if (!crosswords || crosswords.length === 0){
                this.searchCrosswords().then(function() {
                    localStorage.setItem('crossword_list_entry',JSON.stringify(that.state.crosswords))
                })
                
            }        this.crossword =  React.createRef();
        //this.fillCrossword=this.fillCrossword.bind(this)
      };
      
       //componentWillMount() {
           
       //}
      updateSearchFor(e) {
          this.setState({searchFor:e.target.value})
          this.sendForm(e)
      }
      
    searchCrosswords() {
        let that = this
        return new Promise(function(resolve,reject) {
            console.log('SEARCHcw')
            var queryParts = []
            if (that.state.searchFor.length > 0) {
                queryParts.push("search="+that.state.searchFor)
            }
            if (that.state.difficulty.length > 0) {
                queryParts.push("difficulty="+that.state.difficulty)
            }
            console.log('fetch')
            console.log(queryParts)
            var prep = ''//this.props.hermodClient.config && this.props.hermodClient.config.webserver ? this.props.hermodClient.config.webserver : '';
            if (that.props.startWaiting) that.props.startWaiting()
            fetch(prep+'/api/crosswords?'+queryParts.join("&"))
                .then(function(response) {
                    //console.log(response.text())
                    return response.json()
                }).then(function(list) {
                    console.log(list)
                    that.setState({crosswords:list})
                }).finally(function() {
                  if (that.props.stopWaiting) that.props.stopWaiting()  
                  resolve()
                })
        })
    }
    
    sendForm(e) {
        console.log('SEMD FORM')
        //let that = this;
        e.preventDefault()
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout)
        }
        this.searchTimeout = setTimeout(this.searchCrosswords,1000)
        return false;
    }
//<Button style={{float:'left', color:'yellow'}}>Difficulty {crossword.difficulty}</Button>
    render () {
        let that = this
        var searchResults = []
        //var crosswordItemStyle = {
            
        //}
        var difficultyMap = {"1":"Kids","2":"Easy","3":"Medium","4":"Hard","5":"Cryptic"}
        var categoryItems={}
        for (var i in this.state.crosswords) {
            var crossword = this.state.crosswords[i]
            var difficulty = Number(crossword.difficulty > 0 ? crossword.difficulty : 1).toString();
            if (! categoryItems.hasOwnProperty(difficulty)) {
                categoryItems[difficulty] = []
            }
            categoryItems[difficulty].push(<div key={i} style={{width:'90%', textAlign:'left', padding:'1em'}} ><Link to={"/crossword/"+crossword._id} ><Button style={{minWidth:'18em'}}><span style={{float:'right', marginLeft:'0.5em'}} className="badge badge-light">{difficultyMap.hasOwnProperty(crossword.difficulty) ? difficultyMap[crossword.difficulty]:"Unknown"}</span>Start the {crossword.title} crossword</Button></Link></div>)
            searchResults.push(<div key={i} style={{width:'90%', textAlign:'left', padding:'1em'}} ><Link to={"/crossword/"+crossword._id} ><Button style={{minWidth:'18em'}}><span style={{float:'right', marginLeft:'0.5em'}} className="badge badge-light">{difficultyMap.hasOwnProperty(crossword.difficulty) ? difficultyMap[crossword.difficulty]:"Unknown"}</span>Start the {crossword.title} crossword</Button></Link></div>)
        }
        var categoryStyle={backgroundColor: 'orange', minWidth: '30%', float: 'left', minHeight: '7em', border: '1px solid blue', marginLeft: '0.8em' , marginTop: '0.8em' , fontSize:'2em', textAlign:'center', align:'center'
            }
            
          console.log(categoryItems)  
        var categories = [
        ]
        
        
        for (var i in categoryItems) {
            categories.push(<span style={categoryStyle} key={i} >{difficultyMap.hasOwnProperty(i) ? difficultyMap[i]:"Unknown"}
                <div>{categoryItems[i]}</div>
            </span>)
        }
        
        
      return (
        <div className="crosswordListComponent">
              <div style={{float: "left",marginLeft: "0.5em", marginRight: "0.5em", clear: "both" , width: "50%"}}  >
                  <form onSubmit={that.sendForm} ><input style={{fontSize: "1.8em" , width: "100%"}} id="text_input" type='text' value={that.state.searchFor} onChange={that.updateSearchFor} placeholder='Search crosswords' /></form>
            </div> 
            <div className="crosswordSearchResults" style={{clear:'both'}}>
            {this.state.searchFor.length > 0 && searchResults}
            {this.state.searchFor.length ==0 && categories}
            </div>
            <br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/>
        </div>
      );
    }
}
//
            
