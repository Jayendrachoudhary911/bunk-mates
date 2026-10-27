import React, { useState } from "react";
import {
  Box,
  Dialog,
  Paper,
  IconButton,
  Tooltip,
  Typography,
  Button,
  Menu,
  MenuItem,
} from "@mui/material";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import BugReportIcon from "@mui/icons-material/BugReport";
import { motion, AnimatePresence } from "framer-motion";

import { useCall } from "../../contexts/CallContext";
import CallReactionsOverlay from "./CallReactionsOverlay";
import DeviceSettingsModal from "./DeviceSettingsModal";
import InCallChatDrawer from "./InCallChatDrawer";
import AddPersonToCallModal from "./AddPersonToCallModal";
import AudioCallIncoming from "./AudioCallIncoming";
import AudioCallOngoing from "./AudioCallOngoing";
import VideoCallIncoming from "./VideoCallIncoming";
import VideoCallOngoing from "./VideoCallOngoing";
import GroupAudioIncoming from "./GroupAudioIncoming";
import GroupAudioOngoing from "./GroupAudioOngoing";
import GroupVideoIncoming from "./GroupVideoIncoming";
import GroupVideoOngoing from "./GroupVideoOngoing";
import MinimizedCallPiP from "./MinimizedCallPiP";
import { DEFAULT_CALLER_AVATAR, DEFAULT_CALLER_NAME, DEFAULT_GROUP_MEMBERS } from "./CallAssets";

const REACTION_EMOJIS = ["❤️", "🔥", "👋", "✈️", "🎒", "🎉", "👏", "💯"];

