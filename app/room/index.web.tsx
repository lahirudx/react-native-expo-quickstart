import React from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  LiveKitRoom,
  VideoConference,
  GridLayout,
  ParticipantTile,
  RoomAudioRenderer,
  ControlBar,
  useTracks,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { View, StyleSheet } from "react-native";

export default function RoomScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const token = typeof params.token === "string" ? params.token : "";

  if (!token) {
    router.push("/");
    return null;
  }

  return (
    <View style={styles.container}>
      <LiveKitRoom
        serverUrl="wss://rn-meet-impecxbf.livekit.cloud"
        token={token}
        connect={true}
        audio={true}
        video={true}
        onDisconnected={() => router.push("/")}
      >
        <VideoConference />
      </LiveKitRoom>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },
});
