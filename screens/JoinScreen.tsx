import React, { useState } from "react";
import { View, TextInput, Button, StyleSheet, Alert } from "react-native";
import axios from "axios";

export default function JoinScreen({ navigation }: any) {
  const [username, setUsername] = useState("");
  const [room, setRoom] = useState("");

  const handleJoin = async () => {
    if (!username || !room) {
      Alert.alert("Error", "Please enter both username and room.");
      return;
    }

    try {
      // Show loading indicator
      Alert.alert("Connecting", "Attempting to connect to server...");

      // Use axios with timeout instead of fetch
      const response = await axios({
        method: "POST",
        url: "http://3.133.109.97:3000/get-token",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        data: { username, room },
        timeout: 10000, // 10 second timeout
      });

      // Axios automatically throws for non-2xx responses, so we don't need to check response.ok
      const { token } = response.data;
      navigation.navigate("Room", { token, room });
    } catch (error) {
      console.error("Connection error:", error);

      if (axios.isAxiosError(error)) {
        if (error.code === "ECONNABORTED") {
          Alert.alert(
            "Connection Timeout",
            "The server is not responding. Please check your internet connection and try again later."
          );
        } else if (error.message.includes("Network Error") || !error.response) {
          Alert.alert(
            "Network Error",
            "Unable to connect to the server. The server might be down or your device might not have internet access. Please try again later."
          );
        } else {
          Alert.alert(
            "Error",
            `Server error: ${error.response?.status || "Unknown"} ${
              error.message
            }\n\nPlease try again later or contact support.`
          );
        }
      } else {
        Alert.alert(
          "Error",
          `${error.message}\n\nPlease try again later or contact support.`
        );
      }
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Enter your username"
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        style={styles.input}
        placeholder="Enter room name"
        value={room}
        onChangeText={setRoom}
      />
      <Button title="Join Room" onPress={handleJoin} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 16,
  },
  input: {
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 8,
  },
});
