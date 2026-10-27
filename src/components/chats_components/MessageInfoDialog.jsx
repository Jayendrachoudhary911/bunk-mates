import React, { useState, useEffect, useMemo } from "react";
import {
  SwipeableDrawer,
  Box,
  Typography,
  IconButton,
  Avatar,
  LinearProgress,
  Tabs,
  Tab,
  Paper,
} from "@mui/material";
import {
  drawerPaperSx,
  drawerBackdropSx,
  DrawerHandle,
} from "../../theme/designSystem";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import DoneAllRoundedIcon from "@mui/icons-material/DoneAllRounded";
import DoneRoundedIcon from "@mui/icons-material/DoneRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";
import FormattedMessageText from "./FormattedMessageText";
import { safeImageUrl } from "../../utils/uiHelpers";

// Robust, crash-proof date & time formatting helper
function formatReadDateTime(val) {
  if (!val) return null;
  try {
    let d;
    if (typeof val?.toDate === "function") {
      d = val.toDate();
    } else if (val?.seconds != null) {
      d = new Date(val.seconds * 1000);
    } else if (typeof val === "string" || typeof val === "number") {
      d = new Date(val);
    } else if (val instanceof Date) {
      d = val;
    } else {
      return null;
    }
    if (isNaN(d.getTime())) return null;

    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();

    const yest = new Date(now);
    yest.setDate(now.getDate() - 1);
    const isYesterday = d.toDateString() === yest.toDateString();

    const timeStr = d.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    if (isToday) return `Today at ${timeStr}`;
    if (isYesterday) return `Yesterday at ${timeStr}`;

    const dateStr = d.toLocaleDateString([], {
      month: "short",
      day: "numeric",
      year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
    return `${dateStr} at ${timeStr}`;
  } catch {
    return null;
  }
}

function formatFullDate(val) {
  if (!val) return "Unknown";
  try {
    let d;
    if (typeof val?.toDate === "function") {
      d = val.toDate();
    } else if (val?.seconds != null) {
      d = new Date(val.seconds * 1000);
    } else if (typeof val === "string" || typeof val === "number") {
      d = new Date(val);
    } else if (val instanceof Date) {
      d = val;
    } else {
      return "Unknown";
    }
    if (isNaN(d.getTime())) return "Unknown";

    return d.toLocaleDateString([], {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "Unknown";
  }
}

const MessageInfoDialog = ({
  open,
  onClose,
  message,
  currentUser,
  isGroup = false,
  groupInfo = null,
  memberInfo = {},
  friendDetails = null,
  effectiveChatTheme = "dark",
}) => {
  const isDark = effectiveChatTheme === "dark";
  const [tabIndex, setTabIndex] = useState(0);
  const [extraProfiles, setExtraProfiles] = useState({});

  // Reset tab on open
  useEffect(() => {
    if (open) {
      setTabIndex(0);
    }
  }, [open]);

  // Fetch missing member profiles if any
  useEffect(() => {
    if (!open || !isGroup || !message) return;

    const allUids = new Set([
      ...(groupInfo?.members || []),
      ...(message.readBy || []),
      message.senderId,
    ].filter(Boolean));

    const missing = Array.from(allUids).filter(
      (uid) => !memberInfo?.[uid] && !extraProfiles[uid]
    );

    if (missing.length === 0) return;

    missing.forEach(async (uid) => {
      try {
        const snap = await getDoc(doc(db, "users", uid));
        if (snap.exists()) {
          setExtraProfiles((prev) => ({
            ...prev,
            [uid]: { id: snap.id, ...snap.data() },
          }));
        }
      } catch {}
    });
  }, [open, isGroup, message, groupInfo?.members, memberInfo, extraProfiles]);

  const getUserProfile = React.useCallback(
    (uid) => {
      return memberInfo?.[uid] || extraProfiles[uid] || null;
    },
    [memberInfo, extraProfiles]
  );

  // Group readers breakdown
  const { readersList, unreadList, readRatio, totalRecipients } = useMemo(() => {
    if (!isGroup || !message) {
      return { readersList: [], unreadList: [], readRatio: 0, totalRecipients: 0 };
    }

    const members = Array.isArray(groupInfo?.members)
      ? groupInfo.members
      : Object.keys(memberInfo || {});

    // Recipients are group members excluding the message sender
    const recipients = members.filter((uid) => uid !== message.senderId);
    const readBySet = new Set(
      Array.isArray(message.readBy) ? message.readBy : []
    );
    const readByMap = message.readByMap || {};

    const readers = [];
    const unread = [];

    recipients.forEach((uid) => {
      const isRead = readBySet.has(uid) || Boolean(readByMap[uid]);
      const readAtRaw = readByMap[uid] || null;
      const profile = getUserProfile(uid);

      const item = {
        uid,
        displayName:
          profile?.name ||
          profile?.displayName ||
          (uid === currentUser?.uid ? "You" : `User (${uid.slice(0, 5)})`),
        username: profile?.username || "",
        photoURL: profile?.photoURL || "",
        readAt: formatReadDateTime(readAtRaw),
        rawReadAt: readAtRaw,
      };

      if (isRead) {
        readers.push(item);
      } else {
        unread.push(item);
      }
    });

    const total = recipients.length;
    const ratio = total > 0 ? Math.round((readers.length / total) * 100) : 100;

    return {
      readersList: readers,
      unreadList: unread,
      readRatio: ratio,
      totalRecipients: total,
    };
  }, [isGroup, message, groupInfo, memberInfo, currentUser?.uid, getUserProfile]);

  if (!message) return null;

  const isOwn = message.senderId === currentUser?.uid;
  const sentFormattedTime = formatFullDate(message.timestamp);

  // Direct 1-on-1 chat read info
  const isDirectRead = Boolean(message.read || message.isRead);
  const directReadTime = formatReadDateTime(message.readAt);

  const mode = isDark ? "dark" : "light";

  return (
    <SwipeableDrawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      onOpen={() => {}}
      disableSwipeToOpen={false}
      ModalProps={{
        BackdropProps: {
          sx: drawerBackdropSx,
        },
      }}
      PaperProps={{
        sx: {
          ...drawerPaperSx(mode, {
            maxHeight: "85vh",
          }),
          overflowY: "auto",
        },
      }}
    >
      <Box sx={{ display: { xs: "block", md: "none" } }}>
        <DrawerHandle mode={mode} />
      </Box>

      <Box sx={{ maxWidth: 500, mx: "auto", width: "100%", boxSizing: "border-box", pt: { xs: 1, md: 2 } }}>
        {/* Drawer Header */}
        <Box
        sx={{
          m: 0,
          p: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: `1px solid ${
            isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"
          }`,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: "10px",
              bgcolor: isDark
                ? "rgba(0, 183, 255, 0.15)"
                : "rgba(2, 136, 209, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: isDark ? "#00b7ff" : "#0288d1",
            }}
          >
            <InfoOutlinedIcon sx={{ fontSize: 20 }} />
          </Box>
          <Box>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 700,
                fontSize: "1.05rem",
                color: isDark ? "#fff" : "#111",
                lineHeight: 1.2,
              }}
            >
              Message Info
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.55)",
                fontSize: "0.75rem",
              }}
            >
              {isGroup
                ? `${groupInfo?.name || "Group"} • ${readersList.length}/${totalRecipients} read`
                : isOwn
                ? `To ${friendDetails?.displayName || friendDetails?.username || "Friend"}`
                : `From ${friendDetails?.displayName || friendDetails?.username || "Friend"}`}
            </Typography>
          </Box>
        </Box>

        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            color: isDark ? "rgba(255,255,255,0.7)" : "#666",
            "&:hover": {
              bgcolor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)",
            },
          }}
        >
          <CloseRoundedIcon sx={{ fontSize: 20 }} />
        </IconButton>
        </Box>

        <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 2 }}>
        {/* Message Preview Snippet */}
        <Paper
          elevation={0}
          sx={{
            p: 1.5,
            borderRadius: "16px",
            bgcolor: isDark
              ? "rgba(255, 255, 255, 0.05)"
              : "rgba(0, 0, 0, 0.03)",
            border: `1px solid ${
              isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.05)"
            }`,
          }}
        >
          {/* If Image Message */}
          {Boolean(message.imageUrl || message.dataUri) && (
            <Box
              component="img"
              src={safeImageUrl(message.imageUrl || message.dataUri)}
              alt="Message media"
              sx={{
                width: "100%",
                maxHeight: 160,
                objectFit: "cover",
                borderRadius: "12px",
                mb: message.text ? 1 : 0,
              }}
            />
          )}

          {/* If Text Message */}
          {message.text && (
            <Box
              sx={{
                fontSize: "0.88rem",
                color: isDark ? "#fff" : "#111",
                maxHeight: 100,
                overflowY: "auto",
              }}
            >
              <FormattedMessageText
                text={message.text}
                isOwn={false}
                isDark={isDark}
              />
            </Box>
          )}

          {/* If Structured Card */}
          {message.type && !["text", "image"].includes(message.type) && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, py: 0.5 }}>
              <Box
                sx={{
                  px: 1,
                  py: 0.3,
                  borderRadius: "6px",
                  bgcolor: isDark ? "rgba(0,183,255,0.2)" : "rgba(2,136,209,0.15)",
                  color: isDark ? "#00b7ff" : "#0288d1",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  textTransform: "capitalize",
                }}
              >
                {message.type} Card
              </Box>
              <Typography
                variant="body2"
                sx={{
                  color: isDark ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.7)",
                  fontSize: "0.82rem",
                  fontWeight: 500,
                }}
              >
                {message.cardData?.title || message.cardData?.question || message.text || "Interactive widget"}
              </Typography>
            </Box>
          )}

          {/* Sent Timestamp Row */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.8,
              mt: 1,
              pt: 0.8,
              borderTop: `1px solid ${
                isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"
              }`,
              color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)",
              fontSize: "0.75rem",
            }}
          >
            <AccessTimeRoundedIcon sx={{ fontSize: 14 }} />
            <span>Sent: {sentFormattedTime}</span>
          </Box>
        </Paper>

        {/* GROUP CHAT VIEW RECEIPTS */}
        {isGroup ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {/* Read Ratio Progress Bar */}
            <Box>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 0.6,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 600,
                    color: isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.7)",
                  }}
                >
                  Read Receipts ({readersList.length} of {totalRecipients})
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 700,
                    color: isDark ? "#00b7ff" : "#0288d1",
                  }}
                >
                  {readRatio}%
                </Typography>
              </Box>

              <LinearProgress
                variant="determinate"
                value={readRatio}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  bgcolor: isDark
                    ? "rgba(255,255,255,0.08)"
                    : "rgba(0,0,0,0.06)",
                  "& .MuiLinearProgress-bar": {
                    borderRadius: 3,
                    bgcolor: readRatio === 100 ? "#4caf50" : "#00b7ff",
                  },
                }}
              />
            </Box>

            {/* Tabs for Read / Unread */}
            <Tabs
              value={tabIndex}
              onChange={(e, v) => setTabIndex(v)}
              sx={{
                minHeight: 36,
                "& .MuiTab-root": {
                  minHeight: 36,
                  py: 0.5,
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  textTransform: "none",
                  color: isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)",
                  "&.Mui-selected": {
                    color: isDark ? "#00b7ff" : "#0288d1",
                  },
                },
                "& .MuiTabs-indicator": {
                  bgcolor: isDark ? "#00b7ff" : "#0288d1",
                  borderRadius: "2px",
                },
              }}
            >
              <Tab
                label={`Read by (${readersList.length})`}
                icon={<DoneAllRoundedIcon sx={{ fontSize: 16 }} />}
                iconPosition="start"
              />
              <Tab
                label={`Delivered (${unreadList.length})`}
                icon={<DoneRoundedIcon sx={{ fontSize: 16 }} />}
                iconPosition="start"
              />
            </Tabs>

            {/* List Content */}
            <Box
              sx={{
                maxHeight: 220,
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: 0.8,
                pr: 0.5,
              }}
            >
              {tabIndex === 0 ? (
                // Read by List
                readersList.length > 0 ? (
                  readersList.map((reader) => (
                    <Box
                      key={reader.uid}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        p: 1,
                        borderRadius: "12px",
                        bgcolor: isDark
                          ? "rgba(255,255,255,0.03)"
                          : "rgba(0,0,0,0.02)",
                        border: `1px solid ${
                          isDark
                            ? "rgba(255,255,255,0.05)"
                            : "rgba(0,0,0,0.04)"
                        }`,
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                        <Avatar
                          src={reader.photoURL}
                          alt={reader.displayName}
                          sx={{
                            width: 32,
                            height: 32,
                            fontSize: "0.8rem",
                            bgcolor: isDark ? "#333" : "#e0e0e0",
                            color: isDark ? "#fff" : "#333",
                          }}
                        >
                          {reader.displayName?.[0] || "?"}
                        </Avatar>
                        <Box>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 600,
                              fontSize: "0.85rem",
                              color: isDark ? "#fff" : "#111",
                              lineHeight: 1.2,
                            }}
                          >
                            {reader.displayName}
                          </Typography>
                          {reader.username && (
                            <Typography
                              variant="caption"
                              sx={{
                                color: isDark
                                  ? "rgba(255,255,255,0.5)"
                                  : "rgba(0,0,0,0.5)",
                                fontSize: "0.72rem",
                              }}
                            >
                              @{reader.username}
                            </Typography>
                          )}
                        </Box>
                      </Box>

                      {/* Read Timestamp */}
                      <Box sx={{ textAlign: "right" }}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.4,
                            justifyContent: "flex-end",
                          }}
                        >
                          <DoneAllRoundedIcon
                            sx={{
                              fontSize: 15,
                              color: isDark ? "#00b7ff" : "#0288d1",
                            }}
                          />
                          <Typography
                            variant="caption"
                            sx={{
                              fontWeight: 600,
                              color: isDark ? "#00b7ff" : "#0288d1",
                              fontSize: "0.74rem",
                            }}
                          >
                            {reader.readAt || "Viewed"}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  ))
                ) : (
                  <Box sx={{ py: 3, textAlign: "center" }}>
                    <Typography
                      variant="body2"
                      sx={{
                        color: isDark
                          ? "rgba(255,255,255,0.4)"
                          : "rgba(0,0,0,0.4)",
                        fontSize: "0.85rem",
                      }}
                    >
                      No other members have viewed this message yet
                    </Typography>
                  </Box>
                )
              ) : (
                // Unread / Remaining List
                unreadList.length > 0 ? (
                  unreadList.map((member) => (
                    <Box
                      key={member.uid}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        p: 1,
                        borderRadius: "12px",
                        bgcolor: isDark
                          ? "rgba(255,255,255,0.03)"
                          : "rgba(0,0,0,0.02)",
                        border: `1px solid ${
                          isDark
                            ? "rgba(255,255,255,0.05)"
                            : "rgba(0,0,0,0.04)"
                        }`,
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                        <Avatar
                          src={member.photoURL}
                          alt={member.displayName}
                          sx={{
                            width: 32,
                            height: 32,
                            fontSize: "0.8rem",
                            bgcolor: isDark ? "#333" : "#e0e0e0",
                            color: isDark ? "#fff" : "#333",
                          }}
                        >
                          {member.displayName?.[0] || "?"}
                        </Avatar>
                        <Box>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 600,
                              fontSize: "0.85rem",
                              color: isDark ? "#fff" : "#111",
                              lineHeight: 1.2,
                            }}
                          >
                            {member.displayName}
                          </Typography>
                          {member.username && (
                            <Typography
                              variant="caption"
                              sx={{
                                color: isDark
                                  ? "rgba(255,255,255,0.5)"
                                  : "rgba(0,0,0,0.5)",
                                fontSize: "0.72rem",
                              }}
                            >
                              @{member.username}
                            </Typography>
                          )}
                        </Box>
                      </Box>

                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 0.4,
                          color: isDark
                            ? "rgba(255,255,255,0.4)"
                            : "rgba(0,0,0,0.4)",
                        }}
                      >
                        <DoneRoundedIcon sx={{ fontSize: 15 }} />
                        <Typography variant="caption" sx={{ fontSize: "0.74rem" }}>
                          Delivered
                        </Typography>
                      </Box>
                    </Box>
                  ))
                ) : (
                  <Box sx={{ py: 3, textAlign: "center" }}>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "#4caf50",
                        fontSize: "0.85rem",
                        fontWeight: 600,
                      }}
                    >
                      🎉 Everyone in the group has viewed this message!
                    </Typography>
                  </Box>
                )
              )}
            </Box>
          </Box>
        ) : (
          /* DIRECT 1-ON-1 CHAT RECEIPTS TIMELINE */
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.2 }}>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 600,
                color: isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)",
                textTransform: "uppercase",
                letterSpacing: 0.5,
                fontSize: "0.72rem",
              }}
            >
              Delivery & Read Status
            </Typography>

            {/* Read Status Item */}
            <Box
              sx={{
                display: "flex",
                alignItems: "flex-start",
                gap: 1.5,
                p: 1.2,
                borderRadius: "14px",
                bgcolor: isDirectRead
                  ? isDark
                    ? "rgba(0, 183, 255, 0.08)"
                    : "rgba(2, 136, 209, 0.06)"
                  : isDark
                  ? "rgba(255,255,255,0.03)"
                  : "rgba(0,0,0,0.02)",
                border: `1px solid ${
                  isDirectRead
                    ? isDark
                      ? "rgba(0, 183, 255, 0.2)"
                      : "rgba(2, 136, 209, 0.15)"
                    : isDark
                    ? "rgba(255,255,255,0.05)"
                    : "rgba(0,0,0,0.04)"
                }`,
              }}
            >
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: "10px",
                  bgcolor: isDirectRead
                    ? isDark
                      ? "rgba(0, 183, 255, 0.2)"
                      : "rgba(2, 136, 209, 0.15)"
                    : isDark
                    ? "rgba(255,255,255,0.06)"
                    : "rgba(0,0,0,0.05)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: isDirectRead
                    ? isDark
                      ? "#00b7ff"
                      : "#0288d1"
                    : isDark
                    ? "rgba(255,255,255,0.4)"
                    : "rgba(0,0,0,0.4)",
                }}
              >
                <DoneAllRoundedIcon sx={{ fontSize: 18 }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      color: isDark ? "#fff" : "#111",
                      fontSize: "0.85rem",
                    }}
                  >
                    Read
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 500,
                      color: isDirectRead
                        ? isDark
                          ? "#00b7ff"
                          : "#0288d1"
                        : isDark
                        ? "rgba(255,255,255,0.4)"
                        : "rgba(0,0,0,0.4)",
                      fontSize: "0.75rem",
                    }}
                  >
                    {isDirectRead
                      ? directReadTime || "Read"
                      : "Not yet read"}
                  </Typography>
                </Box>
                <Typography
                  variant="caption"
                  sx={{
                    color: isDark
                      ? "rgba(255,255,255,0.5)"
                      : "rgba(0,0,0,0.5)",
                    fontSize: "0.72rem",
                  }}
                >
                  {isDirectRead
                    ? isOwn
                      ? `Viewed by ${friendDetails?.displayName || friendDetails?.username || "Recipient"}`
                      : "Viewed by you"
                    : `Waiting for ${friendDetails?.displayName || friendDetails?.username || "Recipient"} to view`}
                </Typography>
              </Box>
            </Box>

            {/* Delivered Status Item */}
            <Box
              sx={{
                display: "flex",
                alignItems: "flex-start",
                gap: 1.5,
                p: 1.2,
                borderRadius: "14px",
                bgcolor: isDark
                  ? "rgba(255,255,255,0.03)"
                  : "rgba(0,0,0,0.02)",
                border: `1px solid ${
                  isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)"
                }`,
              }}
            >
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: "10px",
                  bgcolor: isDark
                    ? "rgba(255,255,255,0.06)"
                    : "rgba(0,0,0,0.05)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)",
                }}
              >
                <DoneRoundedIcon sx={{ fontSize: 18 }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      color: isDark ? "#fff" : "#111",
                      fontSize: "0.85rem",
                    }}
                  >
                    Delivered
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 500,
                      color: isDark
                        ? "rgba(255,255,255,0.5)"
                        : "rgba(0,0,0,0.5)",
                      fontSize: "0.75rem",
                    }}
                  >
                    {formatReadDateTime(message.timestamp) || "Delivered"}
                  </Typography>
                </Box>
                <Typography
                  variant="caption"
                  sx={{
                    color: isDark
                      ? "rgba(255,255,255,0.5)"
                      : "rgba(0,0,0,0.5)",
                    fontSize: "0.72rem",
                  }}
                >
                  Successfully delivered to {friendDetails?.displayName || "friend"}
                </Typography>
              </Box>
            </Box>
          </Box>
        )}
        </Box>
      </Box>
    </SwipeableDrawer>
  );
};

export default React.memo(MessageInfoDialog);
