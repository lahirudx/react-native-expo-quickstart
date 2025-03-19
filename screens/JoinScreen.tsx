import React, { useState } from "react";
import { View, TextInput, Button, StyleSheet, Alert } from "react-native";

export default function JoinScreen({ navigation }: any) {
  const [username, setUsername] = useState("");
  const [room, setRoom] = useState("");

  const handleJoin = async () => {
    if (!username || !room) {
      Alert.alert("Error", "Please enter both username and room.");
      return;
    }

    try {
      const response = await fetch("http://<YOUR_NODE_SERVER>/get-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, room }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch token");
      }

      const { token } = await response.json();
      navigation.navigate("Room", { token, room });
    } catch (error) {
      Alert.alert("Error", error.message);
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
