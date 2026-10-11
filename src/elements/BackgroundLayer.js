
import { Box } from "@mui/material";
import { useBackground } from "../contexts/BackgroundContext";
import { Backgrounds } from "../theme/backgroundPresets";
import "../theme/ambientBlobs.css";

export default function BackgroundLayer({ weather, children }) {
  const { backgroundMode, presetIndex } = useBackground();
  const seed = `${presetIndex}`;

  let base;

  switch (backgroundMode) {
    case "solid":
      base = Backgrounds.solid({ seed });
      break;
    case "gradient":
      base = Backgrounds.gradient({ seed });
      break;
    case "weather":
      base = Backgrounds.weather({ weather });
      break;
    case "season":
      base = Backgrounds.season();
      break;
    case "manual":
      base = Backgrounds.gradient({ seed });
      break;
    case "auto":
    default:
      base = Backgrounds.auto({ weather });
  }

  const composed = Backgrounds.compose(base);

  return (
    <Box
      sx={{
        position: "relative",
        minHeight: "100vh",
        overflow: "hidden",
        ...composed,
        transition: "background-image 1.2s cubic-bezier(.4,0,.2,1)",
      }}
    >
      {/* GPU Blobs */}
      <Box className="ambientBlob" sx={{ top: "-20%", left: "-10%", background: "#ff2a2a" }} />
      <Box className="ambientBlob" sx={{ bottom: "-25%", right: "-15%", background: "#22c55e", animationDelay: "-14s" }} />

      {children}
    </Box>
  );
}
