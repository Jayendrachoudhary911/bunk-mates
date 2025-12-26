import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { 
  Box, TextField, AppBar, Toolbar, Typography, Drawer, 
  List, Divider, IconButton, Chip, CircularProgress, Backdrop, 
  Card, CardContent, ListItemButton, Grid, Button, Tooltip,
  Paper, Stack, ListItemText, Slide, Fade, Zoom, Alert, AlertTitle
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SearchIcon from '@mui/icons-material/Search';
import HistoryIcon from '@mui/icons-material/History';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import CloudIcon from '@mui/icons-material/Cloud';
import NewspaperIcon from '@mui/icons-material/Newspaper';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MedicalInformationIcon from '@mui/icons-material/MedicalInformation';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const theme = createTheme({
  palette: { primary: { main: '#2563eb' }, background: { default: 'transparent' } },
  typography: { fontFamily: '"Plus Jakarta Sans", sans-serif' },
  shape: { borderRadius: 24 }
});

const CPCB_URL = `https://api.data.gov.in/resource/3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69?api-key=579b464db66ec23bdd0000011c04ccafb50742ba6a0a7d5e22aa498e&format=json&limit=1000`;

const getAQIDetails = (aqi) => {
  if (aqi <= 50) return { label: "Good", color: "#10b981", advisory: "Safe for outdoor activities.", mask: "Not needed", precautions: ["Open windows for ventilation", "Perfect for morning runs"] };
  if (aqi <= 100) return { label: "Satisfactory", color: "#84cc16", advisory: "Minor breathing discomfort to sensitive people.", mask: "Optional", precautions: ["Sensitive groups should monitor symptoms", "Limit prolonged outdoor exertion"] };
  if (aqi <= 200) return { label: "Moderate", color: "#facc15", advisory: "Breathing discomfort to people with asthma/heart disease.", mask: "N95 for sensitive groups", precautions: ["Close windows during peak hours", "Use air purifiers indoors"] };
  if (aqi <= 300) return { label: "Poor", color: "#f97316", advisory: "Breathing discomfort to most people on prolonged exposure.", mask: "N95 Recommended", precautions: ["Avoid outdoor morning walks", "Keep inhalers handy if asthmatic"] };
  if (aqi <= 400) return { label: "Very Poor", color: "#ef4444", advisory: "Respiratory illness on prolonged exposure.", mask: "N95 Mandatory", precautions: ["Stay indoors as much as possible", "Stop all outdoor physical activities"] };
  return { label: "Severe", color: "#991b1b", advisory: "Affects healthy people and seriously impacts those with existing diseases.", mask: "N95 Mandatory", precautions: ["Emergency: Do not step out", "Run air purifiers at max"] };
};

const generateForecast = (currentAqi) => {
  const days = ["Tomorrow", "Wednesday", "Thursday"];
  return days.map(day => {
    const change = Math.random() > 0.5 ? 1.15 : 0.85;
    const val = Math.round(currentAqi * change);
    return { day, aqi: val, info: getAQIDetails(val) };
  });
};

const createCustomIcon = (color) => new L.DivIcon({
  html: `<div style="background-color: ${color}; width: 22px; height: 22px; border-radius: 50%; border: 4px solid white; box-shadow: 0 4px 15px rgba(0,0,0,0.2);"></div>`,
  className: '', iconSize: [22, 22], iconAnchor: [11, 11],
});

function ChangeView({ center, zoom }) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

const AQIWebApp = () => {
  const [loading, setLoading] = useState(true);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [allStations, setAllStations] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]);
  const [searchQuery, setSearchQuery] = useState('');
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const savedHistory = JSON.parse(localStorage.getItem('aqi_history') || '[]');
    setHistory(savedHistory);

    fetch(CPCB_URL)
      .then(res => res.json())
      .then(json => {
        const stationsMap = {};
        json.records.forEach(r => {
          const key = r.station;
          if (!stationsMap[key]) {
            stationsMap[key] = {
              id: r.id || key, city: r.city, station: r.station, state: r.state,
              lat: parseFloat(r.latitude), lng: parseFloat(r.longitude),
              last_update: r.last_update, pollutants: {}, maxAqi: 0
            };
          }
          const val = parseInt(r.avg_value) || 0;
          stationsMap[key].pollutants[r.pollutant_id] = { value: r.avg_value, unit: r.pollutant_unit };
          if (val > stationsMap[key].maxAqi) stationsMap[key].maxAqi = val;
        });

        const grouped = Object.values(stationsMap).filter(s => !isNaN(s.lat));
        setAllStations(grouped);
        setFilteredResults(grouped);
        setLoading(false);
        autoDetectNearest(grouped);
      });
  }, []);

  const autoDetectNearest = (stations) => {
    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude, longitude } = pos.coords;
      let minDistance = Infinity;
      let nearest = null;
      stations.forEach(s => {
        const dist = Math.sqrt(Math.pow(latitude - s.lat, 2) + Math.pow(longitude - s.lng, 2));
        if (dist < minDistance) { minDistance = dist; nearest = s; }
      });
      if (nearest) { setSelectedStation(nearest); setMapCenter([nearest.lat, nearest.lng]); }
    });
  };

  const handleSearchSubmit = async (query) => {
    const target = query || searchQuery;
    if (!target) return;
    const newHistory = [target, ...history.filter(h => h !== target)].slice(0, 5);
    setHistory(newHistory);
    localStorage.setItem('aqi_history', JSON.stringify(newHistory));
    
    const matches = allStations.filter(s => s.city?.toLowerCase().includes(target.toLowerCase()));
    setFilteredResults(matches);
    if(matches.length > 0) { setMapCenter([matches[0].lat, matches[0].lng]); setIsSearchActive(true); }
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <Backdrop open={loading} sx={{ zIndex: 9999, bgcolor: 'rgba(255, 255, 255, 0.16)', backdropFilter: "blur(20px)" }}><CircularProgress /></Backdrop>

<AppBar
  position="fixed"
  elevation={0}
  sx={{
    bgcolor: 'transparent',
    backdropFilter: 'blur(10px)',
    zIndex: 1300,
    pointerEvents: 'none',
  }}
>
  <Toolbar
    sx={{
      justifyContent: 'center',
      py: 1.5,
      pointerEvents: 'auto',
    }}
  >
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        width: { xs: '100%', sm: 620 },
        px: 1,
        py: 0.5,
        gap: 0.5,

        bgcolor: 'rgba(241,245,249,0.9)',
        backdropFilter: 'blur(12px)',
        borderRadius: 999,

        boxShadow: isSearchActive
          ? '0 12px 30px rgba(0,0,0,0.18)'
          : '0 8px 24px rgba(0,0,0,0.12)',

        border: '1px solid rgba(0,0,0,0.06)',
        transition: 'all .25s ease',
      }}
    >
      <IconButton
        onClick={() => setIsSearchActive(!isSearchActive)}
        sx={{
          bgcolor: isSearchActive ? 'primary.main' : 'transparent',
          color: isSearchActive ? 'white' : 'text.secondary',
          '&:hover': {
            bgcolor: isSearchActive ? 'primary.dark' : 'rgba(0,0,0,0.05)',
          },
          transition: 'all .2s ease',
        }}
      >
        {isSearchActive ? <ArrowBackIcon /> : <SearchIcon />}
      </IconButton>

      <TextField
        fullWidth
        variant="standard"
        placeholder="Search city or station…"
        value={searchQuery}
        onFocus={() => setIsSearchActive(true)}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
        InputProps={{
          disableUnderline: true,
          sx: {
            fontSize: 15,
            fontWeight: 600,
            color: 'text.primary',
            px: 1,
            '&::placeholder': {
              color: 'text.secondary',
              opacity: 0.8,
            },
          },
        }}
      />

      <IconButton
        onClick={() => handleSearchSubmit()}
        sx={{
          bgcolor: '#000',
          color: 'white',
          '&:hover': { bgcolor: 'primary.dark' },
          boxShadow: '0',
          transition: 'all .2s ease',
        }}
      >
        <GpsFixedIcon fontSize="small" />
      </IconButton>
    </Box>
  </Toolbar>
