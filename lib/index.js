import React, { Component } from 'react';
import PropTypes from "prop-types";

const GlobalContext = React.createContext();

/*
* @param {function} Component - React component
* @callback mapStateToProps - portion of state object to assign to props
* @param {object} transmitters - callback functions to assign to props
* @returns {object} React Context.Consumer instance containing global state
*/
export const connect = (Component, mapStateToProps, transmitters = {}) => props => {
    const _mapTransmittersToProps = (transmitters, setGlobalState) => {
        const output = {};
        for (let func in transmitters) {
            output[func] = (...args) => transmitters[func].apply(null, args)(setGlobalState);
        }
        return output;
    }
    return (
        <GlobalContext.Consumer>
            {({ globalState, setGlobalState }) => {
                const mappedState = mapStateToProps ? mapStateToProps(globalState) : globalState;
                const mappedTransmitters = _mapTransmittersToProps(transmitters, setGlobalState);
                return (
                    <Component setGlobalState={setGlobalState}{...mappedState} {...mappedTransmitters} {...props} />
                )
            }}
        </GlobalContext.Consumer>
    )
}

export default class Provider extends Component {
    constructor(props) {
        super(props);
        this.state = props.globalState;
    }
    render() {
        return (
            <GlobalContext.Provider value={{ globalState: this.state, setGlobalState: this.setState.bind(this) }}>
                {this.props.children}
            </GlobalContext.Provider>
        )
    }
}

Provider.propTypes = {
    globalState: PropTypes.object.isRequired,
    children: PropTypes.element.isRequired
}

