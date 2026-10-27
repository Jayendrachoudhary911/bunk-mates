import React, { useState } from "react";
import { Box, Typography, Button, LinearProgress, Card } from "@mui/material";
import {
  CloudDownloadOutlined,
  DeleteOutline,
  StorageOutlined,
  SyncOutlined,
} from "@mui/icons-material";
import {
  SettingsLayout,
  SettingsHeader,
  SettingsSection,
  SettingsGroup,
  SettingsRow,
  SETTINGS_THEME,
} from "./SettingsShared";

export default function OfflineDownloadsView({ onBack }) {
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const [cachedRegions, setCachedRegions] = useState([
    { id: "reg_1", name: "Goa & North Coast", size: "48.2 MB", updated: "3 days ago" },
    { id: "reg_2", name: "Manali & Solang Valley", size: "36.8 MB", updated: "1 week ago" },
  ]);

  const handleDownloadNewRegion = () => {
    if (downloading) return;
    setDownloading(true);
    setDownloadProgress(10);
    const interval = setInterval(() => {
      setDownloadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setDownloading(false);
          setCachedRegions((current) => [
            ...current,
            { id: `reg_${Date.now()}`, name: "Jaipur & Old City", size: "29.4 MB", updated: "Just now" },
          ]);
          return 0;
        }
        return prev + 25;
      });
    }, 400);
  };

  const handleDeleteRegion = (id) => {
    setCachedRegions((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <SettingsLayout>
      <SettingsHeader title="Offline & Downloads" onBack={onBack} />

      {/* Storage Breakdown Card */}
      <Card
        sx={{
          bgcolor: SETTINGS_THEME.card,
          p: 2.5,
          borderRadius: "26px",
          border: "1px solid rgba(255, 255, 255, 0.04)",
          mb: 3,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
          <StorageOutlined sx={{ color: SETTINGS_THEME.accent, fontSize: 24 }} />
          <Box>
            <Typography variant="body1" sx={{ color: SETTINGS_THEME.textPrimary, fontWeight: 700 }}>
              Device Storage Usage
            </Typography>
            <Typography variant="caption" sx={{ color: SETTINGS_THEME.textSecondary }}>
              Estimated ~114 MB used by BunkMates offline data
            </Typography>
          </Box>
        </Box>

        <LinearProgress
          variant="determinate"
          value={28}
          sx={{
            height: 8,
            borderRadius: 4,
            bgcolor: "rgba(255, 255, 255, 0.08)",
            "& .MuiLinearProgress-bar": { bgcolor: SETTINGS_THEME.accent },
            mb: 1.5,
          }}
        />

        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography variant="caption" sx={{ color: SETTINGS_THEME.textSecondary }}>
            Offline Maps: 85 MB
          </Typography>
          <Typography variant="caption" sx={{ color: SETTINGS_THEME.textSecondary }}>
            Trips Cache: 18 MB
          </Typography>
          <Typography variant="caption" sx={{ color: SETTINGS_THEME.textSecondary }}>
            Media: 11 MB
          </Typography>
        </Box>
      </Card>

      {/* Downloaded Maps */}
      <SettingsSection title="DOWNLOADED MAP REGIONS" sx={{ ml: 0.5 }} />
      <SettingsGroup sx={{ mb: 3 }}>
        {cachedRegions.map((reg, idx) => (
          <SettingsRow
            key={reg.id}
            icon={CloudDownloadOutlined}
            title={reg.name}
            subtitle={`${reg.size} • Last updated ${reg.updated}`}
            trailing={
              <Button
                size="small"
                color="error"
                onClick={() => handleDeleteRegion(reg.id)}
                sx={{ textTransform: "none", minWidth: 0, p: 0.8 }}
              >
                <DeleteOutline fontSize="small" />
              </Button>
            }
            showChevron={false}
            showDivider={idx < cachedRegions.length - 1}
          />
        ))}

        {downloading && (
          <Box sx={{ p: 2, bgcolor: SETTINGS_THEME.surface }}>
            <Typography variant="caption" sx={{ color: SETTINGS_THEME.textPrimary, display: "block", mb: 0.5 }}>
              Downloading Jaipur & Old City ({downloadProgress}%)...
            </Typography>
            <LinearProgress variant="determinate" value={downloadProgress} sx={{ height: 6, borderRadius: 3 }} />
          </Box>
        )}
      </SettingsGroup>

      <Button
        variant="outlined"
        fullWidth
        disabled={downloading}
        onClick={handleDownloadNewRegion}
        startIcon={<CloudDownloadOutlined />}
        sx={{
          py: 1.5,
          borderRadius: "18px",
          color: SETTINGS_THEME.accent,
          borderColor: "rgba(40, 127, 224, 0.3)",
          textTransform: "none",
          fontWeight: 700,
          mb: 4,
          "&:hover": {
            borderColor: SETTINGS_THEME.accent,
            bgcolor: "rgba(40, 127, 224, 0.08)",
          },
        }}
      >
        {downloading ? "Downloading Region..." : "Download New Offline Region"}
      </Button>

      {/* Offline Trips Cache */}
      <SettingsSection title="OFFLINE TRIPS CACHE" sx={{ ml: 0.5 }} />
      <SettingsGroup>
        <SettingsRow
          icon={SyncOutlined}
          title="Auto-Cache Upcoming Trips"
          subtitle="Keep active itinerary notes and expense logs available without network"
          showChevron={false}
          showDivider
        />
        <SettingsRow
          title="Clear Offline Cache"
          subtitle="Purge temporary files without affecting your cloud trips"
          onClick={() => {
            sessionStorage.clear();
            alert("Offline cache refreshed.");
          }}
          showChevron={false}
        />
      </SettingsGroup>
    </SettingsLayout>
  );
}
