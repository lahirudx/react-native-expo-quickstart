import React, { useEffect } from "react";
import { Stack } from "expo-router";
import { Platform, StatusBar } from "react-native";

export default function RootLayout() {
  useEffect(() => {
    if (Platform.OS === "android") {
      StatusBar.setTranslucent(true);
      StatusBar.setBackgroundColor("transparent");
    }
  }, []);

  return (
    <>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "none",
          gestureEnabled: true,
        }}
      />
    </>
  );
}
