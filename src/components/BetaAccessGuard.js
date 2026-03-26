import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  CircularProgress,
  Button,
  Paper,
  Fade,
  Slide,
  Stack,
  GlobalStyles,
  SwipeableDrawer,
  IconButton,
  Divider,
  keyframes 
} from "@mui/material";
import { 
  LockOutlined, 
  ChevronRight,
} from "../icons/LucideIcons";
import { Info, X, ShieldCheck, Zap, Users, Compass, MapPin, Stars, Mountain, Plane, Camera, Tent, } from "lucide-react";
import { ThemeProvider } from "@mui/material/styles";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { useThemeToggle } from "../contexts/ThemeToggleContext";
import { getTheme } from "../theme";

const ALLOWED_USER_TYPES = ["Beta", "Dev Beta"];

const orbit = keyframes`
  0% { transform: rotate(0deg) translateX(15px) rotate(0deg); opacity: 0.5; }
  50% { opacity: 1; }
  100% { transform: rotate(360deg) translateX(15px) rotate(-360deg); opacity: 0.5; }
`;

export default function BetaAccessGuard({ children }) {
  const { mode, accent } = useThemeToggle();
  const theme = getTheme(mode, accent);
  
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();


  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setAccessDenied(true);
        setLoading(false);
        return;
      }
      const userDocRef = doc(db, "users", user.uid);
      const unsubscribeUserDoc = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const userType = (docSnap.data().type || "").trim();
          setAccessDenied(!ALLOWED_USER_TYPES.includes(userType));
        } else {
          setAccessDenied(true);
        }
        setLoading(false);
      }, () => {
        setAccessDenied(true);
        setLoading(false);
      });
      return () => unsubscribeUserDoc();
    });
    return () => unsubscribeAuth();
  }, []);

  const toggleDrawer = (open) => () => setDrawerOpen(open);

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", bgcolor: "background.default" }}>
          <CircularProgress size={24} thickness={2} sx={{ color: "text.primary" }} />
        </Box>
      </ThemeProvider>
    );
  }
    if (accessDenied) {
    const backgroundIcons = [Compass, Mountain, Plane, Camera, Tent, MapPin, Stars];

    return (
      <ThemeProvider theme={theme}>
        <GlobalStyles styles={{ body: { backgroundColor: theme.palette.background.default, margin: 0 } }} />
        
<Box 
          sx={{ 
            height: "100vh", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            px: 3,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Box sx={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
            gridTemplateRows: 'repeat(auto-fill, minmax(100px, 1fr))',
            opacity: 0.07,
            pointerEvents: 'none',
            zIndex: 0,
          }}>
            {[...Array(60)].map((_, i) => {
              const Icon = backgroundIcons[i % backgroundIcons.length];
              return (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `rotate(${i % 2 === 0 ? 15 : -15}deg)` }}>
                  <Icon
  size={32}
  color={mode === "dark" ? "#ffffff" : theme.palette.text.secondary}
/>
                </Box>
              );
            })}
          </Box>
          <Fade in timeout={1200}>
            <Box 
              sx={{ 
                width: "100%", 
                maxWidth: 480, 
                zIndex: 1,
                transition: 'transform 0.1s ease-out'
              }}
            >
              <Slide in direction="up" timeout={800}>
                <Paper
                  elevation={0}
                  sx={{
                    p: { xs: 4, sm: 6 },
                    textAlign: "center",
                    borderRadius: "40px",
                    background: "rgba(255, 255, 255, 0)",
                    border: `0px solid ${theme.palette.divider}`,
                    position: 'relative'
                  }}
                >
                  <Stack alignItems="center" spacing={4}>

                    <Box>
                      <Typography variant="overline" sx={{ letterSpacing: 5, color: "text.disabled", fontWeight: 700, textTransform: 'uppercase', fontSize: '0.7rem' }}>
                        Expedition Status: Restricted
                      </Typography>
                      <Typography variant="h3" sx={{ fontWeight: 300, mt: 1.5, mb: 2, letterSpacing: -1 }}>
                        Uncharted Territory
                      </Typography>
                      <Typography variant="body2" sx={{ color: "text.secondary", lineHeight: 1.9, maxWidth: 340, mx: "auto", fontSize: '0.95rem' }}>
                        This region of the app is currently available only to registered <b>Beta Navigators</b>. Your current clearance is not valid for this expedition.
                      </Typography>
                    </Box>

                    <Stack direction="column" spacing={1.5} sx={{ width: "100%", maxWidth: 300 }}>
                      <Button
                        variant="contained"
                        fullWidth
                        onClick={() => navigate("/waitlist")}
                        startIcon={<MapPin size={18} />}
                        sx={{
                          py: 2,
                          borderRadius: "100px",
                          bgcolor: mode === "dark" ? "#f1f1f1e3" : "#00000090",
                          color: "background.default",
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          backdropFilter: "blur(10px)",
                          boxShadow: "none",
                          letterSpacing: 1,
                          "&:hover": { bgcolor: "primary.dark" },
                        }}
                      >
                        Request BETA Access
                      </Button>
                      
                      <Button
                        variant="text"
                        fullWidth
                        onClick={toggleDrawer(true)}
                        sx={{ color: "text.secondary", fontWeight: 600, py: 1.5 }}
                      >
                        Log Entry Details
                      </Button>
                    </Stack>

                    <Typography 
                      variant="caption" 
                      onClick={() => auth.signOut()}
                      sx={{ opacity: 0.4, cursor: 'pointer', '&:hover': { opacity: 1, textDecoration: 'underline' } }}
                    >
                      Navigator: {auth.currentUser?.email}. Abandon Expedition?
                    </Typography>
                  </Stack>
                </Paper>
              </Slide>
            </Box>
          </Fade>
        </Box>

        {/* --- DETAILS DRAWER --- */}
<SwipeableDrawer
  anchor="bottom"
  open={drawerOpen}
  onClose={toggleDrawer(false)}
  onOpen={toggleDrawer(true)}
  ModalProps={{
    BackdropProps:{
      sx: {
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)", // Safari support
        backgroundColor: "rgba(0, 0, 0, 0)", // dim layer
        transition: "all 0.4s ease",
      },
    }
  }}
  PaperProps={{
    sx: (theme) => ({
      borderRadius: "28px",
      maxHeight: "85vh",

      /* 💎 Glass effect */
      backdropFilter: "blur(30px)",
      background:
        theme.palette.mode === "dark"
          ? "rgba(20,20,20,0.75)"
          : "rgba(255,255,255,0.75)",

      backgroundImage: "none",

      /* 📦 Floating look */
      m: 2,
      maxWidth: 520,
      mx: { xs: 2, sm: "auto" },

      /* ✨ Glow + depth */
      boxShadow: "none",

      border: `1px solid ${
        theme.palette.mode === "dark"
          ? "rgba(255,255,255,0.08)"
          : "rgba(0,0,0,0.08)"
      }`,

      transition: "all 0.4s ease",

      /* 🌊 Subtle gradient overlay */
      "&::before": {
        content: '""',
        position: "absolute",
        inset: 0,
        background:
          `linear-gradient(120deg, ${theme.palette.primary.main}40, transparent 40%)`,
        pointerEvents: "none",
      },
    }),
  }}
