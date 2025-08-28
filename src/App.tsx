import React, { useState, useEffect, useCallback } from "react";
import { format, addMonths, endOfMonth } from "date-fns";
import { utcToZonedTime } from "date-fns-tz";
import LocationCard from "./components/LocationCard";
import { WillyWeatherService } from "./services/willyWeatherService";
import { SafetyService } from "./services/safetyService";
import { LocationData, Location } from "./types";
import BannerImage from "./images/Banner.png";
import "./App.css";

const QUEENSLAND_TIMEZONE = "Australia/Brisbane";

const App: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [locationsData, setLocationsData] = useState<LocationData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const willyWeatherService = WillyWeatherService.getInstance();
  const safetyService = SafetyService.getInstance();

  const fetchAllLocationData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const locationIds = willyWeatherService.getLocationIds();
      const locationNames = willyWeatherService.getLocationNames();
      const targetDate = new Date(selectedDate + "T12:00:00");
      const qldTargetDate = utcToZonedTime(targetDate, QUEENSLAND_TIMEZONE);

      const locationDataPromises = locationNames.map(async (locationName) => {
        const locationId = locationIds[locationName];

        try {
          // Fetch location details
          const location = await willyWeatherService.getLocation(locationId);

          // Fetch weather and tide data
          const [weatherForecast, tideData] = await Promise.all([
            willyWeatherService.getWeatherForecast(locationId, selectedDate),
            willyWeatherService.getTideForecast(locationId, selectedDate),
          ]);

          // Extract current weather
          const weather = willyWeatherService.extractCurrentWeather(
            weatherForecast,
            qldTargetDate
          );

          // Extract tide points
          const tides = willyWeatherService.extractTidePoints(tideData);

          // Calculate safety
          const isSafe = safetyService.isSafeToDrive(tides, qldTargetDate);
          const safeWindows = safetyService.calculateSafeWindows(
            tides,
            qldTargetDate
          );

          return {
            location,
            weather,
            tides,
            isSafe,
            safeWindows,
          } as LocationData;
        } catch (err) {
          console.error(`Error fetching data for ${locationName}:`, err);

          // Return error state for this location
          return {
            location: {
              id: locationId,
              name: locationName,
              region: "",
              state: "QLD",
              postcode: "",
              timeZone: QUEENSLAND_TIMEZONE,
              lat: 0,
              lng: 0,
              typeId: 0,
            } as Location,
            weather: null,
            tides: [],
            isSafe: false,
            safeWindows: [],
            error: err instanceof Error ? err.message : "Failed to fetch data",
          } as LocationData;
        }
      });

      const results = await Promise.all(locationDataPromises);
      setLocationsData(results);
    } catch (err) {
      console.error("Error fetching location data:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch data";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, safetyService, willyWeatherService]);

  // Initialize with current Queensland time
  useEffect(() => {
    const qldTime = utcToZonedTime(new Date(), QUEENSLAND_TIMEZONE);
    setCurrentTime(qldTime);
    setSelectedDate(format(qldTime, "yyyy-MM-dd"));
  }, []);

  // Fetch data when date changes
  useEffect(() => {
    if (selectedDate) {
      fetchAllLocationData();
    }
  }, [selectedDate, fetchAllLocationData]);

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(event.target.value);

    // Update current time to match selected date at current time
    const newDate = new Date(
      event.target.value + "T" + format(currentTime, "HH:mm:ss")
    );
    const qldTime = utcToZonedTime(newDate, QUEENSLAND_TIMEZONE);
    setCurrentTime(qldTime);
  };

  const isToday =
    selectedDate ===
    format(utcToZonedTime(new Date(), QUEENSLAND_TIMEZONE), "yyyy-MM-dd");

  return (
    <div className="App">
      <div className="container">
        <header className="header">
          <div style={{ textAlign: "center", marginBottom: "20px" }}>
            <img
              src={BannerImage}
              alt="Queensland Beach Driving Safety"
              style={{
                maxWidth: "100%",
                height: "auto",
                borderRadius: "10px",
                boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)",
              }}
            />
          </div>
          <p
            style={{
              textAlign: "center",
              fontSize: "18px",
              marginBottom: "10px",
            }}
          >
            Check tide conditions for safe beach driving
          </p>
          <div
            style={{
              fontSize: "14px",
              color: "rgba(255,255,255,0.8)",
              textAlign: "center",
            }}
          >
            Current Queensland Time:{" "}
            {format(utcToZonedTime(new Date(), QUEENSLAND_TIMEZONE), "PPpp")}
          </div>
        </header>

        <div className="date-picker-container">
          <label htmlFor="date-picker">Select Date for Beach Conditions:</label>
          <input
            id="date-picker"
            type="date"
            value={selectedDate}
            onChange={handleDateChange}
            min={format(new Date(), "yyyy-MM-dd")}
            max={format(
              endOfMonth(addMonths(new Date(), 1)),
              "yyyy-MM-dd"
            )}
          />
          {isToday && (
            <div
              style={{ fontSize: "12px", color: "#27ae60", marginTop: "5px" }}
            >
              Showing current conditions
            </div>
          )}
        </div>

        {error && (
          <div className="error">
            <strong>Error:</strong> {error}
          </div>
        )}

        {loading ? (
          <div className="loading">
            <h3>Loading beach conditions...</h3>
            <p>Fetching live weather and tide data for Queensland beaches</p>
            <div style={{ marginTop: "20px" }}>
              <div
                style={{
                  width: "50px",
                  height: "50px",
                  border: "3px solid rgba(255,255,255,0.3)",
                  borderTop: "3px solid white",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                  margin: "0 auto",
                }}
              ></div>
            </div>
          </div>
        ) : locationsData.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px 20px",
              backgroundColor: "rgba(255, 255, 255, 0.95)",
              borderRadius: "15px",
              margin: "20px 0",
            }}
          >
            <div style={{ fontSize: "48px", marginBottom: "20px" }}>🌊</div>
            <h3 style={{ color: "#e74c3c", marginBottom: "15px" }}>
              No Beach Data Available
            </h3>
            <p
              style={{ color: "#7f8c8d", fontSize: "16px", lineHeight: "1.5" }}
            >
              We're unable to fetch current beach conditions at this time.
              <br />
              Please check your internet connection and try again.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: "20px",
                padding: "12px 24px",
                backgroundColor: "#3498db",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              Refresh Page
            </button>
          </div>
        ) : (
          <div className="locations-grid">
            {locationsData.map((locationData, index) => (
              <LocationCard
                key={`${locationData.location.name}-${index}`}
                locationData={locationData}
                currentTime={currentTime}
              />
            ))}
          </div>
        )}

        <div
          style={{
            marginTop: "40px",
            padding: "20px",
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            borderRadius: "15px",
            fontSize: "14px",
            color: "#2c3e50",
            boxShadow: "0 8px 25px rgba(0, 0, 0, 0.1)",
          }}
        >
          <h3 style={{ marginTop: "0", color: "#2980b9" }}>
            ℹ️ Beach Driving Safety Information
          </h3>
          <ul style={{ paddingLeft: "20px" }}>
            <li>
              <strong>Safe Driving Rule:</strong> Avoid driving on the beach
              within 2 hours before or after high tide
            </li>
            <li>
              <strong>Why?</strong> High tides can make sand soft and increase
              the risk of getting stuck
            </li>
            <li>
              <strong>Best Times:</strong> Drive during low tide periods when
              sand is firmer
            </li>
            <li>
              <strong>Always:</strong> Check local conditions and follow park
              regulations
            </li>
            <li>
              <strong>Emergency:</strong> Carry recovery equipment and inform
              others of your plans
            </li>
          </ul>
          <p style={{ marginBottom: "0", fontStyle: "italic" }}>
            <strong>Disclaimer:</strong> This tool provides guidance only.
            Always check current local conditions, weather warnings, and park
            regulations before beach driving. Drive at your own risk.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default App;
