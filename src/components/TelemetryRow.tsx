import React from "react";
import { View, Text, StyleSheet } from "react-native";

type TelemetryRowProps = {
  label: string;
  value: any;
};

const TelemetryRow = (props: TelemetryRowProps) => {
  return (
    <View style={styles.container_rows}>
      <View style={{ width: "60%", flexDirection: "column", paddingTop: 5 }}>
        <Text style={styles.labelStyle} numberOfLines={1}>
          {props.label}
        </Text>
      </View>
      <View style={{ width: "40%", flexDirection: "column", paddingTop: 5 }}>
        <Text style={styles.valueStyle} numberOfLines={1}>
          {props.value}
        </Text>
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
  labelStyle: {
    color: "black",
    fontSize: 20,
  },
  valueStyle: {
    color: "#333333",
    fontSize: 15,
  },
});

export default TelemetryRow;
