import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Container,
  Paper,
  Avatar,
  Typography,
  Button,
  IconButton,
  Grid,
  Tabs,
  Tab,
  Card,
  CardMedia,
  CardContent,
  Chip,
  Divider,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  Tooltip,
  Snackbar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  useTheme
} from '@mui/material';
import {
  Edit as EditIcon,
  Share as ShareIcon,
  PersonAdd as PersonAddIcon,
  Check as CheckIcon,
  Message as MessageIcon,
  Lock as LockIcon,
  Public as PublicIcon,
  LocationOn as LocationOnIcon,
  CalendarToday as CalendarTodayIcon,
  FlightTakeoff as FlightTakeoffIcon,
  Explore as ExploreIcon,
  EmojiEvents as EmojiEventsIcon,
  PhotoCamera as PhotoCameraIcon,
  ContentCopy as ContentCopyIcon,
  Add as AddIcon
} from '@mui/icons-material';

// --- THEME & DESIGN SYSTEM IMPORTS ---
import { designTokens, glass, cardHover } from '../theme/designSystem';
import UniversalShareToChatDialog from '../components/chats_components/UniversalShareToChatDialog';

// --- FIREBASE IMPORTS ---
import { db, auth } from '../firebase';
import { doc, updateDoc, collection, query, where, getDocs, limit, arrayUnion } from 'firebase/firestore';

