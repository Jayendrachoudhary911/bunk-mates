import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, AppBar, Avatar, Paper, Typography, IconButton, TextField, Button, Fab,
  List, ListItem, ListItemButton, ListItemText, Menu, MenuItem, Dialog, DialogTitle,
  DialogContent, DialogActions, SwipeableDrawer, Collapse, Divider, Tooltip, Chip, useTheme,
} from '@mui/material';
import {
  Send as SendIcon, ArrowDownward as ArrowDownwardIcon, MoreVert as MoreVertIcon,
  Close as CloseIcon, Edit as EditIcon, Delete as DeleteIcon, InsertPhoto as InsertPhotoIcon,
  Check as CheckIcon, AccessTime as AccessTimeIcon, DoneAll as DoneAllIcon, Poll as PollIcon
} from '@mui/icons-material';
import { FastAverageColor } from 'fast-average-color';
import EmojiPicker, { Emoji } from 'emoji-picker-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import Popover from '@mui/material/Popover';
import { fontSize, fontStyle, styled } from '@mui/system';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import RemoveIcon from '@mui/icons-material/Remove';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ReplyIcon from '@mui/icons-material/Reply';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CameraAltOutlinedIcon from '@mui/icons-material/CameraAltOutlined';
// Assume these imports exist from the project structure
import { auth, db } from '../../firebase';
import {
  collection, doc, getDoc, addDoc, updateDoc, arrayUnion, arrayRemove,
  onSnapshot, serverTimestamp, query, orderBy, deleteDoc, deleteField
} from 'firebase/firestore';
import { useThemeToggle } from '../../contexts/ThemeToggleContext';
import { getTheme } from '../../theme';
import GroupInfoDrawer from '../GroupChat/GroupInfoDrawer';
// Link preview API key assumed from environment
const LINK_PREVIEW_API_KEY = '3db616e201708f056ee4d32ddab9839a';

// --- UTILITY FUNCTIONS & CUSTOM HOOKS (from initial response) ---

/**
 * Computes the message bubble shape for grouping.
 * @param {GroupMessage[]} messages
 * @param {number} index
 * @param {string} currentUserId
 * @returns {{top: number, bottom: number}}
 */
const getMessageShape = (messages, index, currentUserId) => {
  const currentMessage = messages[index];
  const prevMessage = messages[index - 1];
  const nextMessage = messages[index + 1];

  const isMe = currentMessage.senderId === currentUserId;

  let isGroupedWithPrev = false;
  if (prevMessage) {
    const timeDiff = currentMessage.timestamp?.seconds - prevMessage.timestamp?.seconds;
    isGroupedWithPrev = (
      prevMessage.senderId === currentMessage.senderId &&
      timeDiff < 60
    );
  }

  let isGroupedWithNext = false;
  if (nextMessage) {
    const timeDiff = nextMessage.timestamp?.seconds - currentMessage.timestamp?.seconds;
    isGroupedWithNext = (
      nextMessage.senderId === currentMessage.senderId &&
      timeDiff < 60
    );
  }

  const radius = 20;
  const flat = 4;

  // Specific corner flattening logic for grouped messages
  const borderRadius = {
      // Top right for sender, top left for others
      topRight: isMe ? (isGroupedWithNext ? flat : radius) : radius,
      bottomRight: isMe ? (isGroupedWithPrev ? flat : radius) : radius,
      topLeft: isMe ? radius : (isGroupedWithNext ? flat : radius),
      bottomLeft: isMe ? radius : (isGroupedWithPrev ? flat : radius),
  };

  return {
    borderTopLeftRadius: borderRadius.topLeft,
    borderTopRightRadius: borderRadius.topRight,
    borderBottomLeftRadius: borderRadius.bottomLeft,
    borderBottomRightRadius: borderRadius.bottomRight,
  };
};

/**
 * Groups messages by date for date chips.
 * @param {GroupMessage[]} messages
 * @returns {Array<{date: Date, messages: GroupMessage[]}>}
 */
const groupMessagesByDate = (messages) => {
  const grouped = [];
  let currentDate = null;
  let currentGroup = [];

  messages.forEach(msg => {
    // Ensure timestamp is converted to Date object for comparison
    const msgDate = msg.timestamp?.toDate ? msg.timestamp.toDate() : new Date();
    const dateKey = msgDate.toLocaleDateString();

    if (!currentDate || currentDate.toLocaleDateString() !== dateKey) {
      if (currentGroup.length > 0) {
        grouped.push({ date: currentDate, messages: currentGroup });
      }
      currentDate = msgDate;
      currentGroup = [msg];
    } else {
      currentGroup.push(msg);
    }
  });

  if (currentGroup.length > 0) {
    grouped.push({ date: currentDate, messages: currentGroup });
  }

  return grouped;
};

// Simplified Regex for URL detection (for link preview)
const URL_REGEX = /(https?:\/\/[^\s]+)/g;

/**
 * Custom hook to listen to the current user's state.
 */
const useAuthUser = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      setCurrentUser(user);
      setLoadingUser(false);
    });
    return unsubscribe;
  }, []);
  return { currentUser, loadingUser };
};

/**
 * Custom hook to listen for group and member data.
 * (Logic is complex and kept identical to the first response's hook)
 */