export default function GlobalCallOverlay() {
  const {
    activeCall,
    incomingCall,
    callStatus,
    duration,
    formatCallTime,
    isIncoming,
    isMinimized,
    setIsMinimized,
    isChatPage,
    isMuted,
    isVideoOff,
    isSpeakerOn,
    toggleSpeaker,
    isScreenSharing,
    hasRemoteVideo,
    audioAutoplayBlocked,
    unlockAudioAutoplay,
    acceptIncomingCall,
    declineIncomingCall,
    endCall,
    toggleMute,
    toggleVideo,
    toggleScreenShare,
    sendReaction,
    reactions,
    groupParticipants,
    currentUser,
    attachLocalVideo,
    attachRemoteVideo,
    navigate,
  } = useCall();

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [addPersonOpen, setAddPersonOpen] = useState(false);
  const [chatDrawerOpen, setChatDrawerOpen] = useState(false);
  const [showReactionsBar, setShowReactionsBar] = useState(false);

  // Optional Preview Mode State for testing/demoing all 8 Figma screens
  const [previewScreen, setPreviewScreen] = useState(null);
  const [previewAnchorEl, setPreviewAnchorEl] = useState(null);

  /* ==============================================================
   * 1. INCOMING CALL SCREEN ROUTER (No active call yet)
   * ============================================================== */
  if (incomingCall && !activeCall && !previewScreen) {
    const isGroup = Boolean(incomingCall.isGroupCall || incomingCall.groupId);
    const isVideo = incomingCall.callType === "video";

    return (
      <Dialog
        open={true}
        fullScreen
        PaperProps={{
          sx: {
            bgcolor: "#020617",
            color: "#fff",
            overflow: "hidden",
            margin: 0,
            width: "100vw",
            height: "100vh",
          },
        }}
      >
        {isGroup && !isVideo && (
          <GroupAudioIncoming
            groupName={incomingCall.groupName || "Bunk1"}
            members={incomingCall.members || DEFAULT_GROUP_MEMBERS}
            onAccept={acceptIncomingCall}
            onDecline={declineIncomingCall}
            onSendMessage={() => {
              declineIncomingCall();
              if (incomingCall.groupId) navigate(`/group/${incomingCall.groupId}`);
            }}
          />
        )}

        {isGroup && isVideo && (
          <GroupVideoIncoming
            groupName={incomingCall.groupName || "Bunk1"}
            members={incomingCall.members || DEFAULT_GROUP_MEMBERS}
            onAccept={acceptIncomingCall}
            onDecline={declineIncomingCall}
            onSendMessage={() => {
              declineIncomingCall();
              if (incomingCall.groupId) navigate(`/group/${incomingCall.groupId}`);
            }}
          />
        )}

        {!isGroup && !isVideo && (
          <AudioCallIncoming
            callerName={incomingCall.callerName || DEFAULT_CALLER_NAME}
            callerAvatar={incomingCall.callerAvatar || DEFAULT_CALLER_AVATAR}
            callerHandle={incomingCall.callerHandle}
            onAccept={acceptIncomingCall}
            onDecline={declineIncomingCall}
            onSendMessage={() => {
              declineIncomingCall();
              if (incomingCall.callerId) navigate(`/chat/${incomingCall.callerId}`);
            }}
          />
        )}

        {!isGroup && isVideo && (
          <VideoCallIncoming
            callerName={incomingCall.callerName || DEFAULT_CALLER_NAME}
            callerAvatar={incomingCall.callerAvatar || DEFAULT_CALLER_AVATAR}
            callerHandle={incomingCall.callerHandle}
            onAccept={acceptIncomingCall}
            onDecline={declineIncomingCall}
            onSendMessage={() => {
              declineIncomingCall();
              if (incomingCall.callerId) navigate(`/chat/${incomingCall.callerId}`);
            }}
          />
        )}
      </Dialog>
    );
  }

  /* ==============================================================
   * 2. PREVIEW / DEMO MODE (For testing & showcase of all 8 screens)
   * ============================================================== */
  if (previewScreen) {
    return (
      <Dialog
        open={true}
        fullScreen
        PaperProps={{
          sx: {
            bgcolor: "#020617",
            color: "#fff",
            overflow: "hidden",
            margin: 0,
            width: "100vw",
            height: "100vh",
          },
        }}
      >
        {/* Top-Right Preview Switcher Badge */}
        <Box
          sx={{
            position: "absolute",
            top: 14,
            right: 14,
            zIndex: 100,
          }}
        >
          <Button
            size="small"
            variant="contained"
            onClick={(e) => setPreviewAnchorEl(e.currentTarget)}
            startIcon={<BugReportIcon sx={{ fontSize: 16 }} />}
            sx={{
              borderRadius: "99px",
              bgcolor: "rgba(15, 23, 42, 0.85)",
              backdropFilter: "blur(20px)",
              color: "#38bdf8",
              border: "1px solid rgba(56, 189, 248, 0.3)",
              fontWeight: 800,
              fontSize: "0.75rem",
              textTransform: "none",
              px: 1.8,
              py: 0.5,
              boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
              "&:hover": { bgcolor: "rgba(15, 23, 42, 0.95)" },
            }}
          >
            {previewScreen} (Switch)
          </Button>

          <Menu
            anchorEl={previewAnchorEl}
            open={Boolean(previewAnchorEl)}
            onClose={() => setPreviewAnchorEl(null)}
            PaperProps={{
              sx: {
                bgcolor: "#0f172a",
                color: "#fff",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: "16px",
                mt: 1,
              },
            }}
          >
            <MenuItem onClick={() => { setPreviewScreen("audio-call-incoming"); setPreviewAnchorEl(null); }}>
              1. 1:1 Audio Call Incoming
            </MenuItem>
            <MenuItem onClick={() => { setPreviewScreen("audio-call-ongoing"); setPreviewAnchorEl(null); }}>
              2. 1:1 Audio Call Ongoing
            </MenuItem>
            <MenuItem onClick={() => { setPreviewScreen("video-call-incoming"); setPreviewAnchorEl(null); }}>
              3. 1:1 Video Call Incoming
            </MenuItem>
            <MenuItem onClick={() => { setPreviewScreen("video-call-ongoing"); setPreviewAnchorEl(null); }}>
              4. 1:1 Video Call Ongoing
            </MenuItem>
            <MenuItem onClick={() => { setPreviewScreen("group-audio-call-incoming"); setPreviewAnchorEl(null); }}>
              5. Group Audio Call Incoming
            </MenuItem>
            <MenuItem onClick={() => { setPreviewScreen("group-audio-call-ongoing"); setPreviewAnchorEl(null); }}>
              6. Group Audio Call Ongoing
            </MenuItem>
            <MenuItem onClick={() => { setPreviewScreen("group-video-call-incoming"); setPreviewAnchorEl(null); }}>
              7. Group Video Call Incoming
            </MenuItem>
            <MenuItem onClick={() => { setPreviewScreen("group-video-call-ongoing"); setPreviewAnchorEl(null); }}>
              8. Group Video Call Ongoing
            </MenuItem>
            <MenuItem onClick={() => { setPreviewScreen(null); setPreviewAnchorEl(null); }} sx={{ color: "#ef4444", fontWeight: 700 }}>
              Close Preview Mode
            </MenuItem>
          </Menu>
        </Box>

        {previewScreen === "audio-call-incoming" && (
          <AudioCallIncoming
            callerName={DEFAULT_CALLER_NAME}
            callerAvatar={DEFAULT_CALLER_AVATAR}
            callerHandle="jayendra"
            onAccept={() => setPreviewScreen("audio-call-ongoing")}
            onDecline={() => setPreviewScreen(null)}
            onSendMessage={() => setPreviewScreen(null)}
          />
        )}

        {previewScreen === "audio-call-ongoing" && (
          <AudioCallOngoing
            peerName={DEFAULT_CALLER_NAME}
            peerAvatar={DEFAULT_CALLER_AVATAR}
            duration={28}
            formatCallTime={formatCallTime}
            isMuted={isMuted}
            isSpeakerOn={isSpeakerOn}
            callStatus="connected"
            onToggleMute={toggleMute}
            onToggleSpeaker={toggleSpeaker}
            onEndCall={() => setPreviewScreen(null)}
            onMinimize={() => setPreviewScreen(null)}
            onToggleChat={() => setChatDrawerOpen(true)}
            onToggleReactions={() => setShowReactionsBar(!showReactionsBar)}
            onOpenSettings={() => setSettingsOpen(true)}
            onAddPerson={() => setAddPersonOpen(true)}
          />
        )}

        {previewScreen === "video-call-incoming" && (
          <VideoCallIncoming
            callerName={DEFAULT_CALLER_NAME}
            callerAvatar={DEFAULT_CALLER_AVATAR}
            callerHandle="jayendra"
            onAccept={() => setPreviewScreen("video-call-ongoing")}
            onDecline={() => setPreviewScreen(null)}
            onSendMessage={() => setPreviewScreen(null)}
          />
        )}

        {previewScreen === "video-call-ongoing" && (
          <VideoCallOngoing
            peerName={DEFAULT_CALLER_NAME}
            peerAvatar={DEFAULT_CALLER_AVATAR}
            myAvatar={DEFAULT_CALLER_AVATAR}
            duration={35}
            formatCallTime={formatCallTime}
            isMuted={isMuted}
            isVideoOff={isVideoOff}
            isSpeakerOn={isSpeakerOn}
            isScreenSharing={isScreenSharing}
            hasRemoteVideo={false}
            callStatus="connected"
            attachLocalVideo={attachLocalVideo}
            attachRemoteVideo={attachRemoteVideo}
            onToggleMute={toggleMute}
            onToggleVideo={toggleVideo}
            onToggleSpeaker={toggleSpeaker}
            onToggleScreenShare={toggleScreenShare}
            onEndCall={() => setPreviewScreen(null)}
            onMinimize={() => setPreviewScreen(null)}
            onToggleChat={() => setChatDrawerOpen(true)}
            onToggleReactions={() => setShowReactionsBar(!showReactionsBar)}
            onOpenSettings={() => setSettingsOpen(true)}
            onAddPerson={() => setAddPersonOpen(true)}
          />
        )}

        {previewScreen === "group-audio-call-incoming" && (
          <GroupAudioIncoming
            groupName="Bunk1"
            members={DEFAULT_GROUP_MEMBERS}
            onAccept={() => setPreviewScreen("group-audio-call-ongoing")}
            onDecline={() => setPreviewScreen(null)}
            onSendMessage={() => setPreviewScreen(null)}
          />
        )}

        {previewScreen === "group-audio-call-ongoing" && (
          <GroupAudioOngoing
            groupName="Bunk1"
            members={DEFAULT_GROUP_MEMBERS}
            duration={42}
            formatCallTime={formatCallTime}
            isMuted={isMuted}
            isSpeakerOn={isSpeakerOn}
            callStatus="connected"
            onToggleMute={toggleMute}
            onToggleSpeaker={toggleSpeaker}
            onEndCall={() => setPreviewScreen(null)}
            onMinimize={() => setPreviewScreen(null)}
            onToggleChat={() => setChatDrawerOpen(true)}
            onToggleReactions={() => setShowReactionsBar(!showReactionsBar)}
            onAddMember={() => setAddPersonOpen(true)}
            onOpenSettings={() => setSettingsOpen(true)}
          />
        )}

        {previewScreen === "group-video-call-incoming" && (
          <GroupVideoIncoming
            groupName="Bunk1"
            members={DEFAULT_GROUP_MEMBERS}
            onAccept={() => setPreviewScreen("group-video-call-ongoing")}
            onDecline={() => setPreviewScreen(null)}
            onSendMessage={() => setPreviewScreen(null)}
          />
        )}

        {previewScreen === "group-video-call-ongoing" && (
          <GroupVideoOngoing
            groupName="Bunk1"
            members={DEFAULT_GROUP_MEMBERS}
            duration={68}
            formatCallTime={formatCallTime}
            isMuted={isMuted}
            isVideoOff={isVideoOff}
            isSpeakerOn={isSpeakerOn}
            isScreenSharing={isScreenSharing}
            hasRemoteVideo={false}
            callStatus="connected"
            attachLocalVideo={attachLocalVideo}
            attachRemoteVideo={attachRemoteVideo}
            onToggleMute={toggleMute}
            onToggleVideo={toggleVideo}
            onToggleSpeaker={toggleSpeaker}
            onToggleScreenShare={toggleScreenShare}
            onEndCall={() => setPreviewScreen(null)}
            onMinimize={() => setPreviewScreen(null)}
            onToggleChat={() => setChatDrawerOpen(true)}
            onToggleReactions={() => setShowReactionsBar(!showReactionsBar)}
            onAddMember={() => setAddPersonOpen(true)}
            onOpenSettings={() => setSettingsOpen(true)}
          />
        )}
      </Dialog>
    );
  }

  // If no active call, return null (or Dev Preview button on localhost)
  if (!activeCall) {
    return (
      <Box sx={{ position: "fixed", bottom: 20, left: 20, zIndex: 1200 }}>
        <Tooltip title="Preview Figma Call Screens">
          <IconButton
            size="small"
            onClick={(e) => setPreviewAnchorEl(e.currentTarget)}
            sx={{
              bgcolor: "rgba(15, 23, 42, 0.75)",
              backdropFilter: "blur(12px)",
              color: "rgba(255, 255, 255, 0.6)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              opacity: 0.4,
              transition: "all 0.2s ease",
              "&:hover": {
                opacity: 1,
                bgcolor: "rgba(15, 23, 42, 0.95)",
                color: "#38bdf8",
                transform: "scale(1.08)",
              },
            }}
          >
            <BugReportIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>

        <Menu
          anchorEl={previewAnchorEl}
          open={Boolean(previewAnchorEl)}
          onClose={() => setPreviewAnchorEl(null)}
          PaperProps={{
            sx: {
              bgcolor: "#0f172a",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: "16px",
              mt: 1,
            },
          }}
        >
          <MenuItem onClick={() => { setPreviewScreen("audio-call-incoming"); setPreviewAnchorEl(null); }}>
            1. 1:1 Audio Call Incoming
          </MenuItem>
          <MenuItem onClick={() => { setPreviewScreen("audio-call-ongoing"); setPreviewAnchorEl(null); }}>
            2. 1:1 Audio Call Ongoing
          </MenuItem>
          <MenuItem onClick={() => { setPreviewScreen("video-call-incoming"); setPreviewAnchorEl(null); }}>
            3. 1:1 Video Call Incoming
          </MenuItem>
          <MenuItem onClick={() => { setPreviewScreen("video-call-ongoing"); setPreviewAnchorEl(null); }}>
            4. 1:1 Video Call Ongoing
          </MenuItem>
          <MenuItem onClick={() => { setPreviewScreen("group-audio-call-incoming"); setPreviewAnchorEl(null); }}>
            5. Group Audio Call Incoming
          </MenuItem>
          <MenuItem onClick={() => { setPreviewScreen("group-audio-call-ongoing"); setPreviewAnchorEl(null); }}>
            6. Group Audio Call Ongoing
          </MenuItem>
          <MenuItem onClick={() => { setPreviewScreen("group-video-call-incoming"); setPreviewAnchorEl(null); }}>
            7. Group Video Call Incoming
          </MenuItem>
          <MenuItem onClick={() => { setPreviewScreen("group-video-call-ongoing"); setPreviewAnchorEl(null); }}>
            8. Group Video Call Ongoing
          </MenuItem>
        </Menu>
      </Box>
    );
  }

  /* ==============================================================
   * 3. ACTIVE CALL DETAILS & RESOLVED IDENTITIES
   * ============================================================== */
  const isVideo = activeCall.callType === "video";
  const isGroup = Boolean(activeCall.isGroupCall || activeCall.groupId);
  const groupName = activeCall.groupName || "Bunk1";
  const peerName = isIncoming ? activeCall.callerName : activeCall.receiverName;
  const peerAvatar = isIncoming ? activeCall.callerAvatar : activeCall.receiverAvatar;
  const peerHandle = isIncoming ? activeCall.callerHandle : activeCall.receiverHandle;
  const myAvatar = isIncoming ? activeCall.receiverAvatar : activeCall.callerAvatar;

  /* ==============================================================
   * 4. MINIMIZED PICTURE-IN-PICTURE (PIP) MODE
   * ============================================================== */
  if (isMinimized) {
    return (
      <MinimizedCallPiP
        peerName={peerName || DEFAULT_CALLER_NAME}
        peerAvatar={peerAvatar || DEFAULT_CALLER_AVATAR}
        isVideo={isVideo}
        isGroupCall={isGroup}
        groupName={groupName}
        duration={duration}
        formatCallTime={formatCallTime}
        callStatus={callStatus}
        isMuted={isMuted}
        isVideoOff={isVideoOff}
        hasRemoteVideo={hasRemoteVideo}
        attachRemoteVideo={attachRemoteVideo}
        onToggleMute={toggleMute}
        onToggleVideo={toggleVideo}
        onEndCall={endCall}
        onExpand={() => {
          setIsMinimized(false);
          if (!isChatPage) navigate("/chats");
        }}
      />
    );
  }

  /* ==============================================================
   * 5. FULL-SCREEN ONGOING CALL SCREEN ROUTER
   * ============================================================== */
  return (
    <>
      <Dialog
        open={true}
        fullScreen
        PaperProps={{
          sx: {
            bgcolor: "#020617",
            color: "#fff",
            overflow: "hidden",
            margin: 0,
            width: "100vw",
            height: "100vh",
          },
        }}
      >
        {/* Browser Audio Autoplay Blocked Notification Banner */}
        {audioAutoplayBlocked && (
          <Box
            sx={{
              position: "absolute",
              top: 24,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 100,
              bgcolor: "#ef4444",
              color: "#fff",
              px: 2.5,
              py: 0.8,
              borderRadius: "99px",
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              boxShadow: "0 8px 30px rgba(239, 68, 68, 0.6)",
            }}
          >
            <VolumeUpIcon sx={{ fontSize: 20 }} />
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              Audio is muted by browser policy
            </Typography>
            <Button
              size="small"
              onClick={unlockAudioAutoplay}
              sx={{
                bgcolor: "#fff",
                color: "#000",
                fontWeight: 800,
                borderRadius: "99px",
                textTransform: "none",
                py: 0.2,
                px: 1.5,
                "&:hover": { bgcolor: "#f1f5f9" },
              }}
            >
              Unmute
            </Button>
          </Box>
        )}

        {/* Flying Animated Reactions Layer */}
        <CallReactionsOverlay reactions={reactions} />

        {/* Quick Reactions Bar Pop-up */}
        <AnimatePresence>
          {showReactionsBar && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              style={{
                position: "absolute",
                bottom: 110,
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 40,
              }}
            >
              <Paper
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  p: 1,
                  px: 1.5,
                  borderRadius: "99px",
                  bgcolor: "rgba(15, 23, 42, 0.92)",
                  backdropFilter: "blur(24px)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  boxShadow: "0 16px 40px rgba(0,0,0,0.7)",
                }}
              >
                {REACTION_EMOJIS.map((emoji) => (
                  <IconButton
                    key={emoji}
                    onClick={() => {
                      sendReaction(emoji);
                      setShowReactionsBar(false);
                    }}
                    sx={{
                      fontSize: "1.4rem",
                      p: 0.6,
                      "&:hover": { transform: "scale(1.3)" },
                      transition: "transform 0.15s ease",
                    }}
                  >
                    {emoji}
                  </IconButton>
                ))}
              </Paper>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Route to the Appropriate Screen */}
        {isGroup && !isVideo && (
          <GroupAudioOngoing
            groupName={groupName}
            members={groupParticipants.length > 0 ? groupParticipants : (activeCall.members || DEFAULT_GROUP_MEMBERS)}
            currentUser={currentUser}
            duration={duration}
            formatCallTime={formatCallTime}
            isMuted={isMuted}
            isSpeakerOn={isSpeakerOn}
            callStatus={callStatus}
            onToggleMute={toggleMute}
            onToggleSpeaker={toggleSpeaker}
            onEndCall={endCall}
            onMinimize={() => setIsMinimized(true)}
            onToggleChat={() => setChatDrawerOpen(true)}
            onToggleReactions={() => setShowReactionsBar(!showReactionsBar)}
            onAddMember={() => setAddPersonOpen(true)}
            onOpenSettings={() => setSettingsOpen(true)}
          />
        )}

        {isGroup && isVideo && (
          <GroupVideoOngoing
            groupName={groupName}
            members={groupParticipants.length > 0 ? groupParticipants : (activeCall.members || DEFAULT_GROUP_MEMBERS)}
            currentUser={currentUser}
            duration={duration}
            formatCallTime={formatCallTime}
            isMuted={isMuted}
            isVideoOff={isVideoOff}
            isSpeakerOn={isSpeakerOn}
            isScreenSharing={isScreenSharing}
            hasRemoteVideo={hasRemoteVideo}
            callStatus={callStatus}
            attachLocalVideo={attachLocalVideo}
            attachRemoteVideo={attachRemoteVideo}
            onToggleMute={toggleMute}
            onToggleVideo={toggleVideo}
            onToggleSpeaker={toggleSpeaker}
            onToggleScreenShare={toggleScreenShare}
            onEndCall={endCall}
            onMinimize={() => setIsMinimized(true)}
            onToggleChat={() => setChatDrawerOpen(true)}
            onToggleReactions={() => setShowReactionsBar(!showReactionsBar)}
            onAddMember={() => setAddPersonOpen(true)}
            onOpenSettings={() => setSettingsOpen(true)}
          />
        )}

        {!isGroup && !isVideo && (
          <AudioCallOngoing
            peerName={peerName || DEFAULT_CALLER_NAME}
            peerAvatar={peerAvatar || DEFAULT_CALLER_AVATAR}
            peerHandle={peerHandle}
            duration={duration}
            formatCallTime={formatCallTime}
            isMuted={isMuted}
            isSpeakerOn={isSpeakerOn}
            callStatus={callStatus}
            onToggleMute={toggleMute}
            onToggleSpeaker={toggleSpeaker}
            onEndCall={endCall}
            onMinimize={() => setIsMinimized(true)}
            onToggleChat={() => setChatDrawerOpen(true)}
            onToggleReactions={() => setShowReactionsBar(!showReactionsBar)}
            onOpenSettings={() => setSettingsOpen(true)}
            onAddPerson={() => setAddPersonOpen(true)}
          />
        )}

        {!isGroup && isVideo && (
          <VideoCallOngoing
            peerName={peerName || DEFAULT_CALLER_NAME}
            peerAvatar={peerAvatar || DEFAULT_CALLER_AVATAR}
            myAvatar={myAvatar || DEFAULT_CALLER_AVATAR}
            duration={duration}
            formatCallTime={formatCallTime}
            isMuted={isMuted}
            isVideoOff={isVideoOff}
            isSpeakerOn={isSpeakerOn}
            isScreenSharing={isScreenSharing}
            hasRemoteVideo={hasRemoteVideo}
            callStatus={callStatus}
            attachLocalVideo={attachLocalVideo}
            attachRemoteVideo={attachRemoteVideo}
            onToggleMute={toggleMute}
            onToggleVideo={toggleVideo}
            onToggleSpeaker={toggleSpeaker}
            onToggleScreenShare={toggleScreenShare}
            onEndCall={endCall}
            onMinimize={() => setIsMinimized(true)}
            onToggleChat={() => setChatDrawerOpen(true)}
            onToggleReactions={() => setShowReactionsBar(!showReactionsBar)}
            onOpenSettings={() => setSettingsOpen(true)}
            onAddPerson={() => setAddPersonOpen(true)}
          />
        )}
      </Dialog>

      {/* Device Settings Dialog */}
      <DeviceSettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />

      {/* Add Person To Call Dialog */}
      <AddPersonToCallModal open={addPersonOpen} onClose={() => setAddPersonOpen(false)} />

      {/* In-Call Text Chat Drawer */}
      <InCallChatDrawer open={chatDrawerOpen} onClose={() => setChatDrawerOpen(false)} />
    </>
  );
}
