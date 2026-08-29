import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, TouchableOpacity, Platform } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useWebSocketStore } from "@/store/useWebSocketStore";
import { MessageType } from "@/@types/talkie";

const ICE_SERVERS = [{ urls: "stun:stun.l.google.com:19302" }];
const isWeb = Platform.OS === "web";

const streamCleanup = (stream: any) => {
  stream?.getTracks?.().forEach((track: any) => track.stop?.());
};

const getCallMedia = async (mediaDevices: any) => {
  try {
    return await mediaDevices.getUserMedia({
      audio: true,
      video: {
        facingMode: "user",
      },
    });
  } catch (videoError) {
    console.warn("Video media failed, trying audio-only call:", videoError);
    return mediaDevices.getUserMedia({ audio: true, video: false });
  }
};

export default function ActiveCallScreen() {
  const router = useRouter();
  const { callId, otherUserId, name, role } = useLocalSearchParams<{
    callId: string;
    otherUserId: string;
    name: string;
    role: "caller" | "callee";
  }>();

  const sendCallEnd = useWebSocketStore((s) => s.sendCallEnd);
  const sendWebRTCOffer = useWebSocketStore((s) => s.sendWebRTCOffer);
  const sendWebRTCAnswer = useWebSocketStore((s) => s.sendWebRTCAnswer);
  const sendWebRTCIceCandidate = useWebSocketStore((s) => s.sendWebRTCIceCandidate);
  const activeCall = useWebSocketStore((s) => s.activeCall);
  const setActiveCall = useWebSocketStore((s) => s.setActiveCall);

  const wsMessages = useWebSocketStore((s) => s.messages);
  const pcRef = useRef<any>(null);
  const pendingIceCandidatesRef = useRef<any[]>([]);
  const localVideoRef = useRef<any>(null);
  const remoteVideoRef = useRef<any>(null);
  const localStreamRef = useRef<any>(null);
  const remoteStreamRef = useRef<any>(null);
  const [localStream, setLocalStream] = useState<any>(null);
  const [remoteStream, setRemoteStream] = useState<any>(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [webrtc, setWebrtc] = useState<any>(null);
  const [callError, setCallError] = useState<string | null>(null);
  const [peerReady, setPeerReady] = useState(false);

  const callLabel = useMemo(() => name ?? "Video call", [name]);
  const callStatus = activeCall?.callId === callId ? activeCall.status : null;
  const shouldStartMedia =
    callStatus === "connecting" || callStatus === "in_call";
  const statusText = callError
    ? callError
    : callStatus === "ringing"
      ? "Waiting for answer..."
      : role === "caller"
        ? "Connecting..."
        : "Joining call...";

  const flushPendingIceCandidates = async (pc: any, nativeWebrtc: any) => {
    const pending = pendingIceCandidatesRef.current.splice(0);

    for (const rawCandidate of pending) {
      const candidate =
        isWeb || !nativeWebrtc
          ? rawCandidate
          : new nativeWebrtc.RTCIceCandidate(rawCandidate);
      await pc.addIceCandidate(candidate);
    }
  };

  useEffect(() => {
    if (isWeb) return;
    let mounted = true;
    import("react-native-webrtc")
      .then((mod) => {
        if (!mounted) return;
        setWebrtc(mod);
      })
      .catch((e: unknown) =>
        console.error("Failed to load react-native-webrtc:", e),
      );
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!shouldStartMedia) return;
    if (!isWeb && !webrtc) return;
    if (pcRef.current) return;
    let mounted = true;

    const start = async () => {
      setCallError(null);
      const mediaDevices = isWeb ? navigator.mediaDevices : webrtc.mediaDevices;
      const PeerConnection = isWeb ? RTCPeerConnection : webrtc.RTCPeerConnection;

      if (!mediaDevices?.getUserMedia || !PeerConnection) {
        throw new Error("WebRTC is not available in this environment");
      }

      const stream = await getCallMedia(mediaDevices);
      if (!mounted) return;
      localStreamRef.current = stream;
      setLocalStream(stream);
      if (stream.getVideoTracks().length === 0) setCamOn(false);

      const pc = new PeerConnection({ iceServers: ICE_SERVERS as any });
      pcRef.current = pc;
      setPeerReady(true);

      stream.getTracks().forEach((track: any) => pc.addTrack(track, stream));

      (pc as any).ontrack = (event: any) => {
        const [rs] = event.streams ?? [];
        if (rs) {
          remoteStreamRef.current = rs;
          setRemoteStream(rs);
          const currentCall = useWebSocketStore.getState().activeCall;
          if (currentCall?.callId === callId) {
            setActiveCall({ ...currentCall, status: "in_call" });
          }
        }
      };

      (pc as any).onicecandidate = (event: any) => {
        if (!event.candidate) return;
        sendWebRTCIceCandidate({
          toUserId: otherUserId,
          callId,
          candidate: event.candidate,
        });
      };

      if (role === "caller") {
        const offer = await pc.createOffer({ offerToReceiveVideo: true });
        await pc.setLocalDescription(offer);
        sendWebRTCOffer({
          toUserId: otherUserId,
          callId,
          offer: pc.localDescription ?? offer,
        });
      }
    };

    start().catch((e) => {
      console.error("Failed to start call:", e);
      setCallError(
        e instanceof Error
          ? e.message
          : "Could not start the call. Check camera and microphone access.",
      );
    });

    return () => {
      mounted = false;
      try {
        pcRef.current?.close?.();
        streamCleanup(localStreamRef.current);
        streamCleanup(remoteStreamRef.current);
        pcRef.current = null;
        localStreamRef.current = null;
        remoteStreamRef.current = null;
        setPeerReady(false);
      } catch {}
    };
  }, [
    callId,
    otherUserId,
    role,
    sendWebRTCIceCandidate,
    sendWebRTCOffer,
    setActiveCall,
    shouldStartMedia,
    webrtc,
  ]);

  useEffect(() => {
    if (!isWeb || !localVideoRef.current) return;
    localVideoRef.current.srcObject = localStream;
  }, [localStream]);

  useEffect(() => {
    if (!isWeb || !remoteVideoRef.current) return;
    remoteVideoRef.current.srcObject = remoteStream;
  }, [remoteStream]);

  // Callee: when store receives an offer, set remote description and answer.
  useEffect(() => {
    if (role !== "callee") return;
    if (!isWeb && !webrtc) return;
    if (!activeCall?.offer) return;
    if (activeCall.callId !== callId) return;
    if (!peerReady) return;
    const pc = pcRef.current;
    if (!pc) return;

    (async () => {
      if (!pc.remoteDescription) {
        const remoteOffer = isWeb
          ? activeCall.offer
          : new webrtc.RTCSessionDescription(activeCall.offer);
        await pc.setRemoteDescription(remoteOffer);
        await flushPendingIceCandidates(pc, webrtc);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        sendWebRTCAnswer({
          toUserId: otherUserId,
          callId,
          answer: pc.localDescription ?? answer,
        });
      }
    })().catch((e) => console.error("Answer flow failed:", e));
  }, [activeCall, callId, otherUserId, peerReady, role, sendWebRTCAnswer, webrtc]);

  // Caller: apply remote answer from ws messages
  useEffect(() => {
    if (role !== "caller") return;
    if (!isWeb && !webrtc) return;
    if (!peerReady) return;
    const pc = pcRef.current;
    if (!pc) return;

    const last = wsMessages[wsMessages.length - 1];
    if (!last) return;
    if (last.type !== MessageType.WEBRTC_ANSWER) return;
    const payload: any = last.payload ?? {};
    if (payload.callId !== callId) return;
    if (!payload.answer) return;

    (async () => {
      if (!pc.remoteDescription) {
        const remoteAnswer = isWeb
          ? payload.answer
          : new webrtc.RTCSessionDescription(payload.answer);
        await pc.setRemoteDescription(remoteAnswer);
        await flushPendingIceCandidates(pc, webrtc);
      }
    })().catch((e) => console.error("Set remote answer failed:", e));
  }, [wsMessages, callId, peerReady, role, webrtc]);

  // Both: apply remote ICE candidates from ws messages
  useEffect(() => {
    if (!isWeb && !webrtc) return;

    const last = wsMessages[wsMessages.length - 1];
    if (!last) return;
    if (last.type !== MessageType.WEBRTC_ICE_CANDIDATE) return;
    const payload: any = last.payload ?? {};
    if (payload.callId !== callId) return;
    if (!payload.candidate) return;

    const pc = pcRef.current;
    if (!pc) {
      pendingIceCandidatesRef.current.push(payload.candidate);
      return;
    }

    if (!pc.remoteDescription) {
      pendingIceCandidatesRef.current.push(payload.candidate);
      return;
    }
    const candidate = isWeb
      ? payload.candidate
      : new webrtc.RTCIceCandidate(payload.candidate);
    pc.addIceCandidate(candidate).catch(
      (e: unknown) => console.error("Add ICE failed:", e),
    );
  }, [wsMessages, callId, peerReady, webrtc]);

  useEffect(() => {
    // end call if store marks ended/rejected
    if (!activeCall || activeCall.callId !== callId) return;
    if (activeCall.status === "ended" || activeCall.status === "rejected") {
      router.replace("/(tabs)/messages");
    }
  }, [activeCall, callId, router]);

  const toggleMic = () => {
    if (!localStream) return;
    localStream.getAudioTracks().forEach((t: any) => (t.enabled = !micOn));
    setMicOn((v) => !v);
  };

  const toggleCam = () => {
    if (!localStream) return;
    localStream.getVideoTracks().forEach((t: any) => (t.enabled = !camOn));
    setCamOn((v) => !v);
  };

  const end = () => {
    try {
      pcRef.current?.close();
      streamCleanup(localStream);
      streamCleanup(remoteStream);
      localStreamRef.current = null;
      remoteStreamRef.current = null;
      setPeerReady(false);
    } catch {}
    sendCallEnd({ toUserId: otherUserId, callId });
    router.replace("/(tabs)/messages");
  };

  if (isWeb) {
    return (
      <View className="flex-1 bg-black">
        {remoteStream ? (
          React.createElement("video", {
            ref: remoteVideoRef,
            autoPlay: true,
            playsInline: true,
            style: {
              width: "100%",
              height: "100%",
              objectFit: "cover",
              backgroundColor: "black",
            },
          })
        ) : (
          <View className="flex-1 items-center justify-center bg-black">
            <Text className="text-white text-lg font-semibold">
              {callLabel}
            </Text>
            <Text className="text-slate-300 mt-2 text-center px-8">
              {statusText}
            </Text>
          </View>
        )}

        {localStream &&
          React.createElement("video", {
            ref: localVideoRef,
            autoPlay: true,
            playsInline: true,
            muted: true,
            style: {
              position: "absolute",
              right: 14,
              top: 60,
              width: 110,
              height: 160,
              borderRadius: 16,
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.18)",
              backgroundColor: "black",
              objectFit: "cover",
              transform: "scaleX(-1)",
            },
          })}

        <View className="absolute bottom-10 w-full px-6">
          <View className="flex-row items-center justify-center gap-4">
            <TouchableOpacity
              className="w-14 h-14 rounded-full bg-slate-900/70 items-center justify-center"
              activeOpacity={0.8}
              onPress={toggleMic}
              disabled={!localStream}
            >
              <Ionicons
                name={micOn ? "mic" : "mic-off"}
                size={22}
                color="white"
              />
            </TouchableOpacity>
            <TouchableOpacity
              className="w-14 h-14 rounded-full bg-slate-900/70 items-center justify-center"
              activeOpacity={0.8}
              onPress={toggleCam}
              disabled={!localStream}
            >
              <Ionicons
                name={camOn ? "videocam" : "videocam-off"}
                size={22}
                color="white"
              />
            </TouchableOpacity>
            <TouchableOpacity
              className="w-16 h-16 rounded-full bg-red-500 items-center justify-center"
              activeOpacity={0.85}
              onPress={end}
            >
              <Ionicons name="call" size={22} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      {remoteStream ? (
        <webrtc.RTCView
          streamURL={remoteStream.toURL()}
          style={{ flex: 1, backgroundColor: "black" }}
          objectFit="cover"
        />
      ) : (
        <View className="flex-1 items-center justify-center bg-black">
          <Text className="text-white text-lg font-semibold">{callLabel}</Text>
          <Text className="text-slate-300 mt-2 text-center px-8">
            {statusText}
          </Text>
        </View>
      )}

      {localStream && (
        <View
          style={{
            position: "absolute",
            right: 14,
            top: 60,
            width: 110,
            height: 160,
            borderRadius: 16,
            overflow: "hidden",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.18)",
            backgroundColor: "black",
          }}
        >
          <webrtc.RTCView
            streamURL={localStream.toURL()}
            style={{ width: "100%", height: "100%" }}
            objectFit="cover"
            mirror
          />
        </View>
      )}

      <View className="absolute bottom-10 w-full px-6">
        <View className="flex-row items-center justify-center gap-4">
          <TouchableOpacity
            className="w-14 h-14 rounded-full bg-slate-900/70 items-center justify-center"
            activeOpacity={0.8}
            onPress={toggleMic}
            disabled={!localStream}
          >
            <Ionicons
              name={micOn ? "mic" : "mic-off"}
              size={22}
              color="white"
            />
          </TouchableOpacity>
          <TouchableOpacity
            className="w-14 h-14 rounded-full bg-slate-900/70 items-center justify-center"
            activeOpacity={0.8}
            onPress={toggleCam}
            disabled={!localStream}
          >
            <Ionicons
              name={camOn ? "videocam" : "videocam-off"}
              size={22}
              color="white"
            />
          </TouchableOpacity>
          <TouchableOpacity
            className="w-16 h-16 rounded-full bg-red-500 items-center justify-center"
            activeOpacity={0.85}
            onPress={end}
          >
            <Ionicons name="call" size={22} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
