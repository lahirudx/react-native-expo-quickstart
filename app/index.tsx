import React, { useState, useEffect } from "react";
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
  Modal,
  Pressable,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface Room {
  roomId: string;
  displayName: string;
  participantCount: number;
}

const serverUrl = "http://192.168.1.17:3000";
const wsUrl = "ws://192.168.1.17:3000";
const USERNAME_KEY = "@livekit_username";

export default function JoinScreen() {
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string>("");
  const [tempSelectedRoom, setTempSelectedRoom] = useState<string>("");
  const [selectedRoomLabel, setSelectedRoomLabel] = useState(
    "Start your own stream"
  );
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Load saved username
    const loadUsername = async () => {
      try {
        const savedUsername = await AsyncStorage.getItem(USERNAME_KEY);
        if (savedUsername) {
          setUsername(savedUsername);
        }
      } catch (error) {
        console.error("Failed to load username:", error);
      }
    };
    loadUsername();

    // Initialize WebSocket connection
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log("WebSocket Connected");
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "rooms") {
        // Only show rooms with participants
        const activeRooms = data.rooms.filter(
          (room) => room.participantCount > 0
        );
        setRooms(activeRooms);

        // Clear selection if selected room is no longer active
        if (
          selectedRoom &&
          !activeRooms.find((room) => room.roomId === selectedRoom)
        ) {
          setSelectedRoom("");
          setSelectedRoomLabel("Start your own stream");
        }
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

    // Save username
    try {
      await AsyncStorage.setItem(USERNAME_KEY, username);
    } catch (error) {
      console.error("Failed to save username:", error);
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
        params: { token, room, displayName },
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

  const handleRoomSelect = (roomId: string) => {
    setSelectedRoom(roomId);
    if (!roomId) {
      setSelectedRoomLabel("Start your own stream");
    } else {
      const room = rooms.find((r) => r.roomId === roomId);
      if (room) {
        setSelectedRoomLabel(
          `${room.displayName} (${room.participantCount} ${
            room.participantCount === 1 ? "viewer" : "viewers"
          })`
        );
      }
    }
  };

  const handlePickerOpen = () => {
    setTempSelectedRoom(selectedRoom);
    setShowPicker(true);
  };

  const handlePickerDone = () => {
    handleRoomSelect(tempSelectedRoom);
    setShowPicker(false);
  };

  const handlePickerCancel = () => {
    setTempSelectedRoom(selectedRoom);
    setShowPicker(false);
  };

  const renderPicker = () => {
    if (Platform.OS === "ios") {
      return (
        <TouchableOpacity
          style={styles.inputContainer}
          onPress={handlePickerOpen}
        >
          <Ionicons
            name="people"
            size={24}
            color="#666"
            style={styles.inputIcon}
          />
          <Text style={styles.pickerText}>{selectedRoomLabel}</Text>
          <Ionicons
            name="chevron-down"
            size={24}
            color="#666"
            style={styles.pickerIcon}
          />
        </TouchableOpacity>
      );
    }

    return (
      <View style={styles.inputContainer}>
        <Ionicons
          name="people"
          size={24}
          color="#666"
          style={styles.inputIcon}
        />
        <Picker
          selectedValue={selectedRoom}
          style={styles.picker}
          onValueChange={handleRoomSelect}
          dropdownIconColor="#666"
        >
          <Picker.Item label="Start your own stream" value="" />
          {rooms.map((room) => (
            <Picker.Item
              key={room.roomId}
              label={`${room.displayName} (${room.participantCount} ${
                room.participantCount === 1 ? "viewer" : "viewers"
              })`}
              value={room.roomId}
            />
          ))}
        </Picker>
      </View>
    );
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

          {rooms.length > 0 && renderPicker()}

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
                <Text style={styles.joinButtonText}>
                  {selectedRoom ? "Join Stream" : "Start Stream"}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {Platform.OS === "ios" && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={showPicker}
          onRequestClose={handlePickerCancel}
        >
          <Pressable style={styles.modalContainer} onPress={handlePickerCancel}>
            <Pressable style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity
                  onPress={handlePickerCancel}
                  style={styles.modalButton}
                >
                  <Text style={[styles.modalButtonText, { color: "#FF3B30" }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handlePickerDone}
                  style={styles.modalButton}
                >
                  <Text style={styles.modalButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
              <Picker
                selectedValue={tempSelectedRoom}
                onValueChange={setTempSelectedRoom}
                itemStyle={styles.modalPickerItem}
              >
                <Picker.Item
                  label="Start your own stream"
                  value=""
                  color="white"
                />
                {rooms.map((room) => (
                  <Picker.Item
                    key={room.roomId}
                    label={`${room.displayName} (${room.participantCount} ${
                      room.participantCount === 1 ? "viewer" : "viewers"
                    })`}
                    value={room.roomId}
                    color="white"
                  />
                ))}
              </Picker>
            </Pressable>
          </Pressable>
        </Modal>
      )}
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
    minHeight: Platform.OS === "ios" ? 60 : 50,
    overflow: "hidden",
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
  picker: {
    flex: 1,
    height: 50,
    color: "white",
  },
  pickerIOS: {
    marginLeft: -8,
  },
  pickerItem: {
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
  pickerText: {
    flex: 1,
    color: "white",
    fontSize: 16,
  },
  pickerIcon: {
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "#333",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#444",
  },
  modalButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  modalButtonText: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalPickerItem: {
    color: "white",
    fontSize: 20,
  },
});