const useGroupData = (groupName, currentUser) => {
  const [groupInfo, setGroupInfo] = useState(null);
  const [memberUsers, setMemberUsers] = useState({});
  const [loadingGroup, setLoadingGroup] = useState(true);

  useEffect(() => {
    if (!groupName) return;
    const groupDocRef = doc(db, 'groupChats', groupName);
    const unsubscribe = onSnapshot(groupDocRef, async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setGroupInfo({ id: docSnap.id, ...data });

        const memberIds = data.members || [];
        const memberDetails = {};
        const userPromises = memberIds.map(uid => getDoc(doc(db, 'users', uid)));

        const userSnaps = await Promise.all(userPromises);
        userSnaps.forEach(userSnap => {
          if (userSnap.exists()) {
            memberDetails[userSnap.id] = { id: userSnap.id, ...userSnap.data() };
          }
        });
        setMemberUsers(memberDetails);

      } else {
        setGroupInfo(null);
      }
      setLoadingGroup(false);
    }, (error) => {
      console.error("Error fetching group info:", error);
      setGroupInfo(null);
      setLoadingGroup(false);
    });

    return unsubscribe;
  }, [groupName]);

  const isCreator = groupInfo?.createdBy === currentUser?.uid;
  const isAdmin = isCreator || (groupInfo?.admins || []).includes(currentUser?.uid);
  const canSend = groupInfo?.sendAccess === 'all' || isAdmin;

  return { groupInfo, memberUsers, loadingGroup, isAdmin, isCreator, canSend };
};

/**
 * Custom hook to listen for messages and typing indicators.
 * (Logic is complex and kept identical to the first response's hook)
 */
const useMessagesAndTyping = (groupName, currentUserId) => {
  const [messages, setMessages] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [loadingMessages, setLoadingMessages] = useState(true);
  const updateDraftRef = useRef(null);

  useEffect(() => {
    if (!groupName) return;
    const messagesColRef = collection(db, 'groupChats', groupName, 'messages');
    const q = query(messagesColRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp ? doc.data().timestamp : { seconds: Date.now() / 1000 },
      }));
      setMessages(msgs);
      setLoadingMessages(false);
    }, (error) => {
      console.error("Error fetching messages:", error);
      setLoadingMessages(false);
    });

    return unsubscribe;
  }, [groupName]);

  useEffect(() => {
    if (!groupName) return;
    const groupDocRef = doc(db, 'groupChats', groupName);
    const unsubscribe = onSnapshot(groupDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const groupData = docSnap.data();
        const activeDrafts = Object.entries(groupData.drafts || {})
          .filter(([uid, text]) => uid !== currentUserId && text)
          .reduce((acc, [uid, text]) => ({ ...acc, [uid]: text }), {});
        setDrafts(activeDrafts);
      }
    }, (error) => {
      console.error("Error fetching drafts:", error);
    });
    return unsubscribe;
  }, [groupName, currentUserId]);

  const updateDraft = useCallback((text) => {
    if (!groupName || !currentUserId) return;
    if (updateDraftRef.current) clearTimeout(updateDraftRef.current);

    updateDraftRef.current = setTimeout(async () => {
      const groupDocRef = doc(db, 'groupChats', groupName);
      await updateDoc(groupDocRef, {
        [`drafts.${currentUserId}`]: text,
      });
    }, 500);
  }, [groupName, currentUserId]);

  useEffect(() => () => { if (updateDraftRef.current) clearTimeout(updateDraftRef.current); }, []);

  return { messages, drafts, loadingMessages, updateDraft };
};


// --- SUB-COMPONENTS ---

