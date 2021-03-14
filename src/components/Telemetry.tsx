import * as React from "react";
import { Text, View, Button, StyleSheet, processColor } from "react-native";
import { LineChart } from "react-native-charts-wrapper";

import { connect as reduxConnect } from "react-redux";
import { BikeStatus, ReduxState } from "../Reducer";
import TelemetryRow from "./TelemetryRow";

type TelemetryProps = {
  bikeTelemetry: Array<BikeStatus>;
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

const Telemetry = (props: TelemetryProps) => {
  let calories = props.bikeTelemetry
    .map((bikeStatus) => {
      return { y: bikeStatus.calories, x: bikeStatus.timer };
    })
    .reverse();
  let resistance = props.bikeTelemetry
    .map((bikeStatus) => {
      return { y: bikeStatus.resistance, x: bikeStatus.timer };
    })
    .reverse();
  let watts = props.bikeTelemetry
    .map((bikeStatus) => {
      return { y: bikeStatus.watts, x: bikeStatus.timer };
    })
    .reverse();
  let speed = props.bikeTelemetry
    .map((bikeStatus) => {
      return { y: bikeStatus.speed, x: bikeStatus.timer };
    })
    .reverse();
  console.log(props.bikeTelemetry[0]);
  return (
    <View style={{ flexDirection: "column", paddingTop: 5, flex: 1 }}>
      <View style={styles.container_rows}>
        <View style={{ width: "50%", flexDirection: "column", paddingTop: 5 }}>
          <TelemetryRow
            label="Timer:"
            value={formatTime(props.bikeTelemetry[0].timer)}
          />
          <TelemetryRow
            label="Speed:"
            value={Math.round(props.bikeTelemetry[0].speed * 10) / 10 + " mph"}
          />
          <TelemetryRow
            label="Distance:"
            value={
              Math.round(props.bikeTelemetry[0].distance * 10) / 10 + " mi"
            }
          />
        </View>
        <View style={{ width: "50%", flexDirection: "column", paddingTop: 5 }}>
          <TelemetryRow
            label="Resistance:"
            value={props.bikeTelemetry[0].resistance}
          />
          <TelemetryRow
            label="Watts:"
            value={Math.floor(props.bikeTelemetry[0].watts)}
          />
          <TelemetryRow
            label="Calories:"
            value={Math.floor(props.bikeTelemetry[0].calories)}
          />
          <TelemetryRow label="RPM:" value={props.bikeTelemetry[0].rpm} />
        </View>
      </View>
      <View style={{ flex: 1 }}>
        <LineChart
          style={{ flex: 1 }}
          data={{
            dataSets: [
              {
                label: "Speed",
                values: speed,
                config: {
                  drawCircles: false,
                  drawValues: false,
                  axisDependency: "LEFT",
                  color: processColor("#ff0000"),
                },
              },
              {
                label: "Watts",
                values: watts,
                config: {
                  drawCircles: false,
                  axisDependency: "LEFT",
                  drawValues: false,
                  color: processColor("#000000"),
                },
              },
              {
                label: "Resistance",
                values: resistance,
                config: {
                  drawCircles: false,
                  axisDependency: "RIGHT",
                  drawValues: false,
                  color: processColor("#00ff00"),
                },
              },
            ],
          }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container_rows: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-start", // if you want to fill rows left to right
  },
});

export default Telemetry;
