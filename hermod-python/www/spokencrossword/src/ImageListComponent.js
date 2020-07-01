import React from "react";
import {Component} from 'react';
import { Button } from "react-bootstrap";
import { BrowserRouter as Router, Link , Redirect} from "react-router-dom";


export default class ImageListComponent extends Component {
    
    render() {
        console.log(this.props.images)
        let that = this;
        if (this.props.images && this.props.images.length > 0) { 
            let images = []
            for (var i = 0; i< that.props.images.length; i++) {
                images.push(<span  key={i} ><img src={that.props.images[i].url} style={{width: '90%'}} /><div>{that.props.images[i].attribution}</div></span>)
            }
            return (
            <div className="images-list" >
                {images}
                <br/><br/><br/><br/><br/><br/>
            </div>
            );
        } else {
            return <Redirect to="/" />
        }
    }
};