// 1. ChatHeader
const ChatHeader = ({ groupInfo, memberUsers, memberCount, onOpenDrawer, headerTextColor }) => {
  const theme = useTheme();
  const membersSummary = useMemo(() => {
    const firstThreeNames = groupInfo?.members?.slice(0, 3)
      .map(uid => memberUsers[uid]?.name || '...').join(', ');
    return memberCount > 3 ? `${firstThreeNames} +${memberCount - 3} more` : firstThreeNames;
  }, [groupInfo, memberUsers, memberCount]);

  return (
    <AppBar position="static" elevation={2} sx={{ bgcolor: 'transparent', backdropFilter: 'blur(10px)' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', p: 1.5, cursor: 'pointer' }} onClick={onOpenDrawer}>
        <Avatar src={groupInfo.iconURL} sx={{ mr: 2 }} />
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h6" color={headerTextColor}>{groupInfo.name}</Typography>
          <Typography variant="caption" color={headerTextColor} sx={{ opacity: 0.8 }}>
            {membersSummary || 'Loading members...'}
          </Typography>
        </Box>
        <IconButton color="inherit" sx={{ color: headerTextColor }}><MoreVertIcon /></IconButton>
      </Box>
      <Divider sx={{ bgcolor: headerTextColor, opacity: 0.1 }} />
    </AppBar>
  );
};

// 2. MessageBubble (The core rendering complexity)
const LinkPreviewCard = ({ url, onCacheHit }) => {
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const cacheKey = `link-preview-${url}`;
        const cached = localStorage.getItem(cacheKey);

        if (cached) {
            const data = JSON.parse(cached);
            setPreview(data);
            onCacheHit(data); // Notify parent of cache hit
            return;
        }

        const fetchPreview = async () => {
            setLoading(true);
            try {
                const encodedUrl = encodeURIComponent(url);
                const response = await axios.get(
                    `https://api.linkpreview.net/?key=${LINK_PREVIEW_API_KEY}&q=${encodedUrl}`
                );
                const data = response.data;
                if (data.url) {
                    setPreview(data);
                    localStorage.setItem(cacheKey, JSON.stringify(data));
                }
            } catch (error) {
                console.error("Link preview error:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchPreview();
    }, [url, onCacheHit]);

    if (loading || !preview) return null;

    return (
        <Paper
            elevation={1}
            onClick={() => window.open(preview.url, '_blank')}
            sx={{
                mt: 1, p: 1, cursor: 'pointer',
                border: '1px solid', borderColor: 'divider',
                '&:hover': { bgcolor: 'action.hover' }
            }}
        >
            {preview.image && (
                <Box component="img" src={preview.image} alt="Preview" sx={{ width: '100%', maxHeight: 100, objectFit: 'cover', mb: 1, borderRadius: 1 }} />
            )}
            <Typography variant="subtitle2" noWrap>{preview.title}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxHeight: 40, overflow: 'hidden' }}>{preview.description}</Typography>
            <Typography variant="caption" color="primary">{new URL(preview.url).hostname}</Typography>
        </Paper>
    );
};

const ReactionChip = ({ emoji, count, memberUsers, onOpenDrawer }) => {
    const reactedUids = useMemo(() => Object.keys(memberUsers), [memberUsers]);
    const firstTwoAvatars = reactedUids.slice(0, 2).map(uid => memberUsers[uid]?.photoURL);

    return (
        <Chip
            size="small"
            label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Emoji unified={emoji.unified} size={16} />
                    <Typography variant="caption" sx={{ ml: 0.5 }}>{count}</Typography>
                </Box>
            }
            onClick={onOpenDrawer}
            avatar={
              <Box sx={{ display: 'flex' }}>
                {firstTwoAvatars.map((url, i) => (
                  <Avatar key={i} src={url} sx={{ width: 16, height: 16, border: 0.5, borderColor: 'background.paper', ml: i > 0 ? -0.5 : 0 }} />
                ))}
              </Box>
            }
            sx={{ mr: 0.5, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', height: 20 }}
        />
    );
};

const MessageBubble = React.memo(({ message, isMe, memberUsers, shape, scrollToMessage, onAction, onToggleReaction, onVote }) => {
  const theme = useTheme();
  const senderName = memberUsers[message.senderId]?.name || message.senderName || 'Unknown';
  const senderAvatar = memberUsers[message.senderId]?.photoURL;
  const isSingleEmoji = message.text && /^(\p{Emoji}|\s)+$/u.test(message.text.trim()) && message.text.trim().length <= 4;
  const isPoll = message.type === 'poll';
  const isSystem = message.type === 'system';
  const bubbleColor = isMe ? theme.palette.primary.main : theme.palette.action.selected;
  const textColor = isMe ? theme.palette.primary.contrastText : theme.palette.text.primary;
  const [anchorEl, setAnchorEl] = useState(null);
  const [linkPreview, setLinkPreview] = useState(null);

  // Link Preview Logic
  const firstUrl = message.text?.match(URL_REGEX)?.[0];
  const handleCacheHit = useCallback((data) => setLinkPreview(data), []);
  const renderTextWithLinks = useMemo(() => {
    if (!message.text) return null;
    return message.text.split(URL_REGEX).map((part, index) => {
      if (part.match(URL_REGEX)) {
        return <a key={index} href={part} target="_blank" rel="noopener noreferrer" style={{ color: theme.palette.info.main }}>{part}</a>;
      }
      // Simple Mention pattern (e.g., @username or @name)
      return part.split(/@(\w+)/g).map((subPart, subIndex) => {
        if (subIndex % 2 === 1) {
          // Check if it's a known member
          const mentionedUser = Object.values(memberUsers).find(u => u.username === subPart || u.name === subPart);
          if (mentionedUser) {
            return (
              <span
                key={`${index}-${subIndex}`}
                onClick={() => scrollToMessage(mentionedUser.id)} // Navigate to user profile, simplified here
                style={{ fontWeight: 'bold', color: theme.palette.warning.main, cursor: 'pointer' }}
              >
                @{subPart}
              </span>
            );
          }
        }
        return subPart;
      });
    });
  }, [message.text, theme.palette.info.main, theme.palette.warning.main, memberUsers, scrollToMessage]);

  // Reactions Grouping
  const reactionsMap = useMemo(() => {
    if (!message.reactions) return {};
    return Object.entries(message.reactions).reduce((acc, [uid, emoji]) => {
      acc[emoji] = (acc[emoji] || []).concat(uid);
      return acc;
    }, {});
  }, [message.reactions]);

  // Status Icon Logic
  const StatusIcon = useMemo(() => {
    const color = message.status === 'read' ? theme.palette.info.main : theme.palette.text.secondary;
    if (message.status === 'read') return <DoneAllIcon sx={{ fontSize: 14, color }} />;
    if (message.status === 'delivered') return <DoneAllIcon sx={{ fontSize: 14, color }} />;
    if (message.status === 'sent') return <CheckIcon sx={{ fontSize: 14, color }} />;
    return <AccessTimeIcon sx={{ fontSize: 14, color }} />; // clock for sending/pending
  }, [message.status, theme.palette.info.main, theme.palette.text.secondary]);

  // Context Menu Handlers
  const handleContextMenu = (event) => {
    event.preventDefault();
    setAnchorEl(event.currentTarget);
  };
  const handleCloseMenu = () => setAnchorEl(null);

  const handleAction = (action) => {
    onAction(message.id, action);
    handleCloseMenu();
  };

  if (isSystem) {
    return (
      <Box sx={{ textAlign: 'center', my: 1, opacity: 0.7 }}>
        <Chip label={message.content} size="small" variant="outlined" color="info" />
      </Box>
    );
  }

  return (
    <Box
      id={`message-${message.id}`}
      sx={{
        display: 'flex',
        justifyContent: isMe ? 'flex-end' : 'flex-start',
        my: 0.5,
      }}
      onContextMenu={handleContextMenu}
    >
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleCloseMenu}>
        <MenuItem onClick={() => onToggleReaction(message.id, '❤️')}>React ❤️</MenuItem>
        <MenuItem onClick={() => onAction(message, 'reply')}>Reply</MenuItem>
        {isMe && <MenuItem onClick={() => onAction(message, 'edit')}><EditIcon fontSize="small" sx={{ mr: 1 }} />Edit</MenuItem>}
        {isMe && <MenuItem onClick={() => onAction(message.id, 'delete')}><DeleteIcon fontSize="small" sx={{ mr: 1 }} />Delete</MenuItem>}
      </Menu>

      {!isMe && (
        <Avatar src={senderAvatar} sx={{ width: 24, height: 24, mr: 1, mt: 0.5 }} />
      )}

      {isSingleEmoji ? (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1.2 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }}>
          <Typography sx={{ fontSize: '4rem', lineHeight: 1 }}>{message.text}</Typography>
        </motion.div>
      ) : (
        <Paper
          elevation={2}
          sx={{
            p: 1,
            maxWidth: '70%',
            bgcolor: bubbleColor,
            color: textColor,
            ...shape,
            // Apply different radius for the corner pointing away from the flow
            borderBottomRightRadius: isMe ? shape.borderBottomRightRadius : 20,
            borderBottomLeftRadius: isMe ? 20 : shape.borderBottomLeftRadius,
          }}
        >
          {!isMe && <Typography variant="caption" sx={{ fontWeight: 'bold', mb: 0.5, display: 'block' }}>{senderName}</Typography>}

          {/* Reply Preview Block */}
          {message.replyTo && (
            <Paper
              onClick={() => scrollToMessage(message.replyTo.id)}
              sx={{
                p: 0.8, mb: 1, bgcolor: 'rgba(0,0,0,0.1)',
                borderLeft: `3px solid ${theme.palette.info.light}`,
                cursor: 'pointer',
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 'bold', color: theme.palette.info.light }}>
                {message.replyTo.senderName}
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {message.replyTo.text}
              </Typography>
            </Paper>
          )}

          {isPoll ? (
            <Box>
                <Typography variant="subtitle1" fontWeight="bold" mb={1}>{message.question}</Typography>
                {message.options.map((option, idx) => {
                    const voted = (option.votes || []).includes(message.senderId); // Simplified: check if sender voted
                    const totalVotes = option.votes?.length || 0;
                    return (
                        <Button
                            key={idx}
                            fullWidth
                            variant={voted ? 'contained' : 'outlined'}
                            onClick={() => onVote(message.id, idx)}
                            sx={{ mt: 0.5, justifyContent: 'space-between', textTransform: 'none' }}
                            disabled={message.options.some(opt => (opt.votes || []).includes(message.senderId))}
                        >
                            {option.text}
                            <Chip label={totalVotes} size="small" variant="filled" color={voted ? 'secondary' : 'default'} />
                        </Button>
                    );
                })}
            </Box>
          ) : message.type === 'image' ? (
            <Box>
              <img src={message.dataUri} alt="Shared" style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px' }} />
              <Typography variant="body2">{renderTextWithLinks}</Typography>
            </Box>
          ) : (
            <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
              {renderTextWithLinks}
              {message.edited && <Typography variant="caption" sx={{ opacity: 0.7, ml: 1 }}>(edited)</Typography>}
            </Typography>
          )}

          {/* Link Preview */}
          {firstUrl && !linkPreview && <LinkPreviewCard url={firstUrl} onCacheHit={handleCacheHit} />}
          {firstUrl && linkPreview && (
            <Paper
                elevation={1}
                onClick={() => window.open(linkPreview.url, '_blank')}
                sx={{ mt: 1, p: 1, cursor: 'pointer', border: '1px solid', borderColor: 'divider', '&:hover': { bgcolor: 'action.hover' } }}
            >
                {linkPreview.image && <Box component="img" src={linkPreview.image} alt="Preview" sx={{ width: '100%', maxHeight: 100, objectFit: 'cover', mb: 1, borderRadius: 1 }} />}
                <Typography variant="subtitle2" noWrap>{linkPreview.title}</Typography>
                <Typography variant="caption" color="primary">{new URL(linkPreview.url).hostname}</Typography>
            </Paper>
          )}


          {/* Time and Status */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mt: 0.5 }}>
            <Typography variant="caption" sx={{ mr: 0.5 }}>
              {message.timestamp?.toDate ? message.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}
            </Typography>
            {isMe && StatusIcon}
          </Box>
        </Paper>
      )}

      {/* Reaction Chips */}
      {Object.entries(reactionsMap).length > 0 && (
          <Box sx={{
              position: 'relative',
              top: '-10px',
              left: isMe ? '-10px' : '10px',
              display: 'flex',
              flexWrap: 'wrap',
          }}>
              {Object.entries(reactionsMap).map(([emoji, uids]) => (
                  <ReactionChip
                      key={emoji}
                      emoji={emoji}
                      count={uids.length}
                      memberUsers={uids.reduce((acc, uid) => ({ ...acc, [uid]: memberUsers[uid] }), {})}
                      onOpenDrawer={() => console.log('Open Reactions Drawer')} // Placeholder
                  />
              ))}
          </Box>
      )}
    </Box>
  );
});

