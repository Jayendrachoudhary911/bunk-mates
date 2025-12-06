import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, AppBar, Avatar, Paper, Typography, IconButton, TextField, Button, Fab,
  List, ListItem, ListItemButton, ListItemText, Menu, MenuItem, Dialog, DialogTitle,
  DialogContent, DialogActions, SwipeableDrawer, Collapse, Divider, Tooltip, Chip, useTheme,
  CircularProgress
} from '@mui/material';
import {
  Send as SendIcon, ArrowDownward as ArrowDownwardIcon, Close as CloseIcon,
  Edit as EditIcon, DeleteOutline as DeleteOutlineIcon, InsertPhoto as InsertPhotoIcon,
  Check as CheckIcon, AccessTime as AccessTimeIcon, DoneAll as DoneAllIcon,
  Poll as PollIcon, Reply as ReplyIcon, ContentCopy as ContentCopyIcon,
  Search as SearchIcon, Add as AddIcon, Remove as RemoveIcon, ArrowBack as ArrowBackIcon,
  MoreVert as MoreVertIcon // Explicitly imported
} from '@mui/icons-material';
import { FastAverageColor } from 'fast-average-color';
import EmojiPicker, { Emoji } from 'emoji-picker-react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import axios from 'axios';
import Popover from '@mui/material/Popover';
import { styled } from '@mui/system';

// --- ASSUMED EXTERNAL IMPORTS ---
import { auth, db } from '../../firebase';
import {
  collection, doc, getDoc, addDoc, updateDoc, arrayUnion, arrayRemove,
  onSnapshot, serverTimestamp, query, orderBy, deleteDoc, deleteField
} from 'firebase/firestore';
import { useThemeToggle } from '../../contexts/ThemeToggleContext';
import { getTheme } from '../../theme';
import GroupInfoDrawer from '../GroupChat/GroupInfoDrawer'; 

// --- CONSTANTS & UTILITY FUNCTIONS ---

const LINK_PREVIEW_API_KEY = '3db616e201708f056ee4d32ddab9839a';
const URL_REGEX = /(https?:\/\/[^\s]+)/g;

const getMessageShape = (messages, index, currentUserId) => {
  const currentMessage = messages[index];
  const prevMessage = messages[index - 1];
  const nextMessage = messages[index + 1];
  const isMe = currentMessage.senderId === currentUserId;

  const timeCheck = (a, b) => Math.abs((a?.timestamp?.seconds || 0) - (b?.timestamp?.seconds || 0)) < 60;
  
  const isGroupedWithPrev = prevMessage && prevMessage.senderId === currentMessage.senderId && timeCheck(currentMessage, prevMessage);
  const isGroupedWithNext = nextMessage && nextMessage.senderId === currentMessage.senderId && timeCheck(currentMessage, nextMessage);

  const radius = 20;
  const flat = 4;

  const getRadius = (isEdge, isGrouped) => isEdge ? (isGrouped ? flat : radius) : radius;

  const shape = {
    borderTopLeftRadius: getRadius(!isMe, isGroupedWithNext),
    borderTopRightRadius: getRadius(isMe, isGroupedWithNext),
    borderBottomLeftRadius: getRadius(!isMe, isGroupedWithPrev),
    borderBottomRightRadius: getRadius(isMe, isGroupedWithPrev),
  };
  
  if (isMe) {
    shape.borderBottomRightRadius = isGroupedWithPrev ? flat : radius;
  } else {
    shape.borderBottomLeftRadius = isGroupedWithPrev ? flat : radius;
  }
  
  return shape;
};

const groupMessagesByDate = (messages) => {
  const grouped = [];
  let currentDateString = null;
  let currentGroup = [];

  messages.forEach(msg => {
    const timestamp = msg.timestamp?.toDate ? msg.timestamp.toDate() : new Date();
    const dateKey = timestamp.toLocaleDateString();

    if (dateKey !== currentDateString) {
      if (currentGroup.length > 0) {
        grouped.push({ date: new Date(currentDateString), messages: currentGroup });
      }
      currentDateString = dateKey;
      currentGroup = [msg];
    } else {
      currentGroup.push(msg);
    }
  });

  if (currentGroup.length > 0) {
    grouped.push({ date: new Date(currentDateString), messages: currentGroup });
  }
  return grouped;
};

