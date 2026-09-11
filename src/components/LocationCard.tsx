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
  isToday?: boolean;
}

const getStatusEmoji = (summary: string): string => {
  const text = (summary || "").toLowerCase();
  if (text.includes("thunder") || text.includes("storm"))
    return "⛈️";
  if (text.includes("rain") || text.includes("shower") || text.includes("drizzle"))
    return "🌦️";
  if (text.includes("cloud") || text.includes("overcast"))
    return "☁️";
  if (text.includes("fog") || text.includes("mist"))
    return "🌫️";
  if (text.includes("wind"))
    return "💨";
  if (text.includes("sun") || text.includes("clear") || text.includes("fine"))
    return "🌤️";
  return "🌤️";
};

const LocationCard: React.FC<LocationCardProps> = ({
  locationData,
  currentTime,
  onRefresh,
  isRefreshing = false,
  isToday = true,
}) => {
  const {
    location,
    weather,
    tides,
    safetyStatus,
    safeWindows,
    error,
    dataSource,
  } = locationData;

  const formatDataSource = () => {
    if (!dataSource) return null;

    const fetchTime = new Date(dataSource.fetchedAt);
    const isRecent = Date.now() - dataSource.fetchedAt < 10 * 60 * 1000; // 10 minutes
    const time = format(fetchTime, "HH:mm");

    if (dataSource.isLive) {
      return {
        label: "Live Data",
        time,
        isLive: true,
      };
    }
    if (dataSource.isFallback) {
      return {
        label: "Cached Data",
        time,
        isLive: false,
      };
    }
    return {
      label: isRecent ? "Recent Cache" : "Cached Data",
      time,
      isLive: false,
    };
  };

  const dataSourceInfo = formatDataSource();

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
  const sortedTides = [...todaysTides].sort((a, b) => {
    const dateA = new Date(a.dateTime);
    const dateB = new Date(b.dateTime);

    if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
      console.warn("Invalid tide dateTime found:", {
        a: a.dateTime,
        b: b.dateTime,
      });
      return 0;
    }

    return dateA.getTime() - dateB.getTime();
  });

  const getDateText = () => {
    if (isToday) {
      return "Today";
    }
    return format(currentTime, "MMM d");
  };

  const statusContent = {
    safe: {
      label: "SAFE TO DRIVE",
      text: "Beach driving conditions are currently safe",
      image: PositiveImage,
      imageAlt: "Safe to drive",
    },
    hurry: {
      label: "HURRY UP!",
      text: "It's getting late if you want to drive you need to hurry",
      image: NeutralImage,
      imageAlt: "Hurry up if you want to drive",
    },
    unsafe: {
      label: "UNSAFE TO DRIVE",
      text: "Too close to high tide - avoid beach driving",
      image: NegativeImage,
      imageAlt: "Unsafe to drive",
    },
  };

  if (error) {
    return (
      <section className="location-card location-card--error">
        <div className="error-card">
          <div className="error-card__img">
            <img src={NegativeImage} alt="Data unavailable" />
          </div>
          <div className="status-box__label" style={{ color: "#991b1b" }}>
            DATA UNAVAILABLE
            <div className="status-box__text" style={{ color: "#b91c1c" }}>
              We couldn't fetch current conditions for this location
            </div>
          </div>
        </div>

        <div className="error-card__details">
          <div>
            ⚠️ <strong>Unable to Load Beach Conditions</strong>
          </div>
          <div>{error}</div>
          <div className="error-card__hint">
            Please check your internet connection and try refreshing the page.
            For safety, avoid beach driving when conditions are unknown.
          </div>
        </div>
      </section>
    );
  }

  const renderLiveBadge = () => {
    if (!dataSourceInfo) return null;
    return (
      <div
        className="live-badge"
        style={dataSourceInfo.isLive ? undefined : { opacity: 0.85 }}
        onClick={(e) => e.preventDefault()}
      >
        <span className="live-badge__dot" />
        <span>
          {dataSourceInfo.label} {dataSourceInfo.time}
        </span>
        {onRefresh && (
          <button
            className={`live-badge__refresh ${
              isRefreshing ? "spin" : ""
            }`}
            onClick={() => !isRefreshing && onRefresh(location.name)}
            disabled={isRefreshing}
            title={
              isRefreshing
                ? "Refreshing..."
                : "Refresh data for this location"
            }
            aria-label={`Refresh data for ${location.name}`}
          >
            <svg
              className="live-badge__icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.2"
              />
            </svg>
          </button>
        )}
      </div>
    );
  };

  return (
    <section className="location-card">
      <div className="location-card__header">
        <h2 className="location-card__title">{location.name}</h2>
        {renderLiveBadge()}
      </div>

      {isToday && (
        <div
          className={`status-box ${
            safetyStatus === "safe"
              ? "safe"
              : safetyStatus === "hurry"
              ? "hurry"
              : "unsafe"
          }`}
        >
          <div className="status-box__img">
            <img
              src={statusContent[safetyStatus].image}
              alt={statusContent[safetyStatus].imageAlt}
            />
          </div>
          <div className="status-box__body">
            <div className="status-box__label">
              {statusContent[safetyStatus].label}
            </div>
            <div className="status-box__text">
              {statusContent[safetyStatus].text}
            </div>
          </div>
        </div>
      )}

      <div className="safe-windows">
        <div className="safe-windows__title">
          Safe Driving Windows {getDateText()}
        </div>
        {safeWindows.length > 0 ? (
          <ul className="safe-windows__list">
            {safeWindows.map((window, index) => (
              <li key={index} className="safe-window-pill">
                {window.start} - {window.end} ({window.duration})
              </li>
            ))}
          </ul>
        ) : (
          <p className="safe-windows__empty">
            No safe driving windows available{" "}
            {isToday ? "today" : `on ${getDateText()}`} due to tide conditions.
          </p>
        )}
      </div>

      {sortedTides.length > 0 && (
        <div>
          <div className="tide-block__label">{getDateText()}'s Tides</div>
          <div className="tide-grid">
            {sortedTides.map((tide, index) => (
              <div key={`${tide.type}-${index}`} className="tide-cell">
                <span className="tide-cell__type">
                  {tide.type === "high" ? (
                    <svg
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      aria-hidden="true"
                    >
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                    </svg>
                  ) : (
                    <svg
                      className="flip"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      aria-hidden="true"
                    >
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                    </svg>
                  )}
                  {tide.type === "high" ? "HIGH TIDE" : "LOW TIDE"}
                </span>
                <span className="tide-cell__time">
                  {formatTideTime(tide.dateTime)}
                </span>
                <span className="tide-cell__height">
                  {formatTideHeight(tide.height)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {weather ? (
        <>
          {weather.summary && (
            <p className="current-weather">
              <span className="current-weather__emoji">
                {getStatusEmoji(weather.summary)}
              </span>
              <span>
                <strong>Current Conditions:</strong> {weather.summary}
              </span>
            </p>
          )}

          <div className="temp-box">
            <div className="temp-box__label">TEMPERATURE</div>
            <div className="temp-box__value">
              {weather.minTemperature !== weather.maxTemperature
                ? `${Math.round(weather.minTemperature)}°C - ${Math.round(
                    weather.maxTemperature
                  )}°C`
                : `${Math.round(weather.temperature)}°C`}
            </div>
          </div>
        </>
      ) : (
        <div className="weather-unavailable">
          <div>
            ⚠️ <strong>Weather data temporarily unavailable</strong>
          </div>
          <p>Tide and safety information is still accurate</p>
        </div>
      )}
    </section>
  );
};

export default LocationCard;