// 3. MessageList
const MessageList = ({ groupedMessages, currentUserId, memberUsers, getMessageShape, scrollToMessage, onSetReply, onSetEdit, onDeleteMessage, onToggleReaction, onVote }) => {
  const handleMessageAction = useCallback((messageOrId, action) => {
    if (action === 'reply') {
      onSetReply(messageOrId);
    } else if (action === 'edit') {
      onSetEdit(messageOrId);
    } else if (action === 'delete') {
      onDeleteMessage(messageOrId);
    }
    // Add quick reaction handling here
  }, [onSetReply, onSetEdit, onDeleteMessage]);

  return (
    <List sx={{ p: 0 }}>
      {groupedMessages.map(({ date, messages }) => (
        <React.Fragment key={date.getTime()}>
          <Box sx={{ textAlign: 'center', my: 2 }}>
            <Chip label={date.toLocaleDateString()} size="small" color="primary" variant="outlined" />
          </Box>
          {messages.map((message, index) => (
            <ListItem key={message.id} sx={{ p: 0, display: 'block' }}>
              <MessageBubble
                message={message}
                isMe={message.senderId === currentUserId}
                memberUsers={memberUsers}
                shape={getMessageShape(messages, index, currentUserId)}
                scrollToMessage={scrollToMessage}
                onAction={handleMessageAction}
                onToggleReaction={onToggleReaction}
                onVote={onVote}
              />
            </ListItem>
          ))}
        </React.Fragment>
      ))}
    </List>
  );
};

