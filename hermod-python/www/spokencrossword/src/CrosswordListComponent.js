import React, {Component} from 'react';
import 'whatwg-fetch'
import { Button } from "react-bootstrap";
import {Link } from "react-router-dom";

export default class CrosswordListComponent extends Component {
    
    constructor(props) {
      super(props);
      this.state = {
         crosswords: [],
         searchFor: ''  ,
         difficulty: '0'
       }
       this.searchCrosswords = this.searchCrosswords.bind(this)
       this.updateSearchFor = this.updateSearchFor.bind(this)
       this.sendForm = this.sendForm.bind(this)
       this.updateSearchFor =this.updateSearchFor.bind(this)
       this.searchDifficulty = this.searchDifficulty.bind(this)
       this.searchTimeout = null
    }

    
      componentDidMount() {
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
                
            }        
            this.crossword =  React.createRef();
            if (that.props.match && that.props.match.params && that.props.match.params.difficulty && that.props.match.params.difficulty.length > 0)  {
                that.searchCrosswords()
            }
      };
      
      componentWillUpdate(props,state) {
          console.log('component did update')
          console.log([props.match.params,this.props.match.params])
          let that = this;
          if (that.props.match && that.props.match.params && that.props.match.params.difficulty && props.match && props.match.params && props.match.params.difficulty && props.match.params.difficulty !=  that.props.match.params.difficulty)  {
                that.searchCrosswords() 
            }
      }
      
      
      updateSearchFor(e) {
          this.setState({searchFor:e.target.value})
          this.sendForm(e)
      }
      
      searchCrosswords() {
        let that = this
        return new Promise(function(resolve,reject) {
            var queryParts = []
            if (that.state.searchFor.length > 0) {
                queryParts.push("search="+that.state.searchFor)
            }
            if (that.props.match && that.props.match.params && that.props.match.params.difficulty && that.props.match.params.difficulty.length > 0)  {
                queryParts.push("difficulty="+that.props.match.params.difficulty)
            }
            //if (that.state.difficulty.length > 0) {
                //queryParts.push("difficulty="+that.state.difficulty)
            //}
            var prep = ''//this.props.hermodClient.config && this.props.hermodClient.config.webserver ? this.props.hermodClient.config.webserver : '';
            if (that.props.startWaiting) that.props.startWaiting()
            fetch(prep+'/api/crosswords?'+queryParts.join("&"))
                .then(function(response) {
                    return response.json()
                }).then(function(list) {
                    that.setState({crosswords:list})
                }).finally(function() {
                  if (that.props.stopWaiting) that.props.stopWaiting()  
                  resolve()
                })
        })
    }
    
    sendForm(e) {
        e.preventDefault()
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout)
        }
        this.searchTimeout = setTimeout(this.searchCrosswords,1000)
        return false;
    }
    
    searchDifficulty(difficulty) {
        this.setState({difficulty:difficulty})
        if (parseInt(difficulty) > 0) {
            this.searchCrosswords()
        }
    }

    render () {
        let that = this
        var searchResults = []
        var difficultyMap = {"1":"Kids","10":"Junior Primary","11":"Middle Primary","12":"Senior Primary","13":"Junior High","14":"Senior High","2":"Easy","3":"Medium","4":"Hard","5":"Cryptic"}
        var categoryOrdering = ["1","10","11","12","13","15","2","3","4","5"]
        var categoryItems={}
        for (var i in this.state.crosswords) {
            var crossword = this.state.crosswords[i]
            var difficulty = Number(crossword.difficulty > 0 ? crossword.difficulty : 1).toString();
            if (! categoryItems.hasOwnProperty(difficulty)) {
                categoryItems[difficulty] = []
            }
            categoryItems[difficulty].push(<div key={i} style={{width:'90%', textAlign:'left'}} ><Link to={"/crossword/"+crossword._id} ><Button  variant="secondary"  style={{minWidth:'18em'}}>Start the {crossword.title} crossword</Button></Link></div>)
            searchResults.push(<div key={i} style={{width:'90%', textAlign:'left', padding:'1em'}} ><Link to={"/crossword/"+crossword._id} ><Button  variant="secondary" style={{minWidth:'18em'}}><span style={{float:'right', marginLeft:'0.5em'}} className="badge badge-light">{difficultyMap.hasOwnProperty(crossword.difficulty) ? difficultyMap[crossword.difficulty]:"Unknown"}</span>Start the {crossword.title} crossword</Button></Link></div>)
        }
        var categoryStyle={backgroundColor: 'orange', minWidth: '30%', float: 'left', minHeight: '7em', border: '1px solid blue', marginLeft: '0.8em' , marginTop: '0.8em' , fontSize:'2em', textAlign:'center', align:'center'
            }
            
        var categories = []
        for (var a in categoryOrdering) {
            var j = categoryOrdering[a]
            if (categoryItems[Number(j)] && categoryItems[Number(j)].length > 0) {
                categories.push(<div className='col-10 col-md-5'  style={categoryStyle} key={j} ><Link to={"/crosswords/"+j} >{difficultyMap.hasOwnProperty(j) ? difficultyMap[j]:"Unknown"}</Link>
                    <div >{categoryItems[Number(j)]}</div>
                   
                </div>)
            }
        }
        //for (var j in categoryItems) {
            ////var j = Number(difficultyData)
           //// if (categoryItems[j] && categoryItems[j].length > 0) {
                //categories.push(<div className='col-10 col-md-5'  style={categoryStyle} key={j} ><Link to={"/crosswords/"+j} >{difficultyMap.hasOwnProperty(j) ? difficultyMap[j]:"Unknown"}</Link>
                    //<div >{categoryItems[j]}</div>
                   
                //</div>)
           //// }
        //}
        
        
        
      return (
        <div className="crosswordListComponent row">
              <div style={{marginLeft: "0.5em", marginRight: "0.5em", clear: "both" , width: "50%"}}  >
                  <form onSubmit={that.sendForm} ><input style={{fontSize: "1.8em" , width: "100%"}} id="text_input" type='text' value={that.state.searchFor} onChange={that.updateSearchFor} placeholder='Search crosswords' /></form>
            </div> 
             <div className="crosswordSearchResults" style={{clear:'both', width: '100%'}}>
            {(this.state.searchFor.length === 0 ) && categories}
            </div>
            <br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/>
        </div>
      );
    }
}
//onClick={function(j) { return function() {that.searchDifficulty(j)}}(j)}
// <div key={i} style={{width:'90%', textAlign:'left'}} ><Button  onClick={function(j) { return function() {that.searchDifficulty(j)}}(j)} style={{minWidth:'18em'}}>Show more</Button></div>
            