const LinkPreviewCard = React.memo(({ url, onCacheHit }) => {
    const theme = useTheme();
    const [preview, setPreview] = useState(null);

    useEffect(() => {
        const cacheKey = `link-preview-${url}`;
        const cached = localStorage.getItem(cacheKey);

        if (cached) {
            const data = JSON.parse(cached);
            setPreview(data);
            onCacheHit(data); 
            return;
        }

        const fetchPreview = async () => {
            try {
                const response = await axios.get(`https://api.linkpreview.net/?key=${LINK_PREVIEW_API_KEY}&q=${encodeURIComponent(url)}`);
                const data = response.data;
                if (data.url) {
                    setPreview(data);
                    localStorage.setItem(cacheKey, JSON.stringify(data));
                }
            } catch (error) {
                console.error("Link preview error:", error);
            }
        };

        fetchPreview();
    }, [url, onCacheHit]);

    if (!preview || !preview.title) return null;

    return (
        <Paper
            elevation={1}
            onClick={() => window.open(preview.url, '_blank')}
            sx={{
                mt: 1, p: 1, cursor: 'pointer',
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                border: '1px solid', borderColor: theme.palette.divider,
                borderRadius: 2,
                '&:hover': { bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' }
            }}
        >
            {preview.image && (
                <Box component="img" src={preview.image} alt="Preview" sx={{ width: '100%', maxHeight: 100, objectFit: 'cover', mb: 1, borderRadius: 1 }} />
            )}
            <Typography variant="subtitle2" noWrap sx={{ fontWeight: 'bold' }}>{preview.title}</Typography>
            <Typography variant="caption" color="primary">{new URL(preview.url).hostname}</Typography>
        </Paper>
    );
});

// 2. MessageBubble (Memoized)
const MessageBubble = React.memo(({ message, isMe, memberUsers, shape, scrollToMessage, onAction, onToggleReaction, onVote, theme, currentUserId }) => {
    const senderName = memberUsers[message.senderId]?.name || message.senderName || 'Unknown';
    const senderAvatar = memberUsers[message.senderId]?.photoURL;
    const isSingleEmoji = message.text && /^(\p{Emoji}|\s)+$/u.test(message.text.trim()) && message.text.trim().length <= 4;
    const isPoll = message.type === 'poll';
    const isSystem = message.type === 'system';
    const bubbleColor = isMe ? theme.palette.primary.main : theme.palette.action.selected;
    const textColor = isMe ? theme.palette.primary.contrastText : theme.palette.text.primary;
    const [anchorEl, setAnchorEl] = useState(null);
    const [linkPreviewData, setLinkPreviewData] = useState(null);
    
    // Memoized text rendering
    const renderTextWithLinks = useMemo(() => {
        if (!message.text) return null;
        return message.text.split(URL_REGEX).map((part, index) => {
            if (part.match(URL_REGEX)) {
                return <a key={index} href={part} target="_blank" rel="noopener noreferrer" style={{ color: theme.palette.info.main }}>{part}</a>;
            }
            // Simple Mention pattern
            return part.split(/@(\w+)/g).map((subPart, subIndex) => {
                if (subIndex % 2 === 1) {
                    const mentionedUser = Object.values(memberUsers).find(u => u.username === subPart || u.name === subPart);
                    if (mentionedUser) {
                        return <span key={`${index}-${subIndex}`} style={{ fontWeight: 'bold', color: theme.palette.warning.main, cursor: 'pointer' }}>@{subPart}</span>;
                    }
                }
                return subPart;
            });
        });
    }, [message.text, theme.palette.info.main, theme.palette.warning.main, memberUsers]);

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
        return <AccessTimeIcon sx={{ fontSize: 14, color }} />;
    }, [message.status, theme.palette.info.main, theme.palette.text.secondary]);

    const handleAction = (action) => {
        onAction(message, action);
        setAnchorEl(null);
    };

    if (isSystem) {
        return (
            <Box sx={{ textAlign: 'center', my: 1, opacity: 0.7 }}>
                <Chip label={message.content} size="small" variant="outlined" color="info" />
            </Box>
        );
    }

    const firstUrl = message.text?.match(URL_REGEX)?.[0];

    return (
        <Box
            id={`message-${message.id}`}
            sx={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', my: 0.5, maxWidth: '100%' }}
            onContextMenu={(e) => { e.preventDefault(); setAnchorEl(e.currentTarget); }}
        >
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
                <MenuItem onClick={() => onToggleReaction(message.id, '❤️')}>React ❤️</MenuItem>
                <MenuItem onClick={() => handleAction('reply')}><ReplyIcon fontSize="small" sx={{ mr: 1 }} />Reply</MenuItem>
                {isMe && <MenuItem onClick={() => handleAction('edit')}><EditIcon fontSize="small" sx={{ mr: 1 }} />Edit</MenuItem>}
                {isMe && <MenuItem onClick={() => onAction(message.id, 'delete')}><DeleteOutlineIcon fontSize="small" sx={{ mr: 1 }} />Delete</MenuItem>}
                <MenuItem onClick={() => { navigator.clipboard.writeText(message.text || ""); setAnchorEl(null); }}><ContentCopyIcon fontSize="small" sx={{ mr: 1 }} />Copy</MenuItem>
            </Menu>

            {!isMe && (
                <Avatar src={senderAvatar} sx={{ width: 24, height: 24, mr: 1, mt: 0.5, flexShrink: 0 }} />
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
                        maxWidth: '80%', 
                        bgcolor: bubbleColor,
                        color: textColor,
                        ...shape,
                    }}
                >
                    {!isMe && <Typography variant="caption" sx={{ fontWeight: 'bold', mb: 0.5, display: 'block', color: theme.palette.info.light }}>{senderName}</Typography>}

                    {message.replyTo && (
                        <Paper onClick={() => scrollToMessage(message.replyTo.id)} sx={{ p: 0.8, mb: 1, bgcolor: 'rgba(0,0,0,0.1)', borderLeft: `3px solid ${theme.palette.info.light}`, cursor: 'pointer', borderRadius: 1 }}>
                            <Typography variant="caption" sx={{ fontWeight: 'bold', color: theme.palette.info.light, display: 'block' }}>{message.replyTo.senderName}</Typography>
                            <Typography variant="caption" sx={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{message.replyTo.text}</Typography>
                        </Paper>
                    )}
                    
                    {message.type === 'image' && message.dataUri ? (
                        <img src={message.dataUri} alt="Shared" style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px' }} />
                    ) : null}
                    
                    {/* Render Text Content */}
                    <Typography variant="body2" sx={{ wordBreak: 'break-word', color: textColor }}>
                         {renderTextWithLinks}
                         {message.edited && <Typography component="span" variant="caption" sx={{ opacity: 0.7, ml: 1 }}>(edited)</Typography>}
                    </Typography>

                    {/* Link Preview (Only display if text is present and preview data is fetched/cached) */}
                    {firstUrl && <LinkPreviewCard url={firstUrl} onCacheHit={setLinkPreviewData} />}

                    {/* Poll rendering logic (Simplified) */}
                    {isPoll && message.options && (
                        <Box sx={{ mt: 1 }}>
                            {message.options.map((option, idx) => {
                                const totalVotes = option.votes?.length || 0;
                                const hasVoted = (option.votes || []).includes(currentUserId);
                                return (
                                    <Button key={idx} fullWidth onClick={() => onVote(message.id, idx)} disabled={message.options.some(opt => (opt.votes || []).includes(currentUserId))} sx={{ mt: 0.5, justifyContent: 'space-between', textTransform: 'none', bgcolor: hasVoted ? theme.palette.warning.main : 'inherit' }}>
                                        {option.text}
                                        <Chip label={totalVotes} size="small" />
                                    </Button>
                                );
                            })}
                        </Box>
                    )}

                    {/* Time and Status */}
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mt: 0.5 }}>
                        <Typography variant="caption" sx={{ mr: 0.5, color: textColor }}>
                            {message.timestamp?.toDate ? message.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}
                        </Typography>
                        {isMe && StatusIcon}
                    </Box>
                </Paper>
            )}

            {/* Reaction Chips */}
            {Object.entries(reactionsMap).length > 0 && (
                <Box sx={{ position: 'relative', top: '-10px', left: isMe ? '-10px' : '10px', display: 'flex', flexWrap: 'wrap' }}>
                    {Object.entries(reactionsMap).map(([emoji, uids]) => (
                        <Chip key={emoji} size="small" label={`${emoji} ${uids.length}`} sx={{ mr: 0.5, bgcolor: theme.palette.background.paper, border: '1px solid', borderColor: theme.palette.divider, height: 20 }} />
                    ))}
                </Box>
            )}
        </Box>
    );
});