// 4. Composer (The second most complex component)
const Composer = ({ onSendMessage, onUpdateMessage, onTyping, replyTo, onCancelReply, editMessage, onCancelEdit, memberUsers, onOpenPollDialog }) => {
  const theme = useTheme();
  const [text, setText] = useState(editMessage ? editMessage.text : '');
  const [mentionsDrawerOpen, setMentionsDrawerOpen] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    // Sync text state and focus when entering edit mode
    if (editMessage) {
      setText(editMessage.text);
      if (inputRef.current) inputRef.current.focus();
    } else {
      setText('');
      // Clear reply state when done editing
      if (!replyTo) onCancelReply();
    }
  }, [editMessage, replyTo, onCancelReply]);

  const handleChange = (e) => {
    const newText = e.target.value;
    setText(newText);
    onTyping(newText);

    // Mentions logic: Check for '@' at the beginning or after a space
    const caretPos = inputRef.current?.selectionStart || newText.length;
    const preText = newText.substring(0, caretPos);
    const lastAt = preText.lastIndexOf('@');

    if (lastAt !== -1 && (lastAt === 0 || preText[lastAt - 1] === ' ')) {
      const mentionText = preText.substring(lastAt + 1);
      if (mentionText.length >= 0) {
        setMentionsDrawerOpen(true);
      } else {
        setMentionsDrawerOpen(false);
      }
    } else {
      setMentionsDrawerOpen(false);
    }
  };

  const handleSelectMention = (user) => {
    const usernameOrName = user.username || user.name;
    const currentText = text;
    const caretPos = inputRef.current?.selectionStart || currentText.length;
    const preText = currentText.substring(0, caretPos);
    const lastAt = preText.lastIndexOf('@');

    if (lastAt !== -1) {
      const newText = currentText.substring(0, lastAt) + `@${usernameOrName} ` + currentText.substring(caretPos);
      setText(newText);
      onTyping(newText);
    }
    setMentionsDrawerOpen(false);
    if (inputRef.current) inputRef.current.focus();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (text.trim() === '') return;

    if (editMessage) {
      onUpdateMessage(editMessage.id, text.trim());
      onCancelEdit();
    } else {
      onSendMessage(text.trim());
    }
    setText('');
    onTyping('');
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        // In a full implementation, you'd show a preview here before sending
        onSendMessage(text.trim(), 'image', { dataUri: reader.result });
        setText('');
        onTyping('');
      };
      reader.readAsDataURL(file);
    }
  };

  // List of members for the mention drawer
  const mentionableMembers = useMemo(() => Object.values(memberUsers).filter(u => u.name), [memberUsers]);

  return (
    <Box sx={{ p: 1 }}>
      {/* Reply Preview Strip */}
      {replyTo && !editMessage && (
        <AnimatePresence>
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
            <Paper elevation={0} sx={{ p: 1, mb: 1, bgcolor: theme.palette.action.hover, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: 1 }}>
              <Box sx={{ overflow: 'hidden' }}>
                <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block' }}>Replying to: {replyTo.senderName}</Typography>
                <Typography variant="caption" sx={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {replyTo.text}
                </Typography>
              </Box>
              <IconButton size="small" onClick={onCancelReply}><CloseIcon fontSize="small" /></IconButton>
            </Paper>
          </motion.div>
        </AnimatePresence>
      )}

      {/* Mentions Drawer (SwipeableDrawer or just a Collapse) */}
      <Collapse in={mentionsDrawerOpen && mentionableMembers.length > 0}>
        <Paper elevation={3} sx={{ maxHeight: 150, overflowY: 'auto', mb: 1, p: 1, bgcolor: 'background.paper' }}>
          <List dense>
            {mentionableMembers.map(user => (
              <ListItemButton key={user.id} onClick={() => handleSelectMention(user)}>
                <Avatar src={user.photoURL} sx={{ width: 24, height: 24, mr: 1 }} />
                <ListItemText primary={user.name} secondary={user.username && `@${user.username}`} />
              </ListItemButton>
            ))}
          </List>
        </Paper>
      </Collapse>


      <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
        <input
          accept="image/*"
          type="file"
          onChange={handleImageUpload}
          style={{ display: 'none' }}
          id="image-upload-input"
        />
        <Tooltip title="Send Image">
            <label htmlFor="image-upload-input">
                <IconButton component="span" color="primary">
                    <InsertPhotoIcon />
                </IconButton>
            </label>
        </Tooltip>

        <Tooltip title="More Actions (Polls, Timeline, Checklist)">
            <IconButton color="primary" onClick={onOpenPollDialog}>
                <PollIcon />
            </IconButton>
        </Tooltip>

        <TextField
          inputRef={inputRef}
          fullWidth
          multiline
          maxRows={4}
          value={text}
          onChange={handleChange}
          label={editMessage ? "Editing Message..." : "Type a message..."}
          variant="outlined"
          size="small"
          sx={{ '& fieldset': { borderRadius: 3 } }}
        />

        {editMessage ? (
          <>
            <Button onClick={onCancelEdit} variant="outlined" color="error">Cancel</Button>
            <Button type="submit" variant="contained" color="success">Save</Button>
          </>
        ) : (
          <IconButton type="submit" color="primary" disabled={text.trim() === ''}>
            <SendIcon />
          </IconButton>
        )}
      </Box>
    </Box>
  );
};


