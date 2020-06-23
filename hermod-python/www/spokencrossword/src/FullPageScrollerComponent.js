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

    //for (let i = 1; i <= 5; i++) {
      //pageNumbers.push(
        //<Pager.Item key={i} eventKey={i - 1} onSelect={this.handlePageChange}>
          //{i}
        //</Pager.Item>,
      //);
    //}

    return [...pageNumbers];
  };

  render() {
    //const pagesNumbers = this.getPagesNumbers();

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
        //<Pager className="pagination-additional-class" bsSize="large">
          //{pagesNumbers}
        //</Pager>
