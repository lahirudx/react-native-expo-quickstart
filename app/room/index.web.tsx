import React, { useState, useEffect } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  LiveKitRoom,
  ParticipantTile,
  RoomAudioRenderer,
  useTracks,
  useLocalParticipant,
  useParticipants,
  VideoTrack,
  useRoomContext,
} from "@livekit/components-react";
import { Track, ConnectionQuality, Room } from "livekit-client";
import "@livekit/components-styles";
import { View } from "react-native";

const RoomView = ({ token }: { token: string }) => {
  const router = useRouter();
  const [showParticipants, setShowParticipants] = useState(false);
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { updateOnlyOn: [] }
  );
  const { localParticipant } = useLocalParticipant();
  const participants = useParticipants();
  const room = useRoomContext();
  const [connectionQuality, setConnectionQuality] = useState<ConnectionQuality>(
    ConnectionQuality.Unknown
  );

  useEffect(() => {
    if (!localParticipant) return;

    const updateQuality = () => {
      setConnectionQuality(localParticipant.connectionQuality);
    };

    localParticipant.on("connectionQualityChanged", updateQuality);
    updateQuality();

    return () => {
      localParticipant.off("connectionQualityChanged", updateQuality);
    };
  }, [localParticipant]);

  const getQualityColor = (quality: ConnectionQuality) => {
    switch (quality) {
      case ConnectionQuality.Excellent:
        return "rgba(76, 175, 80, 0.8)";
      case ConnectionQuality.Good:
        return "rgba(139, 195, 74, 0.8)";
      case ConnectionQuality.Poor:
        return "rgba(255, 193, 7, 0.8)";
      case ConnectionQuality.Lost:
        return "rgba(244, 67, 54, 0.8)";
      default:
        return "rgba(158, 158, 158, 0.5)";
    }
  };

  const handleHangup = async () => {
    if (!room || !localParticipant) return;
    try {
      // Disable camera and mic first
      await localParticipant.setCameraEnabled(false);
      await localParticipant.setMicrophoneEnabled(false);

      // Then disconnect from room
      room.disconnect();
      router.push("/");
    } catch (error) {
      console.error("Error during hangup:", error);
      // Still try to navigate back even if error
      router.push("/");
    }
  };

  return (
    <div className="room-container">
      <div className="video-grid">
        {tracks.map((track, index) => (
          <div key={index} className="video-tile">
            <ParticipantTile
              trackRef={track}
              disableSpeakingIndicator
              className="participant-tile"
            />
          </div>
        ))}
      </div>

      {showParticipants && (
        <div className="participants-panel">
          <h3>Participants</h3>
          {participants.map((participant) => (
            <div key={participant.identity} className="participant-item">
              <span>{participant.identity}</span>
              <div
                className="quality-indicator"
                style={{
                  backgroundColor: getQualityColor(
                    participant.connectionQuality
                  ),
                }}
              />
            </div>
          ))}
        </div>
      )}

      <div className="controls-container">
        <button
          className="control-button"
          onClick={() =>
            localParticipant?.setMicrophoneEnabled(
              !localParticipant.isMicrophoneEnabled
            )
          }
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {localParticipant?.isMicrophoneEnabled ? (
              <path
                d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z"
                fill="white"
              />
            ) : (
              <path
                d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z"
                fill="white"
              />
            )}
          </svg>
        </button>

        <button
          className="control-button"
          onClick={() =>
            localParticipant?.setCameraEnabled(
              !localParticipant.isCameraEnabled
            )
          }
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {localParticipant?.isCameraEnabled ? (
              <path
                d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"
                fill="white"
              />
            ) : (
              <path
                d="M21 6.5l-4 4V7c0-.55-.45-1-1-1H9.82L21 17.18V6.5zM3.27 2L2 3.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 3.27 2z"
                fill="white"
              />
            )}
          </svg>
        </button>

        <button
          className="control-button"
          onClick={() =>
            localParticipant?.setScreenShareEnabled(
              !localParticipant.isScreenShareEnabled
            )
          }
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M20 18c1.1 0 1.99-.9 1.99-2L22 6c0-1.11-.9-2-2-2H4c-1.11 0-2 .89-2 2v10c0 1.1.89 2 2 2H0v2h24v-2h-4zM4 16V6h16v10.01L4 16z"
              fill="white"
            />
          </svg>
        </button>

        <button
          className="control-button"
          onClick={() => setShowParticipants(!showParticipants)}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M16.5 12C17.88 12 18.99 10.88 18.99 9.5C18.99 8.12 17.88 7 16.5 7C15.12 7 14 8.12 14 9.5C14 10.88 15.12 12 16.5 12ZM9 11C10.66 11 11.99 9.66 11.99 8C11.99 6.34 10.66 5 9 5C7.34 5 6 6.34 6 8C6 9.66 7.34 11 9 11ZM16.5 14C14.67 14 11 14.92 11 16.75V19H22V16.75C22 14.92 18.33 14 16.5 14ZM9 13C6.67 13 2 14.17 2 16.5V19H9V16.75C9 15.9 9.33 14.41 11.37 13.28C10.5 13.1 9.66 13 9 13Z"
              fill="white"
            />
          </svg>
        </button>

        <button className="control-button leave-button" onClick={handleHangup}>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08c-.18-.17-.29-.42-.29-.7 0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28-.79-.74-1.68-1.36-2.66-1.85-.33-.16-.56-.5-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z"
              fill="white"
            />
          </svg>
        </button>
      </div>
      <RoomAudioRenderer />
    </div>
  );
};