// 5. TypingIndicator (Simplified)
const TypingIndicator = React.memo(({ drafts, memberUsers }) => {
  const typingUsers = useMemo(() => {
    return Object.keys(drafts)
      .filter(uid => memberUsers[uid])
      .map(uid => memberUsers[uid]);
  }, [drafts, memberUsers]);

  if (typingUsers.length === 0) return null;

  const names = typingUsers.map(u => u.name || u.username || 'Someone');
  const text = names.length > 2
    ? 'Several people are typing...'
    : names.length === 2
      ? `${names[0]} and ${names[1]} are typing...`
      : `${names[0]} is typing...`;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', p: 1, pl: 2 }}>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.3 }}
          style={{ display: 'flex', alignItems: 'center' }}
        >
          {typingUsers.slice(0, 3).map((user) => (
            <Avatar key={user.id} src={user.photoURL} sx={{ width: 24, height: 24, mr: -1, border: '2px solid white' }} />
          ))}
          <Paper elevation={3} sx={{ ml: 2, p: 1, borderRadius: 2 }}>
            <Typography variant="caption" sx={{ fontStyle: 'italic' }}>{text}</Typography>
          </Paper>
        </motion.div>
      </AnimatePresence>
    </Box>
  );
});

// 6. PollDialog (Simplified)
const PollDialog = ({ open, onClose, onSendPoll }) => {
    const [question, setQuestion] = useState('');
    const [options, setOptions] = useState(['', '']);

    const handleOptionChange = (index, value) => {
        const newOptions = [...options];
        newOptions[index] = value;
        setOptions(newOptions);
    };

    const handleAddOption = () => setOptions([...options, '']);
    const handleRemoveOption = (index) => setOptions(options.filter((_, i) => i !== index));

    const handleSend = () => {
        const validOptions = options.filter(opt => opt.trim());
        if (question.trim() && validOptions.length >= 2) {
            onSendPoll(question.trim(), validOptions);
            setQuestion('');
            setOptions(['', '']);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>Create New Poll</DialogTitle>
            <DialogContent>
                <TextField
                    autoFocus
                    margin="dense"
                    label="Poll Question"
                    type="text"
                    fullWidth
                    variant="outlined"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                />
                <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Options (Min 2)</Typography>
                {options.map((option, index) => (
                    <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                        <TextField
                            fullWidth
                            label={`Option ${index + 1}`}
                            variant="outlined"
                            value={option}
                            onChange={(e) => handleOptionChange(index, e.target.value)}
                        />
                        {options.length > 2 && (
                            <IconButton onClick={() => handleRemoveOption(index)} color="error">
                                <CloseIcon />
                            </IconButton>
                        )}
                    </Box>
                ))}
                <Button onClick={handleAddOption} startIcon={<AddIcon />}>Add Option</Button>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleSend} disabled={question.trim() === '' || options.filter(opt => opt.trim()).length < 2} variant="contained">
                    Send Poll
                </Button>
            </DialogActions>
        </Dialog>
    );
};


// --- The Main GroupChatPage Component (Identical to initial response logic but updated imports) ---

