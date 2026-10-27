import React, { useState, useCallback } from "react";
import {
  Dialog,
  Box,
  Typography,
  IconButton,
  Button,
  TextField,
  Tooltip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CropIcon from "@mui/icons-material/Crop";
import RotateIcon from "@mui/icons-material/RotateRight";
import LooksOneRoundedIcon from "@mui/icons-material/LooksOneRounded";
import Cropper from "react-easy-crop";

const ImageUploadCropperModal = ({
  open,
  onClose,
  imageDataUri,
  onSend,
  effectiveChatTheme = "dark",
}) => {
  const [cropMode, setCropMode] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [currentImage, setCurrentImage] = useState(imageDataUri);
  const [textOverlay, setTextOverlay] = useState("");
  const [isViewOnce, setIsViewOnce] = useState(false);

  React.useEffect(() => {
    setCurrentImage(imageDataUri);
    setCropMode(false);
    setRotation(0);
    setTextOverlay("");
    setIsViewOnce(false);
  }, [imageDataUri, open]);

  const onCropComplete = useCallback(() => {}, []);

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleSend = () => {
    onSend(currentImage, textOverlay, { viewOnce: isViewOnce });
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen
      PaperProps={{
        sx: {
          bgcolor: "rgba(10, 10, 10, 0.95)",
          backdropFilter: "blur(20px)",
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          p: 2,
        },
      }}
    >
      <Box sx={{ position: "absolute", top: 16, right: 16, zIndex: 10 }}>
        <IconButton onClick={onClose} sx={{ color: "#fff" }}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Box
        sx={{
          width: "100%",
          maxWidth: 620,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
          Preview & Send Photo
        </Typography>

        {cropMode ? (
          <Box
            sx={{
              position: "relative",
              width: "100%",
              height: 380,
              borderRadius: "16px",
              overflow: "hidden",
              mb: 2,
            }}
          >
            <Cropper
              image={currentImage}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={4 / 3}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </Box>
        ) : (
          <Box
            sx={{
              position: "relative",
              width: "100%",
              maxHeight: "52vh",
              display: "flex",
              justifyContent: "center",
              mb: 2,
            }}
          >
            <img
              src={currentImage}
              alt="preview"
              style={{
                maxWidth: "100%",
                maxHeight: "52vh",
                borderRadius: "16px",
                objectFit: "contain",
                transform: `rotate(${rotation}deg)`,
                transition: "transform 0.2s ease",
              }}
            />
          </Box>
        )}

        {/* Toolbar */}
        <Box sx={{ display: "flex", gap: 1.5, mb: 2 }}>
          <Button
            variant="outlined"
            size="small"
            onClick={() => setCropMode((prev) => !prev)}
            startIcon={<CropIcon />}
            sx={{
              color: "#fff",
              borderColor: "rgba(255,255,255,0.2)",
              borderRadius: "20px",
              textTransform: "none",
            }}
          >
            {cropMode ? "Done" : "Crop"}
          </Button>

          <Button
            variant="outlined"
            size="small"
            onClick={handleRotate}
            startIcon={<RotateIcon />}
            sx={{
              color: "#fff",
              borderColor: "rgba(255,255,255,0.2)",
              borderRadius: "20px",
              textTransform: "none",
            }}
          >
            Rotate
          </Button>

          <Tooltip title={isViewOnce ? "Photo set to view once (click to turn off)" : "Set photo to view once (disappears after recipient views it)"}>
            <Button
              variant={isViewOnce ? "contained" : "outlined"}
              size="small"
              onClick={() => setIsViewOnce((prev) => !prev)}
              startIcon={<LooksOneRoundedIcon sx={{ fontSize: 18 }} />}
              sx={{
                color: "#fff",
                bgcolor: isViewOnce ? "#00b7ff" : "transparent",
                borderColor: isViewOnce ? "#00b7ff" : "rgba(255,255,255,0.25)",
                borderRadius: "20px",
                textTransform: "none",
                fontWeight: isViewOnce ? 700 : 500,
                boxShadow: isViewOnce ? "0 0 14px rgba(0, 183, 255, 0.5)" : "none",
                "&:hover": {
                  bgcolor: isViewOnce ? "#009bd9" : "rgba(255,255,255,0.08)",
                },
              }}
            >
              {isViewOnce ? "1 Time View" : "View Once"}
            </Button>
          </Tooltip>
        </Box>

        {/* Optional caption */}
        <TextField
          value={textOverlay}
          onChange={(e) => setTextOverlay(e.target.value)}
          placeholder="Add a caption..."
          fullWidth
          variant="outlined"
          InputProps={{
            sx: {
              borderRadius: "16px",
              bgcolor: "rgba(255, 255, 255, 0.08)",
              color: "#fff",
              "& fieldset": { border: "none" },
            },
          }}
          sx={{ mb: 2.5 }}
        />

        {/* Action buttons */}
        <Box sx={{ display: "flex", gap: 2, width: "100%" }}>
          <Button
            fullWidth
            variant="outlined"
            onClick={onClose}
            sx={{
              py: 1.2,
              borderRadius: "16px",
              borderColor: "rgba(255,255,255,0.2)",
              color: "#fff",
              textTransform: "none",
              fontWeight: 600,
            }}
          >
            Cancel
          </Button>

          <Button
            fullWidth
            variant="contained"
            onClick={handleSend}
            sx={{
              py: 1.2,
              borderRadius: "16px",
              bgcolor: "#00b7ff",
              color: "#fff",
              textTransform: "none",
              fontWeight: 600,
              "&:hover": { bgcolor: "#009bd9" },
            }}
          >
            Send Photo
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
};

export default React.memo(ImageUploadCropperModal);
