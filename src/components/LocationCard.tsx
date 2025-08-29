import React from "react";
import { LocationData } from "../types";
import { format } from "date-fns";
import PositiveImage from "../images/Positive.png";
import NegativeImage from "../images/Negative.png";

interface LocationCardProps {
  locationData: LocationData;
  currentTime: Date;
}

const LocationCard: React.FC<LocationCardProps> = ({
  locationData,
  currentTime,
}) => {
  const { location, weather, tides, isSafe, safeWindows, error } = locationData;

  if (error) {
    return (
      <div className="location-card">
        <h2>{location.name}</h2>

        {/* Error State with Negative Image */}
        <div className="safety-status unsafe">
          <div className="safety-status-content">
            <img
              src={NegativeImage}
              alt="Data unavailable"
              className="safety-status-image error"
            />
            <div className="safety-status-text">
              <div className="safety-status-title">
                DATA UNAVAILABLE
              </div>
              <div className="safety-status-description">
                We couldn't fetch current conditions for this location
              </div>
            </div>
          </div>
        </div>

        {/* Error Details */}
        <div className="error-details">
          <div className="error-title">
            ⚠️ Unable to Load Beach Conditions
          </div>
          <div className="error-message">
            {error}
          </div>
          <div className="error-help">
            Please check your internet connection and try refreshing the page.
            For safety, avoid beach driving when conditions are unknown.
          </div>
        </div>
      </div>
    );
  }

  const formatTideTime = (dateTime: string) => {
    return format(new Date(dateTime), "HH:mm");
  };

  const formatTideHeight = (height: number) => {
    return `${height.toFixed(2)}m`;
  };

  const getTodaysTides = () => {
    const today = format(currentTime, "yyyy-MM-dd");
    return tides.filter((tide) => {
      const tideDate = format(new Date(tide.dateTime), "yyyy-MM-dd");
      return tideDate === today;
    });
  };

  const todaysTides = getTodaysTides();
  const highTides = todaysTides.filter((tide) => tide.type === "high");
  const lowTides = todaysTides.filter((tide) => tide.type === "low");

  return (
    <div className="location-card">
      <h2>{location.name}</h2>

      {/* Safety Status */}
      <div className={`safety-status ${isSafe ? "safe" : "unsafe"}`}>
        <div className="safety-status-content">
          <img
            src={isSafe ? PositiveImage : NegativeImage}
            alt={isSafe ? "Safe to drive" : "Unsafe to drive"}
            className="safety-status-image"
          />
          <div className="safety-status-text">
            <div className="safety-status-title">
              {isSafe ? "SAFE TO DRIVE" : "UNSAFE TO DRIVE"}
            </div>
            <div className="safety-status-description">
              {isSafe
                ? "Beach driving conditions are currently safe"
                : "Too close to high tide - avoid beach driving"}
            </div>
          </div>
        </div>
      </div>

      {/* Weather Information */}
      {weather ? (
        <>
          <div className="weather-info">
            <div className="weather-item">
              <div className="label">Temperature</div>
              <div className="value">{Math.round(weather.temperature)}°C</div>
            </div>
            {weather.apparentTemperature !== weather.temperature && (
              <div className="weather-item">
                <div className="label">Feels Like</div>
                <div className="value">
                  {Math.round(weather.apparentTemperature)}°C
                </div>
              </div>
            )}
            {weather.precipitationProbability > 0 && (
              <div className="weather-item">
                <div className="label">Rain Chance</div>
                <div className="value">{weather.precipitationProbability}%</div>
              </div>
            )}
            {weather.windSpeed > 0 && (
              <div className="weather-item">
                <div className="label">Wind</div>
                <div className="value">
                  {Math.round(weather.windSpeed)} km/h
                </div>
              </div>
            )}
          </div>

          {/* Weather Summary */}
          {weather.summary && (
            <div className="weather-summary">
              <div className="weather-summary-content">
                <span className="weather-summary-icon">🌤️</span>
                <strong>Current Conditions:</strong> {weather.summary}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="weather-unavailable">
          <div className="weather-unavailable-content">
            <span className="weather-summary-icon">⚠️</span>
            <strong>Weather data temporarily unavailable</strong>
          </div>
          <div className="weather-unavailable-subtitle">
            Tide and safety information is still accurate
          </div>
        </div>
      )}

      {/* Tide Information */}
      <div className="tide-info">
        <h4>Today's Tides</h4>
        <div className="tide-times">
          {highTides.map((tide, index) => (
            <div key={`high-${index}`} className="tide-time">
              <div className="type">High Tide</div>
              <div className="time">{formatTideTime(tide.dateTime)}</div>
              <div className="height">{formatTideHeight(tide.height)}</div>
            </div>
          ))}
          {lowTides.map((tide, index) => (
            <div key={`low-${index}`} className="tide-time">
              <div className="type">Low Tide</div>
              <div className="time">{formatTideTime(tide.dateTime)}</div>
              <div className="height">{formatTideHeight(tide.height)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Safe Driving Windows */}
      {safeWindows.length > 0 && (
        <div className="safe-windows">
          <h3>Safe Driving Windows Today</h3>
          <ul>
            {safeWindows.map((window, index) => (
              <li key={index}>
                {window.start} - {window.end} ({window.duration})
              </li>
            ))}
          </ul>
        </div>
      )}

      {safeWindows.length === 0 && (
        <div className="safe-windows">
          <h3>Safe Driving Windows Today</h3>
          <p className="safe-windows-none">
            No safe driving windows available today due to tide conditions.
          </p>
        </div>
      )}
    </div>
  );
};

export default LocationCard;
