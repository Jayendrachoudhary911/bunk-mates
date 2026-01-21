import { useEffect, useState } from "react";

const API_KEY = "c5298240cb3e71775b479a32329803ab";

export const useLiveWeather = (lat, lon) => {
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    if (!lat || !lon) return;

    fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
    )
      .then((res) => res.json())
      .then((data) => {
        setWeather({
          temp: Math.round(data.main.temp),
          condition: data.weather[0].main,
        });
      })
      .catch(() => {});
  }, [lat, lon]);

  return weather;
};
