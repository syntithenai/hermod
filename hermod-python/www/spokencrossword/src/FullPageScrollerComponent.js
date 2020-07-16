import React from "react";
//import { Pager } from "react-bootstrap";

import ReactPageScroller from "react-page-scroller";


import "./index.css";

export default class FullPageScrollerComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = { currentPage: null };
  }

  handlePageChange = number => {
    this.setState({ currentPage: number }); // set currentPage number, to reset it from the previous selected.
  };

  getPagesNumbers = () => {
    const pageNumbers = [];
    return [...pageNumbers];
  };

  render() {
    return (
      <React.Fragment>
        <ReactPageScroller
          pageOnChange={this.handlePageChange}
          customPageNumber={this.state.currentPage}
          containerWidth={window.innerWidth}
          containerHeight={window.innerHeight * 0.8}
        >
        {this.props.children}
        </ReactPageScroller>

      </React.Fragment>
    );
  }
}
