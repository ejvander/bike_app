import React, { useEffect } from "react";
import { Text, View, Button, StyleSheet } from "react-native";
import { State } from "react-native-ble-plx";
import { connect as reduxConnect } from "react-redux";
import {
  chooseAccount,
  Account,
  fetchAccounts,
  ReduxState,
  fetchSessions,
  Session,
  BikeStatus,
  fetchSession,
} from "../Reducer";
import Telemetry from "./Telemetry";

type Props = {
  navigation: any;
  id: number;
  fetchSession: typeof fetchSession;
  session_data: Array<BikeStatus>;
};

const ViewSessionScreen = (props: Props) => {
  useEffect(() => {
    console.log("view session");
    props.fetchSession(props.id);
  }, []);
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      {props.session_data.length != 0 ? (
        <Telemetry bikeTelemetry={props.session_data} />
      ) : (
        <Text>Loading</Text>
      )}
    </View>
  );
};

export default reduxConnect(
  (state: ReduxState): any => ({
    session_data: state.session_data,
    account: state.account,
  }),
  { fetchSession }
)(ViewSessionScreen);
