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
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <img
              src={NegativeImage}
              alt="Data unavailable"
              style={{
                width: "80px",
                height: "80px",
                objectFit: "contain",
                opacity: 0.7,
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontWeight: "bold",
                  fontSize: "18px",
                  marginBottom: "8px",
                }}
              >
                DATA UNAVAILABLE
              </div>
              <div style={{ fontSize: "14px", fontWeight: "normal" }}>
                We couldn't fetch current conditions for this location
              </div>
            </div>
          </div>
        </div>

        {/* Error Details */}
        <div
          style={{
            marginTop: "15px",
            padding: "15px",
            backgroundColor: "#fff5f5",
            borderRadius: "8px",
            border: "1px solid #fed7d7",
          }}
        >
          <div
            style={{
              fontSize: "14px",
              color: "#c53030",
              marginBottom: "8px",
              fontWeight: "bold",
            }}
          >
            ⚠️ Unable to Load Beach Conditions
          </div>
          <div
            style={{
              fontSize: "13px",
              color: "#742a2a",
              lineHeight: "1.4",
            }}
          >
            {error}
          </div>
          <div
            style={{
              fontSize: "12px",
              color: "#9c4221",
              marginTop: "10px",
              fontStyle: "italic",
            }}
          >
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
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <img
            src={isSafe ? PositiveImage : NegativeImage}
            alt={isSafe ? "Safe to drive" : "Unsafe to drive"}
            style={{
              width: "80px",
              height: "80px",
              objectFit: "contain",
              flexShrink: 0,
            }}
          />
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontWeight: "bold",
                fontSize: "18px",
                marginBottom: "8px",
              }}
            >
              {isSafe ? "SAFE TO DRIVE" : "UNSAFE TO DRIVE"}
            </div>
            <div style={{ fontSize: "14px", fontWeight: "normal" }}>
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
            {Math.abs(weather.apparentTemperature - weather.temperature) > 2 && (
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
            {weather.rainfallAmount && weather.rainfallAmount.probability > 0 && (
              <div className="weather-item">
                <div className="label">Rainfall</div>
                <div className="value">
                  {weather.rainfallAmount.startRange !== null && weather.rainfallAmount.endRange !== null
                    ? `${weather.rainfallAmount.startRange}-${weather.rainfallAmount.endRange}mm`
                    : weather.rainfallAmount.endRange !== null
                    ? `${weather.rainfallAmount.rangeDivide}${weather.rainfallAmount.endRange}mm`
                    : 'Possible'}
                </div>
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

          {/* Enhanced Weather Summary */}
          {weather.summary && (
            <div style={{ 
              marginTop: '15px', 
              padding: '15px', 
              backgroundColor: '#f0f8ff', 
              borderRadius: '8px',
              fontSize: '14px',
              color: '#2c3e50',
              border: '1px solid #e3f2fd'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '18px' }}>🌤️</span>
                <strong>Current Conditions:</strong> {weather.summary}
              </div>
              
              {/* Additional rainfall information */}
              {weather.rainfallAmount && weather.rainfallAmount.probability > 0 && (
                <div style={{ 
                  marginTop: '8px', 
                  padding: '8px', 
                  backgroundColor: '#e8f4fd', 
                  borderRadius: '6px',
                  fontSize: '13px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '16px' }}>🌧️</span>
                    <strong>Rainfall Forecast:</strong>
                  </div>
                  <div style={{ marginTop: '4px', marginLeft: '22px' }}>
                    {weather.rainfallAmount.startRange !== null && weather.rainfallAmount.endRange !== null
                      ? `Expected: ${weather.rainfallAmount.startRange}-${weather.rainfallAmount.endRange}mm`
                      : weather.rainfallAmount.endRange !== null
                      ? `Expected: ${weather.rainfallAmount.rangeDivide}${weather.rainfallAmount.endRange}mm`
                      : 'Light rainfall possible'}
                    {weather.rainfallAmount.probability > 0 && (
                      <span style={{ color: '#666', marginLeft: '8px' }}>
                        ({weather.rainfallAmount.probability}% chance)
                      </span>
                    )}
                  </div>
                </div>
              )}
              
              {/* Felt temperature note */}
              {Math.abs(weather.apparentTemperature - weather.temperature) > 2 && (
                <div style={{ 
                  marginTop: '8px', 
                  fontSize: '12px', 
                  color: '#666',
                  fontStyle: 'italic'
                }}>
                  <span style={{ fontSize: '14px' }}>🌡️</span>
                  {weather.apparentTemperature > weather.temperature 
                    ? ` Feels warmer due to humidity and wind conditions`
                    : ` Feels cooler due to wind chill`}
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <div
          style={{
            marginTop: "15px",
            padding: "15px",
            backgroundColor: "#fff8e1",
            borderRadius: "8px",
            fontSize: "14px",
            color: "#f57c00",
            border: "1px solid #ffcc02",
            textAlign: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            <span style={{ fontSize: "18px" }}>⚠️</span>
            <strong>Weather data temporarily unavailable</strong>
          </div>
          <div style={{ marginTop: "5px", fontSize: "12px", opacity: 0.8 }}>
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
          <p style={{ color: "#e74c3c", fontStyle: "italic" }}>
            No safe driving windows available today due to tide conditions.
          </p>
        </div>
      )}
    </div>
  );
};

export default LocationCard;
