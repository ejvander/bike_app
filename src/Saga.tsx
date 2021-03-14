// @flow

import {
  EventEmitter,
  PermissionsAndroid,
  Platform,
  SliderComponent,
} from "react-native";
import { buffers, channel, eventChannel } from "redux-saga";
import {
  fork,
  cancel,
  take,
  call,
  put,
  race,
  cancelled,
  actionChannel,
  select,
} from "redux-saga/effects";
import {
  Account,
  log,
  logError,
  updateConnectionState,
  bleStateUpdated,
  BleStateUpdatedAction,
  UpdateConnectionStateAction,
  ConnectAction,
  sensorTagFound,
  ConnectionState,
  updateResistance,
  ReduxState,
  updateBikeTelemetry,
  BikeStatus,
  fetchedAccounts,
  SaveRideAction,
  clearRide,
  FetchSessionsAction,
  fetchedSessions,
  fetchedSession,
} from "./Reducer";
import {
  BleManager,
  BleError,
  Device,
  State,
  LogLevel,
} from "react-native-ble-plx";
import { Buffer } from "buffer";
import { API_URL } from "@env";

const CHARACTERISTIC_f3_UUID = "0bf669f3-45f2-11e7-9598-0800200c9a66";
const CHARACTERISTIC_f4_UUID = "0bf669f4-45f2-11e7-9598-0800200c9a66";
const CHARACTERISTIC_f2_UUID = "0bf669f2-45f2-11e7-9598-0800200c9a66";
const SERVICE_UUID = "0bf669f1-45f2-11e7-9598-0800200c9a66";

const PORT = __DEV__ ? 5101 : 5100;

const API_ENDPOINT = API_URL + ":" + PORT + "/v1";

export const getBikeStatus = (state: ReduxState) => state.bikeTelemetry[0];

