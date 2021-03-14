// @flow

import { ActionSheetIOS } from "react-native";
import { State, Device, BleError } from "react-native-ble-plx";

export type Action =
  | LogAction
  | ClearLogsAction
  | ConnectAction
  | DisconnectAction
  | UpdateConnectionStateAction
  | BleStateUpdatedAction
  | SensorTagFoundAction
  | UpdateReistanceAction
  | UpdateBikeTelemetryAction
  | AccountChosenAction
  | FetchAccountsAction
  | FetchedAccountsAction
  | SaveRideAction
  | ClearRideAction
  | FetchSessionsAction
  | FetchedSessionsAction
  | FetchSessionAction
  | FetchedSessionAction;

export type LogAction = {
  type: "LOG";
  message: string;
};

export type ClearLogsAction = {
  type: "CLEAR_LOGS";
};

export type ConnectAction = {
  type: "CONNECT";
  device: Device;
};

export type DisconnectAction = {
  type: "DISCONNECT";
};

export type UpdateConnectionStateAction = {
  type: "UPDATE_CONNECTION_STATE";
  state: keyof typeof ConnectionState;
};

export type UpdateReistanceAction = {
  type: "UPDATE_RESISTANCE_STATE";
  resistance: number;
};

export type UpdateBikeTelemetryAction = {
  type: "UPDATE_BIKE_TELEMETRY";
  timer: number;
  speed: number;
  rpm: number;
  distance: number;
  calories: number;
  watts: number;
};

export type BleStateUpdatedAction = {
  type: "BLE_STATE_UPDATED";
  state: keyof typeof State;
};

export type SensorTagFoundAction = {
  type: "SENSOR_TAG_FOUND";
  device: Device;
};

export type AccountChosenAction = {
  type: "ACCOUNT_CHOSEN";
  account: Account;
};

export type FetchAccountsAction = {
  type: "FETCH_ACCOUNTS";
};

export type FetchedAccountsAction = {
  type: "FETCHED_ACCOUNTS";
  accounts: Array<Account>;
};

export type FetchedSessionsAction = {
  type: "FETCHED_SESSIONS";
  sessions: Array<Session>;
};

export type FetchSessionsAction = {
  type: "FETCH_SESSIONS";
  id: number;
};

export type FetchSessionAction = {
  type: "FETCH_SESSION";
  id: number;
};

export type FetchedSessionAction = {
  type: "FETCHED_SESSION";
  session_data: Array<BikeStatus>;
};

export type SaveRideAction = {
  type: "SAVE_RIDE";
  ride: Array<BikeStatus>;
  user_id: number;
};

export type ClearRideAction = {
  type: "CLEAR_RIDE";
};

export type ReduxState = {
  logs: Array<string>;
  activeError: BleError | null | undefined;
  activeSensorTag: Device | null | undefined;
  connectionState: keyof typeof ConnectionState;
  bleState: keyof typeof State;
  devices: Map<string, Device>;
  bikeTelemetry: Array<BikeStatus>;
  account: Account | null;
  fetchedAccounts: Array<Account>;
  sessions: Array<Session>;
  session_data: Array<BikeStatus>;
};

export type Session = {
  id: number;
  distance: number;
  timestamp: string;
  ride_time: number;
  calories: number;
};

export type Account = {
  name: string;
  id: number;
};

export type BikeStatus = {
  resistance: number;
  timer: number;
  speed: number;
  rpm: number;
  distance: number;
  calories: number;
  watts: number;
};

export enum ConnectionState {
  DISCONNECTED = "DISCONNECTED",
  CONNECTING = "CONNECTING",
  DISCOVERING = "DISCOVERING",
  CONNECTED = "CONNECTED",
  DISCONNECTING = "DISCONNECTING",
}

export const initialState: ReduxState = {
  bleState: State.Unknown,
  activeError: null,
  activeSensorTag: null,
  connectionState: ConnectionState.DISCONNECTED,
  logs: [],
  devices: new Map(),
  bikeTelemetry: [
    {
      resistance: 0,
      timer: 0,
      speed: 0,
      rpm: 0,
      distance: 0,
      calories: 0,
      watts: 0,
    },
  ],
  account: null,
  fetchedAccounts: [],
  sessions: [],
  session_data: [],
};

export function log(message: string): LogAction {
  return {
    type: "LOG",
    message,
  };
}

export function logError(error: BleError) {
  return log(
    "ERROR: " +
      error.message +
      ", ATT: " +
      (error.attErrorCode || "null") +
      ", iOS: " +
      (error.iosErrorCode || "null") +
      ", android: " +
      (error.androidErrorCode || "null") +
      ", reason: " +
      (error.reason || "null")
  );
}

export function clearLogs(): ClearLogsAction {
  return {
    type: "CLEAR_LOGS",
  };
}

export function connect(device: Device): ConnectAction {
  return {
    type: "CONNECT",
    device,
  };
}

