/* global window */

import React, { Component } from 'react'

export default class HermodReactLogger extends Component {

    constructor(props) {
        super(props);
        this.state = {showLogMessages:{},showLog:{}}
        this.toggleMessageExpansion = this.toggleMessageExpansion.bind(this);
        this.isLogMessageExpanded = this.isLogMessageExpanded.bind(this);
        this.isLogExpanded = this.isLogExpanded.bind(this);
        this.toggleLogExpansion = this.toggleLogExpansion.bind(this);
    };

  
       
    toggleMessageExpansion(e,key) {
        let showLogMessages = this.state.showLogMessages;
        if (this.isLogMessageExpanded(key)) {
            showLogMessages[key] = false;
        } else {
            showLogMessages[key] = true;
        }
        this.setState({showLogMessages:showLogMessages});
    };
    
    toggleLogExpansion(e,key) {
        let showLog = this.state.showLog;
        if (this.isLogExpanded(key)) {
            showLog[key] = false;
        } else {
            showLog[key] = true;
        }
        this.setState({showLog:showLog});
    };
    
    isLogMessageExpanded(key) {
        if (this.state.showLogMessages.hasOwnProperty(key) && this.state.showLogMessages[key]) {
            return true;
        }
        return false;
    };
    
    isLogExpanded(key) {
        if (this.state.showLog.hasOwnProperty(key) && this.state.showLog[key]) {
            return true;
        }
        return false;
    };
   
    render() {
        let that = this;
        if (this.props.sites) {
            let sitesRendered = Object.keys(this.props.sites).map(function(siteKeyIn) {
                let siteKey = siteKeyIn && siteKeyIn.length > 0 ? siteKeyIn : 'unknownSite';
                let site = that.props.sites[siteKey];
                let sessions = Object.values(site);
                sessions.sort(function(a,b) {
                    if (a.starttimestamp < b.starttimestamp) return 1;
                    else return -1;
                });
                if (!that.props.siteId || (that.props.siteId && siteKey === that.props.siteId)) {
                    let sessionsRendered = sessions.map(function(session,sessionLoopKey) {
                        if (session)  {
                            let logs = that.props.messages.map(function(val,key) {
                                if (val.sessionId === session.sessionId) {
                                    return <div key={key} >
                                        <button onClick={(e) => that.toggleMessageExpansion(e,key)} >+</button> 
                                         &nbsp;&nbsp;{val.text}
                                        {that.isLogMessageExpanded(key) && <pre>{val.payload}</pre>}
                                    </div>                            
                                }
                                return [];
                            });
                            let statusText= that.props.sessionStatusText[session.sessionId];
                            let sessionClass = 'session-'+statusText;
                            let sessionStyle = {margin:'1em', padding:'1em', border: '2px solid black',borderRadius:'10px'};
                            let sessionItems = [];
                            let audioItems = [];
                            if (session.audio) {
                                audioItems = session.audio.map(function(audioData,ikey) {
                                    return <span key={ikey} >{audioData[ikey]  && audioData.length > 0 && <audio src={audioData} controls={true} style={{float:'right'}}/>}</span>
                                });
                            }
                            if (session.asr) sessionItems = session.asr.map(function(transcript,ikey) {
                                let slotValues = [];
                                
                                if (session.intents && session.intents.length > ikey && session.intents[ikey]) slotValues = session.intents[ikey].slots.map(function(slot,skey) {
                                    return <li key={skey}>{slot.slotName.split('_').join(' ')} {slot.value.value}</li>
                                });
                                return <div key={ikey}>
                                <div style={{marginBottom:'1em',fontWeight:'bold'}}>
                                    {transcript.text} 
                                </div>
                               {session.tts && session.tts.length > 0 && <div ><hr style={{height:'1px', width:'100%'}}/>                               <div><i>{session.tts && session.tts.length > ikey && session.tts[ikey] && session.tts[ikey].text}</i></div></div>
                               }
                                
                                
                                <div ><hr style={{height:'1px', width:'100%'}}/></div>
                                <div>
                                    {slotValues && <ul>{slotValues}</ul>}
                                </div>
                                
                                
                                </div>
                            });
                            if (session.started && session.sessionId) {
                                return <div className={sessionClass} style={sessionStyle}  key={sessionLoopKey} >
                                    <button style={{display:'inline',paddingRight:'0.5em'}} onClick={(e) => that.toggleLogExpansion(e,session.sessionId)} >+</button> 
                                    <h4 style={{marginLeft:'1em',display:'inline',clear:'right'}}>{session.sessionId} {that.props.sessionStatusText[session.sessionId]} </h4><div style={{float:'right'}}>{audioItems}</div>
                                
                                    <hr style={{height:'1px', width:'100%'}}/>
                                    
                                    <div >{sessionItems}</div>
                                    <hr style={{height:'1px', width:'100%'}}/>
                                    {that.isLogExpanded(session.sessionId) && <div >{logs}</div>}
                                </div>
                            }   
                            //
                                                  
                        }
                        return [];
                    });
                    let activityStyle={padding:'0.2em',borderRadius:'5px',float:'right',marginRight:'4em'};
                    return <div style={{margin:'1em',padding:'1em', border: '2px solid black',borderRadius:'10px'}} key={siteKey}>
                        {siteKey} 
                        {that.props.hotwordListening[siteKey] && <b style={Object.assign({backgroundColor:'lightpink',border:'1px solid red'},activityStyle)} >Hotword</b>}
                        {that.props.audioListening[siteKey] && <b style={Object.assign({backgroundColor:'lightgreen',border:'1px solid green'},activityStyle)}>Listening</b>}
                        <div>{sessionsRendered}</div>
                    </div>
                }
                return ;
            });
            return <b>
             {sitesRendered}
            <br/>
            </b>;
            
        } else {
            return []
        }
    }
}
