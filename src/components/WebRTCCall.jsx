import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  IconButton,
  Avatar,
  Dialog,
  Stack,
  Tooltip,
  Chip,
} from "@mui/material";
import CallIcon from "@mui/icons-material/Call";
import CallEndIcon from "@mui/icons-material/CallEnd";
import VideocamIcon from "@mui/icons-material/Videocam";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import {
  doc,
  setDoc,
  updateDoc,
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebase";

const RTC_CONFIG = {
  iceServers: [
    { urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"] },
  ],
  iceCandidatePoolSize: 10,
};

export default function WebRTCCall({
  open,
  onClose,
  callData,
  isIncoming = false,
  currentUser,
}) {
  const [callStatus, setCallStatus] = useState("initiating"); // "initiating" | "ringing" | "connected" | "ended"
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [hasRemoteVideo, setHasRemoteVideo] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const timerRef = useRef(null);
  const unsubscribeCallRef = useRef(null);
  const unsubscribeCandidatesRef = useRef(null);

  const callType = callData?.callType || "video";
  const isVideo = callType === "video";

  // Peer details to display
  const otherPartyName = isIncoming ? callData?.callerName : callData?.receiverName;
  const otherPartyAvatar = isIncoming ? callData?.callerAvatar : callData?.receiverAvatar;
  const otherPartyHandle = isIncoming ? callData?.callerHandle : callData?.receiverHandle;

  // Cleanup helper
  const cleanupStreamsAndPC = () => {
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
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
  };

  // End Call Action
  const handleEndCall = async () => {
    try {
      if (callData?.callID) {
        const callDocRef = doc(db, "calls", callData.callID);
        await updateDoc(callDocRef, {
          status: "ended",
          endedAt: serverTimestamp(),
        }).catch(() => {});
      }
    } catch (err) {
      console.warn("Error marking call ended in firestore:", err);
    }
    cleanupStreamsAndPC();
    setCallStatus("ended");
    setTimeout(() => {
      onClose();
    }, 800);
  };

  // Toggle Mute
  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
    }
  };

  // Toggle Video
  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      videoTracks.forEach((track) => {
        track.enabled = isVideoOff;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  // Initialize Call Effect
  useEffect(() => {
    if (!open || !callData?.callID || !currentUser) return;

    let isCancelled = false;

    const startWebRTC = async () => {
      try {
        const pc = new RTCPeerConnection(RTC_CONFIG);
        pcRef.current = pc;

        // Get Local Stream
        let localStream = null;
        try {
          localStream = await navigator.mediaDevices.getUserMedia({
            video: isVideo ? { width: { ideal: 640 }, height: { ideal: 480 } } : false,
            audio: true,
          });
        } catch (mediaErr) {
          console.warn("Could not get requested media, trying audio only fallback:", mediaErr);
          localStream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
        }

        if (isCancelled) {
          localStream?.getTracks().forEach((t) => t.stop());
          return;
        }

        localStreamRef.current = localStream;
        if (localVideoRef.current && localStream) {
          localVideoRef.current.srcObject = localStream;
        }

        // Add Local tracks to PC
        localStream.getTracks().forEach((track) => {
          pc.addTrack(track, localStream);
        });

        // Remote track handler
        pc.ontrack = (event) => {
          if (remoteVideoRef.current && event.streams && event.streams[0]) {
            remoteVideoRef.current.srcObject = event.streams[0];
            const hasVideoTrack = event.streams[0].getVideoTracks().length > 0;
            setHasRemoteVideo(hasVideoTrack);
          }
        };

        const callDocRef = doc(db, "calls", callData.callID);

        // Caller or Callee logic
        if (!isIncoming) {
          // CALLER LOGIC
          setCallStatus("calling");

          // Send caller ICE candidates to callerCandidates subcollection
          pc.onicecandidate = (event) => {
            if (event.candidate && callDocRef) {
              const callerCandidatesCol = collection(callDocRef, "callerCandidates");
              addDoc(callerCandidatesCol, event.candidate.toJSON()).catch((e) => console.warn(e));
            }
          };

          // Create Offer
          const offerDescription = await pc.createOffer();
          await pc.setLocalDescription(offerDescription);

          const offer = {
            sdp: offerDescription.sdp,
            type: offerDescription.type,
          };

          // Save call document to Firestore
          await setDoc(callDocRef, {
            callID: callData.callID,
            callType: callData.callType || "video",
            callerId: currentUser.uid,
            callerName: currentUser.displayName || callData.callerName || "User",
            callerHandle: callData.callerHandle || currentUser.email?.split("@")[0] || "",
            callerAvatar: currentUser.photoURL || callData.callerAvatar || "",
            receiverId: callData.receiverId,
            receiverName: callData.receiverName || "User",
            receiverHandle: callData.receiverHandle || "",
            receiverAvatar: callData.receiverAvatar || "",
            status: "calling",
            offer,
            createdAt: serverTimestamp(),
          });

          // Listen for Callee Answer
          unsubscribeCallRef.current = onSnapshot(callDocRef, (snapshot) => {
            const data = snapshot.data();
            if (!data) return;

            if (data.status === "ended") {
              handleEndCall();
            } else if (data.status === "connected" && !timerRef.current) {
              setCallStatus("connected");
              timerRef.current = setInterval(() => setDuration((prev) => prev + 1), 1000);
            }

            if (!pc.currentRemoteDescription && data.answer) {
              const answerDescription = new RTCSessionDescription(data.answer);
              pc.setRemoteDescription(answerDescription).catch((e) => console.warn(e));
              setCallStatus("connected");
              if (!timerRef.current) {
                timerRef.current = setInterval(() => setDuration((prev) => prev + 1), 1000);
              }
            }
          });

          // Listen for remote ICE candidates (calleeCandidates)
          const calleeCandidatesCol = collection(callDocRef, "calleeCandidates");
          unsubscribeCandidatesRef.current = onSnapshot(calleeCandidatesCol, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
              if (change.type === "added") {
                const candidate = new RTCIceCandidate(change.doc.data());
                pc.addIceCandidate(candidate).catch((e) => console.warn(e));
              }
            });
          });
        } else {
          // CALLEE (RECEIVER) LOGIC
          setCallStatus("connected");
          if (!timerRef.current) {
            timerRef.current = setInterval(() => setDuration((prev) => prev + 1), 1000);
          }

          // Send callee candidates to calleeCandidates subcollection
          pc.onicecandidate = (event) => {
            if (event.candidate && callDocRef) {
              const calleeCandidatesCol = collection(callDocRef, "calleeCandidates");
              addDoc(calleeCandidatesCol, event.candidate.toJSON()).catch((e) => console.warn(e));
            }
          };

          // Get the offer from Firestore
          const callSnap = await getDoc(callDocRef);
          const callDocData = callSnap.data();

          if (callDocData?.offer) {
            await pc.setRemoteDescription(new RTCSessionDescription(callDocData.offer));
            const answerDescription = await pc.createAnswer();
            await pc.setLocalDescription(answerDescription);

            const answer = {
              type: answerDescription.type,
              sdp: answerDescription.sdp,
            };

            await updateDoc(callDocRef, {
              answer,
              status: "connected",
            });
          }

          // Listen for call document status updates
          unsubscribeCallRef.current = onSnapshot(callDocRef, (snapshot) => {
            const data = snapshot.data();
            if (data?.status === "ended") {
              handleEndCall();
            }
          });

          // Listen for caller Candidates
          const callerCandidatesCol = collection(callDocRef, "callerCandidates");
          unsubscribeCandidatesRef.current = onSnapshot(callerCandidatesCol, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
              if (change.type === "added") {
                const candidate = new RTCIceCandidate(change.doc.data());
                pc.addIceCandidate(candidate).catch((e) => console.warn(e));
              }
            });
          });
        }
      } catch (err) {
        console.error("WebRTC Setup Error:", err);
      }
    };

    startWebRTC();

    return () => {
      isCancelled = true;
      cleanupStreamsAndPC();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, callData?.callID]);

  const formatCallTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    return `${String(mins).padStart(2, "0")}:${String(remSecs).padStart(2, "0")}`;
  };

  return (
    <Dialog
      open={open}
      onClose={handleEndCall}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "28px",
          bgcolor: "#0d0f12",
          color: "#fff",
          overflow: "hidden",
          boxShadow: "0 24px 60px rgba(0,0,0,0.8)",
          border: "1px solid rgba(255,255,255,0.08)",
          minHeight: 520,
        },
      }}
    >
      <Box sx={{ position: "relative", width: "100%", height: 520, bgcolor: "#0a0a0c", overflow: "hidden" }}>
        {/* Remote Video Stream or Avatar fallback */}
        {isVideo ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: hasRemoteVideo ? "block" : "none",
            }}
          />
        ) : null}

        {/* Big Avatar Fallback for Audio Call or when Remote Video is off */}
        {(!isVideo || !hasRemoteVideo) && (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              background: "radial-gradient(circle at center, #1b222d 0%, #07090c 100%)",
            }}
          >
            <Avatar
              src={otherPartyAvatar}
              sx={{
                width: 110,
                height: 110,
                border: "4px solid rgba(255,255,255,0.12)",
                boxShadow: "0 12px 32px rgba(0,0,0,0.5)",
                mb: 2,
              }}
            >
              {otherPartyName?.[0] || "U"}
            </Avatar>
            <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: "-0.5px" }}>
              {otherPartyName || "User"}
            </Typography>
            {otherPartyHandle && (
              <Typography variant="body2" sx={{ opacity: 0.6, mt: 0.3 }}>
                @{otherPartyHandle}
              </Typography>
            )}
            <Chip
              label={
                callStatus === "connected"
                  ? formatCallTime(duration)
                  : callStatus === "calling"
                  ? "Calling..."
                  : "Connecting..."
              }
              sx={{
                mt: 2,
                bgcolor: callStatus === "connected" ? "rgba(46,125,50,0.3)" : "rgba(255,255,255,0.08)",
                color: callStatus === "connected" ? "#4caf50" : "#fff",
                fontWeight: 700,
                fontSize: "0.82rem",
              }}
            />
          </Box>
        )}

        {/* Small Picture-in-Picture Local Video Preview (for Video Calls) */}
        {isVideo && (
          <Box
            sx={{
              position: "absolute",
              top: 20,
              right: 20,
              width: 140,
              height: 105,
              borderRadius: "16px",
              overflow: "hidden",
              border: "2px solid rgba(255,255,255,0.18)",
              boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
              bgcolor: "#1a1a1a",
              zIndex: 10,
            }}
          >
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transform: "scaleX(-1)",
                display: isVideoOff ? "none" : "block",
              }}
            />
            {isVideoOff && (
              <Box
                sx={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: "#1e1e24",
                }}
              >
                <VideocamOffIcon sx={{ opacity: 0.5, fontSize: 32 }} />
              </Box>
            )}
          </Box>
        )}

        {/* Header Details (Top Left) */}
        <Box
          sx={{
            position: "absolute",
            top: 20,
            left: 20,
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            p: 1,
            px: 1.5,
            borderRadius: "99px",
            bgcolor: "rgba(0,0,0,0.4)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <Box
            sx={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              bgcolor: callStatus === "connected" ? "#00e676" : "#ffb300",
              boxShadow: callStatus === "connected" ? "0 0 10px #00e676" : "none",
            }}
          />
          <Typography variant="caption" sx={{ fontWeight: 800, letterSpacing: "0.5px" }}>
            {callStatus === "connected"
              ? `${isVideo ? "VIDEO" : "AUDIO"} CALL • ${formatCallTime(duration)}`
              : callStatus === "calling"
              ? "CALLING..."
              : "CONNECTING..."}
          </Typography>
        </Box>

        {/* Control Bar (Bottom Floating Action Pill) */}
        <Box
          sx={{
            position: "absolute",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            gap: 2,
            p: 1.2,
            px: 2.5,
            borderRadius: "99px",
            bgcolor: "rgba(18, 20, 24, 0.75)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.12)",
            boxShadow: "0 12px 36px rgba(0,0,0,0.7)",
          }}
        >
          {/* Mic Toggle */}
          <Tooltip title={isMuted ? "Unmute" : "Mute"}>
            <IconButton
              onClick={toggleMute}
              sx={{
                bgcolor: isMuted ? "rgba(244, 67, 54, 0.2)" : "rgba(255,255,255,0.08)",
                color: isMuted ? "#f44336" : "#fff",
                width: 48,
                height: 48,
                "&:hover": {
                  bgcolor: isMuted ? "rgba(244, 67, 54, 0.3)" : "rgba(255,255,255,0.15)",
                },
              }}
            >
              {isMuted ? <MicOffIcon /> : <MicIcon />}
            </IconButton>
          </Tooltip>

          {/* Video Toggle (Only for Video Calls) */}
          {isVideo && (
            <Tooltip title={isVideoOff ? "Turn Video On" : "Turn Video Off"}>
              <IconButton
                onClick={toggleVideo}
                sx={{
                  bgcolor: isVideoOff ? "rgba(244, 67, 54, 0.2)" : "rgba(255,255,255,0.08)",
                  color: isVideoOff ? "#f44336" : "#fff",
                  width: 48,
                  height: 48,
                  "&:hover": {
                    bgcolor: isVideoOff ? "rgba(244, 67, 54, 0.3)" : "rgba(255,255,255,0.15)",
                  },
                }}
              >
                {isVideoOff ? <VideocamOffIcon /> : <VideocamIcon />}
              </IconButton>
            </Tooltip>
          )}

          {/* End Call Button */}
          <Tooltip title="End Call">
            <IconButton
              onClick={handleEndCall}
              sx={{
                bgcolor: "#f44336",
                color: "#fff",
                width: 52,
                height: 52,
                boxShadow: "0 6px 16px rgba(244,67,54,0.4)",
                "&:hover": {
                  bgcolor: "#d32f2f",
                  transform: "scale(1.05)",
                },
                transition: "all 0.2s ease",
              }}
            >
              <CallEndIcon sx={{ fontSize: 28 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Dialog>
  );
}

export function IncomingCallDialog({ open, callData, onAccept, onDecline }) {
  if (!callData) return null;
  const isVideo = callData.callType === "video";

  return (
    <Dialog
      open={open}
      onClose={onDecline}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "24px",
          bgcolor: "#121418",
          color: "#fff",
          p: 3,
          textAlign: "center",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 20px 50px rgba(0,0,0,0.8)",
        },
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <Avatar
          src={callData.callerAvatar}
          sx={{
            width: 84,
            height: 84,
            mb: 2,
            border: "3px solid #00e676",
            boxShadow: "0 0 24px rgba(0,230,118,0.4)",
          }}
        >
          {callData.callerName?.[0] || "U"}
        </Avatar>

        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          {callData.callerName || "Unknown Caller"}
        </Typography>

        {callData.callerHandle && (
          <Typography variant="caption" sx={{ opacity: 0.6, mb: 1 }}>
            @{callData.callerHandle}
          </Typography>
        )}

        <Chip
          icon={
            isVideo ? (
              <VideocamIcon sx={{ fontSize: "1rem !important", color: "#00e676 !important" }} />
            ) : (
              <CallIcon sx={{ fontSize: "0.9rem !important", color: "#00e676 !important" }} />
            )
          }
          label={`Incoming ${isVideo ? "Video" : "Audio"} Call...`}
          sx={{
            bgcolor: "rgba(0,230,118,0.12)",
            color: "#00e676",
            fontWeight: 700,
            fontSize: "0.78rem",
            mb: 3,
          }}
        />

        <Stack direction="row" spacing={3} justifyContent="center" sx={{ width: "100%", mt: 1 }}>
          {/* Decline Button */}
          <IconButton
            onClick={onDecline}
            sx={{
              bgcolor: "#f44336",
              color: "#fff",
              width: 56,
              height: 56,
              "&:hover": { bgcolor: "#d32f2f", transform: "scale(1.06)" },
              transition: "all 0.2s ease",
            }}
          >
            <CallEndIcon sx={{ fontSize: 28 }} />
          </IconButton>

          {/* Accept Button */}
          <IconButton
            onClick={onAccept}
            sx={{
              bgcolor: "#00e676",
              color: "#000",
              width: 56,
              height: 56,
              boxShadow: "0 4px 20px rgba(0,230,118,0.5)",
              "&:hover": { bgcolor: "#00c853", transform: "scale(1.06)" },
              transition: "all 0.2s ease",
            }}
          >
            {isVideo ? <VideocamIcon sx={{ fontSize: 30 }} /> : <CallIcon sx={{ fontSize: 28 }} />}
          </IconButton>
        </Stack>
      </Box>
    </Dialog>
  );
}

