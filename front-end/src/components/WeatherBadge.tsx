import { useEffect, useState } from "react";

export function WeatherBadge() {
  const [weather, setWeather] = useState<{
    temp: number;
    description: string;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Map Open-Meteo weather codes to friendly text
  const weatherDescriptions: Record<number, string> = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Cloudy",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Light drizzle",
    61: "Slight rain",
    63: "Rain",
    65: "Heavy rain",
    71: "Snowfall",
    80: "Rain showers",
    95: "Thunderstorm",
  };

  useEffect(() => {
    fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=30.628&longitude=-96.334&current_weather=true"
    )
      .then((res) => res.json())
      .then((data) => {
        const w = data.current_weather;
        if (!w) {
          setError(true);
        } else {
          setWeather({
            temp: Math.round(w.temperature),
            description: weatherDescriptions[w.weathercode] ?? "Weather",
          });
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const baseClasses =
    "inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs md:text-sm bg-gray-700/80 text-gray-100";

  if (loading) return <div className={baseClasses}>Loading weather...</div>;
  if (error || !weather) return <div className={baseClasses}>Weather unavailable</div>;

  return (
    <div className={baseClasses}>
      <span>☁️</span>
      <span>{weather.temp}°F • {weather.description}</span>
    </div>
  );
}