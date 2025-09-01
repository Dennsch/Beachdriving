import React from "react";
import { LocationData } from "../types";
import { format } from "date-fns";
import PositiveImage from "../images/Positive.png";
import NegativeImage from "../images/Negative.png";
import NeutralImage from "../images/Neutral.png";

interface LocationCardProps {
  locationData: LocationData;
  currentTime: Date;
  onRefresh?: (locationName: string) => void;
  isRefreshing?: boolean;
}

const LocationCard: React.FC<LocationCardProps> = ({
  locationData,
  currentTime,
  onRefresh,
  isRefreshing = false,
}) => {
  const { location, weather, tides, isSafe, safetyStatus, safeWindows, error, dataSource } = locationData;

  // Helper function to format data source info
  const formatDataSource = () => {
    if (!dataSource) return null;

    const fetchTime = new Date(dataSource.fetchedAt);
    const isRecent = Date.now() - dataSource.fetchedAt < 10 * 60 * 1000; // 10 minutes

    if (dataSource.isLive) {
      return {
        icon: "🟢",
        label: "Live Data",
        time: format(fetchTime, "HH:mm"),
        color: "#27ae60",
        bgColor: "#d5f4e6"
      };
    } else if (dataSource.isFallback) {
      return {
        icon: "🟡",
        label: "Cached Data (Network Issue)",
        time: format(fetchTime, "HH:mm 'on' MMM d"),
        color: "#f39c12",
        bgColor: "#fef9e7"
      };
    } else {
      return {
        icon: isRecent ? "🟢" : "🔵",
        label: isRecent ? "Recent Cache" : "Cached Data",
        time: format(fetchTime, "HH:mm"),
        color: isRecent ? "#27ae60" : "#3498db",
        bgColor: isRecent ? "#d5f4e6" : "#ebf3fd"
      };
    }
  };

  const dataSourceInfo = formatDataSource();

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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "15px" }}>
        <h2 style={{ margin: 0 }}>{location.name}</h2>
        
        {/* Data Source Indicator */}
        {dataSourceInfo && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 12px",
              backgroundColor: dataSourceInfo.bgColor,
              borderRadius: "20px",
              fontSize: "12px",
              fontWeight: "500",
              color: dataSourceInfo.color,
              border: `1px solid ${dataSourceInfo.color}30`,
              flexShrink: 0,
              marginLeft: "10px"
            }}
          >
            <span style={{ fontSize: "10px" }}>{dataSourceInfo.icon}</span>
            <span>{dataSourceInfo.label}</span>
            <span style={{ fontSize: "11px", opacity: 0.8 }}>
              {dataSourceInfo.time}
            </span>
            {onRefresh && (
              <button
                onClick={() => !isRefreshing && onRefresh(location.name)}
                disabled={isRefreshing}
                style={{
                  background: "none",
                  border: "none",
                  cursor: isRefreshing ? "not-allowed" : "pointer",
                  padding: "2px",
                  marginLeft: "4px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "12px",
                  color: dataSourceInfo.color,
                  opacity: isRefreshing ? 0.5 : 0.7,
                  transition: "opacity 0.2s, background-color 0.2s",
                  animation: isRefreshing ? "spin 1s linear infinite" : "none",
                }}
                onMouseEnter={(e) => {
                  if (!isRefreshing) {
                    e.currentTarget.style.opacity = "1";
                    e.currentTarget.style.backgroundColor = `${dataSourceInfo.color}20`;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isRefreshing) {
                    e.currentTarget.style.opacity = "0.7";
                    e.currentTarget.style.backgroundColor = "transparent";
                  }
                }}
                title={isRefreshing ? "Refreshing..." : "Refresh data for this location"}
              >
                🔄
              </button>
            )}
          </div>
        )}
      </div>

      {/* Safety Status */}
      <div className={`safety-status ${safetyStatus === 'safe' ? 'safe' : safetyStatus === 'hurry' ? 'neutral' : 'unsafe'}`}>
        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          <img
            src={safetyStatus === 'safe' ? PositiveImage : safetyStatus === 'hurry' ? NeutralImage : NegativeImage}
            alt={safetyStatus === 'safe' ? "Safe to drive" : safetyStatus === 'hurry' ? "Hurry up if you want to drive" : "Unsafe to drive"}
            style={{
              width: "100px",
              height: "100px",
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
              {safetyStatus === 'safe' ? "SAFE TO DRIVE" : safetyStatus === 'hurry' ? "HURRY UP!" : "UNSAFE TO DRIVE"}
            </div>
            <div style={{ fontSize: "14px", fontWeight: "normal" }}>
              {safetyStatus === 'safe'
                ? "Beach driving conditions are currently safe"
                : safetyStatus === 'hurry'
                ? "It's getting late if you want to drive you need to hurry"
                : "Too close to high tide - avoid beach driving"}
            </div>
          </div>
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

      {/* Weather Information */}
      {weather ? (
        <>

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

          {/* Weather Summary */}
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
            {weather.rainfallAmount &&weather.rainfallAmount.probability && (
              <div className="weather-item">
                <div className="label">Rain Chance</div>
                <div className="value">{weather.rainfallAmount.probability}%</div>
              </div>
            )}
            {weather.rainfallAmount && weather.rainfallAmount.probability > 0 ? (
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
            ):(weather.windSpeed > 0 && (
              <div className="weather-item">
                <div className="label">Wind</div>
                <div className="value">
                  {Math.round(weather.windSpeed)} km/h
                </div>
              </div>
            ))}
          </div>

         
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

     

      
    </div>
  );
};

export default LocationCard;
