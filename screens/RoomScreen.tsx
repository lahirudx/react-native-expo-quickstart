import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  FlatList,
  ListRenderItem,
  TouchableOpacity,
  Text,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import {
  AudioSession,
  LiveKitRoom,
  useTracks,
  TrackReferenceOrPlaceholder,
  VideoTrack,
  isTrackReference,
  registerGlobals,
  useLocalParticipant,
  useLiveKitRoom,
  useParticipants,
} from "@livekit/react-native";
import {
  Track,
  ConnectionQuality,
  RemoteParticipant,
  LocalParticipant,
  Room,
} from "livekit-client";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

registerGlobals();

export default function RoomScreen({ route, navigation }: any) {
  const { token, room } = route.params;
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let start = async () => {
      await AudioSession.startAudioSession();
    };

    start();
    return () => {
      AudioSession.stopAudioSession();
    };
  }, []);

  return (
    <LiveKitRoom
      serverUrl="wss://rn-meet-impecxbf.livekit.cloud"
      token={token}
      connect={true}
      options={{
        adaptiveStream: { pixelDensity: "screen" },
      }}
      audio={true}
      video={true}
      // @ts-ignore - type definitions seem incorrect
      onConnected={() => setIsConnected(true)}
    >
      <RoomView navigation={navigation} roomName={room} />
    </LiveKitRoom>
  );
}

