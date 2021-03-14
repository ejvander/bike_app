// @flow

import { createStore, applyMiddleware } from "redux";
import createSagaMiddleware from "redux-saga";
import runSaga from "./sagaConfigure";
import { reducer } from "./Reducer";
import { rootSaga } from "./sagas/RootSaga";

const sagaMiddleware = createSagaMiddleware();
export const store = createStore(reducer, applyMiddleware(sagaMiddleware));
runSaga(rootSaga, sagaMiddleware);