export default function RoomScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const token = typeof params.token === "string" ? params.token : "";

  if (!token) {
    router.push("/");
    return null;
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#1a1a1a" }}>
      <LiveKitRoom
        serverUrl="wss://rn-meet-impecxbf.livekit.cloud"
        token={token}
        connect={true}
        audio={true}
        video={true}
        onDisconnected={() => router.push("/")}
      >
        <RoomView token={token} />
      </LiveKitRoom>
    </View>
  );
}

// Update the CSS
const style = document.createElement("style");
style.textContent = `
  .room-container {
    height: 100vh;
    display: flex;
    flex-direction: column;
    background: #1a1a1a;
    position: relative;
    overflow: hidden;
  }

  .video-grid {
    flex: 1;
    padding: 1rem;
    display: grid;
    gap: 1rem;
    align-items: center;
    justify-content: center;
    margin: 0 auto;
    width: 100%;
    max-width: 1200px;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    grid-auto-rows: 1fr;
  }

  .video-tile {
    position: relative;
    width: 100%;
    height: 100%;
    aspect-ratio: 16/9;
    background: #333;
    border-radius: 8px;
    overflow: hidden;
  }

  @media (max-width: 768px) {
    .video-grid {
      padding: 0.5rem;
      gap: 0.5rem;
      grid-template-columns: 1fr;
    }
  }

  @media (min-width: 769px) and (max-width: 1200px) {
    .video-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (min-width: 1201px) {
    .video-grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  /* For 1 participant */
  .video-grid:has(.video-tile:only-child) {
    grid-template-columns: minmax(auto, 800px);
  }

  /* For 2 participants */
  .video-grid:has(.video-tile:nth-child(2):last-child) {
    grid-template-columns: repeat(2, 1fr);
  }

  /* For 3-4 participants */
  .video-grid:has(.video-tile:nth-child(n+3):nth-child(-n+4):last-child) {
    grid-template-columns: repeat(2, 1fr);
  }

  /* For 5-6 participants */
  .video-grid:has(.video-tile:nth-child(n+5):nth-child(-n+6):last-child) {
    grid-template-columns: repeat(3, 1fr);
  }

  /* For 7+ participants */
  .video-grid:has(.video-tile:nth-child(7)) {
    grid-template-columns: repeat(3, 1fr);
  }

  .participants-panel {
    position: absolute;
    right: 1rem;
    top: 1rem;
    background: rgba(0, 0, 0, 0.8);
    border-radius: 12px;
    padding: 1rem;
    width: 250px;
    color: white;
  }

  .participant-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    margin: 0.5rem 0;
  }

  .quality-indicator {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }

  .controls-container {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 20px;
    background: rgba(0, 0, 0, 0.95);
    gap: 20px;
    border-top-left-radius: 20px;
    border-top-right-radius: 20px;
    backdrop-filter: blur(10px);
  }

  .control-button {
    width: 56px;
    height: 56px;
    background-color: #666666;
    color: white;
    border: none;
    border-radius: 28px;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
  }

  .control-button:hover {
    background-color: #777777;
    transform: scale(1.05);
  }

  .control-button:active {
    background-color: #888888;
    transform: scale(0.95);
  }

  .leave-button {
    background-color: #FF3B30;
  }

  .leave-button:hover {
    background-color: #FF524A;
  }

  .leave-button:active {
    background-color: #E6352A;
  }

  .participant-tile {
    width: 100% !important;
    height: 100% !important;
    aspect-ratio: 16/9;
  }
`;
document.head.appendChild(style);
