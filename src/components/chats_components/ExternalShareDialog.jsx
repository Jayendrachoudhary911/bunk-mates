import React, { useState, useEffect } from "react";
import {
  SwipeableDrawer,
  Box,
  Typography,
  IconButton,
  Button,
  TextField,
  InputAdornment,
  Tooltip,
  Snackbar,
  Alert,
  Stack,
  Divider,
} from "@mui/material";
import {
  drawerPaperSx,
  drawerBackdropSx,
  DrawerHandle,
} from "../../theme/designSystem";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ShareRoundedIcon from "@mui/icons-material/ShareRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import TelegramIcon from "@mui/icons-material/Telegram";
import TwitterIcon from "@mui/icons-material/Twitter";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import IosShareRoundedIcon from "@mui/icons-material/IosShareRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";

const ExternalShareDialog = ({
  open,
  onClose,
  items = [],
  itemType = "message",
  effectiveChatTheme = "dark",
  currentUser,
}) => {
  const isDark = effectiveChatTheme === "dark";
  const [generatedImageUrl, setGeneratedImageUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "" });

  // Normalize items array
  const safeItems = Array.isArray(items) ? items : items ? [items] : [];
  const itemCount = safeItems.length;

  // Extract preview title and snippet
  const primaryItem = safeItems[0] || {};
  let title = "BunkMate Message";
  let snippet = "";

  if (primaryItem.type === "trip_preview" || primaryItem.type === "trip") {
    title = `Trip: ${primaryItem.cardData?.title || primaryItem.cardData?.name || primaryItem.title || "Trip Plan"}`;
    snippet = primaryItem.cardData?.destination || primaryItem.destination || primaryItem.text || "Shared Trip on BunkMate";
  } else if (primaryItem.type === "place_preview" || primaryItem.type === "place") {
    title = `Place: ${primaryItem.cardData?.title || primaryItem.cardData?.name || primaryItem.title || "Must Visit Place"}`;
    snippet = primaryItem.cardData?.location || primaryItem.location || primaryItem.text || "Recommended place on BunkMate";
  } else if (primaryItem.type === "user_profile" || primaryItem.type === "user") {
    title = `Profile: ${primaryItem.cardData?.name || primaryItem.cardData?.displayName || primaryItem.name || "Member"}`;
    snippet = primaryItem.cardData?.bio || primaryItem.bio || "BunkMate Community Member";
  } else if (primaryItem.type === "note_preview" || primaryItem.type === "note") {
    title = `Note: ${primaryItem.cardData?.title || primaryItem.title || "Trip Note"}`;
    snippet = primaryItem.cardData?.content || primaryItem.content || primaryItem.text || "";
  } else if (primaryItem.type === "budget" || primaryItem.type === "expenses") {
    title = `Budget & Expenses`;
    snippet = primaryItem.cardData?.title || primaryItem.text || "Trip financial overview";
  } else if (primaryItem.type === "timeline") {
    title = `Trip Itinerary & Timeline`;
    snippet = primaryItem.cardData?.title || primaryItem.text || "Shared timeline plan";
  } else if (primaryItem.type === "checklist" || primaryItem.type === "poll") {
    title = primaryItem.type === "poll" ? "Group Poll" : "Trip Checklist";
    snippet = primaryItem.cardData?.question || primaryItem.cardData?.title || primaryItem.text || "";
  } else {
    // Normal message or multi-message
    if (itemCount > 1) {
      title = `${itemCount} Forwarded Items`;
      snippet = safeItems
        .map((m) => m.text || (m.imageUrl || m.dataUri ? "[Photo]" : `[${m.type || "Widget"}]`))
        .filter(Boolean)
        .slice(0, 3)
        .join(" • ");
    } else {
      title = primaryItem.senderName ? `Message from ${primaryItem.senderName}` : "BunkMate Message";
      snippet = primaryItem.text || (primaryItem.imageUrl || primaryItem.dataUri ? "[Photo message]" : "Shared content");
    }
  }

  // Direct trip and place links
  const tripId =
    primaryItem.cardData?.tripId ||
    primaryItem.tripId ||
    (primaryItem.type === "trip_preview" || primaryItem.type === "trip" ? primaryItem.cardData?.id || primaryItem.id : null);

  const placeId =
    primaryItem.cardData?.placeId ||
    primaryItem.placeId ||
    (primaryItem.type === "place_preview" || primaryItem.type === "place" ? primaryItem.cardData?.id || primaryItem.id : null);

  // Widget prop image (photo attached to card, trip cover, user avatar, etc.)
  const widgetImage =
    primaryItem.cardData?.imageUrl ||
    primaryItem.cardData?.image ||
    primaryItem.cardData?.coverImage ||
    primaryItem.cardData?.photo ||
    primaryItem.cardData?.photoURL ||
    primaryItem.imageUrl ||
    primaryItem.dataUri ||
    (Array.isArray(primaryItem.images) && primaryItem.images[0]) ||
    null;

  let directLink = "";
  if (tripId) {
    directLink = `${window.location.origin}/trip/${tripId}`;
  } else if (placeId) {
    directLink = `${window.location.origin}/place/${placeId}`;
  }

  // Generate unique share URL or direct trip/place link
  const shareUrl =
    directLink ||
    `${window.location.origin}/share?type=${encodeURIComponent(itemType)}&id=${encodeURIComponent(primaryItem.id || Date.now())}&t=${Date.now()}`;

  const shareText = `${title}\n${snippet ? `"${snippet.slice(0, 100)}..."\n` : ""}${directLink ? `Explore: ${directLink}\n` : ""}Check it out on BunkMate! 🚀\n${shareUrl}`;

  // Generate Image on Canvas when dialog opens (with widget image if available)
  useEffect(() => {
    if (!open) return;

    let isCancelled = false;

    const renderCard = (imgElement = null) => {
      const canvas = document.createElement("canvas");
      canvas.width = 640;
      canvas.height = 360;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // 1. Modern Gradient Background
      const gradient = ctx.createLinearGradient(0, 0, 640, 360);
      if (isDark) {
        gradient.addColorStop(0, "#0a0e17");
        gradient.addColorStop(0.5, "#111827");
        gradient.addColorStop(1, "#072b45");
      } else {
        gradient.addColorStop(0, "#f0f9ff");
        gradient.addColorStop(0.5, "#e0f2fe");
        gradient.addColorStop(1, "#bae6fd");
      }
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 640, 360);

      // Decorative glowing circular ambient lights
      ctx.beginPath();
      ctx.arc(540, 80, 140, 0, Math.PI * 2);
      ctx.fillStyle = isDark ? "rgba(0, 183, 255, 0.12)" : "rgba(2, 136, 209, 0.15)";
      ctx.fill();

      ctx.beginPath();
      ctx.arc(80, 300, 120, 0, Math.PI * 2);
      ctx.fillStyle = isDark ? "rgba(186, 104, 200, 0.1)" : "rgba(186, 104, 200, 0.12)";
      ctx.fill();

      // 2. Inner Glass Card
      ctx.save();
      ctx.fillStyle = isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(255, 255, 255, 0.65)";
      ctx.strokeStyle = isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.08)";
      ctx.lineWidth = 1.5;

      // Draw rounded rect for inner card
      const rx = 30, ry = 30, rw = 580, rh = 300, rRadius = 24;
      ctx.beginPath();
      ctx.moveTo(rx + rRadius, ry);
      ctx.lineTo(rx + rw - rRadius, ry);
      ctx.quadraticCurveTo(rx + rw, ry, rx + rw, ry + rRadius);
      ctx.lineTo(rx + rw, ry + rh - rRadius);
      ctx.quadraticCurveTo(rx + rw, ry + rh, rx + rw - rRadius, ry + rh);
      ctx.lineTo(rx + rRadius, ry + rh);
      ctx.quadraticCurveTo(rx, ry + rh, rx, ry + rh - rRadius);
      ctx.lineTo(rx, ry + rRadius);
      ctx.quadraticCurveTo(rx, ry, rx + rRadius, ry);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // 3. Brand Pill at Top Left
      ctx.save();
      ctx.fillStyle = "#00b7ff";
      ctx.beginPath();
      ctx.arc(60, 65, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = "bold 16px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.fillStyle = isDark ? "#ffffff" : "#0f172a";
      ctx.fillText("BUNKMATE", 78, 71);

      // Pill badge for type
      ctx.fillStyle = isDark ? "rgba(0, 183, 255, 0.2)" : "rgba(2, 136, 209, 0.15)";
      ctx.beginPath();
      const bx = 470, by = 50, bw = 120, bh = 28, br = 14;
      ctx.moveTo(bx + br, by);
      ctx.lineTo(bx + bw - br, by);
      ctx.quadraticCurveTo(bx + bw, by, bx + bw, by + br);
      ctx.lineTo(bx + bw, by + bh - br);
      ctx.quadraticCurveTo(bx + bw, by + bh, bx + bw - br, by + bh);
      ctx.lineTo(bx + br, by + bh);
      ctx.quadraticCurveTo(bx, by + bh, bx, by + bh - br);
      ctx.lineTo(bx, by + br);
      ctx.quadraticCurveTo(bx, by, bx + br, by);
      ctx.closePath();
      ctx.fill();

      ctx.font = "bold 12px -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.fillStyle = isDark ? "#00b7ff" : "#0288d1";
      ctx.textAlign = "center";
      ctx.fillText(itemType.toUpperCase(), bx + bw / 2, by + 18);
      ctx.textAlign = "left";
      ctx.restore();

      const hasImage = Boolean(imgElement);

      // Draw Widget Image Thumbnail if available
      if (hasImage) {
        ctx.save();
        const ix = 410, iy = 96, iw = 175, ih = 150, ir = 16;
        ctx.beginPath();
        ctx.moveTo(ix + ir, iy);
        ctx.lineTo(ix + iw - ir, iy);
        ctx.quadraticCurveTo(ix + iw, iy, ix + iw, iy + ir);
        ctx.lineTo(ix + iw, iy + ih - ir);
        ctx.quadraticCurveTo(ix + iw, iy + ih, ix + iw - ir, iy + ih);
        ctx.lineTo(ix + ir, iy + ih);
        ctx.quadraticCurveTo(ix, iy + ih, ix, iy + ih - ir);
        ctx.lineTo(ix, iy + ir);
        ctx.quadraticCurveTo(ix, iy, ix + ir, iy);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(imgElement, ix, iy, iw, ih);
        ctx.restore();

        // Border around image
        ctx.save();
        ctx.strokeStyle = isDark ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.1)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(ix + ir, iy);
        ctx.lineTo(ix + iw - ir, iy);
        ctx.quadraticCurveTo(ix + iw, iy, ix + iw, iy + ir);
        ctx.lineTo(ix + iw, iy + ih - ir);
        ctx.quadraticCurveTo(ix + iw, iy + ih, ix + iw - ir, iy + ih);
        ctx.lineTo(ix + ir, iy + ih);
        ctx.quadraticCurveTo(ix, iy + ih, ix, iy + ih - ir);
        ctx.lineTo(ix, iy + ir);
        ctx.quadraticCurveTo(ix, iy, ix + ir, iy);
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
      }

      // 4. Title
      ctx.save();
      ctx.font = "bold 22px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.fillStyle = isDark ? "#ffffff" : "#0f172a";
      const maxChars = hasImage ? 24 : 36;
      const truncatedTitle = title.length > maxChars ? title.slice(0, maxChars - 2) + "..." : title;
      ctx.fillText(truncatedTitle, 60, 130);

      // 5. Snippet / Content preview
      ctx.font = "14px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.fillStyle = isDark ? "rgba(255, 255, 255, 0.75)" : "rgba(15, 23, 42, 0.75)";
      const cleanSnippet = (snippet || "Shared content preview").replace(/[\r\n]+/g, " ");
      const charsPerLine = hasImage ? 34 : 52;
      const line1 = cleanSnippet.slice(0, charsPerLine);
      const line2 = cleanSnippet.length > charsPerLine ? cleanSnippet.slice(charsPerLine, charsPerLine * 2) + "..." : "";
      ctx.fillText(line1, 60, 170);
      if (line2) {
        ctx.fillText(line2, 60, 194);
      }

      // 6. Direct Link Badge if Trip or Place
      if (directLink) {
        ctx.fillStyle = isDark ? "rgba(0, 183, 255, 0.15)" : "rgba(2, 136, 209, 0.12)";
        ctx.fillRect(60, 218, hasImage ? 320 : 380, 26);
        ctx.font = "11px -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.fillStyle = isDark ? "#00b7ff" : "#0288d1";
        const linkDisplay = directLink.replace(/^https?:\/\//, "");
        ctx.fillText(`🔗 ${linkDisplay}`, 68, 235);
      }

      // 7. Sender & Date Footer
      ctx.font = "12px -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.fillStyle = isDark ? "rgba(255, 255, 255, 0.45)" : "rgba(15, 23, 42, 0.5)";
      const dateStr = new Date().toLocaleDateString([], {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      ctx.fillText(`Shared via BunkMate • ${dateStr}`, 60, 290);
      ctx.fillText("bunkmate.app", 510, 290);
      ctx.restore();

      // Convert to Image Data URL
      try {
        const dataUri = canvas.toDataURL("image/png");
        if (!isCancelled) {
          setGeneratedImageUrl(dataUri);
        }
      } catch {}
    };

    renderCard(null);

    if (widgetImage) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        if (!isCancelled) {
          renderCard(img);
        }
      };
      img.onerror = () => {};
      img.src = widgetImage;
    }

    return () => {
      isCancelled = true;
    };
  }, [open, title, snippet, itemType, isDark, widgetImage, directLink]);

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setSnackbar({ open: true, message: "Link copied to clipboard!" });
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleDownloadImage = () => {
    if (!generatedImageUrl) return;
    const a = document.createElement("a");
    a.href = generatedImageUrl;
    a.download = `bunkmate_share_${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setSnackbar({ open: true, message: "Preview card image downloaded!" });
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        // Attempt sharing with image blob if supported
        if (generatedImageUrl && navigator.canShare) {
          const res = await fetch(generatedImageUrl);
          const blob = await res.blob();
          const file = new File([blob], "bunkmate_preview.png", { type: "image/png" });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              title,
              text: shareText,
              url: shareUrl,
              files: [file],
            });
            onClose();
            return;
          }
        }

        // Fallback to text & link share
        await navigator.share({
          title,
          text: shareText,
          url: shareUrl,
        });
        onClose();
      } catch (err) {
        // User cancelled or share failed
      }
    } else {
      handleCopyLink();
    }
  };

  const mode = isDark ? "dark" : "light";

  return (
    <>
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
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              pb: 1,
              px: 1,
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
                  color: isDark ? "#00b7ff" : "#0288d1",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ShareRoundedIcon sx={{ fontSize: 20 }} />
              </Box>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                  Share to Apps
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.6 }}>
                  Generate preview card & shareable link
                </Typography>
              </Box>
            </Box>

            <IconButton size="small" onClick={onClose} sx={{ opacity: 0.7 }}>
              <CloseRoundedIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Box>

          <Box sx={{ px: 1, pt: 0.5, display: "flex", flexDirection: "column", gap: 2 }}>
          {/* Generated Card Image Preview */}
          {generatedImageUrl && (
            <Box
              sx={{
                position: "relative",
                borderRadius: "16px",
                overflow: "hidden",
                border: `1px solid ${
                  isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"
                }`,
                boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
              }}
            >
              <Box
                component="img"
                src={generatedImageUrl}
                alt="Generated Share Card"
                sx={{
                  width: "100%",
                  height: "auto",
                  display: "block",
                }}
              />

              <Tooltip title="Download Preview Card Image">
                <IconButton
                  size="small"
                  onClick={handleDownloadImage}
                  sx={{
                    position: "absolute",
                    bottom: 8,
                    right: 8,
                    bgcolor: "rgba(0, 0, 0, 0.65)",
                    color: "#fff",
                    backdropFilter: "blur(8px)",
                    "&:hover": { bgcolor: "rgba(0, 0, 0, 0.85)" },
                  }}
                >
                  <DownloadRoundedIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            </Box>
          )}

          {/* Shareable Link Input with Copy Button */}
          <TextField
            fullWidth
            size="small"
            value={shareUrl}
            InputProps={{
              readOnly: true,
              endAdornment: (
                <InputAdornment position="end">
                  <Button
                    size="small"
                    onClick={handleCopyLink}
                    startIcon={copied ? <CheckRoundedIcon sx={{ fontSize: 16 }} /> : <ContentCopyRoundedIcon sx={{ fontSize: 16 }} />}
                    sx={{
                      textTransform: "none",
                      fontWeight: 700,
                      borderRadius: "8px",
                      color: copied ? "#4caf50" : isDark ? "#00b7ff" : "#0288d1",
                    }}
                  >
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </InputAdornment>
              ),
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "12px",
                bgcolor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
                fontSize: "0.82rem",
              },
            }}
          />

          {/* Social Quick Share Buttons */}
          <Box>
            <Typography
              variant="caption"
              sx={{
                display: "block",
                mb: 1,
                fontWeight: 600,
                textAlign: "center",
                opacity: 0.65,
                textTransform: "uppercase",
                letterSpacing: 0.5,
                fontSize: "0.7rem",
              }}
            >
              Direct Share via Social Apps
            </Typography>

            <Stack direction="row" spacing={1.5} justifyContent="center" alignItems="center">
              {/* WhatsApp */}
              <Tooltip title="Share on WhatsApp">
                <IconButton
                  component="a"
                  href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    bgcolor: "#25D366",
                    color: "#fff",
                    p: 1.2,
                    borderRadius: "12px",
                    "&:hover": { bgcolor: "#20ba59", transform: "scale(1.08)" },
                    transition: "all 0.15s ease",
                  }}
                >
                  <WhatsAppIcon sx={{ fontSize: 20 }} />
                </IconButton>
              </Tooltip>

              {/* Telegram */}
              <Tooltip title="Share on Telegram">
                <IconButton
                  component="a"
                  href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    bgcolor: "#229ED9",
                    color: "#fff",
                    p: 1.2,
                    borderRadius: "12px",
                    "&:hover": { bgcolor: "#1f8fc4", transform: "scale(1.08)" },
                    transition: "all 0.15s ease",
                  }}
                >
                  <TelegramIcon sx={{ fontSize: 20 }} />
                </IconButton>
              </Tooltip>

              {/* Twitter / X */}
              <Tooltip title="Share on X">
                <IconButton
                  component="a"
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    bgcolor: "#000",
                    color: "#fff",
                    p: 1.2,
                    borderRadius: "12px",
                    "&:hover": { bgcolor: "#222", transform: "scale(1.08)" },
                    transition: "all 0.15s ease",
                  }}
                >
                  <TwitterIcon sx={{ fontSize: 20 }} />
                </IconButton>
              </Tooltip>

              {/* Email */}
              <Tooltip title="Share via Email">
                <IconButton
                  component="a"
                  href={`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(shareText)}`}
                  sx={{
                    bgcolor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
                    color: isDark ? "#fff" : "#111",
                    p: 1.2,
                    borderRadius: "12px",
                    "&:hover": { bgcolor: isDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.14)", transform: "scale(1.08)" },
                    transition: "all 0.15s ease",
                  }}
                >
                  <EmailOutlinedIcon sx={{ fontSize: 20 }} />
                </IconButton>
              </Tooltip>
            </Stack>
          </Box>

          <Divider sx={{ my: 0.5, borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }} />

          {/* Native System Share Button */}
          <Button
            fullWidth
            variant="contained"
            startIcon={<IosShareRoundedIcon sx={{ fontSize: 18 }} />}
            onClick={handleNativeShare}
            sx={{
              py: 1.1,
              borderRadius: "14px",
              textTransform: "none",
              fontWeight: 700,
              fontSize: "0.92rem",
              background: "linear-gradient(135deg, #00b7ff 0%, #0288d1 100%)",
              boxShadow: "0 6px 20px rgba(0, 183, 255, 0.35)",
              color: "#fff",
              "&:hover": {
                background: "linear-gradient(135deg, #009bd9 0%, #0277bd 100%)",
              },
            }}
          >
            Share via Apps...
          </Button>
          </Box>
        </Box>
      </SwipeableDrawer>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={2500}
        onClose={() => setSnackbar({ open: false, message: "" })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="success" sx={{ borderRadius: "12px", fontWeight: 600 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default React.memo(ExternalShareDialog);
