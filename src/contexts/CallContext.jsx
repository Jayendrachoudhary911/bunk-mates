import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  doc,
  setDoc,
  updateDoc,
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  deleteDoc,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import { useUser } from "./UserContext";

const CallContext = createContext(null);

// Multi-STUN servers with high availability across ports 19302 & 3478 for mobile & cellular NAT traversal
const RTC_CONFIG = {
  iceServers: [
    {
      urls: [
        "stun:stun.l.google.com:19302",
        "stun:stun1.l.google.com:19302",
        "stun:stun2.l.google.com:19302",
        "stun:stun3.l.google.com:19302",
        "stun:stun4.l.google.com:19302",
      ],
    },
    { urls: ["stun:stun.cloudflare.com:3478"] },
    { urls: ["stun:stun.services.mozilla.com:3478"] },
    { urls: ["stun:global.stun.twilio.com:3478"] },
  ],
  iceCandidatePoolSize: 10,
  bundlePolicy: "max-bundle",
  rtcpMuxPolicy: "require",
  sdpSemantics: "unified-plan",
};

// Robust candidate normalization for Android cross-compatibility
const normalizeCandidate = (candObj) => {
  if (!candObj) return null;
  const sdpCandidate = candObj.candidate || candObj.sdpCandidate;
  if (!sdpCandidate || typeof sdpCandidate !== "string" || sdpCandidate.trim() === "") {
    return null;
  }
  let sdpMLineIndex = candObj.sdpMLineIndex;
  if (typeof sdpMLineIndex === "string") {
    const parsed = parseInt(sdpMLineIndex, 10);
    sdpMLineIndex = isNaN(parsed) ? 0 : parsed;
  } else if (typeof sdpMLineIndex !== "number") {
    sdpMLineIndex = 0;
  }
  const sdpMid = candObj.sdpMid !== undefined && candObj.sdpMid !== null ? String(candObj.sdpMid) : "0";
  return {
    candidate: sdpCandidate,
    sdpMid,
    sdpMLineIndex,
  };
};

// Optimize SDP for Opus FEC (Forward Error Correction) & DTX for mobile/cellular audio reliability
const optimizeSDP = (sdp) => {
  if (!sdp) return sdp;
  let modified = sdp.replace(
    /a=fmtp:(\d+) minptime=\d+;useinbandfec=\d+/g,
    "a=fmtp:$1 minptime=10;useinbandfec=1;usedtx=1"
  );
  if (!modified.includes("useinbandfec=1") && modified.includes("a=rtpmap:") && modified.includes("opus/48000")) {
    modified = modified.replace(
      /(a=rtpmap:(\d+) opus\/48000\/2[\r\n]+)/g,
      "$1a=fmtp:$2 minptime=10;useinbandfec=1;usedtx=1\r\n"
    );
  }
  return modified;
};

// Web Audio Tone Generator for Ringback & Incoming Chime
class ToneGenerator {
  constructor() {
    this.ctx = null;
    this.intervalId = null;
  }

  ensureContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
  }

  playRingback() {
    this.stop();
    this.ensureContext();
    if (!this.ctx) return;

    const playToneBurst = () => {
      try {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc1.frequency.setValueAtTime(440, now);
        osc2.frequency.setValueAtTime(480, now);

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 1.8);
        osc2.stop(now + 1.8);
      } catch (e) {}
    };

    playToneBurst();
    this.intervalId = setInterval(playToneBurst, 3500);
  }

  playIncomingChime() {
    this.stop();
    this.ensureContext();
    if (!this.ctx) return;

    const playChimeBurst = () => {
      try {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          const start = now + idx * 0.14;
          osc.frequency.setValueAtTime(freq, start);
          gain.gain.setValueAtTime(0.12, start);
          gain.gain.exponentialRampToValueAtTime(0.001, start + 0.5);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(start);
          osc.stop(start + 0.5);
        });
      } catch (e) {}
    };

    playChimeBurst();
    this.intervalId = setInterval(playChimeBurst, 2500);
  }

  playReactionPop() {
    this.ensureContext();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(950, now + 0.12);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
    } catch (e) {}
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

const toneGen = new ToneGenerator();

// Safe helper to strip undefined fields so Firestore never rejects payloads
const cleanPayload = (obj) => {
  const clean = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) {
      clean[k] = v;
    } else {
      clean[k] = null;
    }
  }
  return clean;
};

