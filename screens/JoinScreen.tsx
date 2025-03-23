import React, { useState } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";

export default function JoinScreen({ navigation }: any) {
  const [username, setUsername] = useState("");
  const [room, setRoom] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const serverUrl = "http://3.133.109.97:3000";

  const handleJoin = async () => {
    if (!username || !room) {
      Alert.alert("Error", "Please enter both username and room.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios({
        method: "POST",
        url: `${serverUrl}/get-token`,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        data: { username, room },
        timeout: 10000,
      });

      const { token } = response.data;
      navigation.navigate("Room", { token, room });
    } catch (error: any) {
      console.error("Connection error:", error);
      Alert.alert(
        "Error",
        error.response?.data?.message ||
          "Unable to connect to the server. Please try again later."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Ionicons name="videocam" size={64} color="#007AFF" />
          <Text style={styles.title}>LiveKit Video Chat</Text>
          <Text style={styles.subtitle}>Join a room to start chatting</Text>
        </View>
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Ionicons
              name="person"
              size={24}
              color="#666"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Enter your username"
              value={username}
              onChangeText={setUsername}
              autoCorrect={false}
              placeholderTextColor="#666"
            />
          </View>
          <View style={styles.inputContainer}>
            <Ionicons
              name="people"
              size={24}
              color="#666"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Enter room name"
              value={room}
              onChangeText={setRoom}
              autoCapitalize="none"
              autoCorrect={false}
              placeholderTextColor="#666"
            />
          </View>
          <TouchableOpacity
            style={[styles.joinButton, isLoading && styles.joinButtonDisabled]}
            onPress={handleJoin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons
                  name="videocam"
                  size={24}
                  color="white"
                  style={styles.buttonIcon}
                />
                <Text style={styles.joinButtonText}>Join Room</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
  },
  header: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginTop: 8,
  },
  form: {
    flex: 1,
    justifyContent: "center",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#333",
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 50,
    color: "white",
    fontSize: 16,
  },
  joinButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#007AFF",
    borderRadius: 12,
    height: 50,
    marginTop: 8,
  },
  joinButtonDisabled: {
    opacity: 0.7,
  },
  buttonIcon: {
    marginRight: 8,
  },
  joinButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