export function updateConnectionState(
  state: keyof typeof ConnectionState
): UpdateConnectionStateAction {
  return {
    type: "UPDATE_CONNECTION_STATE",
    state,
  };
}

export function disconnect(): DisconnectAction {
  return {
    type: "DISCONNECT",
  };
}

export function bleStateUpdated(
  state: keyof typeof State
): BleStateUpdatedAction {
  return {
    type: "BLE_STATE_UPDATED",
    state,
  };
}

export function sensorTagFound(device: Device): SensorTagFoundAction {
  return {
    type: "SENSOR_TAG_FOUND",
    device,
  };
}

export function updateResistance(resistance: number): UpdateReistanceAction {
  return {
    type: "UPDATE_RESISTANCE_STATE",
    resistance: resistance,
  };
}

export function chooseAccount(account: Account): AccountChosenAction {
  return {
    type: "ACCOUNT_CHOSEN",
    account: account,
  };
}

export function fetchAccounts(): FetchAccountsAction {
  return {
    type: "FETCH_ACCOUNTS",
  };
}

export function fetchSessions(id: number): FetchSessionsAction {
  return {
    type: "FETCH_SESSIONS",
    id: id,
  };
}

export function fetchSession(id: number): FetchSessionAction {
  return {
    type: "FETCH_SESSION",
    id: id,
  };
}

export function fetchedSession(
  session_data: Array<BikeStatus>
): FetchedSessionAction {
  return {
    type: "FETCHED_SESSION",
    session_data: session_data,
  };
}

export function saveRide(
  ride: Array<BikeStatus>,
  user_id: number
): SaveRideAction {
  return {
    type: "SAVE_RIDE",
    ride: ride,
    user_id: user_id,
  };
}

export function clearRide(): ClearRideAction {
  return {
    type: "CLEAR_RIDE",
  };
}

export function fetchedAccounts(
  accounts: Array<Account>
): FetchedAccountsAction {
  return {
    type: "FETCHED_ACCOUNTS",
    accounts: accounts,
  };
}

export function fetchedSessions(
  sessions: Array<Session>
): FetchedSessionsAction {
  return {
    type: "FETCHED_SESSIONS",
    sessions: sessions,
  };
}

export function updateBikeTelemetry(
  timer: number,
  speed: number,
  rpm: number,
  distance: number,
  calories: number,
  watts: number
): UpdateBikeTelemetryAction {
  return {
    type: "UPDATE_BIKE_TELEMETRY",
    timer: timer,
    speed: speed,
    rpm: rpm,
    distance: distance,
    calories: calories,
    watts: watts,
  };
}

export function reducer(
  state: ReduxState = initialState,
  action: Action
): ReduxState {
  switch (action.type) {
    case "LOG":
      return { ...state, logs: [action.message, ...state.logs] };
    case "CLEAR_LOGS":
      return { ...state, logs: [] };
    case "UPDATE_CONNECTION_STATE":
      return {
        ...state,
        connectionState: action.state,
        logs: ["Connection state changed: " + action.state, ...state.logs],
      };
    case "BLE_STATE_UPDATED":
      return {
        ...state,
        bleState: action.state,
        logs: ["BLE state changed: " + action.state, ...state.logs],
      };
    case "SENSOR_TAG_FOUND":
      if (state.devices.has(action.device.id)) return state;
      let active_tag = state.activeSensorTag
        ? state.activeSensorTag
        : action.device;
      let new_devices = new Map(state.devices);
      new_devices.set(action.device.id, action.device);
      return {
        ...state,
        activeSensorTag: active_tag,
        logs: ["devices found: " + state.devices.size, ...state.logs],
        devices: new_devices,
      };
    case "UPDATE_RESISTANCE_STATE":
      let new_arr = state.bikeTelemetry.slice();
      new_arr[0].resistance = action.resistance;
      return { ...state, bikeTelemetry: new_arr };
    case "UPDATE_BIKE_TELEMETRY":
      let last_resistance = state.bikeTelemetry[0].resistance;
      return {
        ...state,
        bikeTelemetry: [
          {
            resistance: last_resistance,
            speed: action.speed,
            rpm: action.rpm,
            distance: action.distance,
            timer: action.timer,
            calories: action.calories,
            watts: action.watts,
          },
          ...state.bikeTelemetry,
        ],
      };
    case "ACCOUNT_CHOSEN":
      return {
        ...state,
        account: action.account,
      };
    case "FETCHED_ACCOUNTS":
      console.log(action.accounts);
      return {
        ...state,
        fetchedAccounts: action.accounts,
      };
    case "CLEAR_RIDE":
      return {
        ...state,
        bikeTelemetry: [
          {
            resistance: 0,
            timer: 0,
            speed: 0,
            rpm: 0,
            distance: 0,
            calories: 0,
            watts: 0,
          },
        ],
      };
    case "FETCHED_SESSIONS":
      return {
        ...state,
        sessions: action.sessions,
      };
    case "FETCHED_SESSION":
      return {
        ...state,
        session_data: action.session_data,
      };
    default:
      return state;
  }
}
