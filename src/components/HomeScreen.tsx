import * as React from "react";
import { Text, View, Button } from "react-native";

import { connect as reduxConnect } from "react-redux";
import { ReduxState } from "../Reducer";

type HomeScreenProps = {
  navigation: any;
  account: Account | null;
};

const HomeScreen = (props: HomeScreenProps) => {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ fontSize: 30 }}>
        Hi {props.account?.name ?? "please choose an account"}
      </Text>
      <View style={{ flexDirection: "column" }}>
        <View style={{ paddingTop: 5 }}>
          <Button
            title="Choose an Account"
            onPress={() => props.navigation.navigate("ChooseAccount")}
          />
        </View>
        <View style={{ paddingTop: 5 }}>
          <Button
            disabled={props.account === null}
            title="Ride!"
            onPress={() => props.navigation.navigate("Telemetry")}
          />
        </View>
        <View style={{ paddingTop: 5 }}>
          <Button
            disabled={props.account === null}
            title="Prior Rides"
            onPress={() => props.navigation.navigate("PriorRides")}
          />
        </View>
      </View>
    </View>
  );
};

export default reduxConnect(
  (state: ReduxState): any => ({
    account: state.account,
  }),
  null
)(HomeScreen);
