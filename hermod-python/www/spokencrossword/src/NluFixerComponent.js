    import React from "react";
    import {Component} from 'react';

    import { Button, Dropdown, ButtonGroup } from "react-bootstrap";
      
    export default class NluFixerComponent extends Component {

       constructor(props) {
          super(props);
          this.getPrettyIntentName = this.getPrettyIntentName.bind(this)
          this.onIntentChanged = this.onIntentChanged.bind(this)
          this.onEntityChanged = this.onEntityChanged.bind(this)
          this.onEntityClicked = this.onEntityClicked.bind(this)
          this.sendForm = this.sendForm.bind(this)
          this.sendFormQuestion = this.sendFormQuestion.bind(this)
          this.onQuestionSelect = this.onQuestionSelect.bind(this)
          this.onQuestionBlur = this.onQuestionBlur.bind(this)
          this.onQuestionFocus = this.onQuestionFocus.bind(this)
          this.onQuestionKeyup = this.onQuestionKeyup.bind(this)
          this.getQuestionSelection = this.getQuestionSelection.bind(this)
          this.getQuestionSelectionRange = this.getQuestionSelectionRange.bind(this)
          this.newEntity = this.newEntity.bind(this)
          this.addOrUpdateEntityValue = this.addOrUpdateEntityValue.bind(this)
          this.addOrUpdateEntityType = this.addOrUpdateEntityType.bind(this)
          this.onEntityDeleted = this.onEntityDeleted.bind(this)
          this.setQuestionSelection = this.setQuestionSelection.bind(this)
          this.onEntityListExpanded = this.onEntityListExpanded.bind(this)
          this.allowIntent = this.allowIntent.bind(this)
          this.canShowEntity = this.canShowEntity.bind(this)
          
          this.questionInput =  React.createRef();
          
          
          this.state={selection:'',selectionRange:[0,0]}
          this.keyupTimeout = null;
          this.state={changed: false, questionIsFocussed: false, showAddButton:false}
        }
        
        getPrettyIntentName(intentName) {
            if (this.props.intentNames && this.props.intentNames.hasOwnProperty(intentName) &&  this.props.intentNames[intentName].length > 0) {
                return this.props.intentNames[intentName]
            } else {
                return intentName
            }
        }
        
        getPrettyEntityName(entityName) {
            if (this.props.entityNames && this.props.entityNames.hasOwnProperty(entityName) &&  this.props.entityNames[entityName].length > 0) {
                return this.props.entityNames[entityName]
            } else {
                return entityName
            }
        }
        
        onIntentChanged(e) {
            var nlu = JSON.parse(this.props.hermodClient.nlu_json_original);
            nlu.intent.name = e.target.attributes.value.textContent
            this.props.api.setNluJson(nlu)
            this.setState({changed:true})
        }
        
        onEntityClicked(e) {
            if (this.state.selection) {     
                this.addOrUpdateEntityValue(e.target.attributes.value.textContent,this.state.selection)
            } else {
                this.setQuestionSelection(e.target.attributes.start.textContent,e.target.attributes.end.textContent)
            }
        }
        
        onEntityListExpanded(e) {
            if (this.state.selection) {     
                this.addOrUpdateEntityValue(e.target.attributes.value.textContent,this.state.selection)
            }
        }
        
            
        onEntityChanged(e) {
            this.addOrUpdateEntityType(e.target.attributes.oldvalue.textContent,e.target.attributes.value.textContent,this.state.selection)
        }

        onEntityDeleted(e) {
            if (e.target.attributes.value && e.target.attributes.value.textContent) { 
                var entity = e.target.attributes.value.textContent
                var nlu = this.props.hermodClient.nlu_json;
                var entities = this.props.hermodClient.nlu_json.entities;
                var newEntities=[]
                for (var i in entities) {
                    if (entities[i].entity !== entity) {
                        newEntities.push(entities[i])
                    }
                }
                nlu.entities = newEntities;
                this.props.api.setNluJson(nlu)
                this.setState({changed:true,selection:'',selectionRange:[0,0]})
            }
        }
        
        
        addOrUpdateEntityType(entity,newEntity,value) {
            var nlu = this.props.hermodClient.nlu_json;
            var entities = this.props.hermodClient.nlu_json.entities;
            var found = false
            for (var i in entities) {
                if (entities[i].entity === entity) {
                    found = true
                    entities[i].entity = newEntity
                    if (value) entities[i].value = value
                }
            }
            if (!found) {
                var range = this.state.selectionRange;
                entities.push({entity:newEntity,start:range[0],end:range[1],value:this.state.selection})
            }
            nlu.entities = entities;
            this.props.api.setNluJson(nlu)
            this.setState({changed:true,selection:'',selectionRange:[0,0],showAddButton:false})
        }
        
        addOrUpdateEntityValue(entity,value) {
            if (value) {
                var nlu = this.props.hermodClient.nlu_json;
                var entities = this.props.hermodClient.nlu_json.entities;
                var found = false
                for (var i in entities) {
                    if (entities[i].entity === entity) {
                        found = true
                        entities[i].value = value
                    }
                }
                if (!found) {
                    var range = this.state.selectionRange;
                    entities.push({entity:entity,start:range[0],end:range[1],value:this.state.selection})
                }
                nlu.entities = entities;
                this.props.api.setNluJson(nlu)
                this.setState({changed:true,selection:'',selectionRange:[0,0],showAddButton:false})
            }
        }
        
        
        newEntity(event) {
            if (event.target.attributes.value && event.target.attributes.value.textContent) { 
                var entity = event.target.attributes.value.textContent
                var nlu = this.props.hermodClient.nlu_json;
                var entities = this.props.hermodClient.nlu_json.entities;
                var newEntities=[]
                for (var i in entities) {
                    if (entities[i].entity !== entity) {
                        newEntities.push(entities[i])
                    }
                }
                var range = this.state.selectionRange;
                newEntities.push({entity:entity,start:range[0],end:range[1],value:this.state.selection})
                nlu.entities = newEntities;
                this.props.api.setNluJson(nlu)
                this.setState({changed:true,selection:'',selectionRange:[0,0]})
            }
        }
       
        allowIntent(intent) {
            if (this.props.allowedIntents) {
                if (intent in this.props.allowedIntents) {
                    return true
                } else {
                    return false
                }
            } else {
                return true
            }
        }
        
        canShowEntity(intent,entity) {
            return true
            //console.log(['CANSHOW',intent,entity])
            //console.log(this.props.hermodClient.domain)
            // build index
            var intentIndex = {}
            if (this.props.hermodClient.domain && this.props.hermodClient.domain.intents) {
               for (var i in this.props.hermodClient.domain.intents) {
                   var intentItems = this.props.hermodClient.domain.intents[i]
                   var intentName = Object.keys(intentItems)[0]
                   var intentData = intentItems[intentName]
                   intentIndex[intentName]={}
                   if (intentData.hasOwnProperty('use_entities')) {
                       intentIndex[intentName].allow = intentData['use_entities']
                   } else if (intentData.hasOwnProperty('ignore_entities'))  {
                        intentIndex[intentName].deny = intentData['ignore_entities']
                   }
               }
               //console.log(intentIndex)
               // now check
               if (intentIndex.hasOwnProperty(intent) && (intentIndex[intent].deny || intentIndex[intent].allow)) {
                   // have some form of restriction
                    if (intentIndex.hasOwnProperty(intent) && (intentIndex[intent].deny)) {
                       if (entity in  intentIndex[intent].deny) {
                         //console.log('exp deny')
                         return false
                       }
                    }
                    if (intentIndex.hasOwnProperty(intent) && (intentIndex[intent].allow)) {
                        if (entity in  intentIndex[intent].allow) {
                           //console.log('exp allow')
                           return true
                        } else {
                            //console.log('allow not listed')
                            return false
                        }
                    }
                    // deny set but not in denied list
                    return true
               } else {
                   // no restrictions set
                   return true
               } 
               
            }
        }
     
        render() {
            let that = this;
            if (this.props.hermodClient) {
                 var parsedIntent = (this.props.hermodClient && this.props.hermodClient.nlu_json && this.props.hermodClient.nlu_json.intent && this.props.hermodClient.nlu_json.intent.name) ? this.props.hermodClient.nlu_json.intent.name : ''
                 
                 var parsedEntities = (this.props.hermodClient && this.props.hermodClient.nlu_json && this.props.hermodClient.nlu_json.entities) ? this.props.hermodClient.nlu_json.entities : []
                  var entityIndex = {}
                  for (var parsedEntity in parsedEntities) {
                      entityIndex[parsedEntities[parsedEntity].entity] = parsedEntities[parsedEntity]
                  }
                  var entityOptions=[<option key={-1} value="" ></option>]
                  var form = null
                  var intentName = null
                  var entityName = null
                  var i=0
                  if (that.props.hermodClient.question && this.props.hermodClient.domain && this.props.hermodClient.domain.entities){
                      // RENDER INTENT PICKLIST
                      var options=[<option key={-1} value="" ></option>]
                      // first options from nlu_json.intent_ranking in order
                      var intentUsed={}
                      for (i in this.props.hermodClient.nlu_json.intent_ranking) {
                          var ranking=this.props.hermodClient.nlu_json.intent_ranking[i]
                          intentName = ranking.name
                          options.push(<Dropdown.Item key={i} value={intentName} onClick={function(event) {that.onIntentChanged(event)}} >{this.getPrettyIntentName(intentName)}</Dropdown.Item>)
                          intentUsed[intentName] = true;
                      }
                      // remaining options
                      for (i in this.props.hermodClient.domain.intents) {
                          var intent = this.props.hermodClient.domain.intents[i]
                          intentName = Object.keys(intent)[0]
                          if (!intentUsed.hasOwnProperty(intentName)) {
                                options.push(<Dropdown.Item key={i+this.props.hermodClient.domain.intents.length} value={intentName} onClick={function(event) {that.onIntentChanged(event)}} >{this.getPrettyIntentName(intentName)}</Dropdown.Item>)
                          }
                      }
                      
                    // RENDER ENTITIES
                      for (i in this.props.hermodClient.domain.entities) {
                          entityName = this.props.hermodClient.domain.entities[i]
                          entityOptions.push(<Dropdown.Item key={i} value={entityName} onClick={function(event) {that.onEntityChanged(event)}} >{this.getPrettyEntityName(entityName)}</Dropdown.Item>)
                      } 
                      
                      var buttons=[]
                      var entityNameInner = null
                      for (i in this.props.hermodClient.domain.entities) {
                        entityName = this.props.hermodClient.domain.entities[i]
                        var innerEntityOptions = []
                        innerEntityOptions.push(<Dropdown.Item key={i+2} ><Button value={entityName} onClick={function(event) {that.onEntityDeleted(event)}}  className="btn btn-danger" >Delete</Button></Dropdown.Item>)
                        innerEntityOptions.push(<Dropdown.Divider key={i+1} />)
                          
                          
                        for (var j in this.props.hermodClient.domain.entities) {
                              entityNameInner = this.props.hermodClient.domain.entities[j]
                              if (this.canShowEntity(parsedIntent,entityNameInner)) {
                                  if (entityName !== entityNameInner) {
                                    innerEntityOptions.push(<Dropdown.Item key={j} oldvalue={entityName} value={entityNameInner} onClick={function(event) {that.onEntityChanged(event)}} >{this.getPrettyEntityName(entityNameInner)}</Dropdown.Item>)    
                                  } else {
                                      innerEntityOptions.push(<Dropdown.Item style={{backgroundColor:'lightgrey',fontWeight:'bold'}} key={j} oldvalue={entityName} value={entityNameInner} onClick={function(event) {that.onEntityChanged(event)}} >{this.getPrettyEntityName(entityNameInner)}</Dropdown.Item>)    
                                  }
                              }
                              
                          } 
                          
                          
                        if (entityIndex.hasOwnProperty(entityName)) {
                              buttons.push(
                              <Dropdown key={i}   style={{border: '1px solid #6a4077' ,marginLeft:'0.3em',backgroundColor:"#c88eda", zIndex:1}}  as={ButtonGroup}>

                                  <Dropdown.Toggle split style={{marginLeft:'0.3em',backgroundColor:"#c88eda",border: 'none'}}  size="sm"  id="dropdown-split-basic" ></Dropdown.Toggle>
                                  <Button onClick={function(event) {that.onEntityClicked(event)}} value={entityName} start={entityIndex[entityName].start} end={entityIndex[entityName].end} style={{marginLeft:'0.3em',backgroundColor:"#c88eda",border: 'none'}}  size="sm" >{entityIndex[entityName].value}</Button>

                                  <Dropdown.Menu>
                                    {innerEntityOptions}
                                  </Dropdown.Menu>
                                </Dropdown>
                             
                             )
                          }
                      }
                      var addEntityOptions=[]
                        for (i in this.props.hermodClient.domain.entities) {
                              entityNameInner = this.props.hermodClient.domain.entities[i]
                              addEntityOptions.push(<Dropdown.Item key={i} oldvalue={entityName} value={entityNameInner} onClick={function(event) {that.newEntity(event)}} >&nbsp;{this.getPrettyEntityName(entityNameInner)}&nbsp;</Dropdown.Item>)
                        } 
                        form = <form onSubmit={function() { return false} } style={{display:'inline'}}>
                            {(parsedIntent) &&    <Dropdown key={i}   style={{clear:'both',border: '1px solid #6a4077' ,marginLeft:'0.3em',backgroundColor:"#c88eda"}}  as={ButtonGroup}>

                                  <Dropdown.Toggle split style={{marginLeft:'0.3em',backgroundColor:"#c88eda",border: 'none'}}  size="sm"  id="dropdown-split-basic" >{parsedIntent}</Dropdown.Toggle>
                                
                                  <Dropdown.Menu>
                                    {options}
                                  </Dropdown.Menu>
                                </Dropdown>
                              
                              }
                            {buttons}
                           {(this.state.showAddButton && this.state.selection) && <Dropdown  show={true} style={{border: '1px solid #6a4077' ,marginLeft:'0.3em',backgroundColor:"#c88eda", zIndex:1}}  as={ButtonGroup}>
                            <Dropdown.Toggle split style={{marginLeft:'0.3em',backgroundColor:"#c88eda",border: 'none'}}  size="sm"  id="dropdown-split-basic" ></Dropdown.Toggle>
                                  
                                  <Dropdown.Menu>
                                    {addEntityOptions}
                                  </Dropdown.Menu>
                                </Dropdown>
                            }
                          
                          {that.state.changed && <Button onClick={that.sendForm} className='btn' size="sm"  style={{marginLeft:'1em', backgroundColor:"#82b77c"}} >Try Again</Button>}
                        </form>
                  }
                  return (
                    <div style={{height:'1em', textAlign:'left'}} className="nluFixerComponent">


                        <div style={{marginLeft: "0.5em", marginRight: "0.5em", clear: "both" , width: "90%"}}  >
                          <form style={{clear:'both'}} onSubmit={that.sendFormQuestion} ><input ref={that.questionInput} onKeyUp={this.onQuestionKeyup} onFocus={this.onQuestionFocus} onBlur={this.onQuestionBlur} onSelect={this.onQuestionSelect} style={{clear:'both', fontSize: "1.3em" , width: "100%"}} id="text_input" type='text' value={that.props.hermodClient.question} onChange={that.props.setQuestion} placeholder='Ask a question' /></form>
                        </div>     
                        <div style={{zIndex:999}} >{form}</div>
                    </div>
                  )
            }
            return null;
        }
         


     
         
        sendFormQuestion(e) {
            let that = this;
            e.preventDefault(); 
            if (that.props.hermodClient && that.props.hermodClient.question) {
                let question = that.props.hermodClient.question;
                var data = {'text':question}
                that.props.api.client.sendMessage('hermod/'+that.props.hermodClient.config.site+'/asr/text',data)
                that.setState({changed: false})
            }
            return false;
        }       
        
        sendForm(e) {
            let that = this;
            if (that.props.hermodClient && that.props.hermodClient.nlu_json) {
                let nlu_json = that.props.hermodClient.nlu_json;
                nlu_json.text = that.props.hermodClient.question
                e.preventDefault()
                that.props.api.client.sendMessage('hermod/'+that.props.hermodClient.config.site+'/nlu/intent',nlu_json)
            }
            that.setState({changed: false})
            return false;
        }
        
        getQuestionSelection(event) {
            const selection = event.target.value.substring(event.target.selectionStart, event.target.selectionEnd);
            return selection ? selection : '';
        }
        
        setQuestionSelection(selectionStart, selectionEnd) {
            var questionInput = this.questionInput.current
            if (questionInput) {
                this.createSelection(questionInput,selectionStart, selectionEnd)
            }
        }
        
        createSelection(field, start, end) {
            if( field.createTextRange ) {
                var selRange = field.createTextRange();
                selRange.collapse(true);
                selRange.moveStart('character', start);
                selRange.moveEnd('character', end-start);
                selRange.select();
            } else if( field.setSelectionRange ) {
                field.setSelectionRange(start, end);
            } else if( field.selectionStart ) {
                field.selectionStart = start;
                field.selectionEnd = end;
            }
            field.focus();
        } 
        
        getQuestionSelectionRange(event) {
            const selection = [event.target.selectionStart ? event.target.selectionStart : 0, event.target.selectionEnd ? event.target.selectionEnd : 0];
            return selection
        }
        
        onQuestionSelect(event) {
            this.setState({'selection':this.getQuestionSelection(event),'selectionRange':this.getQuestionSelectionRange(event),showAddButton:true})
        }
        
        onQuestionBlur(event) {
            this.setState({questionIsFocussed: false, showAddButton: false}) //selection:'',selectionRange:[0,0]})
        }

        onQuestionFocus(event) {
            this.setState({questionIsFocussed: true}) //selection:'',selectionRange:[0,0]})
        }

        
        onQuestionKeyup(event) {
        }
        
    }