</AppBar>


        <Box sx={{ flexGrow: 1, mt: '72px' }}>
          <MapContainer center={mapCenter} zoom={5} style={{ height: '100%', width: '100%' }} zoomControl={false}>
            <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
            <ChangeView center={mapCenter} zoom={selectedStation ? 13 : 5} />
            {allStations.map(s => (
              <Marker key={s.id} position={[s.lat, s.lng]} icon={createCustomIcon(getAQIDetails(s.maxAqi).color)} eventHandlers={{ click: () => { setSelectedStation(s); setIsSearchActive(false); }}} />
            ))}
          </MapContainer>
        </Box>

        <Slide direction="up" in={!isSearchActive && !!selectedStation} mountOnEnter unmountOnExit>
          <Box sx={{ position: 'absolute', bottom: 25, left: 0, right: 0, px: 3, display: 'flex', gap: 2, flexDirection: {xs: 'column', sm: 'row'}, zIndex: 1100, maxHeight: '40vh', overflowY: 'auto' }}>
            
            <Card sx={{ flex: 1.5, borderRadius: 1, boxShadow: 0, bgcolor: '#c8c8c82e', backdropFilter: "blur(20px)" }}>
              <CardContent>
                <Typography variant="caption" fontWeight="bold" color="textSecondary">LIVE AT {selectedStation?.station?.split(',')[0]}</Typography>
                <Typography variant="h5" fontWeight="900" noWrap>{selectedStation?.city}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', my: 1.5, gap: 2 }}>
                  <Typography variant="h2" fontWeight="900" color={getAQIDetails(selectedStation?.maxAqi).color}>{selectedStation?.maxAqi}</Typography>
                  <Box>
                    <Chip label={getAQIDetails(selectedStation?.maxAqi).label} sx={{ bgcolor: getAQIDetails(selectedStation?.maxAqi).color, color: 'white', fontWeight: 'bold', mb: 0.5 }} />
                    <Typography variant="caption" display="block">Updated: {selectedStation?.last_update?.split(' ')[1]}</Typography>
                  </Box>
                </Box>
                <Divider sx={{ my: 1.5 }} />
                <Grid container spacing={1}>
                  {Object.entries(selectedStation?.pollutants || {}).map(([key, p]) => (
                    <Grid item xs={4} key={key}>
                      <Typography variant="caption" color="textSecondary">{key}</Typography>
                      <Typography variant="body2" fontWeight="bold">{p.value} <small>{p.unit}</small></Typography>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>

            <Card sx={{ flex: 1.2, borderRadius: 1, bgcolor: '#0000004c', backdropFilter: "blur(20px)", color: 'white', boxShadow: 0 }}>
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                  <MedicalInformationIcon color="primary" />
                  <Typography variant="subtitle2" fontWeight="bold">HEALTH GUIDELINES</Typography>
                </Stack>
                <Typography variant="body2" sx={{ mb: 2, opacity: 0.9 }}>{getAQIDetails(selectedStation?.maxAqi).advisory}</Typography>
                <Box sx={{ bgcolor: 'rgba(255,255,255,0.1)', p: 1.5, borderRadius: 1 }}>
                  <Typography variant="caption" fontWeight="bold" color="primary">MASK: {getAQIDetails(selectedStation?.maxAqi).mask}</Typography>
                  <List dense sx={{ mt: 0.5 }}>
                    {getAQIDetails(selectedStation?.maxAqi).precautions.map((p, i) => (
                      <ListItemText key={i} primary={`• ${p}`} primaryTypographyProps={{ fontSize: '11px', opacity: 0.8 }} />
                    ))}
                  </List>
                </Box>
              </CardContent>
            </Card>

            <Card sx={{ flex: 1, borderRadius: 1, boxShadow: 0, bgcolor: '#c8c8c82e', backdropFilter: "blur(20px)" }}>
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center" mb={2}>
                  <TrendingUpIcon color="primary" />
                  <Typography variant="subtitle2" fontWeight="bold">3-DAY FORECAST</Typography>
                </Stack>
                <Stack spacing={1.5}>
                  {generateForecast(selectedStation?.maxAqi).map((f, i) => (
                    <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" fontWeight="bold">{f.day}</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" fontWeight="900" color={f.info.color}>{f.aqi}</Typography>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: f.info.color }} />
                      </Box>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Box>
        </Slide>

        <Drawer anchor="right" open={isSearchActive} variant="persistent" PaperProps={{ sx: { width: {xs: '100%', sm: 400}, marginTop: '80px', height: 'calc(100% - 80px)', border: 'none', boxShadow: -10, p: 2, bgcolor: '#f8fafc0f', backdropFilter: "blur(20px)" } }}>
          {history.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" fontWeight="bold" color="textSecondary">RECENT SEARCHES</Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" mt={1}>
                {history.map((h, i) => <Chip key={i} label={h} onClick={() => handleSearchSubmit(h)} sx={{ m: 0.3 }} />)}
              </Stack>
            </Box>
          )}
          <Divider sx={{ my: 2 }} />
          <List>
            {filteredResults.map(s => (
              <ListItemButton key={s.id} onClick={() => { setSelectedStation(s); setMapCenter([s.lat, s.lng]); setIsSearchActive(false); }} sx={{ borderRadius: 4, mb: 1, border: '1px solid #e2e8f0', bgcolor: 'white' }}>
                <ListItemText primary={s.station} secondary={s.city} primaryTypographyProps={{ fontWeight: 700 }} />
                <Chip label={s.maxAqi} size="small" sx={{ bgcolor: getAQIDetails(s.maxAqi).color, color: 'white', fontWeight: 'bold' }} />
              </ListItemButton>
            ))}
          </List>
        </Drawer>
      </Box>
    </ThemeProvider>
  );
};

export default AQIWebApp;