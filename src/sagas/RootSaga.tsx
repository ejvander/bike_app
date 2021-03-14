import { fork } from "redux-saga/effects";
import { apiSaga } from "./ApiSaga";
import { bleSaga } from "./BleSaga";

export function* rootSaga(): Generator<any, any, any> {
  // All below generators are described below...
  yield fork(bleSaga);
  yield fork(apiSaga);
}
