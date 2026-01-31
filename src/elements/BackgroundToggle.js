import React, { useState } from "react";
import {
  Box,
  ToggleButtonGroup,
  ToggleButton,
  Tooltip,
  Typography,
  Divider,
  Switch,
  FormControlLabel,
  Button,
  SwipeableDrawer,
  IconButton,
  Stack,
} from "@mui/material";
import { Close as CloseIcon, Straighten as TuneIcon } from "../icons/LucideIcons";
import {
  useBackground,
  BACKGROUND_TYPES,
  COLOR_CATEGORIES,
  GRADIENT_TYPES,
  MESH_CATEGORIES,
} from "../contexts/BackgroundContext";
import {
  solidPresets,
  gradientPresets,
  meshGradients,
} from "../theme/backgroundPresets";

export default function BackgroundToggle() {
  const [open, setOpen] = useState(false);

  const {
    backgroundType,
    setBackgroundType,
    category,
    setCategory,
    gradientType,
    setGradientType,
    presetIndex,
    setPresetIndex,
    animated,
    setAnimated,
  } = useBackground();

  const getActiveDetails = () => {
    let list = [];
    if (backgroundType === "solid") list = solidPresets[category] || [];
    else if (backgroundType === "gradient")
      list = gradientPresets?.[gradientType]?.[category] || [];
    else if (backgroundType === "mesh") list = meshGradients[category] || [];

    const current = list[presetIndex];
    return {
      name:
        backgroundType === "solid"
          ? `Solid • ${category}`
          : current?.name || "Custom",
      preview:
        backgroundType === "solid"
          ? { backgroundColor: current }
          : {
              backgroundImage: current?.value,
              backgroundSize: "cover",
            },
    };
  };

  const activeDetails = getActiveDetails();
  const activeCategories =
    backgroundType === "mesh" ? MESH_CATEGORIES : COLOR_CATEGORIES;

  return (
    <>
      {/* ─── Trigger Row ─── */}
      <Button
        onClick={() => setOpen(true)}
        sx={{
          px: 0,
          py: 0.75,
          borderRadius: 3,
          textTransform: "none",
          justifyContent: "flex-start",
          width: "100%",
          color: "inherit",
          "&:hover": { backgroundColor: "transparent" },
        }}
      >
        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: "50%",
            border: "2px solid rgba(255,255,255,0.6)",
            mr: 1.5,
            ...activeDetails.preview,
          }}
        />
        <Box sx={{ textAlign: "left" }}>
          <Typography variant="caption" sx={{ opacity: 0.6 }}>
            Background
          </Typography>
          <Typography variant="body2" fontWeight={700}>
            {activeDetails.name}
            {animated && " • Animated"}
          </Typography>
        </Box>
        <TuneIcon sx={{ ml: "auto", opacity: 0.6 }} />
      </Button>

      {/* ─── Drawer ─── */}
      <SwipeableDrawer
        anchor="bottom"
        open={open}
        onClose={() => setOpen(false)}
        onOpen={() => setOpen(true)}
        PaperProps={{
          sx: {
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            maxHeight: "85vh",
            background:
              "linear-gradient(180deg, rgba(18, 18, 18, 0.09), rgba(10, 10, 10, 0.07))",
            backdropFilter: "blur(34px)",
          },
        }}
      >
        <Box sx={{ p: 3, pb: 6 }}>
          {/* Header */}
          <Stack direction="row" alignItems="center" mb={3}>
            <Typography variant="h6" fontWeight={800}>
              Appearance
            </Typography>
            <IconButton
              onClick={() => setOpen(false)}
              sx={{ ml: "auto", opacity: 0.7 }}
            >
              <CloseIcon />
            </IconButton>
          </Stack>

          {/* Controls */}
          <Stack spacing={3}>
            {/* Render Mode */}
            <Box>
              <Typography
                variant="caption"
                sx={{
                  opacity: 0.5,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  mb: 1,
                  display: "block",
                }}
              >
                Render Mode
              </Typography>

              <ToggleButtonGroup
                exclusive
                value={backgroundType}
                onChange={(_, v) => v && setBackgroundType(v)}
                fullWidth
                sx={{
                  bgcolor: "rgba(255,255,255,0.05)",
                  borderRadius: 3,
                }}
              >
                {BACKGROUND_TYPES.map((t) => (
                  <ToggleButton
                    key={t}
                    value={t}
                    sx={{
                      textTransform: "capitalize",
                      fontWeight: 600,
                    }}
                  >
                    {t}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Box>

            {/* Gradient Options */}
            {backgroundType === "gradient" && (
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
              >
                <ToggleButtonGroup
                  exclusive
                  value={gradientType}
                  onChange={(_, v) => v && setGradientType(v)}
                  sx={{
                    bgcolor: "rgba(255,255,255,0.05)",
                    borderRadius: 3,
                  }}
                >
                  {GRADIENT_TYPES.map((g) => (
                    <ToggleButton
                      key={g}
                      value={g}
                      sx={{ textTransform: "capitalize" }}
                    >
                      {g}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>

                <FormControlLabel
                  control={
                    <Switch
                      size="small"
                      checked={animated}
                      onChange={(e) => setAnimated(e.target.checked)}
                    />
                  }
                  label={
                    <Typography variant="caption" fontWeight={600}>
                      Animated
                    </Typography>
                  }
                />
              </Stack>
            )}

            <Divider sx={{ opacity: 0.12 }} />

            {/* Preset Grid */}
            <Box sx={{ maxHeight: "40vh", overflowY: "auto", pr: 1 }}>
              {activeCategories.map((cat) => {
                let list = [];
                if (backgroundType === "solid")
                  list = solidPresets[cat] || [];
                else if (backgroundType === "gradient")
                  list = gradientPresets?.[gradientType]?.[cat] || [];
                else if (backgroundType === "mesh")
                  list = meshGradients[cat] || [];

                if (!list.length) return null;

                return (
                  <Box key={cat} mb={3}>
                    <Typography
                      variant="caption"
                      sx={{
                        opacity: 0.5,
                        fontWeight: 700,
                        letterSpacing: 1,
                        textTransform: "uppercase",
                        mb: 1.5,
                        display: "block",
                      }}
                    >
                      {cat.replace("_", " ")}
                    </Typography>

                    <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
                      {list.map((preset, i) => {
                        const isActive =
                          category === cat && presetIndex === i;

                        return (
                          <Tooltip
                            key={`${cat}-${preset.name || preset}`}
                            title={preset.name || preset}
                            arrow
                          >
                            <Box
                              onClick={() => {
                                setCategory(cat);
                                setPresetIndex(i);
                              }}
                              sx={{
                                width: 44,
                                height: 44,
                                borderRadius: "50%",
                                cursor: "pointer",
                                position: "relative",
                                ...(backgroundType === "solid"
                                  ? { backgroundColor: preset }
                                  : {
                                      backgroundImage: preset.value,
                                      backgroundSize: "cover",
                                    }),
                                border: isActive
                                  ? "2px solid #fff"
                                  : "2px solid transparent",
                                outline:
                                  "1px solid rgba(255,255,255,0.15)",
                                transition:
                                  "transform 0.18s ease, box-shadow 0.18s ease",
                                "&:hover": {
                                  transform: "scale(1.15)",
                                  boxShadow:
                                    "0 6px 20px rgba(0,0,0,0.35)",
                                },
                              }}
                            />
                          </Tooltip>
                        );
                      })}
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Stack>
        </Box>
      </SwipeableDrawer>
    </>
  );
}
