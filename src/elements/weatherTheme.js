import WbSunnyIcon from '@mui/icons-material/WbSunny';
import CloudIcon from '@mui/icons-material/Cloud';
import ThunderstormIcon from '@mui/icons-material/Thunderstorm';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import OpacityIcon from '@mui/icons-material/Opacity';

// Default (DARK) theme colors
const weatherGradients = {
  Clear: "linear-gradient(360deg, #00000000 4%, #00c2cf30 40%, #00c1cf 100%)",
  Clouds: "linear-gradient(360deg, #00000000 4%, #232526 40%, #fffbfb85 100%)",
  Rain: "linear-gradient(360deg, #00000000 4%, #232526 40%, #6e9ca5 100%)",
  Thunderstorm: "linear-gradient(360deg, #00000000 4%, #232526 40%, #8b7c66 100%)",
  Snow: "linear-gradient(360deg, #00000000 4%, #232526 40%, #dae3ff 100%)",
  Drizzle: "linear-gradient(360deg, #00000000 4%, #232526 40%, #859699 100%)",
  Mist: "linear-gradient(360deg, #00000000 4%, #232526 40%, #c7c7c7 100%)",
  Default: "linear-gradient(360deg, #00000000 4%, #232526 40%, #2c2c2c 100%)"
};

const weatherGradientsAlt = {
  // Light theme alternatives (swap dark/light)
  Clear: "linear-gradient(360deg, #ffffff00 4%, #b2faff30 40%, #e0ffff 100%)",
  Clouds: "linear-gradient(360deg, #ffffff00 4%, #e0e0e0 40%, #23252685 100%)",
  Rain: "linear-gradient(360deg, #ffffff00 4%, #e0e0e0 40%, #b3cdd1 100%)",
  Thunderstorm: "linear-gradient(360deg, #ffffff00 4%, #e0e0e0 40%, #cfc2b3 100%)",
  Snow: "linear-gradient(360deg, #ffffff00 4%, #e0e0e0 40%, #f6faff 100%)",
  Drizzle: "linear-gradient(360deg, #ffffff00 4%, #e0e0e0 40%, #dbe6e8 100%)",
  Mist: "linear-gradient(360deg, #ffffff00 4%, #e0e0e0 40%, #f2f2f2 100%)",
  Default: "linear-gradient(360deg, #ffffff00 4%, #e0e0e0 40%, #f5f5f5 100%)"
};

const weatherColors = {
  Clear: "#b3faff",
  Clouds: "#fffbfb",
  Rain: "#82b3bc",
  Thunderstorm: "#8b7c66",
  Snow: "#dae3ff",
  Drizzle: "#859699",
  Mist: "#c7c7c7",
  Default: "#23fc07"
};

const weatherColorsAlt = {
  // Light theme alternatives (swap dark/light)
  Clear: "#00bcd4",
  Clouds: "#232526",
  Rain: "#3e5a66",
  Thunderstorm: "#5d4c36",
  Snow: "#b3c6ff",
  Drizzle: "#5a6a6d",
  Mist: "#888888",
  Default: "#009688"
};

const weatherbgColors = {
  Clear: "#00c2cf20",
  Clouds: "#fffbfb20",
  Rain: "#6e9ca520",
  Thunderstorm: "#8b7c6620",
  Snow: "#dae3ff20",
  Drizzle: "#85969920",
  Mist: "#c7c7c720",
  Default: "#23fc0720"
};

const weatherbgColorsAlt = {
  // Light theme alternatives (swap dark/light)
  Clear: "#b2faff20",
  Clouds: "#23252620",
  Rain: "#3e5a6620",
  Thunderstorm: "#5d4c3620",
  Snow: "#b3c6ff20",
  Drizzle: "#5a6a6d20",
  Mist: "#88888820",
  Default: "#00968820"
};

const emojiStyle = (type) => ({
  fontSize: 26,
  lineHeight: 1,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  filter:
    type === "sun"
      ? "drop-shadow(0 0 6px rgba(255, 200, 80, 0.16))"
      : type === "rain"
      ? "drop-shadow(0 0 6px rgba(0,180,216,0.15))"
      : type === "storm"
      ? "drop-shadow(0 0 8px rgba(99,102,241,0.17))"
      : type === "snow"
      ? "drop-shadow(0 0 6px rgba(180,200,255,0.16))"
      : "drop-shadow(0 0 4px rgba(0,0,0,0.15))",
  animation:
    type === "sun"
      ? "sunPulse 3s infinite"
      : type === "rain"
      ? "rainFloat 3.2s ease-in-out infinite"
      : type === "storm"
      ? "stormShake 1.6s infinite"
      : undefined,
});

<style>
{`
  @keyframes sunPulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.12); }
    100% { transform: scale(1); }
  }

  @keyframes rainFloat {
    0% { transform: translateY(0); }
    50% { transform: translateY(-4px); }
    100% { transform: translateY(0); }
  }

  @keyframes stormShake {
    0% { transform: translateX(0); }
    25% { transform: translateX(-2px); }
    50% { transform: translateX(2px); }
    75% { transform: translateX(-1px); }
    100% { transform: translateX(0); }
  }
`}
</style>


const weatherIcons = {
  Clear: (
    <span role="img" aria-label="Sunny" style={emojiStyle("sun")}>
      ☀️
    </span>
  ),
  Clouds: (
    <span role="img" aria-label="Cloudy" style={emojiStyle()}>
      ☁️
    </span>
  ),
  Rain: (
    <span role="img" aria-label="Rainy" style={emojiStyle("rain")}>
      🌧️
    </span>
  ),
  Thunderstorm: (
    <span role="img" aria-label="Thunderstorm" style={emojiStyle("storm")}>
      ⛈️
    </span>
  ),
  Snow: (
    <span role="img" aria-label="Snow" style={emojiStyle("snow")}>
      ❄️
    </span>
  ),
  Drizzle: (
    <span role="img" aria-label="Drizzle" style={emojiStyle("rain")}>
      🌦️
    </span>
  ),
  Mist: (
    <span role="img" aria-label="Mist" style={emojiStyle()}>
      🌫️
    </span>
  ),
  Haze: (
    <span role="img" aria-label="Haze" style={emojiStyle()}>
      🌫️
    </span>
  ),
  Default: (
    <span role="img" aria-label="Weather" style={emojiStyle()}>
      🌤️
    </span>
  ),
};


export {
  weatherGradients,
  weatherGradientsAlt,
  weatherColors,
  weatherColorsAlt,
  weatherbgColors,
  weatherbgColorsAlt,
  weatherIcons
};