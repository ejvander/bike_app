import React, { useEffect } from "react";
import { Text, View, Button } from "react-native";
import { State } from "react-native-ble-plx";
import { connect as reduxConnect } from "react-redux";
import { chooseAccount, Account, fetchAccounts, ReduxState } from "../Reducer";

type Props = {
  navigation: any;
  chooseAccount: typeof chooseAccount;
  fetchAccounts: typeof fetchAccounts;
  fetchedAccounts: Array<Account>;
};

const Accounts: Array<Account> = [
  {
    name: "Devan",
    id: 1,
  },
  { name: "Eric", id: 2 },
];

const ChooseAccountScreen = (props: Props) => {
  useEffect(() => {
    // write your code here, it's like componentWillMount
    if (props.fetchedAccounts.length === 0) {
      props.fetchAccounts();
    }
  }, []);
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <View style={{ flexDirection: "column" }}>
        {props.fetchedAccounts.map((account) => {
          return (
            <View key={account.id} style={{ paddingTop: 5 }}>
              <Button
                title={account.name}
                onPress={() => {
                  props.chooseAccount(account);
                  props.navigation.popToTop();
                }}
              />
            </View>
          );
        })}
      </View>
    </View>
  );
};

export default reduxConnect(
  (state: ReduxState) => ({
    fetchedAccounts: state.fetchedAccounts,
  }),
  {
    chooseAccount,
    fetchAccounts,
  }
)(ChooseAccountScreen);
