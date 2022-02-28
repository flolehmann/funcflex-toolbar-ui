const combineReducers = (...reducers) =>
    (state, action) =>
        reducers.reduce((newState, reducer) =>
            reducer(newState, action), state)

export default combineReducers;