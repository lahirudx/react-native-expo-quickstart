import * as React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { StatusBar, Platform } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import JoinScreen from "./screens/JoinScreen";
import RoomScreen from "./screens/RoomScreen";

const Stack = createStackNavigator();

export default function App() {
  React.useEffect(() => {
    if (Platform.OS === "android") {
      // Hide navigation bar and make it transparent
      StatusBar.setTranslucent(true);
      StatusBar.setBackgroundColor("transparent");
    }
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar
          barStyle="light-content"
          backgroundColor="transparent"
          translucent
        />
        <Stack.Navigator
          initialRouteName="Join"
          screenOptions={{
            headerShown: false,
            presentation: "modal",
            animationEnabled: true,
            gestureEnabled: true,
            cardStyle: {
              backgroundColor: "#1a1a1a",
            },
          }}
        >
          <Stack.Screen name="Join" component={JoinScreen} />
          <Stack.Screen name="Room" component={RoomScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
