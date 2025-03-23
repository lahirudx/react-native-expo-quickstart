import React, { useState, useEffect } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Platform,
} from "react-native";
import axios from "axios";
import { useRouter } from "expo-router";

interface Room {
  roomId: string;
  displayName: string;
  participantCount: number;
}

const serverUrl = "http://192.168.1.17:3000";
const wsUrl = "ws://192.168.1.17:3000";

export default function JoinScreen() {
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string>("");
  const [ws, setWs] = useState<WebSocket | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Initialize WebSocket connection
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log("WebSocket Connected");
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "rooms") {
        setRooms(data.rooms);
      }
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    socket.onclose = () => {
      console.log("WebSocket disconnected");
    };

    setWs(socket);

    // Cleanup on unmount
    return () => {
      socket.close();
    };
  }, []);

  const handleJoin = async () => {
    if (!username) {
      Alert.alert("Error", "Please enter your username.");
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
        data: {
          username,
          room: selectedRoom,
          isHost: !selectedRoom, // If no room selected, user becomes host
        },
        timeout: 10000,
      });

      const { token, room, displayName } = response.data;
      router.push({
        pathname: "/room",
        params: {
          token: token,
          room: room,
          displayName: displayName,
        },
      });
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
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>LiveKit Video Chat</Text>
        <Text style={styles.subtitle}>Join a room to start chatting</Text>
      </View>
      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <input
            style={webStyles.input}
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoCorrect="off"
          />
        </View>

        {rooms.length > 0 && (
          <View style={styles.inputContainer}>
            <select
              value={selectedRoom}
              onChange={(e) => setSelectedRoom(e.target.value)}
              style={webStyles.select}
            >
              <option value="">Start your own stream</option>
              {rooms.map((room) => (
                <option key={room.roomId} value={room.roomId}>
                  {`${room.displayName} (${room.participantCount} ${
                    room.participantCount === 1 ? "viewer" : "viewers"
                  })`}
                </option>
              ))}
            </select>
          </View>
        )}

        <TouchableOpacity
          style={[styles.joinButton, isLoading && styles.joinButtonDisabled]}
          onPress={handleJoin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.joinButtonText}>
              {selectedRoom ? "Join Stream" : "Start Stream"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
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
    width: "100%",
    maxWidth: 400,
  },
  inputContainer: {
    backgroundColor: "#333",
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
  },
  joinButton: {
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
  joinButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});

// Web-specific styles
const webStyles = {
  input: {
    height: "50px",
    color: "white",
    fontSize: "16px",
    padding: "0 16px",
    width: "100%",
    outline: "none",
    border: "none",
    backgroundColor: "transparent",
    boxSizing: "border-box" as const,
  },
  select: {
    height: "50px",
    color: "white",
    fontSize: "16px",
    padding: "0 16px",
    width: "100%",
    outline: "none",
    border: "none",
    backgroundColor: "transparent",
    cursor: "pointer",
    boxSizing: "border-box" as const,
  },
} as const;
