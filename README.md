# Riddl.js (*Little Redux*)
## Lightweight ReactJS state-management API using `React.Context`.

### Author: **bbgrabbag**

---

#### Description
**Riddl.js** is a ReactJS mini-library for intuitively managing global state. It consists of four very simple parts: `globalState`, `setGlobalState`, `connect` and `Provider`.

* `globalState` is an object representing the state of your application.
* `setGlobalState` is the declarative function for defining new states.
* `connect` is a HoC which lets individual components communicate with the global state
* `Provider` is a wrapper component which houses the single source of truth (the global state) for your application;
---

#### Install

`npm install --save riddl-js`

#### Getting Started

**Riddl.js** aims to make managing the state of an app as intuitive as that of a local component. Simply define your global state and inject it directly into your App:

```javascript
// import the Provider component
import {Provider} from "riddl-js";

// define your global state
const globalState = {
    loggedIn: false
}

// pass it to the provider via props
render(
    <Provider globalState = {globalState}>
        <App />
    </Provider>
    , document.getElementById("root"));
```

The `connect` function simply provides the `globalState` object and `setGlobalState` function to any component via props automatically:

```javascript
import {connect} from "riddl-js";

//The entire global state is available via props
const HomeScreen = props => (
    <div>{props.loggedIn ? "Welcome Riddl user!" : "You are not logged in"}</div>
);

export connect(HomeScreen);
```
```javascript
import {connect} from "riddl-js";

//Declaratively change state using `setGlobalState`
const Auth = props => (
    <button onClick={() => props.setGlobalState({loggedIn: true})}>Login</button>
);

export connect(Auth);
```

---

#### `setGlobalState` is really just `setState`

`setGlobalState` is really just the built-in React component method `setState` bound to the `<Provider>`. That means it works the exact same way in which you're already familiar. For example, if you need to access the previous state: 
```javascript
props.setGlobalState(prevState => ({foo: prevState.foo + "bar"}));
```

Same thing for callbacks:
```javascript
props.setGlobalState({foo: "bar"}, () => props.setGlobalState({foo : "BAR"})));
```
---

#### Asynchronous State Changes / Rendering
One of the core principles of Flux and Redux is that state changes should be predictable and consistent. Promises make this especially challenging. 

Fortunately, since **Riddl** exposes the actual `setGlobalState` function to the scope of a connected component, making predictable state changes is trivial:

```javascript
componentDidMount(){
    this.props.setGlobalState({loading: true});
    fetch('/data')
    .then(response => return response.json())
    .then(data => this.props.setGlobalState({data, loading: false}))
    .catch(err => this.props.setGlobalState({err, loading: false}))
}
```

---

#### The `connect` function
**Riddl**'s `connect` function is inspired from `react-redux`. However it has been slightly condensed. By default the entire `globalState` is provided via props. `mapStateToProps` is an optional second parameter, which lets you extract a specific portion of the global state you need:

```javascript
//globalState --> {portion: {foo: "bar"}, rest: {}}

const NeedsPartOfState = props => (
    <div>
        {props.foo}
    </div>
)

export default connect(NeedsPartOfState, state => state.portion);
```

The third parameter (also optional) is a special object reserved for what are called *transmitters*. 

```javascript
    //...
    export default connect(MyComponent, null, {
        transmitter1, 
        transmitter2, 
        transmitter3
        });
```

**Riddl** transmitters are simply functions that return callbacks with `setGlobalState` as a parameter. They are based on the `redux-thunk` design of using `dispatch` within asynchronous action creators:

```javascript
// transmitters.js
export const coinflip = guess => setGlobalState => (
        new Promise((res, rej)=>{
        setGlobalState({result: "Flipping!!"});
        let result = Math.random() < .5 ? "HEADS" : "TAILS";
        setTimeout(()=> result === guess ? res("YOU WON!") : rej("YOU LOST!"), 1200);
    })
    .then(victory => setGlobalState({result:victory}))
    .catch(defeat => setGlobalState({result:defeat}))
)
```
```javascript
import {coinFlip} from "transmitters.js";

const Game = props => (
    <div>
        <button onClick={()=>props.coinflip("HEADS")}>Click to flip</button>
    </div>
);
export default connect(Game, null, {coinflip});
```
```javascript
const Score = props => (
    <div>{props.result}</div>
);

export default connect(Score);
```
Notice in the example that the transmitter `coinflip` is called from `props`. This is because the `connect` function is responsible for providing transmitters `setGlobalState` before they are attached to props.

#### Organization
It is easiest to store your transmitters in a separate file and export them as needed. By design Riddl doesn't require a strict folder structure, but here is a simple example:
```
/src
    /components
    App.js
    index.js
    /transmitters
        index.js
```
If you are finding yourself with lots of transmitters and a large state, consider breaking them up into separate files:

```javascript
// /transmitters/auth.js

 export const login = credentials => setGlobalState => {
     //...
 }
 export const logout = () => setGlobalState => {
     //...
 }

 export default {
     isAuthenticated: false,
     user: null
 }
```
```javascript
// /src/index.js
import auth from "./transmitters/auth.js";
import data from "./transmitters/data.js";

const globalState = {auth, data};

render(
    <Provider globalState={globalState} >
        <App />
    </Provider>,
    document.getElementById("root");
    )
```
---

## API Reference

#### § `<Provider>`
Wrapper component for the application. Houses the `Context.Provider` and `globalState`.

##### Props
Name | Type | Default Value | Description
--- | --- | --- | ---
`globalState` *[required]* | `Object` | `N/A` | The initial state of the application

```javascript
import {Provider} from "riddl-js";

render(
    <Provider globalState={{key: "value"}}> 
        <App /> 
    </Provider>
    )
```

#### § `connect`
Utility function for linking the Provider to other components in the React component tree.

##### Args
Name | Type | Default Value | Description
--- | --- | --- | ---
`Component` *[required]* | `React Component` | `N/A` | The React component to be given `globalState` and `setGlobalState` via props
`mapStateToProps` *[optional]* | `Function` | `state => state` | Callback function for importing parts of state into the component
`transmitters` *[optional]* | `Object` | `{}` | Useful for connecting asynchronous functions to a component via props

```javascript
import {connect} from "riddl-js";

const transmitter = ()=> setGlobalState => http(url).then(data => setGlobalState({data}));

const MyComponent = props => (
    <div>
        <button onClick={props.transmitter}>GET</button>
    </div>
)

connect(MyComponent, null, {transmitter});
```