export default function UserProfile({ matchUsername }) {
  const theme = useTheme();
  const mode = theme.palette.mode || 'dark';
  const isDark = mode === 'dark';
  const tokens = isDark ? designTokens.dark : designTokens.light;

  // Extract username from route supporting /profile/@username/p/ or /profile/@username/
  const getUsernameFromPath = () => {
    if (matchUsername) return matchUsername;
    const pathSegments = window.location.pathname.split('/');
    const userSegmentIndex = pathSegments.findIndex(seg => seg.startsWith('@'));
    if (userSegmentIndex !== -1) {
      return pathSegments[userSegmentIndex].substring(1);
    }
    return null;
  };

  const targetUsername = getUsernameFromPath();

  // State management
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({ created: 0, joined: 0, completed: 0, destinations: 0, highlights: 0, friends: 0 });
  const [trips, setTrips] = useState([]);
  const [highlights, setHighlights] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [friendsList, setFriendsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Tabs & Dialogs
  const [tabValue, setTabValue] = useState(0);
  const [editOpen, setEditOpen] = useState(false);
  const [shareAnchor, setShareAnchor] = useState(null);
  const [shareToChatOpen, setShareToChatOpen] = useState(false);
  const [snackbarState, setSnackbarState] = useState({ open: false, message: '', severity: 'success' });

  // Interactive Sub-Page / Modal States for Friends, Places, Memories, Trips
  const [modalView, setModalView] = useState(null); // 'friends' | 'places' | 'memories' | 'trips' | null
  const [addHighlightOpen, setAddHighlightOpen] = useState(false);
  const [newHighlight, setNewHighlight] = useState({ title: '', image: '' });

  // Friendship & Privacy State
  const [friendshipStatus, setFriendshipStatus] = useState('none');
  const [isPrivate, setIsPrivate] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  // Dynamic Avatar Glow Colors (YouTube Style Match)
  const [glowColors, setGlowColors] = useState({
    primary: isDark ? 'rgba(74, 222, 128, 0.18)' : 'rgba(34, 197, 94, 0.12)',
    secondary: isDark ? 'rgba(56, 189, 248, 0.08)' : 'rgba(2, 132, 199, 0.05)'
  });

  // Edit Form State
  const [editForm, setEditForm] = useState({
    displayName: '',
    username: '',
    bio: '',
    location: '',
    travelPersonality: '',
    interests: [],
    isPrivate: false
  });

  const avatarImgRef = useRef(null);

  const formatLocation = (loc) => {
    if (!loc) return '';
    if (typeof loc === 'string') return loc;
    if (typeof loc === 'object') {
      if (loc.lat && loc.lng) return `Lat: ${loc.lat.toFixed(2)}, Lng: ${loc.lng.toFixed(2)}`;
      return loc.name || JSON.stringify(loc);
    }
    return String(loc);
  };

  // Avatar Color Extractor for YouTube-style profile match gradient
  const extractColorsFromImage = (imgSrc) => {
    if (!imgSrc) return;
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = imgSrc;
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 40;
        canvas.height = 40;
        ctx.drawImage(img, 0, 0, 40, 40);
        const data = ctx.getImageData(0, 0, 40, 40).data;
        
        let r = 0, g = 0, b = 0, count = 0;
        for (let i = 0; i < data.length; i += 16) {
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
          count++;
        }
        r = Math.floor(r / count);
        g = Math.floor(g / count);
        b = Math.floor(b / count);

        setGlowColors({
          primary: `rgba(${r}, ${g}, ${b}, ${isDark ? '0.22' : '0.14'})`,
          secondary: `rgba(${r}, ${g}, ${b}, ${isDark ? '0.08' : '0.04'})`
        });
      } catch (e) {
        console.debug('Avatar color extraction skipped:', e);
      }
    };
  };

  // Fetch Data from Firestore
  useEffect(() => {
    async function fetchProfileAndTrips() {
      if (!targetUsername) {
        setError('No username specified in the route.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('username', '==', targetUsername), limit(1));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          setError('User profile not found.');
          setLoading(false);
          return;
        }

        const userDocSnap = querySnapshot.docs[0];
        const userData = userDocSnap.data();
        const userId = userDocSnap.id;

        const loggedInUserId = auth?.currentUser?.uid;
        const ownerCheck = loggedInUserId === userId;
        setIsOwner(ownerCheck);

        const profileIsPrivate = userData.privacy?.profileVisibility === 'private' || !!userData.isPrivate;
        setIsPrivate(profileIsPrivate);

        const avatarUrl = userData.photoURL || userData.avatarUrl || '';
        if (avatarUrl) extractColorsFromImage(avatarUrl);

        setProfile({
          uid: userId,
          displayName: userData.name || userData.displayName || 'Traveler',
          username: userData.username || targetUsername,
          bio: userData.bio || 'Exploring the world with BunkMates.',
          location: formatLocation(userData.location),
          travelPersonality: userData.travelPersonality || 'Explorer',
          joinedDate: userData.createdAt ? new Date(userData.createdAt.seconds * 1000).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Recently',
          avatarUrl: avatarUrl,
          interests: userData.interests || ['Mountains', 'Backpacking', 'Photography', 'Food Explorer'],
          isPrivate: profileIsPrivate
        });

        setEditForm({
          displayName: userData.name || userData.displayName || '',
          username: userData.username || '',
          bio: userData.bio || '',
          location: typeof userData.location === 'string' ? userData.location : '',
          travelPersonality: userData.travelPersonality || '',
          interests: userData.interests || ['Mountains', 'Backpacking', 'Photography', 'Food Explorer'],
          isPrivate: profileIsPrivate
        });

        const isUserFriend = loggedInUserId && userData.friends && userData.friends.includes(loggedInUserId);
        if (isUserFriend) setFriendshipStatus('friends');

        // Fetch Friends Details if available
        if (userData.friends && userData.friends.length > 0) {
          const friendsData = [];
          for (const friendId of userData.friends) {
            const fDoc = await getDocs(query(collection(db, 'users'), where('__name__', '==', friendId)));
            fDoc.forEach(d => friendsData.push({ id: d.id, ...d.data() }));
          }
          setFriendsList(friendsData);
        }

        // Fetch Trips
        const tripsRef = collection(db, 'trips');
        const createdQuery = query(tripsRef, where('createdBy', '==', userId));
        const memberQuery = query(tripsRef, where('members', 'array-contains', userId));

        const [createdSnap, memberSnap] = await Promise.all([getDocs(createdQuery), getDocs(memberQuery)]);

        const groupChatsRef = collection(db, 'groupChats');
        const groupChatsSnap = await getDocs(groupChatsRef);
        const chatIconMap = new Map();
        groupChatsSnap.forEach((chatDoc) => {
          const chatData = chatDoc.data();
          if (chatData.tripId && chatData.iconURL) chatIconMap.set(chatData.tripId, chatData.iconURL);
        });

        const tripsMap = new Map();
        const processTripDoc = (docSnap, role) => {
          const tripData = docSnap.data();
          const tripId = docSnap.id;
          const tripPrivacy = tripData.tripPrivacy || 'public';
          if (tripPrivacy === 'public' || ownerCheck || isUserFriend) {
            const tripImage = chatIconMap.get(tripId) || tripData.image || 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=600&q=80';
            tripsMap.set(tripId, { id: tripId, ...tripData, image: tripImage, role });
          }
        };

        createdSnap.forEach((docSnap) => processTripDoc(docSnap, 'Creator'));
        memberSnap.forEach((docSnap) => {
          if (!tripsMap.has(docSnap.id)) processTripDoc(docSnap, 'Member');
        });

        const fetchedTrips = Array.from(tripsMap.values());
        setTrips(fetchedTrips);

        const uniqueDestinations = new Set(fetchedTrips.map(t => formatLocation(t.destination || t.location))).size;

        setStats({
          created: createdSnap.size,
          joined: fetchedTrips.length,
          completed: fetchedTrips.filter(t => t.status === 'completed').length,
          destinations: uniqueDestinations || fetchedTrips.length,
          highlights: userData.highlights?.length || 4,
          friends: userData.friends ? userData.friends.length : 0
        });

        setHighlights(userData.highlights || [
          { id: 'h1', title: 'Trips', image: fetchedTrips[0]?.image || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=200&q=80' },
          { id: 'h2', title: 'Memories', image: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=200&q=80' },
          { id: 'h3', title: 'Squad', image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=200&q=80' },
          { id: 'h4', title: 'Badges', image: 'https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?auto=format&fit=crop&w=200&q=80' }
        ]);

        setAchievements([
          { id: 'a1', title: 'Globe Trotter', description: 'Visited multiple unique regions with verified itineraries', icon: '🌍', badgeColor: '#4ADE80' },
          { id: 'a2', title: 'Pathfinder', description: 'Created popular public itineraries for community members', icon: '🧭', badgeColor: '#38BDF8' },
          { id: 'a3', title: 'Master Organizer', description: 'Successfully completed 5+ group trips as trip leader', icon: '⭐', badgeColor: '#F59E0B' }
        ]);

        setLoading(false);
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load profile data.');
        setLoading(false);
      }
    }

    fetchProfileAndTrips();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetUsername]);

  const handleTabChange = (event, newValue) => setTabValue(newValue);
  const handleShareClick = (event) => setShareAnchor(event.currentTarget);
  const handleShareClose = () => setShareAnchor(null);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setSnackbarState({ open: true, message: 'Profile link copied to clipboard!', severity: 'success' });
    handleShareClose();
  };

  const handleAddHighlight = async () => {
    if (!newHighlight.title || !newHighlight.image || !profile?.uid) return;
    try {
      const newItem = { id: Date.now().toString(), ...newHighlight };
      const userDocRef = doc(db, 'users', profile.uid);
      await updateDoc(userDocRef, {
        highlights: arrayUnion(newItem)
      });
      setHighlights(prev => [...prev, newItem]);
      setNewHighlight({ title: '', image: '' });
      setAddHighlightOpen(false);
      setSnackbarState({ open: true, message: 'Highlight added successfully!', severity: 'success' });
    } catch (err) {
      console.error('Error adding highlight:', err);
      setSnackbarState({ open: true, message: 'Failed to add highlight.', severity: 'error' });
    }
  };

  const handleSaveProfile = async () => {
    if (!profile?.uid) return;
    try {
      const userDocRef = doc(db, 'users', profile.uid);
      await updateDoc(userDocRef, {
        name: editForm.displayName,
        username: editForm.username,
        bio: editForm.bio,
        location: editForm.location,
        travelPersonality: editForm.travelPersonality,
        interests: editForm.interests,
        'privacy.profileVisibility': editForm.isPrivate ? 'private' : 'public',
        isPrivate: editForm.isPrivate,
        updatedAt: new Date()
      });

      setProfile((prev) => ({ ...prev, ...editForm, location: formatLocation(editForm.location) }));
      setIsPrivate(editForm.isPrivate);
      setEditOpen(false);
      setSnackbarState({ open: true, message: 'Profile updated successfully!', severity: 'success' });
    } catch (err) {
      console.error('Error updating profile:', err);
      setSnackbarState({ open: true, message: 'Failed to update profile.', severity: 'error' });
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', bgcolor: tokens.bg }}>
        <CircularProgress sx={{ color: tokens.textPrimary }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  const hasAccess = isOwner || !isPrivate || friendshipStatus === 'friends';

  return (
    <Box
      sx={{
        bgcolor: tokens.bg,
        color: tokens.textPrimary,
        minHeight: '100vh',
        pb: 8,
        position: 'relative',
        isolation: 'isolate',
        '--avatar-glow-primary': glowColors.primary,
        '--avatar-glow-secondary': glowColors.secondary,
        '&::before': {
          content: '""',
          position: 'absolute',
          zIndex: -1,
          pointerEvents: 'none',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'min(100%, 900px)',
          height: '350px',
          background:
            'radial-gradient(ellipse at 50% 10%, var(--avatar-glow-primary) 0%, var(--avatar-glow-secondary) 45%, transparent 75%)',
          filter: 'blur(36px)',
          transition: 'background 0.5s ease-in-out'
        }
      }}
    >
      <Container maxWidth="md" sx={{ pt: { xs: 4, md: 6 }, position: 'relative', zIndex: 2 }}>
        
        {/* COMPACT PROFILE HEADER */}
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'center', sm: 'flex-start' }, gap: 4, mb: 4, textAlign: { xs: 'center', sm: 'left' } }}>
          
          <Box sx={{ position: 'relative', flexShrink: 0 }}>
            <Avatar
              ref={avatarImgRef}
              src={profile?.avatarUrl}
              alt={profile?.displayName}
              sx={{ width: 110, height: 110, border: `2px solid ${tokens.border}`, boxShadow: '0 4px 14px rgba(0,0,0,0.04)' }}
            />
            {isOwner && (
              <IconButton
                size="small"
                onClick={() => setEditOpen(true)}
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  bgcolor: tokens.surface,
                  border: `1px solid ${tokens.border}`,
                  color: tokens.textPrimary,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                  '&:hover': { bgcolor: tokens.cardHoverBg }
                }}
              >
                <PhotoCameraIcon fontSize="small" />
              </IconButton>
            )}
          </Box>

          <Box sx={{ flexGrow: 1, width: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: { xs: 'center', sm: 'space-between' }, flexWrap: 'wrap', gap: 2, mb: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h5" fontWeight="600" sx={{ color: tokens.textPrimary, letterSpacing: '-0.01em' }}>
                  {profile?.displayName}
                </Typography>
                {isPrivate ? (
                  <Tooltip title="Private Profile">
                    <LockIcon fontSize="small" sx={{ color: tokens.textSecondary }} />
                  </Tooltip>
                ) : (
                  <Tooltip title="Public Profile">
                    <PublicIcon fontSize="small" sx={{ color: tokens.textSecondary }} />
                  </Tooltip>
                )}
              </Box>

              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                {isOwner ? (
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={() => setEditOpen(true)}
                    sx={{ borderRadius: 2, borderColor: tokens.border, color: tokens.textPrimary, textTransform: 'none', fontWeight: 500, '&:hover': { borderColor: tokens.textSecondary, bgcolor: tokens.cardHoverBg } }}
                  >
                    Edit profile
                  </Button>
                ) : (
                  <>
                    {friendshipStatus === 'none' && (
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<PersonAddIcon />}
                        onClick={() => setFriendshipStatus('pending_sent')}
                        sx={{ borderRadius: 2, bgcolor: tokens.textPrimary, color: tokens.bg, textTransform: 'none', fontWeight: 500, boxShadow: 'none', '&:hover': { opacity: 0.9 } }}
                      >
                        Add Friend
                      </Button>
                    )}
                    {friendshipStatus === 'friends' && (
                      <>
                        <Button variant="outlined" size="small" startIcon={<CheckIcon />} sx={{ borderRadius: 2, borderColor: tokens.border, color: tokens.textPrimary, textTransform: 'none', fontWeight: 500 }}>
                          Friends
                        </Button>
                        <Button variant="outlined" size="small" startIcon={<MessageIcon />} sx={{ borderRadius: 2, borderColor: tokens.border, color: tokens.textPrimary, textTransform: 'none', fontWeight: 500 }}>
                          Message
                        </Button>
                      </>
                    )}
                  </>
                )}

                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<ShareIcon />}
                  onClick={handleShareClick}
                  sx={{ borderRadius: 2, borderColor: tokens.border, color: tokens.textPrimary, textTransform: 'none', fontWeight: 500, '&:hover': { borderColor: tokens.textSecondary, bgcolor: tokens.cardHoverBg } }}
                >
                  Share
                </Button>
                <Menu anchorEl={shareAnchor} open={Boolean(shareAnchor)} onClose={handleShareClose}>
                  <MenuItem onClick={handleCopyLink}><ContentCopyIcon fontSize="small" sx={{ mr: 1 }} /> Copy Profile Link</MenuItem>
                  <MenuItem onClick={() => { handleShareClose(); setShareToChatOpen(true); }}><MessageIcon fontSize="small" sx={{ mr: 1 }} /> Share to BunkMate Chats & Groups</MenuItem>
                </Menu>
              </Box>
            </Box>

            <Typography variant="body2" sx={{ color: tokens.textSecondary, mb: 1.5 }}>
              @{profile?.username}
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap', justifyContent: { xs: 'center', sm: 'flex-start' } }}>
              {profile?.location && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <LocationOnIcon sx={{ fontSize: 16, color: tokens.textSecondary }} />
                  <Typography variant="body2" sx={{ color: tokens.textSecondary }}>{profile.location}</Typography>
                </Box>
              )}
              {profile?.joinedDate && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <CalendarTodayIcon sx={{ fontSize: 16, color: tokens.textSecondary }} />
                  <Typography variant="body2" sx={{ color: tokens.textSecondary }}>Joined {profile.joinedDate}</Typography>
                </Box>
              )}
            </Box>

            {profile?.bio && (
              <Typography variant="body2" sx={{ color: tokens.textPrimary, lineHeight: 1.6, maxWidth: '600px', mb: 2 }}>
                {profile.bio}
              </Typography>
            )}

            {profile?.travelPersonality && (
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: { xs: 'center', sm: 'flex-start' } }}>
                <Chip label={profile.travelPersonality} size="small" variant="outlined" sx={{ borderRadius: 1.5, borderColor: tokens.border, color: tokens.textSecondary, fontWeight: 500 }} />
              </Box>
            )}
          </Box>
        </Box>

        {/* CLICKABLE TRAVEL STATISTICS */}
        <Paper
          elevation={0}
          sx={{
            ...glass(mode),
            p: 2,
            borderRadius: 3,
            mb: 4,
            display: 'flex',
            justifyContent: 'space-around',
            flexWrap: 'wrap',
            gap: 2
          }}
        >
          <Box onClick={() => setModalView('trips')} sx={{ textAlign: 'center', cursor: 'pointer', '&:hover': { opacity: 0.8 } }}>
            <Typography variant="subtitle1" fontWeight="600" sx={{ color: tokens.textPrimary }}>{stats.created}</Typography>
            <Typography variant="caption" sx={{ color: tokens.textSecondary }}>Trips</Typography>
          </Box>
          <Divider orientation="vertical" flexItem sx={{ borderColor: tokens.border }} />
          <Box onClick={() => setModalView('places')} sx={{ textAlign: 'center', cursor: 'pointer', '&:hover': { opacity: 0.8 } }}>
            <Typography variant="subtitle1" fontWeight="600" sx={{ color: tokens.textPrimary }}>{stats.destinations}</Typography>
            <Typography variant="caption" sx={{ color: tokens.textSecondary }}>Places</Typography>
          </Box>
          <Divider orientation="vertical" flexItem sx={{ borderColor: tokens.border }} />
          <Box onClick={() => setModalView('memories')} sx={{ textAlign: 'center', cursor: 'pointer', '&:hover': { opacity: 0.8 } }}>
            <Typography variant="subtitle1" fontWeight="600" sx={{ color: tokens.textPrimary }}>{stats.highlights}</Typography>
            <Typography variant="caption" sx={{ color: tokens.textSecondary }}>Memories</Typography>
          </Box>
          <Divider orientation="vertical" flexItem sx={{ borderColor: tokens.border }} />
          <Box onClick={() => setModalView('friends')} sx={{ textAlign: 'center', cursor: 'pointer', '&:hover': { opacity: 0.8 } }}>
            <Typography variant="subtitle1" fontWeight="600" sx={{ color: tokens.textPrimary }}>{stats.friends}</Typography>
            <Typography variant="caption" sx={{ color: tokens.textSecondary }}>Friends</Typography>
          </Box>
        </Paper>

        {/* DYNAMIC CIRCULAR TRAVEL HIGHLIGHTS */}
        <Box sx={{ display: 'flex', gap: 3, mb: 5, overflowX: 'auto', pb: 1, alignItems: 'center', justifyContent: { xs: 'flex-start', sm: 'center' } }}>
          {highlights.map((item) => (
            <Box key={item.id} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', flexShrink: 0 }}>
              <Box
                sx={{
                  width: 72,
                  height: 72,
                  borderRadius: '50%',
                  p: '3px',
                  border: `2px solid ${tokens.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'transform 0.2s',
                  '&:hover': { transform: 'scale(1.05)' }
                }}
              >
                <Avatar src={item.image} alt={item.title} sx={{ width: '100%', height: '100%' }} />
              </Box>
              <Typography variant="caption" sx={{ mt: 1, color: tokens.textSecondary, fontWeight: 500 }}>
                {item.title}
              </Typography>
            </Box>
          ))}

          {isOwner && (
            <Box onClick={() => setAddHighlightOpen(true)} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', flexShrink: 0 }}>
              <Box
                sx={{
                  width: 72,
                  height: 72,
                  borderRadius: '50%',
                  border: `2px dashed ${tokens.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: tokens.cardBg,
                  transition: 'transform 0.2s',
                  '&:hover': { transform: 'scale(1.05)' }
                }}
              >
                <AddIcon sx={{ color: tokens.textSecondary }} />
              </Box>
              <Typography variant="caption" sx={{ mt: 1, color: tokens.textSecondary, fontWeight: 500 }}>
                Add Highlight
              </Typography>
            </Box>
          )}
        </Box>

        {/* RESTRICTED PROFILE VIEW IF PRIVATE */}
        {!hasAccess ? (
          <Paper elevation={0} sx={{ ...glass(mode), p: 6, textAlign: 'center', borderRadius: 3 }}>
            <LockIcon sx={{ fontSize: 48, color: tokens.textSecondary, mb: 2 }} />
            <Typography variant="h6" fontWeight="600" sx={{ color: tokens.textPrimary }}>This account is private</Typography>
            <Typography variant="body2" sx={{ color: tokens.textSecondary, mt: 1, mb: 3 }}>
              Follow this traveler or send a friend request to view their trips and travel memories.
            </Typography>
            {friendshipStatus === 'none' && (
              <Button
                variant="contained"
                startIcon={<PersonAddIcon />}
                onClick={() => setFriendshipStatus('pending_sent')}
                sx={{ bgcolor: tokens.textPrimary, color: tokens.bg, textTransform: 'none', boxShadow: 'none', '&:hover': { opacity: 0.9 } }}
              >
                Send Friend Request
              </Button>
            )}
          </Paper>
        ) : (
          <>
            {/* TRAVEL INTERESTS CHIPS */}
            {profile?.interests && profile.interests.length > 0 && (
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 4, justifyContent: { xs: 'center', sm: 'flex-start' } }}>
                {profile.interests.map((interest, idx) => (
                  <Chip
                    key={idx}
                    label={interest}
                    size="small"
                    variant="outlined"
                    sx={{ borderRadius: 2, borderColor: tokens.border, bgcolor: tokens.cardBg, color: tokens.textPrimary, fontWeight: 500 }}
                  />
                ))}
              </Box>
            )}

            {/* PROFILE TABS */}
            <Box sx={{ borderBottom: `1px solid ${tokens.border}`, mb: 3 }}>
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                centered
                sx={{
                  '& .MuiTab-root': { color: tokens.textSecondary, fontWeight: 500, textTransform: 'none', fontSize: '0.95rem' },
                  '& .Mui-selected': { color: `${tokens.textPrimary} !important`, fontWeight: '600 !important' },
                  '& .MuiTabs-indicator': { backgroundColor: tokens.textPrimary, height: '2px' }
                }}
              >
                <Tab icon={<FlightTakeoffIcon fontSize="small" />} iconPosition="start" label="Trips" />
                <Tab icon={<ExploreIcon fontSize="small" />} iconPosition="start" label="Memories" />
                <Tab icon={<EmojiEventsIcon fontSize="small" />} iconPosition="start" label="Achievements" />
              </Tabs>
            </Box>

            {/* TAB CONTENTS WITH PROPER GRIDS */}
            <Box sx={{ mb: 6 }}>
              {tabValue === 0 && (
                trips.length === 0 ? (
                  <Typography variant="body2" sx={{ color: tokens.textSecondary, textAlign: 'center', py: 6 }}>No accessible trips found.</Typography>
                ) : (
                  <Grid container spacing={3}>
                    {trips.map((trip) => (
                      <Grid item xs={12} sm={6} md={4} key={trip.id}>
                        <Card
                          elevation={0}
                          sx={{
                            ...glass(mode),
                            ...cardHover,
                            borderRadius: 3,
                            overflow: 'hidden',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column'
                          }}
                        >
                          <CardMedia component="img" height="150" image={trip.image} alt={trip.name || trip.title} />
                          <CardContent sx={{ p: 2.5, flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <Box>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Chip label={trip.role} size="small" sx={{ bgcolor: tokens.cardHoverBg, color: tokens.textPrimary, fontWeight: 500, borderRadius: 1 }} />
                                {trip.tripPrivacy && trip.tripPrivacy !== 'public' && (
                                  <LockIcon sx={{ fontSize: 16, color: tokens.textSecondary }} />
                                )}
                              </Box>
                              <Typography variant="subtitle1" fontWeight="600" sx={{ color: tokens.textPrimary, mb: 0.5 }}>
                                {trip.name || trip.title || 'Untitled Trip'}
                              </Typography>
                              <Typography variant="body2" sx={{ color: tokens.textSecondary }}>
                                {formatLocation(trip.destination || trip.location) || 'Various Locations'}
                              </Typography>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )
              )}

              {tabValue === 1 && (
                <Grid container spacing={3}>
                  {highlights.map((mem) => (
                    <Grid item xs={12} sm={6} md={4} key={mem.id}>
                      <Card elevation={0} sx={{ ...glass(mode), borderRadius: 3, overflow: 'hidden' }}>
                        <CardMedia component="img" height="180" image={mem.image} alt={mem.title} />
                        <CardContent sx={{ p: 2 }}>
                          <Typography variant="subtitle2" fontWeight="600" sx={{ color: tokens.textPrimary }}>{mem.title}</Typography>
                          <Typography variant="caption" sx={{ color: tokens.textSecondary }}>Travel Highlight</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}

              {tabValue === 2 && (
                <Grid container spacing={2}>
                  {achievements.map((ach) => (
                    <Grid item xs={12} sm={6} key={ach.id}>
                      <Paper
                        elevation={0}
                        sx={{
                          ...glass(mode),
                          p: 3,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2.5,
                          borderRadius: 3,
                          borderLeft: `4px solid ${ach.badgeColor || tokens.textPrimary}`
                        }}
                      >
                        <Typography variant="h3">{ach.icon}</Typography>
                        <Box>
                          <Typography variant="subtitle1" fontWeight="600" sx={{ color: tokens.textPrimary }}>{ach.title}</Typography>
                          <Typography variant="body2" sx={{ color: tokens.textSecondary, mt: 0.5 }}>{ach.description}</Typography>
                        </Box>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          </>
        )}
      </Container>

      {/* MODAL / SUB-PAGE VIEW FOR STATISTICS (Friends, Trips, Places, Memories) */}
      <Dialog open={Boolean(modalView)} onClose={() => setModalView(null)} maxWidth="sm" fullWidth PaperProps={{ sx: { ...glass(mode), borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 600, color: tokens.textPrimary, textTransform: 'capitalize' }}>
          {modalView} List
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: tokens.border }}>
          {modalView === 'friends' && (
            friendsList.length === 0 ? (
              <Typography variant="body2" sx={{ color: tokens.textSecondary, py: 4, textAlign: 'center' }}>No friends added yet.</Typography>
            ) : (
              <List>
                {friendsList.map((friend) => (
                  <ListItem key={friend.id} sx={{ borderRadius: 2, mb: 1, bgcolor: tokens.cardBg }}>
                    <ListItemAvatar>
                      <Avatar src={friend.photoURL || friend.avatarUrl} />
                    </ListItemAvatar>
                    <ListItemText primary={friend.name || friend.displayName} secondary={`@${friend.username}`} primaryTypographyProps={{ color: tokens.textPrimary, fontWeight: 600 }} secondaryTypographyProps={{ color: tokens.textSecondary }} />
                  </ListItem>
                ))}
              </List>
            )
          )}
          {modalView !== 'friends' && (
            <Typography variant="body2" sx={{ color: tokens.textSecondary, py: 4, textAlign: 'center' }}>
              Showing all recorded {modalView} data for this traveler.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalView(null)} sx={{ color: tokens.textSecondary }}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* ADD HIGHLIGHT DIALOG */}
      <Dialog open={addHighlightOpen} onClose={() => setAddHighlightOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { ...glass(mode), borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 600, color: tokens.textPrimary }}>Add Story Highlight</DialogTitle>
        <DialogContent dividers sx={{ borderColor: tokens.border }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label="Title" fullWidth value={newHighlight.title} onChange={(e) => setNewHighlight({ ...newHighlight, title: e.target.value })} />
            <TextField label="Image URL" fullWidth value={newHighlight.image} onChange={(e) => setNewHighlight({ ...newHighlight, image: e.target.value })} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddHighlightOpen(false)} sx={{ color: tokens.textSecondary }}>Cancel</Button>
          <Button onClick={handleAddHighlight} variant="contained" sx={{ bgcolor: tokens.textPrimary, color: tokens.bg, boxShadow: 'none' }}>Add</Button>
        </DialogActions>
      </Dialog>

      {/* EDIT PROFILE DIALOG */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { ...glass(mode), borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 600, color: tokens.textPrimary }}>Edit Profile</DialogTitle>
        <DialogContent dividers sx={{ borderColor: tokens.border }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
            <TextField label="Display Name" fullWidth value={editForm.displayName} onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })} />
            <TextField label="Username" fullWidth value={editForm.username} onChange={(e) => setEditForm({ ...editForm, username: e.target.value })} />
            <TextField label="Bio" multiline rows={3} fullWidth value={editForm.bio} onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })} />
            <TextField label="Location" fullWidth value={editForm.location} onChange={(e) => setEditForm({ ...editForm, location: e.target.value })} />
            <FormControlLabel
              control={<Switch checked={editForm.isPrivate} onChange={(e) => setEditForm({ ...editForm, isPrivate: e.target.checked })} sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: tokens.textPrimary }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: tokens.textPrimary } }} />}
              label="Private Profile"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setEditOpen(false)} sx={{ color: tokens.textSecondary, textTransform: 'none' }}>Cancel</Button>
          <Button onClick={handleSaveProfile} variant="contained" sx={{ bgcolor: tokens.textPrimary, color: tokens.bg, textTransform: 'none', boxShadow: 'none', '&:hover': { opacity: 0.9 } }}>Save Changes</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbarState.open} autoHideDuration={4000} onClose={() => setSnackbarState({ ...snackbarState, open: false })}>
        <Alert severity={snackbarState.severity}>{snackbarState.message}</Alert>
      </Snackbar>

      <UniversalShareToChatDialog
        open={shareToChatOpen}
        onClose={() => setShareToChatOpen(false)}
        itemType="user"
        itemData={profile || {}}
        currentUser={auth.currentUser}
        effectiveChatTheme={mode}
      />
    </Box>
  );
}