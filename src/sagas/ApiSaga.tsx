import { take, call, put, fork } from "redux-saga/effects";
import {
  fetchedAccounts,
  SaveRideAction,
  clearRide,
  FetchSessionsAction,
  fetchedSessions,
  fetchedSession,
} from "../Reducer";
import { API_URL } from "@env";

const PORT = false ? 5101 : 5100;

const API_ENDPOINT = API_URL + ":" + PORT + "/v1";

export function* apiSaga(): Generator<any, any, any> {
  yield fork(fetchAccounts);
  yield fork(saveRide);
  yield fork(fetchSessions);
  yield fork(fetchSession);
}

function* fetchAccounts(): Generator<any, any, any> {
  while (true) {
    yield take("FETCH_ACCOUNTS");
    let res = yield call(fetch, API_ENDPOINT + "/get_users");

    let json = yield res.json();
    console.log(json);
    yield put(fetchedAccounts(json.users));
  }
}

function* fetchSessions(): Generator<any, any, any> {
  while (true) {
    let action: FetchSessionsAction = yield take("FETCH_SESSIONS");
    let res = yield call(
      fetch,
      API_ENDPOINT + "/get_sessions" + "/" + action.id
    );

    let json = yield res.json();
    console.log(json);
    yield put(fetchedSessions(json.sessions));
  }
}

function* fetchSession(): Generator<any, any, any> {
  while (true) {
    let action: FetchSessionsAction = yield take("FETCH_SESSION");
    console.log(action);
    let res = yield call(
      fetch,
      API_ENDPOINT + "/get_session" + "/" + action.id
    );

    let json = yield res.json();
    console.log(json);
    yield put(fetchedSession(json.session_data));
  }
}

function* saveRide(): Generator<any, any, any> {
  while (true) {
    let action: SaveRideAction = yield take("SAVE_RIDE");
    let res = yield call(
      fetch,
      API_ENDPOINT + "/save_session/" + action.user_id,
      {
        method: "POST",
        body: JSON.stringify(action.ride),
      }
    );
    yield put(clearRide());
    console.log(res);
  }
}
