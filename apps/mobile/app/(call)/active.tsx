import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, TouchableOpacity, Platform } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useWebSocketStore } from "@/store/useWebSocketStore";
import { MessageType } from "@/@types/talkie";

const ICE_SERVERS = [{ urls: "stun:stun.l.google.com:19302" }];

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

  const wsMessages = useWebSocketStore((s) => s.messages);
  const pcRef = useRef<any>(null);
  const [localStream, setLocalStream] = useState<any>(null);
  const [remoteStream, setRemoteStream] = useState<any>(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [webrtc, setWebrtc] = useState<any>(null);

  const callLabel = useMemo(() => name ?? "Video call", [name]);

  useEffect(() => {
    if (Platform.OS === "web") return;
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
    if (Platform.OS === "web") return;
    if (!webrtc) return;
    let mounted = true;

    const start = async () => {
      const stream = await webrtc.mediaDevices.getUserMedia({
        audio: true,
        video: {
          facingMode: "user",
        },
      });
      if (!mounted) return;
      setLocalStream(stream);

      const pc = new webrtc.RTCPeerConnection({ iceServers: ICE_SERVERS as any });
      pcRef.current = pc;

      stream.getTracks().forEach((track: any) => pc.addTrack(track, stream));

      (pc as any).ontrack = (event: any) => {
        const [rs] = event.streams ?? [];
        if (rs) setRemoteStream(rs);
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
        sendWebRTCOffer({ toUserId: otherUserId, callId, offer });
      }
    };

    start().catch((e) => {
      console.error("Failed to start call:", e);
      router.replace("/(tabs)/messages");
    });

    return () => {
      mounted = false;
    };
  }, [
    callId,
    otherUserId,
    role,
    router,
    sendWebRTCIceCandidate,
    sendWebRTCOffer,
    webrtc,
  ]);

  // Callee: when store receives an offer, set remote description and answer.
  useEffect(() => {
    if (role !== "callee") return;
    if (Platform.OS === "web") return;
    if (!webrtc) return;
    if (!activeCall?.offer) return;
    if (activeCall.callId !== callId) return;
    const pc = pcRef.current;
    if (!pc) return;

    (async () => {
      if (!pc.remoteDescription) {
        await pc.setRemoteDescription(
          new webrtc.RTCSessionDescription(activeCall.offer),
        );
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        sendWebRTCAnswer({ toUserId: otherUserId, callId, answer });
      }
    })().catch((e) => console.error("Answer flow failed:", e));
  }, [activeCall, callId, otherUserId, role, sendWebRTCAnswer, webrtc]);

  // Caller: apply remote answer from ws messages
  useEffect(() => {
    if (role !== "caller") return;
    if (Platform.OS === "web") return;
    if (!webrtc) return;
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
        await pc.setRemoteDescription(new webrtc.RTCSessionDescription(payload.answer));
      }
    })().catch((e) => console.error("Set remote answer failed:", e));
  }, [wsMessages, callId, role, webrtc]);

  // Both: apply remote ICE candidates from ws messages
  useEffect(() => {
    if (Platform.OS === "web") return;
    if (!webrtc) return;
    const pc = pcRef.current;
    if (!pc) return;

    const last = wsMessages[wsMessages.length - 1];
    if (!last) return;
    if (last.type !== MessageType.WEBRTC_ICE_CANDIDATE) return;
    const payload: any = last.payload ?? {};
    if (payload.callId !== callId) return;
    if (!payload.candidate) return;

    pc.addIceCandidate(new webrtc.RTCIceCandidate(payload.candidate)).catch(
      (e: unknown) => console.error("Add ICE failed:", e),
    );
  }, [wsMessages, callId, webrtc]);

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
      localStream?.getTracks?.().forEach((t: any) => t.stop?.());
    } catch {}
    sendCallEnd({ toUserId: otherUserId, callId });
    router.replace("/(tabs)/messages");
  };

  if (Platform.OS === "web") {
    return (
      <View className="flex-1 bg-white items-center justify-center px-6">
        <Text className="text-gray-900 text-lg font-semibold">
          Video calling isn’t supported on web yet
        </Text>
        <Text className="text-gray-500 text-sm mt-2 text-center">
          Run on iOS/Android (dev client / `expo run`) to use `react-native-webrtc`.
        </Text>
        <TouchableOpacity
          className="mt-6 w-16 h-16 rounded-full bg-red-500 items-center justify-center"
          activeOpacity={0.85}
          onPress={end}
        >
          <Ionicons name="call" size={22} color="white" />
        </TouchableOpacity>
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
          <Text className="text-slate-300 mt-2">
            {role === "caller" ? "Calling…" : "Connecting…"}
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