const GroupChatPage = () => {
  const { groupName } = useParams();
  const navigate = useNavigate();
  const { mode } = useThemeToggle();
  const [localAccent, setLocalAccent] = useState('blue');
  const theme = useMemo(() => getTheme(mode, localAccent), [mode, localAccent]);

  const { currentUser, loadingUser } = useAuthUser();
  const currentUserId = currentUser?.uid;

  const { groupInfo, memberUsers, loadingGroup, isAdmin, isCreator, canSend } = useGroupData(groupName, currentUser);
  const createdByUser = memberUsers[groupInfo?.createdBy];

  const { messages, drafts, loadingMessages, updateDraft } = useMessagesAndTyping(groupName, currentUserId);
  const isLoading = loadingUser || loadingGroup || loadingMessages;

  const [chatWallpaper, setChatWallpaper] = useState('none');
  const [headerTextColor, setHeaderTextColor] = useState('white');
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [replyToMessage, setReplyToMessage] = useState(null);
  const [isEditingMessage, setIsEditingMessage] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [pollDialogOpen, setPollDialogOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
      const [user, setUser] = useState(null)
      const [memberInfo, setMemberInfo] = useState({});
  const [tripInfo, setTripInfo] = useState(null);
  const [timelineStats, setTimelineStats] = useState(null);
    const [groupSettingsOpen, setGroupSettingsOpen] = useState(false);
      const [membersDrawerOpen, setMembersDrawerOpen] = useState(false);
        const [inviteDrawerOpen, setInviteDrawerOpen] = useState(false);
          const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);

  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);

  // --- Theme, Wallpaper, and Color Logic ---

  const getWallpaperUrl = useCallback((wallpaperKey) => {
    if (wallpaperKey === 'default') {
      return mode === 'dark' ? '/wallpapers/default-dark.jpg' : '/wallpapers/default-light.jpg';
    }
    if (wallpaperKey.startsWith('http')) {
      return wallpaperKey;
    }
    return null;
  }, [mode]);

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'bunkmate_chatWallpaper') {
        setChatWallpaper(e.newValue || 'none');
      }
    };
    window.addEventListener('storage', handleStorageChange);
    const storedWallpaper = localStorage.getItem('bunkmate_chatWallpaper') || 'none';
    setChatWallpaper(storedWallpaper);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    const wallpaperUrl = getWallpaperUrl(chatWallpaper);
    if (!wallpaperUrl) {
      setHeaderTextColor(mode === 'dark' ? 'white' : 'black');
      return;
    }

    const fac = new FastAverageColor();
    fac.getColorAsync(wallpaperUrl, { algorithm: 'dominant' })
      .then(color => {
        setHeaderTextColor(color.isDark ? 'white' : 'black');
      })
      .catch(e => {
        console.error('FastAverageColor error:', e);
        setHeaderTextColor(mode === 'dark' ? 'white' : 'black');
      });
  }, [chatWallpaper, getWallpaperUrl, mode]);

  // --- Message Utilities and Handlers ---

  const groupedMessages = useMemo(() => groupMessagesByDate(messages), [messages]);

  const indexById = useMemo(() => {
    return messages.reduce((acc, msg, index) => { acc[msg.id] = index; return acc; }, {});
  }, [messages]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShowScrollToBottom(false);
  }, []);

  const scrollToMessage = useCallback((messageId) => {
    const element = document.getElementById(`message-${messageId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // In a full implementation, you'd add a temporary highlight class here
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      const container = scrollContainerRef.current;
      const isNearBottom = container && (container.scrollHeight - container.scrollTop - container.clientHeight < 300);

      if (isNearBottom || messages.length === 1) {
        scrollToBottom();
      }
    }
  }, [messages, scrollToBottom]);

  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (container) {
      const isAtBottom = container.scrollHeight - container.scrollTop === container.clientHeight;
      setShowScrollToBottom(!isAtBottom);
    }
  }, []);

  const sendMessage = useCallback(async (text, type = 'text', additionalFields = {}) => {
    if (!currentUserId || !groupName || !canSend) return;

    try {
      const messagesColRef = collection(db, 'groupChats', groupName, 'messages');
      const senderInfo = memberUsers[currentUserId] || {};

      const messageData = {
        text,
        senderId: currentUserId,
        senderName: senderInfo.name || currentUser.displayName || 'Unknown User',
        photoURL: senderInfo.photoURL || currentUser.photoURL,
        timestamp: serverTimestamp(),
        status: 'sent',
        read: false,
        ...(replyToMessage && { replyTo: { id: replyToMessage.id, senderName: replyToMessage.senderName, text: replyToMessage.text } }),
        ...(type !== 'text' && { type }),
        ...additionalFields,
      };

      await addDoc(messagesColRef, messageData);
      setReplyToMessage(null);
      updateDraft('');
    } catch (e) {
      console.error("Error sending message: ", e);
    }
  }, [currentUserId, groupName, canSend, replyToMessage, memberUsers, currentUser, updateDraft]);

  const updateMessage = useCallback(async (messageId, newText) => {
    if (!currentUserId || !groupName || !isEditingMessage) return;

    try {
      const messageDocRef = doc(db, 'groupChats', groupName, 'messages', messageId);
      await updateDoc(messageDocRef, {
        text: newText,
        edited: true,
      });
      setIsEditingMessage(null);
      updateDraft('');
    } catch (e) {
      console.error("Error updating message: ", e);
    }
  }, [currentUserId, groupName, isEditingMessage, updateDraft]);

  const deleteMessage = useCallback(async (messageId) => {
    if (!currentUserId || !groupName) return;
    try {
      await deleteDoc(doc(db, 'groupChats', groupName, 'messages', messageId));
    } catch (e) {
      console.error("Error deleting message: ", e);
    }
  }, [groupName, currentUserId]);

  const handleReaction = useCallback(async (messageId, emoji) => {
    if (!currentUserId || !groupName) return;

    const messageRef = doc(db, 'groupChats', groupName, 'messages', messageId);
    const message = messages[indexById[messageId]];

    const currentReaction = message?.reactions?.[currentUserId];

    // Atomically delete or update the reaction field
    const updatePayload = currentReaction === emoji
        ? { [`reactions.${currentUserId}`]: deleteField() }
        : { [`reactions.${currentUserId}`]: emoji };

    await updateDoc(messageRef, updatePayload);
  }, [currentUserId, groupName, messages, indexById]);


  const handlePollVote = useCallback(async (messageId, optionIndex) => {
    if (!currentUserId || !groupName) return;

    const messageRef = doc(db, 'groupChats', groupName, 'messages', messageId);
    const message = messages[indexById[messageId]];
    const options = message?.options || [];

    // Check if user has already voted on ANY option
    const hasVoted = options.some(option => (option.votes || []).includes(currentUserId));
    if (hasVoted) return;

    // Add vote
    await updateDoc(messageRef, {
      [`options.${optionIndex}.votes`]: arrayUnion(currentUserId),
    });

  }, [currentUserId, groupName, messages, indexById]);


  if (isLoading) {
    return (<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><Typography>Loading chat...</Typography></Box>);
  }

  if (!groupInfo) {
    return (<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><Typography color="error">Group "{groupName}" not found.</Typography></Box>);
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        bgcolor: theme.palette.background.default,
        backgroundImage: chatWallpaper !== 'none' ? `url(${getWallpaperUrl(chatWallpaper)})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* 1. Chat Header */}
      <ChatHeader
        groupInfo={groupInfo}
        memberUsers={memberUsers}
        memberCount={groupInfo?.members?.length || 0}
        onOpenDrawer={() => setIsDrawerOpen(true)}
        headerTextColor={headerTextColor}
      />

      {/* 2. Message Area */}
      <Box
        ref={scrollContainerRef}
        onScroll={handleScroll}
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
          p: 1,
          position: 'relative',
        }}
      >
        <Box
          sx={{
            mx: 'auto',
            width: '100%',
            maxWidth: '900px',
            pt: 2,
            pb: 4,
          }}
        >
          {/* Chat Intro Card */}
          <Paper elevation={1} sx={{ p: 2, mb: 2, textAlign: 'center', opacity: 0.8, mx: 'auto', maxWidth: '400px', borderRadius: 2 }}>
            <Typography variant="h6">{groupInfo.name}</Typography>
            <Typography variant="body2" color="text.secondary">{groupInfo.description}</Typography>
          </Paper>

          {/* Message List */}
          <MessageList
            groupedMessages={groupedMessages}
            currentUserId={currentUserId}
            memberUsers={memberUsers}
            getMessageShape={getMessageShape}
            scrollToMessage={scrollToMessage}
            onSetReply={setReplyToMessage}
            onSetEdit={setIsEditingMessage}
            onDeleteMessage={deleteMessage}
            onToggleReaction={handleReaction}
            onVote={handlePollVote}
          />

          {/* Scroll Target */}
          <div ref={messagesEndRef} />
        </Box>

        {/* Scroll To Bottom FAB */}
        <AnimatePresence>
          {showScrollToBottom && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              style={{ position: 'fixed', bottom: 90, right: 20 }}
            >
              <Fab color="primary" size="small" onClick={scrollToBottom}>
                <ArrowDownwardIcon />
              </Fab>
            </motion.div>
          )}
        </AnimatePresence>
      </Box>

      {/* 3. Typing Indicator */}
      <TypingIndicator drafts={drafts} memberUsers={memberUsers} />

      {/* 4. Composer Area */}
      <Paper
        elevation={10}
        sx={{
          p: 1,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          backdropFilter: 'blur(10px)',
          bgcolor: 'rgba(255, 255, 255, 0.7)',
          ...(mode === 'dark' && { bgcolor: 'rgba(0, 0, 0, 0.7)' }),
        }}
      >
        {canSend ? (
          <Composer
            onSendMessage={sendMessage}
            onUpdateMessage={updateMessage}
            onTyping={updateDraft}
            replyTo={replyToMessage}
            onCancelReply={() => setReplyToMessage(null)}
            editMessage={isEditingMessage}
            onCancelEdit={() => setIsEditingMessage(null)}
            memberUsers={memberUsers}
            onOpenPollDialog={() => setPollDialogOpen(true)}
          />
        ) : (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Only admins can send messages in this group
            </Typography>
          </Box>
        )}
      </Paper>

      {/* 5. Group Info Drawer */}
      <GroupInfoDrawer
        profileOpen={profileOpen}
        setProfileOpen={setProfileOpen}
        // pass all required props here: groupInfo, user, handlers, effectiveChatTheme, etc
        groupInfo={groupInfo}
        groupName="My Group"
        mode="dark"
        createdByUser={createdByUser}
        tripInfo={tripInfo}
        timelineStats={timelineStats}
        memberInfo={memberInfo}
        canEditGroupInfo={true}
        canAddMembers={true}
        currentUser={currentUser}
        user={user}
        handleExitGroup={() => console.log("exit group")}
        handleRemoveMember={(uid) => console.log("remove member", uid)}
        handleUpdateGroupInfo={() => console.log("update")}
        handlePermissionChange={(perm, role) => console.log("perm change", perm, role)}
        toggleAdminStatus={(uid) => console.log("toggle admin", uid)}
        setGroupSettingsOpen={setGroupSettingsOpen}
        groupSettingsOpen={groupSettingsOpen}
        membersDrawerOpen={membersDrawerOpen}
        setMembersDrawerOpen={setMembersDrawerOpen}
        inviteDrawerOpen={inviteDrawerOpen}
        setInviteDrawerOpen={setInviteDrawerOpen}
        setNotification={() => {}}
        notification={null}
        handleShare={() => console.log("share link")}
        addUserDialogOpen={addUserDialogOpen}
        setAddUserDialogOpen={setAddUserDialogOpen}
        searchTerm={""}
        setSearchTerm={() => {}}
        searchLoading={false}
        searchResults={[]}
        selectedUsers={[]}
        setSelectedUsers={() => {}}
        handleBatchAddUsers={() => {}}
      />

      {/* 6. Modals/Dialogs */}
      <PollDialog
        open={pollDialogOpen}
        onClose={() => setPollDialogOpen(false)}
        onSendPoll={(question, options) => {
          sendMessage('', 'poll', { question, options: options.map(t => ({ text: t, votes: [] })) });
          setPollDialogOpen(false);
        }}
      />
    </Box>
  );
};

export default GroupChatPage;