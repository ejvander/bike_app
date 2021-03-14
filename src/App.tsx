import * as React from "react";

import { Provider } from "react-redux";
import { store } from "./Store";
import SensorTag from "./components/SensorTag";
import { Text, View, Button } from "react-native";
import HomeScreen from "./components/HomeScreen";
import ChooseAccountScreen from "./components/ChooseAccountScreen";
import PriorRidesScreen from "./components/PriorRidesScreen";

import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import ViewSessionScreen from "./components/ViewSessionScreen";

const Stack = createStackNavigator();

function createHomeScreen({ navigation }) {
  return <HomeScreen navigation={navigation} />;
}

function createChooseAccountScreen({ navigation }) {
  return <ChooseAccountScreen navigation={navigation} />;
}

function createTelemetryScreen() {
  return <SensorTag />;
}

function createPriorRidesScreen({ navigation }) {
  return <PriorRidesScreen navigation={navigation} />;
}

function createViewSessionScreen({ navigation, route }) {
  const { id } = route.params;
  console.log(id);
  return <ViewSessionScreen navigation={navigation} id={id} />;
}

export default function App() {
  return (
    <Provider store={store}>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Home">
          <Stack.Screen
            options={{ title: "Home" }}
            name="Home"
            component={createHomeScreen}
          />
          <Stack.Screen
            options={{ title: "Ride!" }}
            name="Telemetry"
            component={createTelemetryScreen}
          />
          <Stack.Screen
            options={{ title: "Choose Account" }}
            name="ChooseAccount"
            component={createChooseAccountScreen}
          />
          <Stack.Screen
            options={{ title: "Prior Rides" }}
            name="PriorRides"
            component={createPriorRidesScreen}
          />
          <Stack.Screen
            options={{ title: "Session" }}
            name="ViewSession"
            component={createViewSessionScreen}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </Provider>
  );
}