>
  <Box sx={{ p: 4 }}>
    {/* Handle */}
    <Box sx={{ width: 50, height: 4, bgcolor: "divider", borderRadius: 2, mx: "auto", mb: 4 }} />
    
    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
      <Typography variant="h5" sx={{ fontWeight: 800 }}>Program Overview</Typography>
      <IconButton 
        onClick={toggleDrawer(false)} 
        sx={{ 
          bgcolor: mode === 'dark' ? '#ffffff10' : '#00000010', 
          '&:hover': { bgcolor: mode === 'dark' ? '#ffffff20' : '#00000020' } 
        }}
      >
        <X size={20} />
      </IconButton>
    </Stack>

    <Stack spacing={4}>
      <DetailItem 
        icon={<ShieldCheck color={theme.palette.primary.main} />}
        title="Strict Access Control"
        desc="Access is currently limited to Beta and Dev Beta tiers. These accounts are manually whitelisted by our engineering team."
      />
      <DetailItem 
        icon={<Zap color={theme.palette.primary.main} />}
        title="Early Feature Testing"
        desc="Beta members get access to experimental UI components and high-performance features before the public release."
      />
      <DetailItem 
        icon={<Users color={theme.palette.primary.main} />}
        title="Community Feedback"
        desc="Participants contribute directly to the product roadmap through exclusive feedback channels."
      />

      <Divider sx={{ my: 1, opacity: 0.5 }} />

      {/* Info Box */}
      <Box sx={{ p: 3, borderRadius: 4, bgcolor: theme.palette.primary.main }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 0.5, color: mode === 'dark' ? '#000' : '#fff' }}>
          Why am I seeing this?
        </Typography>
        <Typography variant="body2" sx={{ color: mode === 'dark' ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.85)', lineHeight: 1.6 }}>
          Your account is currently tagged as a <b>Standard User</b>. To change your status, please complete the Beta Application.
        </Typography>
      </Box>

      {/* --- Logout / Switch Account Section --- */}
<Stack 
  direction="column" 
  spacing={2} 
  sx={{ 
    pt: 3, 
    mt: 'auto', // Pushes it to the bottom if the stack is in a flex container
    borderTop: `1px solid ${theme.palette.divider}`,
  }}
>
  {/* User Identity Section */}
  <Box 
    sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: 2, 
      p: 1.5, 
      borderRadius: 4, 
      bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
      border: `1px solid ${theme.palette.divider}`,
    }}
  >
    {/* Identity Icon/Avatar */}
    <Box 
      sx={{ 
        width: 36, 
        height: 36, 
        borderRadius: '50%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        bgcolor: 'primary.main',
        color: 'background.default',
        fontWeight: 800,
        fontSize: '0.75rem'
      }}
    >
      {auth.currentUser?.email?.charAt(0).toUpperCase() || 'U'}
    </Box>

    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
      <Typography 
        variant="caption" 
        display="block" 
        sx={{ color: 'text.disabled', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', fontSize: '0.65rem' }}
      >
        Current Session
      </Typography>
      <Typography 
        variant="body2" 
        noWrap 
        sx={{ fontWeight: 600, color: 'text.primary' }}
      >
        {auth.currentUser?.email}
      </Typography>
    </Box>
  </Box>

  {/* Action Button */}
  <Button
    fullWidth
    variant="text"
    onClick={() => auth.signOut()}
    sx={{
      py: 1.5,
      borderRadius: 3,
      textTransform: 'none',
      fontWeight: 700,
      fontSize: '0.85rem',
      color: 'text.secondary',
      transition: 'all 0.2s ease',
      '&:hover': {
        bgcolor: 'error.main',
        color: '#fff',
        '& .logout-text': { color: '#fff' }
      }
    }}
  >
    <Stack direction="row" spacing={1} alignItems="center">
      <Typography className="logout-text" variant="inherit">
        Switch to a different account
      </Typography>
      <ChevronRight size={14} />
    </Stack>
  </Button>
</Stack>
    </Stack>
  </Box>
</SwipeableDrawer>
      </ThemeProvider>
    );
  }

  return <>{children}</>;
}

// Helper component for drawer items
function DetailItem({ icon, title, desc }) {
  return (
    <Stack direction="row" spacing={3} alignItems="flex-start">
      <Box sx={{ mt: 0.5 }}>{icon}</Box>
      <Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{title}</Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", lineHeight: 1.6 }}>{desc}</Typography>
      </Box>
    </Stack>
  );
}