// 5. TypingIndicator (Simplified)
const TypingIndicator = React.memo(({ drafts, memberUsers, theme }) => {
    const typingUsers = useMemo(() => {
        return Object.keys(drafts)
            .filter(uid => memberUsers[uid]?.name) // Filter to only show users with names
            .map(uid => memberUsers[uid]);
    }, [drafts, memberUsers]);

    if (typingUsers.length === 0) return null;

    const names = typingUsers.map(u => u.name || 'Someone');
    const text = names.length > 2
        ? 'Several people are typing...'
        : names.length === 2
        ? `${names[0]} and ${names[1]} are typing...`
        : `${names[0]} is typing...`;

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', p: 1, pl: 2, justifyContent: 'flex-start' }}>
          <AnimatePresence>
            {typingUsers.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.3 }}
              style={{ display: 'flex', alignItems: 'center' }}
            >
              {typingUsers.slice(0, 3).map((user) => (
                <Avatar key={user.id} src={user.photoURL} sx={{ width: 24, height: 24, mr: -1, border: `2px solid ${theme.palette.background.default}` }} />
              ))}
              <Paper elevation={3} sx={{ ml: 2, p: 1, borderRadius: 2, bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
                <Typography variant="caption" sx={{ fontStyle: 'italic', color: theme.palette.text.primary }}>{text}</Typography>
              </Paper>
            </motion.div>
            )}
          </AnimatePresence>
        </Box>
    );
});