const RoomView = ({ navigation, roomName }: any) => {
  const insets = useSafeAreaInsets();
  // Get all camera tracks
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { updateOnlyOn: [] }
  );
  const { localParticipant } = useLocalParticipant();
  const { room } = useLiveKitRoom(roomName);
  const participants = useParticipants();
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [isCameraEnabled, setIsCameraEnabled] = useState(true);
  const [showParticipants, setShowParticipants] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState<ConnectionQuality>(
    ConnectionQuality.Unknown
  );

  useEffect(() => {
    if (!room || !localParticipant) return;

    const updateQuality = () => {
      const quality = localParticipant.connectionQuality;
      setConnectionQuality(quality);
    };

    localParticipant.on("connectionQualityChanged", updateQuality);
    updateQuality();

    return () => {
      localParticipant.off("connectionQualityChanged", updateQuality);
    };
  }, [room, localParticipant]);

  const toggleMic = async () => {
    if (!localParticipant) return;
    try {
      await localParticipant.setMicrophoneEnabled(!isMicEnabled);
      setIsMicEnabled(!isMicEnabled);
    } catch (e) {
      console.error("Failed to toggle mic:", e);
    }
  };

  const toggleCamera = async () => {
    if (!localParticipant) return;
    try {
      await localParticipant.setCameraEnabled(!isCameraEnabled);
      setIsCameraEnabled(!isCameraEnabled);
    } catch (e) {
      console.error("Failed to toggle camera:", e);
    }
  };

  const toggleParticipantMic = async (participant: RemoteParticipant) => {
    try {
      const audioTrack = participant.getTrackPublication(
        Track.Source.Microphone
      );
      if (audioTrack) {
        await audioTrack.setEnabled(!audioTrack.isEnabled);
      }
    } catch (e) {
      console.error("Failed to toggle participant mic:", e);
    }
  };

  const toggleParticipantCamera = async (participant: RemoteParticipant) => {
    try {
      const videoTrack = participant.getTrackPublication(Track.Source.Camera);
      if (videoTrack) {
        await videoTrack.setEnabled(!videoTrack.isEnabled);
      }
    } catch (e) {
      console.error("Failed to toggle participant camera:", e);
    }
  };

  const leaveRoom = () => {
    if (!room) return;
    try {
      room.disconnect();
      navigation.navigate("Join");
    } catch (e) {
      console.error("Failed to leave room:", e);
    }
  };

  const getQualityColor = (quality: ConnectionQuality) => {
    switch (quality) {
      case ConnectionQuality.Excellent:
        return "rgba(76, 175, 80, 0.8)"; // Green with opacity
      case ConnectionQuality.Good:
        return "rgba(139, 195, 74, 0.8)"; // Light green with opacity
      case ConnectionQuality.Poor:
        return "rgba(255, 193, 7, 0.8)"; // Amber with opacity
      case ConnectionQuality.Lost:
        return "rgba(244, 67, 54, 0.8)"; // Red with opacity
      default:
        return "rgba(158, 158, 158, 0.5)"; // Gray with opacity
    }
  };

  const renderTrack: ListRenderItem<TrackReferenceOrPlaceholder> = ({
    item,
  }) => {
    if (isTrackReference(item)) {
      const participantQuality = item.participant.connectionQuality;
      return (
        <View style={styles.participantContainer}>
          <VideoTrack trackRef={item} style={styles.participantView} />
          <View style={styles.participantOverlay}>
            <View style={styles.infoContainer}>
              <View
                style={[
                  styles.qualityDot,
                  { backgroundColor: getQualityColor(participantQuality) },
                ]}
              />
              <Text style={styles.participantName}>
                {item.participant.identity}
              </Text>
            </View>
          </View>
        </View>
      );
    } else {
      return <View style={styles.participantView} />;
    }
  };

  const renderParticipant = ({
    item: participant,
  }: {
    item: LocalParticipant | RemoteParticipant;
  }) => {
    if (!(participant instanceof RemoteParticipant)) return null;

    const audioTrack = participant.getTrackPublication(Track.Source.Microphone);
    const videoTrack = participant.getTrackPublication(Track.Source.Camera);

    return (
      <View style={styles.participantListItem}>
        <Text style={styles.participantName}>{participant.identity}</Text>
        <View style={styles.participantControls}>
          <TouchableOpacity
            style={styles.participantControlButton}
            onPress={() => toggleParticipantMic(participant)}
          >
            <Ionicons
              name={audioTrack?.isEnabled ? "mic" : "mic-off"}
              size={20}
              color="white"
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.participantControlButton}
            onPress={() => toggleParticipantCamera(participant)}
          >
            <Ionicons
              name={videoTrack?.isEnabled ? "videocam" : "videocam-off"}
              size={20}
              color="white"
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (!room || !localParticipant) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <View style={[styles.videoContainer, { marginTop: insets.top }]}>
        <FlatList
          data={tracks}
          renderItem={renderTrack}
          numColumns={2}
          contentContainerStyle={[
            styles.gridContainer,
            { paddingBottom: 100 + insets.bottom },
          ]}
          columnWrapperStyle={styles.row}
        />
      </View>
      {showParticipants && (
        <View
          style={[
            styles.participantsContainer,
            { paddingBottom: insets.bottom },
          ]}
        >
          <FlatList
            data={participants}
            renderItem={renderParticipant}
            keyExtractor={(item) => item.identity}
          />
        </View>
      )}
      <View style={[styles.controlsBar, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity style={styles.controlButton} onPress={toggleMic}>
          <Ionicons
            name={isMicEnabled ? "mic" : "mic-off"}
            size={24}
            color="white"
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlButton} onPress={toggleCamera}>
          <Ionicons
            name={isCameraEnabled ? "videocam" : "videocam-off"}
            size={24}
            color="white"
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => setShowParticipants(!showParticipants)}
        >
          <Ionicons
            name={showParticipants ? "people" : "people-outline"}
            size={24}
            color="white"
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.controlButton, styles.leaveButton]}
          onPress={leaveRoom}
        >
          <Ionicons name="call" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },
  videoContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  loadingText: {
    color: "white",
    fontSize: 16,
  },
  infoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingVertical: 3,
    paddingHorizontal: 5,
    borderRadius: 5,
    alignSelf: "flex-end",
  },
  qualityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  gridContainer: {
    padding: 8,
  },
  row: {
    flex: 1,
    justifyContent: "space-between",
  },
  participantContainer: {
    width: "49%",
    aspectRatio: 3 / 4,
    margin: 4,
    backgroundColor: "#333",
    borderRadius: 8,
    overflow: "hidden",
    position: "relative",
  },
  participantView: {
    flex: 1,
    borderRadius: 8,
  },
  participantOverlay: {
    position: "absolute",
    top: 8,
    left: 8,
    right: 8,
    bottom: 8,
    justifyContent: "space-between",
  },
  participantName: {
    color: "white",
    fontSize: 12,
  },
  controlsContainer: {
    width: "100%",
    backgroundColor: "transparent",
  },
  controlsBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
    paddingVertical: 20,
    backgroundColor: "rgba(0,0,0,0.8)",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
  },
  leaveButton: {
    backgroundColor: "#FF3B30",
  },
  participantsContainer: {
    position: "absolute",
    bottom: 100,
    left: 0,
    right: 0,
    maxHeight: "50%",
    backgroundColor: "rgba(0,0,0,0.8)",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
  },
  participantListItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    backgroundColor: "#333",
    borderRadius: 8,
    marginBottom: 8,
  },
  participantControls: {
    flexDirection: "row",
  },
  participantControlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#444",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
});