export function* bleSaga(): Generator<any, any, any> {
  yield put(log("BLE saga started..."));

  // First step is to create BleManager which should be used as an entry point
  // to all BLE related functionalities
  const manager = new BleManager();
  manager.setLogLevel(LogLevel.Verbose);

  let connection_chan = yield call(channel);

  // All below generators are described below...
  yield fork(handleScanning, manager);
  yield fork(handleBleState, manager);
  yield fork(handleConnection, manager, connection_chan);
  yield fork(handleData, manager, connection_chan);
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

// This generator tracks our BLE state. Based on that we can enable scanning, get rid of devices etc.
// eventChannel allows us to wrap callback based API which can be then conveniently used in sagas.
function* handleBleState(manager: BleManager): Generator<any, any, any> {
  const stateChannel = yield eventChannel((emit) => {
    const subscription = manager.onStateChange((state) => {
      emit(state);
    }, true);
    return () => {
      subscription.remove();
    };
  }, buffers.expanding(1));

  try {
    while (true) {
      const newState = yield take(stateChannel);
      yield put(bleStateUpdated(newState));
    }
  } finally {
    if (yield cancelled()) {
      stateChannel.close();
    }
  }
}

// This generator decides if we want to start or stop scanning depending on specific
// events:
// * BLE state is in PoweredOn state
// * Android's permissions for scanning are granted
// * We already scanned device which we wanted
function* handleScanning(manager: BleManager): Generator<any, any, any> {
  var scanTask = null;
  var bleState: keyof typeof State = State.Unknown;
  var connectionState: keyof typeof ConnectionState =
    ConnectionState.DISCONNECTED;

  const channel = yield actionChannel([
    "BLE_STATE_UPDATED",
    "UPDATE_CONNECTION_STATE",
  ]);

  while (true) {
    const action:
      | BleStateUpdatedAction
      | UpdateConnectionStateAction = yield take(channel);

    switch (action.type) {
      case "BLE_STATE_UPDATED":
        bleState = action.state;
        break;
      case "UPDATE_CONNECTION_STATE":
        connectionState = action.state;
        break;
    }

    const enableScanning =
      bleState === State.PoweredOn &&
      (connectionState === ConnectionState.DISCONNECTING ||
        connectionState === ConnectionState.DISCONNECTED);

    if (enableScanning) {
      if (scanTask != null) {
        yield cancel(scanTask);
      }
      scanTask = yield fork(scan, manager);
    } else {
      if (scanTask != null) {
        yield cancel(scanTask);
        scanTask = null;
      }
    }
  }
}

// As long as this generator is working we have enabled scanning functionality.
// When we detect SensorTag device we make it as an active device.
function* scan(manager: BleManager): Generator<any, any, any> {
  if (Platform.OS === "android" && Platform.Version >= 23) {
    yield put(log("Scanning: Checking permissions..."));
    const enabled = yield call(
      PermissionsAndroid.check,
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
    );
    if (!enabled) {
      yield put(log("Scanning: Permissions disabled, showing..."));
      const granted = yield call(
        PermissionsAndroid.request,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        yield put(log("Scanning: Permissions not granted, aborting..."));
        // TODO: Show error message?
        return;
      }
    }
  }

  yield put(log("Scanning started..."));
  const scanningChannel = yield eventChannel((emit) => {
    manager.startDeviceScan(
      null,
      { allowDuplicates: false },
      (error, scannedDevice) => {
        if (error) {
          emit([error, scannedDevice]);
          return;
        }
        if (scannedDevice != null && scannedDevice.name?.includes("ECHEX-3")) {
          emit([error, scannedDevice]);
        }
      }
    );
    return () => {
      manager.stopDeviceScan();
    };
  }, buffers.expanding(1));

  try {
    while (true) {
      const [error, scannedDevice]: [
        BleError | null,
        Device | null
      ] = yield take(scanningChannel);
      if (error != null) {
      }
      if (scannedDevice != null) {
        yield put(sensorTagFound(scannedDevice));
      }
    }
  } catch (error) {
  } finally {
    yield put(log("Scanning stopped..."));
    if (yield cancelled()) {
      scanningChannel.close();
    }
  }
}

async function setup_channel(device: Device, service: string) {
  await sleep(1000);
  console.log("Sending request 1");
  await device.writeCharacteristicWithoutResponseForService(
    service,
    CHARACTERISTIC_f2_UUID,
    Buffer.from("f0a10091", "hex").toString("base64")
  );
  await sleep(200); //sleep 0.2
  console.log("Sending request 2");
  await device.writeCharacteristicWithoutResponseForService(
    service,
    CHARACTERISTIC_f2_UUID,
    Buffer.from("f0a10091", "hex").toString("base64")
  );
  await sleep(200); //sleep 0.2
  console.log("Sending request 3");
  await device.writeCharacteristicWithoutResponseForService(
    service,
    CHARACTERISTIC_f2_UUID,
    Buffer.from("f0a10091", "hex").toString("base64")
  );
  await sleep(200); // sleep 0.2
  console.log("Sending request 4");
  await device.writeCharacteristicWithoutResponseForService(
    service,
    CHARACTERISTIC_f2_UUID,
    Buffer.from("f0a10091", "hex").toString("base64")
  );
  await sleep(200); // sleep 0.2
  console.log("Sending request 5");
  await device.writeCharacteristicWithoutResponseForService(
    service,
    CHARACTERISTIC_f2_UUID,
    Buffer.from("f0a30093", "hex").toString("base64")
  );
  await sleep(200); //sleep 0.2
  console.log("Sending request 6");
  await device.writeCharacteristicWithoutResponseForService(
    service,
    CHARACTERISTIC_f2_UUID,
    Buffer.from("f0a10091", "hex").toString("base64")
  );
  await sleep(200); // sleep 0.2
  console.log("Sending request 7");
  await device.writeCharacteristicWithoutResponseForService(
    service,
    CHARACTERISTIC_f2_UUID,
    Buffer.from("f0b00101a2", "hex").toString("base64")
  );
  await sleep(200); // sleep 0.2

  console.log("finished setup");
}

function calculate_checksum(val: IterableIterator<number>) {
  let checksum = 0;
  for (let element of val) {
    checksum += element % 256;
  }

  return checksum % 256;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parse_f4(val: string, bikeStatus: BikeStatus) {
  let data = Buffer.from(val, "hex");
  let opcode = data.slice(0, 4).toString("hex");
  let last_distance = 0;
  let action = "";
  if (opcode == "c3b0c391") {
    action = "telemetry";
  } else if (opcode.startsWith("f0d1")) {
    action = "telemetry";
    opcode = "f0d1";
  } else if (opcode == "c3b0c392") {
    action = "resistance";
  } else if (opcode.startsWith("f0d2")) {
    opcode = "f0d2";
    action = "resistance";
  }

  if (action == "telemetry") {
    let start_idx = opcode.length / 2;
    // Data opcode
    let num_bytes = data[start_idx]; // Num bytes excluding checksum
    let seconds_since_start = data
      .slice(start_idx + 1, start_idx + 3)
      .readUInt16BE();

    // data[7:9] ? always 0.  maybe higher distance bits
    let distance = data.slice(start_idx + 3, start_idx + 7).readInt32BE();
    let distance_delta = distance - last_distance;
    last_distance = distance;
    // data[11] ? always 0.  maybe higher cadence bits
    let rpm = data[start_idx + 8];
    // hardcoded in code.  43 rpm = 10 mph regardless of resistance
    let speed = (rpm / 43) * 10;
    // data[13] ? always 0
    let checksum = data[start_idx + 10];

    // Curve reversed from taking samples
    let watts =
      (rpm / 43) *
      (5.734292 +
        3.487019 * bikeStatus.resistance -
        0.2552567 * bikeStatus.resistance ** 2 +
        0.01023795 * bikeStatus.resistance ** 3);

    // Samples happen every seconds, so Joules = watts*second
    let calories = bikeStatus.calories + watts / 1000;

    let timer =
      Math.floor(seconds_since_start / 60).toString() +
      ":" +
      (seconds_since_start % 60).toString();

    /*console.log(
      `timer: ${timer}, speed: ${speed} mph, ` +
        `rpm: ${rpm}, distance: ${(distance * 7.0) / 1860} miles, ` +
        `Calories: ${calories}, ` +
        `watts: ${watts}, resistance: ${bikeStatus.resistance}`
    );*/

    return updateBikeTelemetry(
      seconds_since_start,
      speed,
      rpm,
      (distance * 7.0) / 1860, //Distance in miles
      calories,
      watts
    );
  } else if (action == "resistance") {
    let start_idx = opcode.length / 2;
    // Resistance opcode
    let num_bytes = data[start_idx]; // Excludes checksum
    let resistance = data[start_idx + 1];
    let checksum = data[start_idx + 2];
    return updateResistance(resistance);
  }

  return null;
}

function* handleConnection(
  manager: BleManager,
  connection_chan: any
): Generator<any, any, any> {
  while (true) {
    // Take action
    const { device }: ConnectAction = yield take("CONNECT");

    const disconnectedChannel = yield eventChannel((emit) => {
      const subscription = device.onDisconnected((error: any) => {
        emit({ type: "DISCONNECTED", error: error });
      });
      return () => {
        subscription.remove();
      };
    }, buffers.expanding(1));

    const deviceActionChannel = yield actionChannel(["DISCONNECT"]);

    try {
      yield put(updateConnectionState(ConnectionState.CONNECTING));
      yield call([device, device.connect]);
      yield put(updateConnectionState(ConnectionState.DISCOVERING));
      yield call([device, device.discoverAllServicesAndCharacteristics]);
      yield put(updateConnectionState(ConnectionState.CONNECTED));

      yield put(connection_chan, { status: "CONNECTED", device: device });

      while (true) {
        const { deviceAction, disconnected } = yield race({
          deviceAction: take(deviceActionChannel),
          disconnected: take(disconnectedChannel),
        });

        if (deviceAction) {
          if (deviceAction.type === "DISCONNECT") {
            yield put(connection_chan, {
              status: "DISCONNECTED",
              device: device,
            });

            yield put(log("Disconnected by user..."));
            yield put(updateConnectionState(ConnectionState.DISCONNECTING));
            yield call([device, device.cancelConnection]);
            break;
          }
        } else if (disconnected) {
          yield put(log("Disconnected by device..."));
          if (disconnected.error != null) {
            yield put(logError(disconnected.error));
          }
          break;
        }
      }
    } catch (error) {
      yield put(logError(error));
    } finally {
      disconnectedChannel.close();
      yield put(updateConnectionState(ConnectionState.DISCONNECTED));
    }
  }
}

function* testData() {
  const testChannel = yield eventChannel((emit) => {
    const test_id = setInterval(() => {
      emit(updateResistance(Math.floor(Math.random() * 10)));
    }, 1000);
    return () => {
      clearInterval(test_id);
    };
  }, buffers.expanding(1));

  let timer = 0;
  let distance = 0;
  let calories = 0;
  const f4_channel = yield eventChannel((emit) => {
    const test_id = setInterval(() => {
      timer += 1;
      let speed = Math.floor(Math.random() * 10);
      let rpm = Math.floor(Math.random() * 100);
      distance += Math.random();
      calories += Math.random();
      let watts = Math.random() * 250;
      emit(updateBikeTelemetry(timer, speed, rpm, distance, calories, watts));
    }, 1000);
    return () => {
      clearInterval(test_id);
    };
  }, buffers.expanding(1));

  while (true) {
    let { resistance, state_vals } = yield race({
      resistance: take(testChannel),
      state_vals: take(f4_channel),
    });

    if (resistance) {
      yield put(resistance);
    } else if (state_vals) {
      //console.log(state_vals);
      yield put(state_vals);
    }
  }
}

function* handleData(
  manager: BleManager,
  connection_chan: any
): Generator<any, any, any> {
  //yield call(testData);

  while (true) {
    let device: Device;
    while (true) {
      let connection_status = yield take(connection_chan);
      if (connection_status.status === "CONNECTED") {
        device = connection_status.device;
        break;
      }
    }

    yield race({
      task: call(fetch_data, device),
      cancel: take(connection_chan),
    });
  }
}

function* fetch_data(device: Device) {
  const f3Channel = yield eventChannel((emit) => {
    const subscription = device.monitorCharacteristicForService(
      SERVICE_UUID,
      CHARACTERISTIC_f3_UUID,
      (error, characteristic) => {
        emit({ type: "F3_DATA", error: error, characteristic: characteristic });
      }
    );
    return () => {
      subscription.remove();
    };
  }, buffers.expanding(1));

  const f4Channel = yield eventChannel((emit) => {
    const subscription = device.monitorCharacteristicForService(
      SERVICE_UUID,
      CHARACTERISTIC_f4_UUID,
      (error, characteristic) => {
        console.log(characteristic?.value);
        emit({ type: "F4_DATA", error: error, characteristic: characteristic });
      }
    );
    return () => {
      subscription.remove();
    };
  }, buffers.expanding(1));

  let opcode = 0xf0a0;
  let num_bytes = 0x01;
  let cur_int = 0x01;

  let interval_id = null;

  try {
    yield setup_channel(device, SERVICE_UUID).then(() => {
      interval_id = setInterval(() => {
        console.log("sending update req");
        let operation = Buffer.from([0xf0, 0xa0, num_bytes, cur_int % 256]);
        let val_arr = operation.values();
        let checksum = calculate_checksum(val_arr);
        let out_buf = Buffer.concat([operation, Buffer.from([checksum])]);

        let out_str = out_buf.toString("base64");
        console.log("f2: " + out_buf.toString("hex"));

        device.writeCharacteristicWithoutResponseForService(
          SERVICE_UUID,
          CHARACTERISTIC_f2_UUID,
          out_str
        );
        cur_int += 1;
      }, 1000);
    });

    while (true) {
      // Take action
      const { f3_event, f4_event } = yield race({
        f3_event: take(f3Channel),
        f4_event: take(f4Channel),
      });

      if (f3_event) {
        // Nothing to do for f3 events
      } else if (f4_event) {
        let data = f4_event.characteristic;

        let value = Buffer.from(data.value, "base64").toString("hex");
        let bikeStatus = yield select(getBikeStatus);
        console.log("Bike status: " + bikeStatus);

        let response = parse_f4(value, bikeStatus);
        if (response) {
          yield put(response);
        }
      }
    }
  } catch (error) {
    console.log(error);
  } finally {
    if (interval_id) {
      clearInterval(interval_id);
    }
  }
}
