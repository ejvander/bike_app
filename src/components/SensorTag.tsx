// @flow

import * as React from "react";
import { connect as reduxConnect } from "react-redux";
import {
  StyleSheet,
  Text,
  SafeAreaView,
  View,
  FlatList,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import {
  ReduxState,
  clearLogs,
  connect,
  disconnect,
  ConnectionState,
  BikeStatus,
  saveRide,
  Account,
} from "../Reducer";
import { Device } from "react-native-ble-plx";

import { LineChart } from "react-native-charts-wrapper";
import TelemetryRow from "./TelemetryRow";
import Telemetry from "./Telemetry";

const Button = function (props: ButtonProps) {
  const { onPress, title, ...restProps } = props;
  return (
    <TouchableOpacity onPress={onPress} {...restProps}>
      <Text
        style={[
          styles.buttonStyle,
          restProps.disabled ? styles.disabledButtonStyle : null,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
};

type ButtonProps = {
  onPress: () => void;
  title: string;
  disabled: boolean;
  style: any;
};

type Props = {
  sensorTag: Device | null | undefined;
  connectionState: keyof typeof ConnectionState;
  logs: Array<string>;
  clearLogs: typeof clearLogs;
  connect: typeof connect;
  disconnect: typeof disconnect;
  saveRide: typeof saveRide;
  devices: Map<string, Device>;
  bikeTelemetry: Array<BikeStatus>;
  account: Account;
};

type State = {
  showModal: boolean;
};

class SensorTag extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      showModal: false,
    };
  }

  sensorTagStatus(): string {
    switch (this.props.connectionState) {
      case ConnectionState.CONNECTING:
        return "Connecting...";
      case ConnectionState.DISCOVERING:
        return "Discovering...";
      case ConnectionState.CONNECTED:
        return "Connected";
      case ConnectionState.DISCONNECTED:
      case ConnectionState.DISCONNECTING:
        if (this.props.sensorTag) {
          return "Found " + this.props.sensorTag.name;
        }
    }

    return "Searching...";
  }

  isSensorTagReadyToConnect(): boolean {
    return (
      this.props.sensorTag != null &&
      this.props.connectionState === ConnectionState.DISCONNECTED
    );
  }

  isSensorTagReadyToDisconnect(): boolean {
    return this.props.connectionState === ConnectionState.CONNECTED;
  }

  renderHeader() {
    return (
      <View style={{ padding: 10 }}>
        <Text style={styles.textStyle} numberOfLines={1}>
          {this.sensorTagStatus()}
        </Text>
        <View style={{ flexDirection: "row", paddingTop: 5 }}>
          <Button
            disabled={!this.isSensorTagReadyToConnect()}
            style={{ flex: 1 }}
            onPress={() => {
              if (this.props.sensorTag != null) {
                this.props.connect(this.props.sensorTag);
              }
            }}
            title={"Connect"}
          />
          <View style={{ width: 5 }} />
          <Button
            disabled={!this.isSensorTagReadyToDisconnect()}
            style={{ flex: 1 }}
            onPress={() => {
              this.props.disconnect();
            }}
            title={"Disconnect"}
          />
          <View style={{ width: 5 }} />
          <Button
            disabled={/*!this.isSensorTagReadyToDisconnect()*/ false}
            style={{ flex: 1 }}
            onPress={() => {
              this.props.saveRide(
                this.props.bikeTelemetry,
                this.props.account.id
              );
            }}
            title={"Save Ride"}
          />
        </View>
      </View>
    );
  }

  formatTime(time_in_seconds: number): string {
    let seconds = time_in_seconds % 60;
    let minutes = Math.floor(time_in_seconds / 60) % 60;
    let hours = Math.floor(time_in_seconds / 3600);

    let seconds_str = "00";
    let minutes_str = "00";
    let hours_str = hours.toString();

    if (seconds < 10) {
      seconds_str = "0" + seconds.toString();
    } else {
      seconds_str = seconds.toString();
    }

    if (minutes < 10) {
      minutes_str = "0" + minutes.toString();
    } else {
      minutes_str = minutes.toString();
    }

    return hours_str + ":" + minutes_str + ":" + seconds_str;
  }

  renderTelemetry() {
    return <Telemetry bikeTelemetry={this.props.bikeTelemetry} />;
  }

  renderLogs() {
    return (
      <View style={{ flex: 0.25, padding: 10, paddingTop: 0 }}>
        <FlatList
          style={{ flex: 1 }}
          data={this.props.logs}
          renderItem={({ item }) => (
            <Text style={styles.logTextStyle}> {item} </Text>
          )}
          keyExtractor={(item, index) => index.toString()}
        />
        <Button
          style={{ paddingTop: 10 }}
          onPress={() => {
            this.props.clearLogs();
          }}
          title={"Clear logs"}
          disabled={false}
        />
      </View>
    );
  }

  render() {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#15127e" />
        {this.renderHeader()}
        {this.renderTelemetry()}
        {/*this.renderLogs()*/}
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 5,
  },
  container_rows: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-start", // if you want to fill rows left to right
  },
  textStyle: {
    color: "#000000",
    fontSize: 20,
  },
  logTextStyle: {
    color: "white",
    fontSize: 9,
  },
  buttonStyle: {
    borderWidth: 1,
    borderRadius: 5,
    padding: 5,
    backgroundColor: "#15127e",
    color: "white",
    textAlign: "center",
    fontSize: 20,
  },
  disabledButtonStyle: {
    backgroundColor: "#15142d",
    color: "#919191",
  },
});

export default reduxConnect(
  (state: ReduxState): any => ({
    logs: state.logs,
    sensorTag: state.activeSensorTag,
    connectionState: state.connectionState,
    devices: state.devices,
    bikeTelemetry: state.bikeTelemetry,
    account: state.account,
  }),
  {
    clearLogs,
    connect,
    disconnect,
    saveRide,
  }
)(SensorTag);
