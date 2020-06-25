import React from "react";
import {Component} from 'react';
import { Button } from "react-bootstrap";
import { BrowserRouter as Router, Link , Redirect} from "react-router-dom";


export default class ImageListComponent extends Component {
    
    render() {
        let that = this;
        if (this.props.images && this.props.images.length > 0) { 
            let images = []
            for (var i = 0; i< that.props.images.length; i++) {
                images.push(<img key={i} src={that.props.images[i]} style={{width: '90%'}} />)
            }
            return (
            <div className="images-list" >
                {images}
            </div>
            );
        } else {
            return <Redirect to="/" />
        }
    }
};
