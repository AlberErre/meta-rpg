import React, { Component } from "react";
import PropTypes from "prop-types";

import "./App.less";
import Navbar from "common/components/navbar/Navbar";

class App extends Component {
	static propTypes = {
		children: PropTypes.object.isRequired
	}

	render() {
		return (
			<div className="app-container">
				<Navbar />

				<div className="view-container">
					{this.props.children}
				</div>
			</div>
		);
	}
}

export default App;