// --- MAIN COMPONENT ---

const GroupChatPage = () => {
    const { groupName } = useParams();
    const navigate = useNavigate();
    const { mode, accent } = useThemeToggle();
    const theme = useMemo(() => getTheme(mode, accent), [mode, accent]);
    const currentUserId = auth.currentUser?.uid;

    // --- State Management ---
    const [isLoading, setIsLoading] = useState(true);
    const [groupInfo, setGroupInfo] = useState(null);
    const [memberUsers, setMemberUsers] = useState({}); // UID -> {name, photoURL, ...}
    const [messages, setMessages] = useState([]);
    const [drafts, setDrafts] = useState({}); // UID -> text
    
    const [chatWallpaper, setChatWallpaper] = useState('none');
    const [headerTextColor, setHeaderTextColor] = useState('white');
    const [showScrollToBottom, setShowScrollToBottom] = useState(false);
    const [replyToMessage, setReplyToMessage] = useState(null);
    const [isEditingMessage, setIsEditingMessage] = useState(null);
    const [pollDialogOpen, setPollDialogOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const [imageDataUri, setImageDataUri] = useState(null);
    const [imagePreviewOpen, setImagePreviewOpen] = useState(false);

    const messagesEndRef = useRef(null);
    const scrollContainerRef = useRef(null);
    const draftTimeoutRef = useRef(null);

    // --- Data Fetching & Realtime Listeners (Optimized) ---

    // 1. Group Info, Members, and Drafts Listener
    useEffect(() => {
        if (!groupName) return;

        const groupDocRef = doc(db, 'groupChats', groupName);
        const unsubscribe = onSnapshot(groupDocRef, async (docSnap) => {
            if (!docSnap.exists()) {
                setGroupInfo(null);
                setIsLoading(false);
                return;
            }
            const data = docSnap.data();
            setGroupInfo({ id: docSnap.id, ...data });
            
            // Update drafts in realtime (excluding current user)
            const activeDrafts = Object.entries(data.drafts || {})
              .filter(([uid, text]) => uid !== currentUserId && text)
              .reduce((acc, [uid, text]) => ({ ...acc, [uid]: text }), {});
            setDrafts(activeDrafts);


            // Fetch/Update Member details only if the list changed
            const memberIds = data.members || [];
            if (memberIds.length > Object.keys(memberUsers).length || 
                memberIds.some(uid => !memberUsers[uid])) {
                
                const memberDetails = {};
                const userPromises = memberIds.map(uid => getDoc(doc(db, 'users', uid)));
                const userSnaps = await Promise.all(userPromises);
                
                userSnaps.forEach(userSnap => {
                    if (userSnap.exists()) {
                        memberDetails[userSnap.id] = { id: userSnap.id, ...userSnap.data() };
                    }
                });
                setMemberUsers(memberDetails);
            }
            
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching group data:", error);
            setIsLoading(false);
        });

        return unsubscribe;
    }, [groupName, currentUserId, memberUsers]);

    // 2. Messages Listener
    useEffect(() => {
        if (!groupName) return;
        const messagesColRef = collection(db, 'groupChats', groupName, 'messages');
        const q = query(messagesColRef, orderBy('timestamp', 'asc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const newMessages = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                timestamp: doc.data().timestamp ? doc.data().timestamp : { seconds: Date.now() / 1000 },
            }));
            
            const isNearBottom = scrollContainerRef.current && 
                (scrollContainerRef.current.scrollHeight - scrollContainerRef.current.scrollTop - scrollContainerRef.current.clientHeight < 300);

            setMessages(newMessages);

            // Only auto-scroll if user was near the bottom before the update
            if (isNearBottom || newMessages.length === 1) {
                setTimeout(scrollToBottom, 10); // Ensure render completes before scrolling
            }
            
        }, (error) => {
            console.error("Error fetching messages:", error);
        });

        return unsubscribe;
    }, [groupName]);

    // 3. Theme, Wallpaper, and Color Logic (Cleaned up)
    const getWallpaperUrl = useCallback((wallpaperKey) => {
        if (wallpaperKey === 'default') return mode === 'dark' ? '/wallpapers/default-dark.jpg' : '/wallpapers/default-light.jpg';
        if (wallpaperKey?.startsWith('http')) return wallpaperKey;
        return null;
    }, [mode]);

    useEffect(() => {
        const storedWallpaper = localStorage.getItem('bunkmate_chatWallpaper') || 'none';
        setChatWallpaper(storedWallpaper);
        
        const wallpaperUrl = getWallpaperUrl(storedWallpaper);
        if (!wallpaperUrl) {
          setHeaderTextColor(mode === 'dark' ? 'white' : 'black');
          return;
        }

        const fac = new FastAverageColor();
        fac.getColorAsync(wallpaperUrl, { algorithm: 'dominant' })
          .then(color => {
            setHeaderTextColor(color.isDark ? 'white' : 'black');
          })
          .catch(() => {
            setHeaderTextColor(mode === 'dark' ? 'white' : 'black');
          });
    }, [getWallpaperUrl, mode]);

    // --- Message Utilities and Handlers ---

    const [groupedMessages, indexById] = useMemo(() => {
        const grouped = groupMessagesByDate(messages);
        const indexMap = messages.reduce((acc, msg, index) => { acc[msg.id] = index; return acc; }, {});
        return [grouped, indexMap];
    }, [messages]);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        setShowScrollToBottom(false);
    }, []);

    const scrollToMessage = useCallback((messageId) => {
        const element = document.getElementById(`message-${messageId}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, []);

    const handleScroll = useCallback(() => {
        const container = scrollContainerRef.current;
        if (container) {
            const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 10; // Tolerance
            setShowScrollToBottom(!isAtBottom);
        }
    }, []);
    
    // Auth checks based on groupInfo and current user
    const isAdmin = groupInfo?.createdBy === currentUserId || (groupInfo?.admins || []).includes(currentUserId);
    const canSend = groupInfo?.sendAccess === 'all' || isAdmin;
    const senderInfo = memberUsers[currentUserId] || {};


    const updateDraft = useCallback((text) => {
        if (!groupName || !currentUserId) return;
        if (draftTimeoutRef.current) clearTimeout(draftTimeoutRef.current);

        // Update draft immediately on input
        const groupDocRef = doc(db, 'groupChats', groupName);
        updateDoc(groupDocRef, { [`drafts.${currentUserId}`]: text });

        // Set timeout to clear draft after 2 seconds of inactivity
        draftTimeoutRef.current = setTimeout(() => {
            updateDoc(groupDocRef, { [`drafts.${currentUserId}`]: deleteField() }); // Use deleteField for efficiency
        }, 2000);
    }, [groupName, currentUserId]);

    const sendMessage = useCallback(async (text, type = 'text', additionalFields = {}) => {
        if (!currentUserId || !groupName || !canSend) return;

        try {
            const messagesColRef = collection(db, 'groupChats', groupName, 'messages');

            const messageData = {
                text,
                senderId: currentUserId,
                senderName: senderInfo.name || auth.currentUser.displayName || 'Unknown User',
                photoURL: senderInfo.photoURL || auth.currentUser.photoURL,
                timestamp: serverTimestamp(),
                status: 'sent',
                read: false,
                ...(replyToMessage && { replyTo: { id: replyToMessage.id, senderName: replyToMessage.senderName, text: replyToMessage.text } }),
                ...(type !== 'text' && { type }),
                ...additionalFields,
            };

            await addDoc(messagesColRef, messageData);
            setReplyToMessage(null);
            updateDraft(''); // Clear draft state immediately
            setImageDataUri(null); // Clear image data if sending an image
            setImagePreviewOpen(false);

        } catch (e) {
            console.error("Error sending message: ", e);
        }
    }, [currentUserId, groupName, canSend, replyToMessage, senderInfo, updateDraft]);

    const updateMessage = useCallback(async (messageId, newText) => {
        if (!currentUserId || !groupName) return;

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
    }, [groupName, updateDraft, currentUserId]);

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

        const hasVoted = options.some(option => (option.votes || []).includes(currentUserId));
        if (hasVoted) return;

        await updateDoc(messageRef, {
            [`options.${optionIndex}.votes`]: arrayUnion(currentUserId),
        });

    }, [currentUserId, groupName, messages, indexById]);
    
    // Image Upload Handlers
    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            setImageDataUri(reader.result);
            setImagePreviewOpen(true);
            e.target.value = null; // Reset input
        };
        reader.readAsDataURL(file);
    };

    const handleSendImage = () => {
        if (imageDataUri) {
            sendMessage('', 'image', { dataUri: imageDataUri });
        }
    };
    
    // Handle actions coming from MessageBubble
    const handleMessageAction = (messageOrId, action) => {
        if (action === 'reply') {
            setReplyToMessage(messageOrId);
        } else if (action === 'edit') {
            setIsEditingMessage(messageOrId);
        } else if (action === 'delete') {
            deleteMessage(messageOrId);
        }
    };


    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: theme.palette.background.default }}>
                <CircularProgress color="primary" />
                <Typography variant="body1" sx={{ mt: 2, color: theme.palette.text.secondary }}>Loading chat...</Typography>
            </Box>
        );
    }

    if (!groupInfo) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: theme.palette.background.default }}>
                <Typography color="error">Group "{groupName}" not found.</Typography>
            </Box>
        );
    }
    
    const createdByUser = memberUsers[groupInfo?.createdBy];


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
            {/* 1. Chat Header (Fixed) */}
            <AppBar position="fixed" elevation={2} sx={{ bgcolor: 'transparent', backdropFilter: 'blur(10px)', color: headerTextColor, zIndex: 1100 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', p: 1.5, cursor: 'pointer' }} onClick={() => setProfileOpen(true)}>
                    <IconButton onClick={() => navigate(-1)} sx={{ color: headerTextColor }}><ArrowBackIcon /></IconButton>
                    <Avatar src={groupInfo.iconURL || groupInfo.emoji} sx={{ mr: 2, ml: 1 }} />
                    <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" color={headerTextColor}>{groupInfo.name}</Typography>
                        <Typography variant="caption" color={headerTextColor} sx={{ opacity: 0.8 }}>
                            {Object.values(drafts).length > 0 ? 
                                `${Object.keys(drafts).map(uid => memberUsers[uid]?.name || 'Someone').join(', ')} is typing...` :
                                `Members: ${groupInfo.members?.length || 0}`
                            }
                        </Typography>
                    </Box>
                    <IconButton color="inherit" sx={{ color: headerTextColor }}><MoreVertIcon /></IconButton>
                </Box>
            </AppBar>

            {/* 2. Message Area (Scrollable) */}
            <Box
                ref={scrollContainerRef}
                onScroll={handleScroll}
                sx={{
                    flexGrow: 1,
                    overflowY: 'auto',
                    p: 1,
                    position: 'relative',
                    pt: '70px', // Offset for fixed header
                    pb: '100px', // Offset for fixed composer
                }}
            >
                <Box sx={{ mx: 'auto', width: '100%', maxWidth: '900px', pt: 2, pb: 4 }}>
                    
                    {/* Chat Intro Card */}
                    <Paper elevation={1} sx={{ p: 2, mb: 2, textAlign: 'center', opacity: 0.8, mx: 'auto', maxWidth: '400px', borderRadius: 2 }}>
                        <Typography variant="h6">{groupInfo.name}</Typography>
                        <Typography variant="body2" color="text.secondary">{groupInfo.description}</Typography>
                    </Paper>

                    {/* Message List */}
                    <List sx={{ p: 0 }}>
                        {groupedMessages.map(({ date, messages: dayMessages }, dayIndex) => (
                            <React.Fragment key={dayIndex}>
                                <Box sx={{ textAlign: 'center', my: 2 }}>
                                    <Chip label={date.toLocaleDateString()} size="small" color="primary" variant="outlined" />
                                </Box>
                                {dayMessages.map((message, index) => (
                                    <ListItem key={message.id} sx={{ p: 0, display: 'block' }}>
                                        <MessageBubble
                                            message={message}
                                            isMe={message.senderId === currentUserId}
                                            memberUsers={memberUsers}
                                            shape={getMessageShape(dayMessages, index, currentUserId)}
                                            scrollToMessage={scrollToMessage}
                                            onAction={handleMessageAction}
                                            onToggleReaction={handleReaction}
                                            onVote={handlePollVote}
                                            theme={theme}
                                            currentUserId={currentUserId}
                                        />
                                    </ListItem>
                                ))}
                            </React.Fragment>
                        ))}
                    </List>

                    <div ref={messagesEndRef} />
                </Box>

                {/* Scroll To Bottom FAB (Floating) */}
                <AnimatePresence>
                    {showScrollToBottom && (
                        <motion.div initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0 }} style={{ position: 'fixed', bottom: 90, right: 20 }}>
                            <Fab color="primary" size="small" onClick={scrollToBottom}><ArrowDownwardIcon /></Fab>
                        </motion.div>
                    )}
                </AnimatePresence>
            </Box>
            
            {/* 3. Typing Indicator (Floating just above the Composer) */}
            <Box
                sx={{
                    position: 'fixed',
                    bottom: 70, /* Adjusted to float above Composer (approx 80px high) */
                    left: 0,
                    right: 0,
                    zIndex: 1199,
                    pointerEvents: 'none',
                }}
            >
                <TypingIndicator drafts={drafts} memberUsers={memberUsers} theme={theme} />
            </Box>


            {/* 4. Composer Area (Fixed Footer) */}
            <Paper
                elevation={10}
                sx={{
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    width: '100%',
                    p: 1,
                    borderTopLeftRadius: 20,
                    borderTopRightRadius: 20,
                    backdropFilter: 'blur(10px)',
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.9)',
                    zIndex: 1200,
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
                        handleImageUpload={handleImageUpload}
                    />
                ) : (
                    <Box sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="caption" color="text.secondary">Only admins can send messages in this group</Typography>
                    </Box>
                )}
            </Paper>

            {/* --- Modals/Drawers --- */}
            
            {/* Image Preview Dialog */}
            <Dialog open={imagePreviewOpen} onClose={() => setImagePreviewOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Send Image</DialogTitle>
                <DialogContent>
                    {imageDataUri && <img src={imageDataUri} alt="Preview" style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px' }} />}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => { setImagePreviewOpen(false); setImageDataUri(null); }}>Cancel</Button>
                    <Button onClick={handleSendImage} variant="contained" color="primary">Send</Button>
                </DialogActions>
            </Dialog>
            
            {/* Poll Creation Dialog */}
            <PollDialog
                open={pollDialogOpen}
                onClose={() => setPollDialogOpen(false)}
                onSendPoll={(question, options) => {
                    sendMessage('', 'poll', { question, options: options.map(t => ({ text: t, votes: [] })) });
                    setPollDialogOpen(false);
                }}
            />
            
            {/* Group Info Drawer */}
            <GroupInfoDrawer
                profileOpen={profileOpen}
                setProfileOpen={setProfileOpen}
                groupInfo={groupInfo}
                currentUser={auth.currentUser}
                createdByUser={createdByUser}
                memberInfo={memberUsers}
                tripInfo={null} 
                timelineStats={null}
                setNotification={() => {}}
            />
        </Box>
    );
};

export default GroupChatPage;

// --- INLINED SUB-COMPONENTS (for full file compliance) ---

const Composer = React.memo(({ onSendMessage, onUpdateMessage, onTyping, replyTo, onCancelReply, editMessage, onCancelEdit, memberUsers, onOpenPollDialog, handleImageUpload }) => {
    const theme = useTheme();
    const [text, setText] = useState(editMessage ? editMessage.text : '');
    const [mentionsDrawerOpen, setMentionsDrawerOpen] = useState(false);
    const inputRef = useRef(null);
    const currentUserId = auth.currentUser?.uid;

    useEffect(() => {
        if (editMessage) {
            setText(editMessage.text);
            if (inputRef.current) inputRef.current.focus();
        } else {
            setText('');
        }
    }, [editMessage]);
    
    // Clear text if replyTo changes to null and we are not editing
    useEffect(() => {
        if (!replyTo && !editMessage) setText('');
    }, [replyTo, editMessage]);

    const handleChange = (e) => {
        const newText = e.target.value;
        setText(newText);
        onTyping(newText);

        const caretPos = inputRef.current?.selectionStart || newText.length;
        const preText = newText.substring(0, caretPos);
        const lastAt = preText.lastIndexOf('@');

        if (lastAt !== -1 && (lastAt === 0 || preText[lastAt - 1] === ' ')) {
            setMentionsDrawerOpen(true);
        } else {
            setMentionsDrawerOpen(false);
        }
    };

    const handleSelectMention = (user) => {
        const usernameOrName = user.name || user.username || user.id;
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
        } else {
            onSendMessage(text.trim());
        }
        setText('');
        onTyping('');
    };

    const mentionableMembers = useMemo(() => Object.values(memberUsers).filter(u => u.name && u.id !== currentUserId), [memberUsers, currentUserId]);

    return (
        <Box>
            {/* Reply Preview Strip */}
            {replyTo && !editMessage && (
                <AnimatePresence>
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
                        <Paper elevation={0} sx={{ p: 1, mb: 1, bgcolor: theme.palette.action.hover, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: 1 }}>
                            <Box sx={{ overflow: 'hidden' }}>
                                <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block' }}>Replying to: {replyTo.senderName}</Typography>
                                <Typography variant="caption" sx={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{replyTo.text}</Typography>
                            </Box>
                            <IconButton size="small" onClick={onCancelReply}><CloseIcon fontSize="small" /></IconButton>
                        </Paper>
                    </motion.div>
                </AnimatePresence>
            )}

            {/* Mentions Drawer */}
            <Collapse in={mentionsDrawerOpen && mentionableMembers.length > 0}>
                <Paper elevation={3} sx={{ maxHeight: 150, overflowY: 'auto', mb: 1, p: 1, bgcolor: theme.palette.background.paper }}>
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
                
                {/* File Upload Input & Icon */}
                <input accept="image/*" type="file" onChange={handleImageUpload} style={{ display: 'none' }} id="image-upload-input" />
                <Tooltip title="Send Image">
                    <label htmlFor="image-upload-input">
                        <IconButton component="span" color="primary"><InsertPhotoIcon /></IconButton>
                    </label>
                </Tooltip>

                {/* Poll Icon */}
                <Tooltip title="Create Poll">
                    <IconButton color="primary" onClick={onOpenPollDialog}><PollIcon /></IconButton>
                </Tooltip>

                {/* Text Field */}
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

                {/* Action Buttons */}
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
});


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
            onClose();
            setQuestion('');
            setOptions(['', '']);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>Create New Poll</DialogTitle>
            <DialogContent>
                <TextField autoFocus margin="dense" label="Poll Question" type="text" fullWidth variant="outlined" value={question} onChange={(e) => setQuestion(e.target.value)} />
                <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Options (Min 2)</Typography>
                {options.map((option, index) => (
                    <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                        <TextField fullWidth label={`Option ${index + 1}`} variant="outlined" value={option} onChange={(e) => handleOptionChange(index, e.target.value)} />
                        {options.length > 2 && (
                            <IconButton onClick={() => handleRemoveOption(index)} color="error"><CloseIcon /></IconButton>
                        )}
                    </Box>
                ))}
                <Button onClick={handleAddOption} startIcon={<AddIcon />}>Add Option</Button>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleSend} disabled={question.trim() === '' || options.filter(opt => opt.trim()).length < 2} variant="contained" color="primary">Send Poll</Button>
            </DialogActions>
        </Dialog>
    );
};