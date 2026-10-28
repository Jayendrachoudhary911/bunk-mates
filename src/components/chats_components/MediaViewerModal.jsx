// src/components/chats_components/MediaViewerModal.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { Dialog, Box, IconButton, Typography, Tooltip } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DownloadIcon from "@mui/icons-material/Download";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import RotateRightIcon from "@mui/icons-material/RotateRight";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";
import { motion, AnimatePresence } from "framer-motion";

const MediaViewerModal = ({
  open,
  onClose,
  imageUrl,
  images = [],
  captions = {},
  caption = "",
  initialIndex = 0,
}) => {
  // Aggregate images list (fallback to imageUrl if images array is empty)
  const imagesList = React.useMemo(() => {
    if (Array.isArray(images) && images.length > 0) {
      if (imageUrl && !images.includes(imageUrl)) {
        return [imageUrl, ...images];
      }
      return images;
    }
    return imageUrl ? [imageUrl] : [];
  }, [images, imageUrl]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const thumbnailsRef = useRef(null);

  // Reset transforms when switching images or opening
  const resetTransform = useCallback(() => {
    setZoom(1);
    setRotation(0);
  }, []);

  // Sync index when modal opens or imageUrl changes
  useEffect(() => {
    if (imageUrl && imagesList.length > 0) {
      const idx = imagesList.indexOf(imageUrl);
      setCurrentIndex(idx >= 0 ? idx : 0);
    } else {
      setCurrentIndex(initialIndex || 0);
    }
    resetTransform();
  }, [imageUrl, imagesList, initialIndex, open, resetTransform]);

  // Scroll active thumbnail into view
  useEffect(() => {
    if (thumbnailsRef.current) {
      const activeEl = thumbnailsRef.current.children[currentIndex];
      if (activeEl) {
        activeEl.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    }
  }, [currentIndex]);

  const handlePrev = useCallback(() => {
    resetTransform();
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : imagesList.length - 1));
  }, [imagesList.length, resetTransform]);

  const handleNext = useCallback(() => {
    resetTransform();
    setCurrentIndex((prev) => (prev < imagesList.length - 1 ? prev + 1 : 0));
  }, [imagesList.length, resetTransform]);

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(Number((prev + 0.25).toFixed(2)), 3.5));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(Number((prev - 0.25).toFixed(2)), 0.5));
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  // Listen to fullscreen changes
  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  // Keyboard navigation & shortcuts
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e) => {
      if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "Escape") {
        onClose();
      } else if (e.key === "+" || e.key === "=") {
        handleZoomIn();
      } else if (e.key === "-") {
        handleZoomOut();
      } else if (e.key.toLowerCase() === "r") {
        handleRotate();
      } else if (e.key.toLowerCase() === "0") {
        resetTransform();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, handlePrev, handleNext, onClose, resetTransform]);

  const currentImg = imagesList[currentIndex] || imageUrl;
  const currentCaption = (captions && captions[currentImg]) || (currentIndex === 0 ? caption : "") || "";
  if (!open || !currentImg) return null;

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = currentImg;
    a.download = `bunkmate_media_${Date.now()}.jpg`;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.click();
  };

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(currentImg);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen
      PaperProps={{
        sx: {
          bgcolor: "rgba(10, 10, 12, 0.98)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          p: 0,
          overflow: "hidden",
        },
      }}
    >
      {/* ─── Top Controls ─── */}
      <Box
        sx={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          px: { xs: 1.5, sm: 3 },
          py: 1.5,
          zIndex: 25,
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 70%, transparent 100%)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Typography
            sx={{
              color: "rgba(255, 255, 255, 0.9)",
              fontSize: "0.95rem",
              fontWeight: 600,
              letterSpacing: "0.3px",
            }}
          >
            {imagesList.length > 1
              ? `${currentIndex + 1} of ${imagesList.length}`
              : "Media Viewer"}
          </Typography>
          {zoom !== 1 && (
            <Typography
              variant="caption"
              sx={{
                px: 1,
                py: 0.2,
                borderRadius: "6px",
                bgcolor: "rgba(0, 183, 255, 0.2)",
                color: "#38bdf8",
                fontWeight: 700,
                fontSize: "0.75rem",
              }}
            >
              {Math.round(zoom * 100)}%
            </Typography>
          )}
        </Box>

        {/* Action Controls Toolbar */}
        <Box sx={{ display: "flex", gap: { xs: 0.8, sm: 1.2 }, alignItems: "center" }}>
          {/* Zoom Out */}
          <Tooltip title="Zoom Out (-)">
            <IconButton
              onClick={handleZoomOut}
              disabled={zoom <= 0.5}
              sx={{
                bgcolor: "rgba(255, 255, 255, 0.1)",
                color: "#fff",
                "&:hover": { bgcolor: "rgba(255, 255, 255, 0.22)" },
                "&.Mui-disabled": { opacity: 0.4, color: "#fff" },
              }}
              size="small"
            >
              <ZoomOutIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          {/* Zoom In */}
          <Tooltip title="Zoom In (+)">
            <IconButton
              onClick={handleZoomIn}
              disabled={zoom >= 3.5}
              sx={{
                bgcolor: "rgba(255, 255, 255, 0.1)",
                color: "#fff",
                "&:hover": { bgcolor: "rgba(255, 255, 255, 0.22)" },
                "&.Mui-disabled": { opacity: 0.4, color: "#fff" },
              }}
              size="small"
            >
              <ZoomInIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          {/* Reset View */}
          {(zoom !== 1 || rotation !== 0) && (
            <Tooltip title="Reset View (0)">
              <IconButton
                onClick={resetTransform}
                sx={{
                  bgcolor: "rgba(255, 255, 255, 0.1)",
                  color: "#00b7ff",
                  "&:hover": { bgcolor: "rgba(0, 183, 255, 0.25)" },
                }}
                size="small"
              >
                <RestartAltIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}

          {/* Rotate */}
          <Tooltip title="Rotate 90° (R)">
            <IconButton
              onClick={handleRotate}
              sx={{
                bgcolor: "rgba(255, 255, 255, 0.1)",
                color: "#fff",
                "&:hover": { bgcolor: "rgba(255, 255, 255, 0.22)" },
              }}
              size="small"
            >
              <RotateRightIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          {/* Fullscreen Toggle */}
          <Tooltip title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}>
            <IconButton
              onClick={toggleFullscreen}
              sx={{
                display: { xs: "none", sm: "inline-flex" },
                bgcolor: "rgba(255, 255, 255, 0.1)",
                color: "#fff",
                "&:hover": { bgcolor: "rgba(255, 255, 255, 0.22)" },
              }}
              size="small"
            >
              {isFullscreen ? (
                <FullscreenExitIcon fontSize="small" />
              ) : (
                <FullscreenIcon fontSize="small" />
              )}
            </IconButton>
          </Tooltip>

          {/* Copy Link */}
          <Tooltip title={copied ? "Copied!" : "Copy Image Link"}>
            <IconButton
              onClick={handleCopyLink}
              sx={{
                bgcolor: copied ? "rgba(16, 185, 129, 0.3)" : "rgba(255, 255, 255, 0.1)",
                color: copied ? "#10b981" : "#fff",
                "&:hover": { bgcolor: "rgba(255, 255, 255, 0.22)" },
              }}
              size="small"
            >
              {copied ? <CheckIcon fontSize="small" /> : <ContentCopyIcon fontSize="small" />}
            </IconButton>
          </Tooltip>

          {/* Download */}
          <Tooltip title="Download Image">
            <IconButton
              onClick={handleDownload}
              sx={{
                bgcolor: "rgba(255, 255, 255, 0.1)",
                color: "#fff",
                "&:hover": { bgcolor: "rgba(255, 255, 255, 0.22)" },
              }}
              size="small"
            >
              <DownloadIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          {/* Close */}
          <Tooltip title="Close (Esc)">
            <IconButton
              onClick={onClose}
              sx={{
                bgcolor: "rgba(239, 68, 68, 0.2)",
                color: "#f87171",
                "&:hover": { bgcolor: "rgba(239, 68, 68, 0.35)" },
                ml: 0.5,
              }}
              size="small"
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* ─── Main Image Viewer Area ─── */}
      <Box
        sx={{
          flex: 1,
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          px: { xs: 1, sm: 8 },
          overflow: "hidden",
          cursor: zoom > 1 ? "grab" : "default",
          "&:active": {
            cursor: zoom > 1 ? "grabbing" : "default",
          },
        }}
      >
        {/* Previous Arrow Button */}
        {imagesList.length > 1 && (
          <IconButton
            onClick={handlePrev}
            sx={{
              position: "absolute",
              left: { xs: 8, sm: 24 },
              zIndex: 15,
              bgcolor: "rgba(20, 20, 25, 0.75)",
              color: "#fff",
              p: { xs: 1, sm: 1.5 },
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.15)",
              "&:hover": {
                bgcolor: "rgba(255, 255, 255, 0.25)",
                transform: "scale(1.1)",
              },
              transition: "all 0.2s ease",
            }}
          >
            <ChevronLeftIcon sx={{ fontSize: { xs: 28, sm: 36 } }} />
          </IconButton>
        )}

        {/* Animated Image Canvas */}
        <AnimatePresence mode="wait">
          <motion.img
            key={currentImg}
            src={currentImg}
            alt="expanded media"
            drag={zoom > 1}
            dragConstraints={{ left: -300 * zoom, right: 300 * zoom, top: -200 * zoom, bottom: 200 * zoom }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{
              opacity: 1,
              scale: zoom,
              rotate: rotation,
            }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            style={{
              maxWidth: "92vw",
              maxHeight: "72vh",
              objectFit: "contain",
              borderRadius: "12px",
              userSelect: "none",
              boxShadow: "0 10px 40px rgba(0,0,0,0.85)",
            }}
          />
        </AnimatePresence>

        {/* Next Arrow Button */}
        {imagesList.length > 1 && (
          <IconButton
            onClick={handleNext}
            sx={{
              position: "absolute",
              right: { xs: 8, sm: 24 },
              zIndex: 15,
              bgcolor: "rgba(20, 20, 25, 0.75)",
              color: "#fff",
              p: { xs: 1, sm: 1.5 },
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.15)",
              "&:hover": {
                bgcolor: "rgba(255, 255, 255, 0.25)",
                transform: "scale(1.1)",
              },
              transition: "all 0.2s ease",
            }}
          >
            <ChevronRightIcon sx={{ fontSize: { xs: 28, sm: 36 } }} />
          </IconButton>
        )}

        {/* Caption / Text Overlay */}
        {Boolean(currentCaption && currentCaption.trim()) && (
          <Box
            sx={{
              position: "absolute",
              bottom: { xs: 12, sm: 20 },
              left: "50%",
              transform: "translateX(-50%)",
              maxWidth: { xs: "90%", sm: "640px" },
              width: "fit-content",
              px: { xs: 2, sm: 2.8 },
              py: { xs: 0.9, sm: 1.2 },
              borderRadius: "18px",
              bgcolor: "rgba(18, 18, 22, 0.82)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.6)",
              textAlign: "center",
              zIndex: 16,
              pointerEvents: "auto",
            }}
          >
            <Typography
              sx={{
                color: "#ffffff",
                fontSize: { xs: "0.88rem", sm: "0.96rem" },
                fontWeight: 500,
                lineHeight: 1.45,
                wordBreak: "break-word",
                whiteSpace: "pre-wrap",
              }}
            >
              {currentCaption.trim()}
            </Typography>
          </Box>
        )}
      </Box>

      {/* ─── Bottom Thumbnail Strip ─── */}
      {imagesList.length > 1 && (
        <Box
          sx={{
            width: "100%",
            display: "flex",
            justifyContent: "center",
            pb: { xs: 2, sm: 3 },
            pt: 1,
            zIndex: 20,
          }}
        >
          <Box
            ref={thumbnailsRef}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.2,
              px: 2,
              py: 1,
              maxWidth: "92vw",
              overflowX: "auto",
              bgcolor: "rgba(20, 20, 20, 0.8)",
              backdropFilter: "blur(24px)",
              borderRadius: "20px",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              scrollbarWidth: "none",
              "&::-webkit-scrollbar": { display: "none" },
            }}
          >
            {imagesList.map((imgUrl, idx) => {
              const isActive = idx === currentIndex;
              return (
                <Box
                  key={idx}
                  component={motion.div}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    resetTransform();
                    setCurrentIndex(idx);
                  }}
                  sx={{
                    width: { xs: 46, sm: 54 },
                    height: { xs: 46, sm: 54 },
                    borderRadius: "10px",
                    overflow: "hidden",
                    cursor: "pointer",
                    flexShrink: 0,
                    border: isActive
                      ? "2.5px solid #00b7ff"
                      : "2px solid rgba(255, 255, 255, 0.15)",
                    boxShadow: isActive
                      ? "0 0 14px rgba(0, 183, 255, 0.6)"
                      : "none",
                    opacity: isActive ? 1 : 0.55,
                    transition: "all 0.2s ease",
                    "&:hover": {
                      opacity: 1,
                    },
                  }}
                >
                  <Box
                    component="img"
                    src={imgUrl}
                    alt={`thumbnail ${idx}`}
                    sx={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                </Box>
              );
            })}
          </Box>
        </Box>
      )}
    </Dialog>
  );
};

export default React.memo(MediaViewerModal);

