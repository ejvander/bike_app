import React, { useEffect } from "react";
import { Text, View, Button, StyleSheet } from "react-native";
import { State } from "react-native-ble-plx";
import { ScrollView } from "react-native-gesture-handler";
import { connect as reduxConnect } from "react-redux";
import {
  chooseAccount,
  Account,
  fetchAccounts,
  ReduxState,
  fetchSessions,
  Session,
} from "../Reducer";

type Props = {
  navigation: any;
  sessions: Array<Session>;
  account: Account;
  fetchSessions: typeof fetchSessions;
};

const DataRow = ({ title, value }) => {
  return (
    <View style={styles.container_rows}>
      <View
        style={{
          width: "60%",
          flexDirection: "column",
          paddingTop: 5,
        }}
      >
        <Text style={styles.labelStyle} numberOfLines={1}>
          {title}
        </Text>
      </View>
      <View
        style={{
          width: "40%",
          flexDirection: "column",
          paddingTop: 5,
        }}
      >
        <Text style={styles.valueStyle} numberOfLines={1}>
          {value}
        </Text>
      </View>
    </View>
  );
};

function formatTime(time_in_seconds: number): string {
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

const PriorRidesScreen = (props: Props) => {
  useEffect(() => {
    if (props.account === null) {
      props.navigation.popToTop();
    }
    props.fetchSessions(props.account.id);
  }, []);
  return (
    <ScrollView>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        {props.sessions.map((session: Session) => {
          return (
            <View
              key={session.id}
              style={{
                flexDirection: "column",
                width: "80%",
                backgroundColor: "#2196F3",
                marginTop: 5,
                paddingLeft: 5,
                paddingRight: 5,
                paddingBottom: 5,
              }}
              onTouchEnd={() => {
                props.navigation.navigate("ViewSession", { id: session.id });
              }}
            >
              <View style={{ flexDirection: "row" }}>
                <View style={{ width: "50%", flexDirection: "row" }}>
                  <Text style={styles.labelStyle} numberOfLines={1}>
                    {session.timestamp}
                  </Text>
                </View>
                <View style={{ width: "50%", flexDirection: "row" }}>
                  <DataRow title={"Distance"} value={session.distance} />
                </View>
              </View>
              <View style={{ flexDirection: "row" }}>
                <View style={{ width: "50%", flexDirection: "row" }}>
                  <DataRow title={"Calories"} value={session.calories} />
                </View>
                <View style={{ width: "50%", flexDirection: "row" }}>
                  <DataRow
                    title={"Time"}
                    value={formatTime(session.ride_time)}
                  />
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container_rows: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-start", // if you want to fill rows left to right
  },
  labelStyle: {
    color: "black",
    fontSize: 15,
  },
  valueStyle: {
    color: "#333333",
    fontSize: 15,
  },
});

export default reduxConnect(
  (state: ReduxState): any => ({
    sessions: state.sessions,
    account: state.account,
  }),
  { fetchSessions }
)(PriorRidesScreen);