export function CallProvider({ children }) {
  const { user: currentUser } = useUser();
  const location = useLocation();
  const navigate = useNavigate();

  // Resolved user identity
  const effectiveUser = currentUser || auth.currentUser;
  const effectiveUid = effectiveUser?.uid || effectiveUser?.id;

  // Active call session state
  const [activeCall, setActiveCall] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [callStatus, setCallStatus] = useState("idle"); // "idle" | "initiating" | "calling" | "connected" | "ended" | "reconnecting"
  const [duration, setDuration] = useState(0);
  const [isIncoming, setIsIncoming] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [lowDataMode, setLowDataMode] = useState(false);

  // Hardware states
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [hasRemoteVideo, setHasRemoteVideo] = useState(false);
  const [audioAutoplayBlocked, setAudioAutoplayBlocked] = useState(false);
  const [networkQuality, setNetworkQuality] = useState("good"); // "good" | "fair" | "poor"

  const toggleSpeaker = useCallback(() => {
    setIsSpeakerOn((prev) => !prev);
  }, []);

  // Devices & Permissions
  const [devices, setDevices] = useState({
    audioInputs: [],
    videoInputs: [],
    audioOutputs: [],
  });
  const [selectedAudioInput, setSelectedAudioInput] = useState("");
  const [selectedVideoInput, setSelectedVideoInput] = useState("");
  const [selectedAudioOutput, setSelectedAudioOutput] = useState("");
  const [permissions, setPermissions] = useState({
    mic: "prompt",
    camera: "prompt",
    notifications: "prompt",
  });

  // Reactions & In-Call Messages
  const [reactions, setReactions] = useState([]);
  const [inCallMessages, setInCallMessages] = useState([]);

  // Group Call Real-time Participants
  const [groupParticipants, setGroupParticipants] = useState([]);

  // Internal WebRTC & Media Refs
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const cameraTrackRef = useRef(null);
  const pcRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const timerRef = useRef(null);
  const durationRef = useRef(0);
  const callStatusRef = useRef("idle");
  const callTimeoutRef = useRef(null);
  const callerHistoryDocIdRef = useRef(null);
  const receiverHistoryDocIdRef = useRef(null);
  const unsubscribeCallRef = useRef(null);
  const unsubscribeCandidatesRef = useRef(null);
  const unsubscribeGeneralCandidatesRef = useRef(null);
  const unsubscribeParticipantsRef = useRef(null);
  const unsubscribeReactionsRef = useRef(null);
  const unsubscribeMessagesRef = useRef(null);

  // Stable references for reactive values
  const activeCallRef = useRef(null);
  const currentUserRef = useRef(effectiveUser);
  const currentUidRef = useRef(effectiveUid);
  const selectedAudioInputRef = useRef(selectedAudioInput);
  const selectedVideoInputRef = useRef(selectedVideoInput);

  useEffect(() => {
    activeCallRef.current = activeCall;
  }, [activeCall]);

  useEffect(() => {
    currentUserRef.current = effectiveUser;
    currentUidRef.current = effectiveUid;
  }, [effectiveUser, effectiveUid]);

  useEffect(() => {
    durationRef.current = duration;
  }, [duration]);

  useEffect(() => {
    callStatusRef.current = callStatus;
  }, [callStatus]);

  useEffect(() => {
    selectedAudioInputRef.current = selectedAudioInput;
  }, [selectedAudioInput]);

  useEffect(() => {
    selectedVideoInputRef.current = selectedVideoInput;
  }, [selectedVideoInput]);

  // Determine if currently on a Chat page
  const isChatPage =
    location.pathname.startsWith("/chats") ||
    location.pathname.startsWith("/chat/") ||
    location.pathname.startsWith("/group/");

  // Default minimization: on chat page -> full-screen; on other pages -> pop-up PiP
  useEffect(() => {
    if (activeCall) {
      if (!isChatPage) {
        setIsMinimized(true);
      }
    }
  }, [isChatPage, activeCall]);

  /* -------------------------------------------------------------
   * 1. DEVICE ENUMERATION & PERMISSIONS
   * ------------------------------------------------------------- */
  const enumerateMediaDevices = useCallback(async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return;
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = allDevices.filter((d) => d.kind === "audioinput");
      const videoInputs = allDevices.filter((d) => d.kind === "videoinput");
      const audioOutputs = allDevices.filter((d) => d.kind === "audiooutput");

      setDevices({ audioInputs, videoInputs, audioOutputs });

      if (audioInputs.length && !selectedAudioInputRef.current) {
        setSelectedAudioInput(audioInputs[0].deviceId);
      }
      if (videoInputs.length && !selectedVideoInputRef.current) {
        setSelectedVideoInput(videoInputs[0].deviceId);
      }
      if (audioOutputs.length && !selectedAudioOutput) {
        setSelectedAudioOutput(audioOutputs[0].deviceId);
      }
    } catch (err) {
      console.warn("Could not enumerate media devices:", err);
    }
  }, [selectedAudioOutput]);

  const checkPermissions = useCallback(async () => {
    const permStatus = { mic: "prompt", camera: "prompt", notifications: "prompt" };

    if (navigator.permissions) {
      try {
        const micP = await navigator.permissions.query({ name: "microphone" }).catch(() => null);
        if (micP) permStatus.mic = micP.state;
      } catch (e) {}

      try {
        const camP = await navigator.permissions.query({ name: "camera" }).catch(() => null);
        if (camP) permStatus.camera = camP.state;
      } catch (e) {}
    }

    if ("Notification" in window) {
      permStatus.notifications = Notification.permission;
    }

    setPermissions(permStatus);
    await enumerateMediaDevices();
  }, [enumerateMediaDevices]);

  useEffect(() => {
    checkPermissions();
    if (navigator.mediaDevices) {
      navigator.mediaDevices.ondevicechange = () => {
        enumerateMediaDevices();
      };
    }
  }, [checkPermissions, enumerateMediaDevices]);

  const requestCallPermissions = async (needsVideo = true) => {
    try {
      if ("Notification" in window && Notification.permission === "default") {
        await Notification.requestPermission().catch(() => {});
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: needsVideo,
      });
      stream.getTracks().forEach((t) => t.stop());
      await checkPermissions();
      return true;
    } catch (err) {
      console.warn("Permission request failed or dismissed:", err);
      await checkPermissions();
      return false;
    }
  };

  /* -------------------------------------------------------------
   * 2. AUDIO & VIDEO DEVICE SWITCHING (HOT-SWAP WITHOUT RECONNECTION)
   * ------------------------------------------------------------- */
  const switchAudioDevice = async (deviceId) => {
    setSelectedAudioInput(deviceId);
    selectedAudioInputRef.current = deviceId;
    if (pcRef.current && localStreamRef.current) {
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          audio: { deviceId: { exact: deviceId } },
          video: false,
        });
        const newTrack = newStream.getAudioTracks()[0];
        const sender = pcRef.current.getSenders().find((s) => s.track && s.track.kind === "audio");
        if (sender && newTrack) {
          await sender.replaceTrack(newTrack);
          const oldTrack = localStreamRef.current.getAudioTracks()[0];
          if (oldTrack) {
            oldTrack.stop();
            localStreamRef.current.removeTrack(oldTrack);
          }
          localStreamRef.current.addTrack(newTrack);
        }
      } catch (e) {
        console.warn("switchAudioDevice error:", e);
      }
    }
  };

  const switchVideoDevice = async (deviceId) => {
    setSelectedVideoInput(deviceId);
    selectedVideoInputRef.current = deviceId;
    if (pcRef.current && localStreamRef.current && !isVideoOff) {
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: { exact: deviceId }, width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        });
        const newTrack = newStream.getVideoTracks()[0];
        const sender = pcRef.current.getSenders().find((s) => s.track && s.track.kind === "video");
        if (sender && newTrack) {
          await sender.replaceTrack(newTrack);
          cameraTrackRef.current = newTrack;
          const oldTrack = localStreamRef.current.getVideoTracks()[0];
          if (oldTrack) {
            oldTrack.stop();
            localStreamRef.current.removeTrack(oldTrack);
          }
          localStreamRef.current.addTrack(newTrack);
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = localStreamRef.current;
          }
        }
      } catch (e) {
        console.warn("switchVideoDevice error:", e);
      }
    }
  };

  const switchAudioOutput = async (sinkId) => {
    setSelectedAudioOutput(sinkId);
    if (remoteAudioRef.current && typeof remoteAudioRef.current.setSinkId === "function") {
      try {
        await remoteAudioRef.current.setSinkId(sinkId);
      } catch (e) {
        console.warn("setSinkId failed on remote audio:", e);
      }
    }
    if (remoteVideoRef.current && typeof remoteVideoRef.current.setSinkId === "function") {
      try {
        await remoteVideoRef.current.setSinkId(sinkId);
      } catch (e) {}
    }
  };

  /* -------------------------------------------------------------
   * 3. INCOMING CALL GLOBAL LISTENER (NO COMPOSITE INDEX REQUIRED)
   * ------------------------------------------------------------- */
  useEffect(() => {
    if (!effectiveUid) return;

    // Notice: Query contains ONLY equality filters so Firestore requires ZERO custom composite index!
    const q = query(
      collection(db, "calls"),
      where("receiverId", "==", effectiveUid),
      where("status", "==", "calling")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const calls = snapshot.docs.map((docSnap) => ({
            ...docSnap.data(),
            callID: docSnap.id,
          }));

          // Sort in descending order of createdAt in memory
          calls.sort((a, b) => {
            const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt || 0);
            const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt || 0);
            return tB - tA;
          });

          const latestCall = calls[0];

          // If not currently in a call, notify and ring
          if (!activeCallRef.current) {
            setIncomingCall(latestCall);
            toneGen.playIncomingChime();
          }
        } else {
          setIncomingCall((prev) => {
            if (prev) toneGen.stop();
            return null;
          });
        }
      },
      (err) => {
        console.warn("Incoming call listener warning:", err);
      }
    );

    return () => {
      unsubscribe();
      toneGen.stop();
    };
  }, [effectiveUid]);

  /* -------------------------------------------------------------
   * 4. CLEANUP HELPER
   * ------------------------------------------------------------- */
  const cleanupStreamsAndPC = useCallback(() => {
    toneGen.stop();
    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current);
      callTimeoutRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (unsubscribeCallRef.current) {
      unsubscribeCallRef.current();
      unsubscribeCallRef.current = null;
    }
    if (unsubscribeCandidatesRef.current) {
      unsubscribeCandidatesRef.current();
      unsubscribeCandidatesRef.current = null;
    }
    if (unsubscribeGeneralCandidatesRef.current) {
      unsubscribeGeneralCandidatesRef.current();
      unsubscribeGeneralCandidatesRef.current = null;
    }
    if (unsubscribeParticipantsRef.current) {
      unsubscribeParticipantsRef.current();
      unsubscribeParticipantsRef.current = null;
    }
    if (unsubscribeReactionsRef.current) {
      unsubscribeReactionsRef.current();
      unsubscribeReactionsRef.current = null;
    }
    if (unsubscribeMessagesRef.current) {
      unsubscribeMessagesRef.current();
      unsubscribeMessagesRef.current = null;
    }

    // Clean up group call participant presence if registered
    if (activeCallRef.current?.callID && currentUidRef.current) {
      const pDoc = doc(db, "calls", activeCallRef.current.callID, "participants", currentUidRef.current);
      deleteDoc(pDoc).catch(() => {});
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (cameraTrackRef.current) {
      cameraTrackRef.current.stop();
      cameraTrackRef.current = null;
    }
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }

    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;

    setReactions([]);
    setInCallMessages([]);
    setGroupParticipants([]);
    setIsScreenSharing(false);
    setAudioAutoplayBlocked(false);
    setHasRemoteVideo(false);
  }, []);

  /* -------------------------------------------------------------
   * 5. END ACTIVE CALL
   * ------------------------------------------------------------- */
  const endCall = useCallback(async () => {
    const currentDuration = durationRef.current;
    const currentStatus = callStatusRef.current;
    const callData = activeCallRef.current;
    const currentUid = currentUidRef.current;

    try {
      if (callData?.callID) {
        const callDocRef = doc(db, "calls", callData.callID);
        const callSnap = await getDoc(callDocRef).catch(() => null);
        const callDocData = callSnap?.exists() ? callSnap.data() : callData;

        const isCallConnected = currentStatus === "connected" || currentDuration > 0 || callDocData?.status === "connected";
        const finalStatus = isCallConnected ? "ended" : "missed";
        const endReason = isCallConnected ? "normal" : "missed";

        // 1. Update calls/{callID} document
        await updateDoc(callDocRef, {
          status: "ended",
          endedAt: serverTimestamp(),
          duration: currentDuration,
          durationSeconds: currentDuration,
          endReason,
        }).catch(() => {});

        // History IDs
        const callerHistoryId = callerHistoryDocIdRef.current || callDocData?.callerHistoryDocId;
        const receiverHistoryId = receiverHistoryDocIdRef.current || callDocData?.receiverHistoryDocId;
        const callerId = callDocData?.callerId || currentUid;
        const receiverId = callDocData?.receiverId;

        const historyUpdate = {
          status: finalStatus,
          endedAt: serverTimestamp(),
          duration: currentDuration,
          durationSeconds: currentDuration,
          endReason,
        };

        // 2. Update caller's callHistory subcollection document
        if (callerId && callerHistoryId) {
          await updateDoc(doc(db, "users", callerId, "callHistory", callerHistoryId), historyUpdate).catch(() => {});
        }

        // 3. Update receiver's callHistory subcollection document
        if (receiverId && receiverHistoryId) {
          await updateDoc(doc(db, "users", receiverId, "callHistory", receiverHistoryId), historyUpdate).catch(() => {});
        }

        // 4. If call was missed (unanswered) and initiated by caller, add notification for recipient
        if (!isCallConnected && !isIncoming && receiverId) {
          try {
            await addDoc(collection(db, "notifications"), {
              recipientId: receiverId,
              senderId: callerId,
              senderName: currentUserRef.current?.displayName || callData.callerName || "User",
              senderAvatar: currentUserRef.current?.photoURL || callData.callerAvatar || "",
              type: "missed_call",
              callType: callData.callType || "video",
              timestamp: serverTimestamp(),
              read: false,
            });
          } catch (notifErr) {
            console.warn("Could not log missed call notification:", notifErr);
          }
        }
      }
    } catch (err) {
      console.warn("Error ending call in firestore:", err);
    }

    cleanupStreamsAndPC();
    setCallStatus("ended");
    setTimeout(() => {
      setActiveCall(null);
      setCallStatus("idle");
      setDuration(0);
      setIsMinimized(false);
    }, 600);
  }, [isIncoming, cleanupStreamsAndPC]);

  const endCallRef = useRef(endCall);
  useEffect(() => {
    endCallRef.current = endCall;
  }, [endCall]);

  /* -------------------------------------------------------------
   * 6. DECLINE INCOMING CALL
   * ------------------------------------------------------------- */
  const declineIncomingCall = useCallback(async () => {
    if (!incomingCall) return;
    toneGen.stop();
    const callData = incomingCall;
    setIncomingCall(null);

    try {
      const callDocRef = doc(db, "calls", callData.callID);
      await updateDoc(callDocRef, {
        status: "ended",
        endedAt: serverTimestamp(),
        duration: 0,
        durationSeconds: 0,
        endReason: "declined",
      }).catch(() => {});

      // If it was a group or individual invite document, update that document too
      if (callData.id && callData.id !== callData.callID) {
        await updateDoc(doc(db, "calls", callData.id), {
          status: "ended",
          endedAt: serverTimestamp(),
          endReason: "declined",
        }).catch(() => {});
      }

      if (callData.receiverHistoryDocId && callData.receiverId) {
        await updateDoc(doc(db, "users", callData.receiverId, "callHistory", callData.receiverHistoryDocId), {
          status: "declined",
          endedAt: serverTimestamp(),
          duration: 0,
          durationSeconds: 0,
          endReason: "declined",
        }).catch(() => {});
      }
      if (callData.callerHistoryDocId && callData.callerId) {
        await updateDoc(doc(db, "users", callData.callerId, "callHistory", callData.callerHistoryDocId), {
          status: "declined",
          endedAt: serverTimestamp(),
          duration: 0,
          durationSeconds: 0,
          endReason: "declined",
        }).catch(() => {});
      }
    } catch (e) {
      console.warn("Error declining call:", e);
    }
  }, [incomingCall]);

  /* -------------------------------------------------------------
   * 7. ACCEPT INCOMING CALL
   * ------------------------------------------------------------- */
  const acceptIncomingCall = useCallback(() => {
    if (!incomingCall) return;
    toneGen.stop();
    const targetCallId = incomingCall.parentCallId || incomingCall.callID;
    const callData = {
      ...incomingCall,
      callID: targetCallId,
    };

    if (incomingCall.id && incomingCall.id !== targetCallId) {
      updateDoc(doc(db, "calls", incomingCall.id), { status: "connected" }).catch(() => {});
    }

    setIncomingCall(null);
    setIsIncoming(true);
    setActiveCall(callData);
    setIsMinimized(!isChatPage);
  }, [incomingCall, isChatPage]);

  /* -------------------------------------------------------------
   * 8. START OUTGOING CALL (1-on-1 or Trip Group)
   * ------------------------------------------------------------- */
  const startCall = useCallback(
    async (targetUser, callType = "video", isGroup = false) => {
      const activeUser = currentUserRef.current || auth.currentUser;
      const callerId = activeUser?.uid || activeUser?.id;
      const targetId = targetUser?.uid || targetUser?.id || targetUser?.userId || targetUser?._id;

      if (!callerId || !targetId) {
        console.warn("startCall: missing user IDs", { callerId, targetId });
        return;
      }
      toneGen.stop();

      const callDocId = isGroup
        ? `call_group_${targetId}_${Date.now()}`
        : `call_${callerId}_${targetId}_${Date.now()}`;

      const rawMembers = targetUser?.members || targetUser?.memberUsers || [];
      const newCallData = {
        callID: callDocId,
        callType,
        isGroupCall: Boolean(isGroup),
        groupId: isGroup ? targetId : null,
        groupName: isGroup ? (targetUser.name || "Bunk1") : null,
        groupIcon: isGroup ? (targetUser.photoURL || targetUser.iconURL || "") : null,
        members: rawMembers,
        callerId,
        callerName: activeUser?.displayName || "User",
        callerHandle: activeUser?.email?.split("@")[0] || "",
        callerAvatar: activeUser?.photoURL || "",
        receiverId: targetId,
        receiverName: targetUser?.name || targetUser?.username || "User",
        receiverHandle: targetUser?.username || "",
        receiverAvatar: targetUser?.photoURL || targetUser?.iconURL || "",
      };

      // If group call, fan out incoming call documents and notifications to every member
      if (isGroup && Array.isArray(rawMembers)) {
        rawMembers.forEach(async (m) => {
          const mUid = m.uid || m.id || m._id;
          if (mUid && mUid !== callerId) {
            const memberRingId = `call_group_${callDocId}_${mUid}_${Date.now()}`;
            setDoc(doc(db, "calls", memberRingId), {
              callID: callDocId,
              parentCallId: callDocId,
              receiverId: mUid,
              callerId,
              callerName: activeUser?.displayName || "User",
              callerAvatar: activeUser?.photoURL || "",
              callType,
              isGroupCall: true,
              groupId: targetId,
              groupName: targetUser.name || "Bunk1",
              members: rawMembers,
              status: "calling",
              createdAt: serverTimestamp(),
            }).catch((e) => console.warn("Group member ring error:", e));

            // Also trigger in-app / push notification
            addDoc(collection(db, "notifications"), {
              recipientId: mUid,
              senderId: callerId,
              senderName: activeUser?.displayName || "User",
              senderAvatar: activeUser?.photoURL || "",
              type: "incoming_call",
              callType,
              callID: callDocId,
              isGroupCall: true,
              timestamp: serverTimestamp(),
              read: false,
            }).catch(() => {});
          }
        });
      }

      setIsIncoming(false);
      setActiveCall(newCallData);
      setIsMinimized(!isChatPage);
    },
    [isChatPage]
  );

  /* -------------------------------------------------------------
   * 8B. INVITE USER TO ACTIVE CALL (Audio, Video, Group Audio, Group Video)
   * ------------------------------------------------------------- */
  const inviteUserToCall = useCallback(
    async (targetUser) => {
      if (!activeCall?.callID || !effectiveUid || !targetUser) return false;
      const targetUid = targetUser.uid || targetUser.id || targetUser._id;
      if (!targetUid) return false;

      const myName = effectiveUser?.displayName || "Friend";
      const myAvatar = effectiveUser?.photoURL || "";
      const callDocRef = doc(db, "calls", activeCall.callID);

      try {
        // 1. Direct incoming call document matching listener (where receiverId == targetUid)
        const ringDocId = `call_invite_${activeCall.callID}_${targetUid}_${Date.now()}`;
        await setDoc(doc(db, "calls", ringDocId), {
          callID: activeCall.callID,
          parentCallId: activeCall.callID,
          receiverId: targetUid,
          callerId: effectiveUid,
          callerName: myName,
          callerAvatar: myAvatar,
          callType: activeCall.callType || "audio",
          isGroupCall: true,
          groupId: activeCall.groupId || activeCall.callID,
          groupName: activeCall.groupName || `${myName}'s Group Call`,
          members: [
            ...(activeCall.members || []),
            {
              uid: targetUid,
              name: targetUser.name || targetUser.displayName || targetUser.username || "User",
              photoURL: targetUser.photoURL || "",
            },
          ],
          status: "calling",
          createdAt: serverTimestamp(),
        });

        // 2. Notification for Mobile / Web
        await addDoc(collection(db, "notifications"), {
          recipientId: targetUid,
          senderId: effectiveUid,
          senderName: myName,
          senderAvatar: myAvatar,
          type: "incoming_call",
          callType: activeCall.callType || "audio",
          callID: activeCall.callID,
          isGroupCall: true,
          timestamp: serverTimestamp(),
          read: false,
        }).catch(() => {});

        // 3. Update main call document with new member
        const existingMembers = activeCall.members || [];
        const updatedMembers = [
          ...existingMembers.filter((m) => (m.uid || m.id) !== targetUid),
          {
            uid: targetUid,
            name: targetUser.name || targetUser.displayName || targetUser.username || "User",
            photoURL: targetUser.photoURL || "",
          },
        ];

        await updateDoc(callDocRef, {
          members: updatedMembers,
          isGroupCall: true,
        }).catch(() => {});

        setActiveCall((prev) =>
          prev
            ? {
                ...prev,
                isGroupCall: true,
                members: updatedMembers,
              }
            : null
        );

        return true;
      } catch (err) {
        console.warn("Failed to invite user to call:", err);
        return false;
      }
    },
    [activeCall, effectiveUid, effectiveUser]
  );

  /* -------------------------------------------------------------
   * 9. WEBRTC ENGINE INITIALIZATION & STREAM PIPELINE
   * Keyed strictly on [activeCall?.callID, isIncoming] to prevent
   * inadvertent effect teardown and connection drops!
   * ------------------------------------------------------------- */
  useEffect(() => {
    if (!activeCall?.callID) return;

    let isCancelled = false;
    const isVideoCall = activeCall.callType === "video";
    const activeCallerUid = currentUidRef.current;
    const activeUser = currentUserRef.current;
    const callDocRef = doc(db, "calls", activeCall.callID);

    // Candidate Queuing to avoid DOMException: "The remote description was null"
    let isRemoteDescSet = false;
    const candidateQueue = [];

    const addIceCandidateSafe = async (candidate) => {
      const pc = pcRef.current;
      if (!pc) return;
      if (isRemoteDescSet && pc.remoteDescription && pc.remoteDescription.type) {
        try {
          await pc.addIceCandidate(candidate);
        } catch (e) {
          console.warn("addIceCandidate error:", e);
        }
      } else {
        candidateQueue.push(candidate);
      }
    };

    const flushCandidateQueue = async () => {
      isRemoteDescSet = true;
      const pc = pcRef.current;
      if (!pc) return;
      while (candidateQueue.length > 0) {
        const cand = candidateQueue.shift();
        try {
          await pc.addIceCandidate(cand);
        } catch (e) {
          console.warn("Failed to flush queued candidate:", e);
        }
      }
    };

    const setupWebRTC = async () => {
      try {
        setCallStatus(isIncoming ? "connecting" : "initiating");

        // 1. Peer Connection with modern ICE config
        const pc = new RTCPeerConnection(RTC_CONFIG);
        pcRef.current = pc;

        // ICE Connection State Monitoring
        pc.oniceconnectionstatechange = () => {
          const state = pc.iceConnectionState;
          if (state === "disconnected" || state === "failed") {
            setNetworkQuality("poor");
            setCallStatus("reconnecting");
            if (pc.restartIce) {
              pc.restartIce();
            }
          } else if (state === "connected" || state === "completed") {
            setNetworkQuality("good");
            setCallStatus("connected");
            toneGen.stop();
          }
        };

        // 2. Hardware Media Stream Acquisition with Slow Internet / Low-Bandwidth Optimizations
        const audioConstraints = {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1, // Mono saves 50% bandwidth on mobile/slow networks
          ...(selectedAudioInputRef.current ? { deviceId: { exact: selectedAudioInputRef.current } } : {}),
        };

        const videoConstraints = isVideoCall
          ? {
              width: { ideal: 640, max: 854 },
              height: { ideal: 480, max: 480 },
              frameRate: { ideal: 24, max: 30 },
              ...(selectedVideoInputRef.current ? { deviceId: { exact: selectedVideoInputRef.current } } : {}),
            }
          : false;

        let localStream = null;
        try {
          localStream = await navigator.mediaDevices.getUserMedia({
            audio: audioConstraints,
            video: videoConstraints,
          });
        } catch (mediaErr) {
          console.warn("Could not get requested camera/mic, falling back to audio only:", mediaErr);
          try {
            localStream = await navigator.mediaDevices.getUserMedia({
              audio: true,
              video: false,
            });
          } catch (e2) {
            console.error("Audio fallback also failed:", e2);
          }
        }

        if (isCancelled) {
          localStream?.getTracks().forEach((t) => t.stop());
          return;
        }

        localStreamRef.current = localStream;
        if (localVideoRef.current && localStream) {
          localVideoRef.current.srcObject = localStream;
        }

        // Cache camera track for screen share toggle
        const vTrack = localStream?.getVideoTracks()[0];
        if (vTrack) {
          cameraTrackRef.current = vTrack;
        }

        // Add Local tracks to PC with Bandwidth Encodings
        if (localStream) {
          localStream.getTracks().forEach((track) => {
            const sender = pc.addTrack(track, localStream);
            if (track.kind === "video") {
              try {
                const params = sender.getParameters();
                if (!params.encodings) params.encodings = [{}];
                params.encodings[0].maxBitrate = 500000; // 500 kbps for smooth video on mobile
                sender.setParameters(params).catch(() => {});
              } catch (e) {}
            } else if (track.kind === "audio") {
              try {
                const params = sender.getParameters();
                if (!params.encodings) params.encodings = [{}];
                params.encodings[0].maxBitrate = 32000; // 32 kbps crystal-clear Opus voice
                sender.setParameters(params).catch(() => {});
              } catch (e) {}
            }
          });
        }

        // Configure transceivers & mobile codec preferences (VP8/H264)
        if (pc.addTransceiver) {
          try {
            const hasAudioTransceiver = pc.getTransceivers().some((t) => t.receiver?.track?.kind === "audio");
            if (!hasAudioTransceiver) {
              pc.addTransceiver("audio", { direction: "sendrecv" });
            }
            if (isVideoCall) {
              const hasVideoTransceiver = pc.getTransceivers().some((t) => t.receiver?.track?.kind === "video");
              const videoTransceiver = hasVideoTransceiver
                ? pc.getTransceivers().find((t) => t.receiver?.track?.kind === "video")
                : pc.addTransceiver("video", { direction: "sendrecv" });

              if (videoTransceiver && typeof videoTransceiver.setCodecPreferences === "function" && window.RTCRtpReceiver?.getCapabilities) {
                const capabilities = window.RTCRtpReceiver.getCapabilities("video");
                if (capabilities && capabilities.codecs) {
                  const preferred = capabilities.codecs.filter(
                    (c) => c.mimeType === "video/VP8" || c.mimeType === "video/H264"
                  );
                  const others = capabilities.codecs.filter(
                    (c) => c.mimeType !== "video/VP8" && c.mimeType !== "video/H264"
                  );
                  videoTransceiver.setCodecPreferences([...preferred, ...others]);
                }
              }
            }
          } catch (tErr) {
            console.warn("Transceiver setup note:", tErr);
          }
        }

        // 3. Remote Tracks Handler (Dedicated Audio Element Guarantees Remote Hearing)
        pc.ontrack = (event) => {
          if (event.streams && event.streams[0]) {
            const remoteStream = event.streams[0];
            remoteStreamRef.current = remoteStream;

            // Ensure all audio tracks are active and unmuted
            remoteStream.getAudioTracks().forEach((t) => {
              t.enabled = true;
            });

            // Dedicated persistent audio element playback
            if (remoteAudioRef.current) {
              remoteAudioRef.current.srcObject = remoteStream;
              remoteAudioRef.current.volume = 1.0;
              remoteAudioRef.current
                .play()
                .then(() => setAudioAutoplayBlocked(false))
                .catch((playErr) => {
                  console.warn("Autoplay audio blocked by browser policy:", playErr);
                  setAudioAutoplayBlocked(true);
                });
            }

            // Video element playback
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = remoteStream;
              remoteVideoRef.current.play().catch(() => {});
            }

            const hasVideo = remoteStream.getVideoTracks().length > 0;
            setHasRemoteVideo(hasVideo);
          }
        };

        // 4. ICE candidate sender with Android cross-compatibility (dual-writes to direction subcol and candidates)
        pc.onicecandidate = (event) => {
          if (event.candidate && callDocRef) {
            const candJSON = event.candidate.toJSON();
            if (candJSON && candJSON.candidate) {
              const subCol = isIncoming ? "calleeCandidates" : "callerCandidates";
              const candPayload = {
                candidate: candJSON.candidate,
                sdpMid: candJSON.sdpMid !== undefined && candJSON.sdpMid !== null ? String(candJSON.sdpMid) : "0",
                sdpMLineIndex: typeof candJSON.sdpMLineIndex === "number" ? candJSON.sdpMLineIndex : 0,
                senderId: activeCallerUid || "web",
                createdAt: serverTimestamp(),
              };

              addDoc(collection(callDocRef, subCol), candPayload).catch(() => {});
              addDoc(collection(callDocRef, "candidates"), {
                ...candPayload,
                type: isIncoming ? "callee" : "caller",
              }).catch(() => {});
            }
          }
        };

        // Group Call: Sync participant presence in calls/{callID}/participants
        if (effectiveUid && callDocRef) {
          const myParticipantRef = doc(db, "calls", activeCall.callID, "participants", effectiveUid);
          setDoc(
            myParticipantRef,
            {
              uid: effectiveUid,
              name: activeUser?.displayName || "User",
              avatar: activeUser?.photoURL || "",
              joinedAt: serverTimestamp(),
              status: "in-call",
              muted: isMuted,
              videoOff: isVideoOff,
            },
            { merge: true }
          ).catch(() => {});

          const participantsCol = collection(callDocRef, "participants");
          unsubscribeParticipantsRef.current = onSnapshot(participantsCol, (snap) => {
            const parts = snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
            setGroupParticipants(parts);
          });
        }

        // Candidate ingestion deduplicator & normalizer
        const seenCandidateKeys = new Set();
        const processCandidateDoc = (change) => {
          if (change.type === "added") {
            const raw = change.doc.data();
            if (!raw) return;
            if (raw.senderId && raw.senderId === activeCallerUid) return;
            const norm = normalizeCandidate(raw);
            if (norm && !seenCandidateKeys.has(norm.candidate)) {
              seenCandidateKeys.add(norm.candidate);
              try {
                const candidate = new RTCIceCandidate(norm);
                addIceCandidateSafe(candidate);
              } catch (e) {
                console.warn("Candidate parse error:", e);
              }
            }
          }
        };

        // 5. Firestore Signaling Setup
        if (!isIncoming) {
          // --- CALLER LOGIC ---
          setCallStatus("calling");
          toneGen.playRingback();

          // 45s ringing timeout for caller
          callTimeoutRef.current = setTimeout(() => {
            if (callStatusRef.current === "calling" || callStatusRef.current === "initiating") {
              endCallRef.current();
            }
          }, 45000);

          // Prepare subcollection history docs for both users
          const callerHistoryDocRef = doc(collection(db, "users", activeCallerUid, "callHistory"));
          const receiverHistoryDocRef = doc(collection(db, "users", activeCall.receiverId, "callHistory"));

          callerHistoryDocIdRef.current = callerHistoryDocRef.id;
          receiverHistoryDocIdRef.current = receiverHistoryDocRef.id;

          // Generate SDP Offer with Opus FEC & DTX
          const offerDescription = await pc.createOffer();
          const optimizedOfferSdp = optimizeSDP(offerDescription.sdp);
          await pc.setLocalDescription(new RTCSessionDescription({
            type: offerDescription.type,
            sdp: optimizedOfferSdp,
          }));

          const callerName = activeUser?.displayName || activeCall.callerName || "User";
          const callerHandle = activeCall.callerHandle || activeUser?.email?.split("@")[0] || "";
          const callerAvatar = activeUser?.photoURL || activeCall.callerAvatar || "";
          const receiverName = activeCall.receiverName || "User";
          const receiverHandle = activeCall.receiverHandle || "";
          const receiverAvatar = activeCall.receiverAvatar || "";
          const callTypeVal = activeCall.callType || "video";

          // Log history to caller's users/{uid}/callHistory
          await setDoc(callerHistoryDocRef, cleanPayload({
            id: callerHistoryDocRef.id,
            callID: activeCall.callID,
            callType: callTypeVal,
            direction: "outgoing",
            status: "calling",
            peerId: activeCall.receiverId,
            peerName: receiverName,
            peerAvatar: receiverAvatar,
            peerHandle: receiverHandle,
            callerId: activeCallerUid,
            callerName,
            callerAvatar,
            callerHandle,
            receiverId: activeCall.receiverId,
            receiverName,
            receiverAvatar,
            receiverHandle,
            createdAt: serverTimestamp(),
            duration: 0,
            durationSeconds: 0,
          })).catch((e) => console.warn("Caller history error:", e));

          // Log history to receiver's users/{uid}/callHistory
          await setDoc(receiverHistoryDocRef, cleanPayload({
            id: receiverHistoryDocRef.id,
            callID: activeCall.callID,
            callType: callTypeVal,
            direction: "incoming",
            status: "calling",
            peerId: activeCallerUid,
            peerName: callerName,
            peerAvatar: callerAvatar,
            peerHandle: callerHandle,
            callerId: activeCallerUid,
            callerName,
            callerAvatar,
            callerHandle,
            receiverId: activeCall.receiverId,
            receiverName,
            receiverAvatar,
            receiverHandle,
            createdAt: serverTimestamp(),
            duration: 0,
            durationSeconds: 0,
          })).catch((e) => console.warn("Receiver history error:", e));

          // Save call document to calls/{callID}
          await setDoc(callDocRef, cleanPayload({
            callID: activeCall.callID,
            callType: callTypeVal,
            callerId: activeCallerUid,
            callerName,
            callerHandle,
            callerAvatar,
            receiverId: activeCall.receiverId,
            receiverName,
            receiverHandle,
            receiverAvatar,
            callerHistoryDocId: callerHistoryDocRef.id,
            receiverHistoryDocId: receiverHistoryDocRef.id,
            status: "calling",
            offer: {
              sdp: optimizedOfferSdp,
              type: offerDescription.type,
            },
            createdAt: serverTimestamp(),
          }));

          // Listen for Callee Answer & Status updates from Web and Android
          unsubscribeCallRef.current = onSnapshot(callDocRef, async (snapshot) => {
            const data = snapshot.data();
            if (!data) return;

            if (data.status === "ended") {
              endCallRef.current();
            } else if (["connected", "accepted", "answered", "in-call"].includes(data.status)) {
              toneGen.stop();
              if (callTimeoutRef.current) {
                clearTimeout(callTimeoutRef.current);
                callTimeoutRef.current = null;
              }
              setCallStatus("connected");
              if (!timerRef.current) {
                timerRef.current = setInterval(() => setDuration((prev) => prev + 1), 1000);
              }
            }

            let answerPayload = data.answer;
            if (typeof answerPayload === "string") {
              try {
                answerPayload = JSON.parse(answerPayload);
              } catch (e) {}
            }

            if (!pc.currentRemoteDescription && answerPayload && answerPayload.sdp) {
              toneGen.stop();
              if (callTimeoutRef.current) {
                clearTimeout(callTimeoutRef.current);
                callTimeoutRef.current = null;
              }
              try {
                const answerDescription = new RTCSessionDescription({
                  type: answerPayload.type || "answer",
                  sdp: optimizeSDP(answerPayload.sdp),
                });
                await pc.setRemoteDescription(answerDescription);
                await flushCandidateQueue();
                setCallStatus("connected");
                if (!timerRef.current) {
                  timerRef.current = setInterval(() => setDuration((prev) => prev + 1), 1000);
                }
              } catch (e) {
                console.warn("setRemoteDescription answer error:", e);
              }
            }
          });

          // Listen for calleeCandidates & general candidates
          const calleeCandidatesCol = collection(callDocRef, "calleeCandidates");
          unsubscribeCandidatesRef.current = onSnapshot(calleeCandidatesCol, (snapshot) => {
            snapshot.docChanges().forEach(processCandidateDoc);
          });
          const generalCandidatesCol = collection(callDocRef, "candidates");
          unsubscribeGeneralCandidatesRef.current = onSnapshot(generalCandidatesCol, (snapshot) => {
            snapshot.docChanges().forEach(processCandidateDoc);
          });
        } else {
          // --- CALLEE (RECEIVER) LOGIC ---
          setCallStatus("connected");
          toneGen.stop();
          if (!timerRef.current) {
            timerRef.current = setInterval(() => setDuration((prev) => prev + 1), 1000);
          }

          let hasAnswered = false;

          // Callee listens for the offer on callDocRef with onSnapshot
          unsubscribeCallRef.current = onSnapshot(callDocRef, async (snapshot) => {
            const data = snapshot.data();
            if (!data) return;

            if (data.status === "ended") {
              endCallRef.current();
              return;
            }

            callerHistoryDocIdRef.current = data.callerHistoryDocId || null;
            receiverHistoryDocIdRef.current = data.receiverHistoryDocId || null;

            let offerPayload = data.offer;
            if (typeof offerPayload === "string") {
              try {
                offerPayload = JSON.parse(offerPayload);
              } catch (e) {}
            }

            if (!hasAnswered && offerPayload && offerPayload.sdp && !pc.currentRemoteDescription) {
              hasAnswered = true;
              try {
                await pc.setRemoteDescription(new RTCSessionDescription({
                  type: offerPayload.type || "offer",
                  sdp: optimizeSDP(offerPayload.sdp),
                }));
                await flushCandidateQueue();
                const answerDescription = await pc.createAnswer();
                const optimizedAnswerSdp = optimizeSDP(answerDescription.sdp);
                await pc.setLocalDescription(new RTCSessionDescription({
                  type: answerDescription.type,
                  sdp: optimizedAnswerSdp,
                }));

                await updateDoc(callDocRef, {
                  answer: {
                    type: answerDescription.type,
                    sdp: optimizedAnswerSdp,
                  },
                  status: "connected",
                  acceptedAt: serverTimestamp(),
                });

                // Update call history entries to "connected"
                if (data.callerHistoryDocId && data.callerId) {
                  await updateDoc(doc(db, "users", data.callerId, "callHistory", data.callerHistoryDocId), {
                    status: "connected",
                    acceptedAt: serverTimestamp(),
                  }).catch(() => {});
                }
                if (data.receiverHistoryDocId && data.receiverId) {
                  await updateDoc(doc(db, "users", data.receiverId, "callHistory", data.receiverHistoryDocId), {
                    status: "connected",
                    acceptedAt: serverTimestamp(),
                  }).catch(() => {});
                }
              } catch (calleeErr) {
                console.error("Callee answer failed:", calleeErr);
              }
            }
          });

          // Listen for callerCandidates & general candidates
          const callerCandidatesCol = collection(callDocRef, "callerCandidates");
          unsubscribeCandidatesRef.current = onSnapshot(callerCandidatesCol, (snapshot) => {
            snapshot.docChanges().forEach(processCandidateDoc);
          });
          const generalCandidatesCol = collection(callDocRef, "candidates");
          unsubscribeGeneralCandidatesRef.current = onSnapshot(generalCandidatesCol, (snapshot) => {
            snapshot.docChanges().forEach(processCandidateDoc);
          });
        }

        // 6. In-Call Real-time Reactions Listener
        const reactionsCol = collection(callDocRef, "reactions");
        unsubscribeReactionsRef.current = onSnapshot(reactionsCol, (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            if (change.type === "added") {
              const rxData = change.doc.data();
              setReactions((prev) => [
                ...prev.slice(-15),
                {
                  id: change.doc.id,
                  emoji: rxData.emoji,
                  senderName: rxData.senderName,
                  createdAt: Date.now(),
                },
              ]);
              toneGen.playReactionPop();
            }
          });
        });

        // 7. In-Call Real-time Messages Listener
        const messagesCol = query(collection(callDocRef, "messages"), orderBy("createdAt", "asc"), limit(40));
        unsubscribeMessagesRef.current = onSnapshot(messagesCol, (snapshot) => {
          const msgs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
          setInCallMessages(msgs);
        });
      } catch (err) {
        console.error("WebRTC Setup error:", err);
      }
    };

    setupWebRTC();

    return () => {
      isCancelled = true;
      cleanupStreamsAndPC();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCall?.callID, isIncoming, cleanupStreamsAndPC]);

  /* -------------------------------------------------------------
   * 10. IN-CALL CONTROLS: MUTE, VIDEO, SCREENSHARE, REACTIONS, MESSAGES
   * ------------------------------------------------------------- */
  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach((t) => {
        t.enabled = isMuted;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      videoTracks.forEach((t) => {
        t.enabled = isVideoOff;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  const toggleScreenShare = async () => {
    if (!pcRef.current) return;
    try {
      if (!isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];

        const sender = pcRef.current.getSenders().find((s) => s.track && s.track.kind === "video");
        if (sender) {
          sender.replaceTrack(screenTrack);
        }
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }

        screenTrack.onended = () => {
          stopScreenSharing();
        };

        setIsScreenSharing(true);
      } else {
        stopScreenSharing();
      }
    } catch (err) {
      console.warn("Screen share cancelled or failed:", err);
    }
  };

  const stopScreenSharing = () => {
    if (cameraTrackRef.current && pcRef.current) {
      const sender = pcRef.current.getSenders().find((s) => s.track && s.track.kind === "video");
      if (sender) {
        sender.replaceTrack(cameraTrackRef.current);
      }
      if (localVideoRef.current && localStreamRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
    }
    setIsScreenSharing(false);
  };

  const sendReaction = async (emoji) => {
    if (!activeCall?.callID || !effectiveUid) return;
    toneGen.playReactionPop();
    try {
      const callDocRef = doc(db, "calls", activeCall.callID);
      await addDoc(collection(callDocRef, "reactions"), {
        emoji,
        senderId: effectiveUid,
        senderName: effectiveUser?.displayName || "User",
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      console.warn("Failed to broadcast reaction:", e);
    }
  };

  const sendInCallMessage = async (text) => {
    if (!activeCall?.callID || !effectiveUid || !text.trim()) return;
    try {
      const callDocRef = doc(db, "calls", activeCall.callID);
      await addDoc(collection(callDocRef, "messages"), {
        text: text.trim(),
        senderId: effectiveUid,
        senderName: effectiveUser?.displayName || "User",
        senderAvatar: effectiveUser?.photoURL || "",
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      console.warn("Failed to send in-call message:", e);
    }
  };

  // Helper to unlock blocked autoplay audio
  const unlockAudioAutoplay = () => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current
        .play()
        .then(() => setAudioAutoplayBlocked(false))
        .catch((e) => console.warn("Audio unlock failed:", e));
    }
  };

  // Callback ref attachers to preserve video streams across PiP and Full-Screen switching
  const attachLocalVideo = useCallback((el) => {
    localVideoRef.current = el;
    if (el && localStreamRef.current) {
      el.srcObject = localStreamRef.current;
    }
  }, []);

  const attachRemoteVideo = useCallback((el) => {
    remoteVideoRef.current = el;
    if (el && remoteStreamRef.current) {
      el.srcObject = remoteStreamRef.current;
      el.play().catch(() => {});
    }
  }, []);

  // Format call duration MM:SS
  const formatCallTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <CallContext.Provider
      value={{
        activeCall,
        incomingCall,
        callStatus,
        duration,
        formatCallTime,
        isIncoming,
        isMinimized,
        setIsMinimized,
        isChatPage,
        lowDataMode,
        setLowDataMode,
        isMuted,
        isVideoOff,
        isSpeakerOn,
        toggleSpeaker,
        isScreenSharing,
        hasRemoteVideo,
        audioAutoplayBlocked,
        unlockAudioAutoplay,
        networkQuality,
        devices,
        selectedAudioInput,
        selectedVideoInput,
        selectedAudioOutput,
        setSelectedAudioInput: switchAudioDevice,
        setSelectedVideoInput: switchVideoDevice,
        switchAudioOutput,
        permissions,
        requestCallPermissions,
        startCall,
        acceptIncomingCall,
        declineIncomingCall,
        endCall,
        inviteUserToCall,
        groupParticipants,
        currentUser: effectiveUser,
        toggleMute,
        toggleVideo,
        toggleScreenShare,
        sendReaction,
        sendInCallMessage,
        reactions,
        inCallMessages,
        localVideoRef,
        remoteVideoRef,
        attachLocalVideo,
        attachRemoteVideo,
        localStreamRef,
        remoteStreamRef,
        remoteAudioRef,
        navigate,
      }}
    >
      {/* 
        Dedicated global hidden audio element.
        Mounted persistently at the provider root ensures remote audio stream
        ALWAYS plays directly through the phone/desktop speaker or headphones,
        even if the video element is minimized, off, or hidden!
      */}
      <audio
        ref={remoteAudioRef}
        autoPlay
        playsInline
        style={{ display: "none" }}
      />
      {children}
    </CallContext.Provider>
  );
}

export function useCall() {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error("useCall must be used within a CallProvider");
  }
  return context;
}

export default CallContext;
