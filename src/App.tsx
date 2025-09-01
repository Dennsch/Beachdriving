import React, { useState, useEffect, useCallback } from "react";
import { format, addMonths, endOfMonth } from "date-fns";
import { utcToZonedTime } from "date-fns-tz";
import LocationCard from "./components/LocationCard";
import PayPalButton from "./components/PayPalButton";
import { WeatherServiceFactory } from "./services/weatherServiceFactory";
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
  const [showCacheDebug, setShowCacheDebug] = useState<boolean>(false);
  const [cacheStats, setCacheStats] = useState<any>(null);
  const [refreshingLocations, setRefreshingLocations] = useState<Set<string>>(new Set());

  const weatherService = WeatherServiceFactory.getWeatherService();
  const safetyService = SafetyService.getInstance();

  // Update cache stats after data fetching
  const updateCacheStats = useCallback(() => {
    if (weatherService && typeof (weatherService as any).getCacheStats === 'function') {
      const stats = (weatherService as any).getCacheStats();
      setCacheStats(stats);
    }
  }, [weatherService]);

  // Refresh data for a specific location
  const refreshLocationData = useCallback(async (locationName: string) => {
    // Prevent multiple simultaneous refreshes for the same location
    if (refreshingLocations.has(locationName)) {
      return;
    }

    // Add location to refreshing set
    setRefreshingLocations(prev => new Set(prev).add(locationName));

    try {
      const locationIds = weatherService.getLocationIds();
      const locationId = locationIds[locationName];
      
      if (!locationId) {
        console.error(`Location ID not found for ${locationName}`);
        return;
      }

      // Clear any existing error for this location
      setLocationsData(prevData => 
        prevData.map(locationData => 
          locationData.location.name === locationName 
            ? { ...locationData, error: undefined }
            : locationData
        )
      );

      // Clear cache for this specific location and date to force fresh data
      if (weatherService && typeof (weatherService as any).removeCacheEntry === 'function') {
        (weatherService as any).removeCacheEntry(locationId, selectedDate);
      }

      const targetDate = new Date(selectedDate + "T12:00:00");
      const qldTargetDate = utcToZonedTime(targetDate, QUEENSLAND_TIMEZONE);

      // Fetch fresh data for this location
      const combinedResult = await weatherService.getCombinedForecast(
        locationId,
        selectedDate
      );
      const combinedData = combinedResult.data;
      const dataSource = combinedResult.dataSource;

      // Extract current weather
      const weather = combinedData.forecasts.weather
        ? weatherService.extractCurrentWeather(
            combinedData,
            qldTargetDate
          )
        : null;

      // Extract tide points
      const tides = combinedData.forecasts.tides
        ? weatherService.extractTidePoints({
            location: combinedData.location,
            forecasts: { tides: combinedData.forecasts.tides },
          })
        : [];

      // Calculate safety
      const isSafe = safetyService.isSafeToDrive(tides, utcToZonedTime(new Date(), QUEENSLAND_TIMEZONE));
      const safetyStatus = safetyService.getSafetyStatus(tides, utcToZonedTime(new Date(), QUEENSLAND_TIMEZONE));
      const safeWindows = safetyService.calculateSafeWindows(
        tides,
        qldTargetDate
      );

      const updatedLocationData = {
        location: {
          ...combinedData.location,
          name: locationName, // Use hardcoded name instead of API name
        },
        weather,
        tides,
        isSafe,
        safetyStatus,
        safeWindows,
        dataSource, // Include data source metadata
      } as LocationData;

      // Update the specific location in the state
      setLocationsData(prevData => 
        prevData.map(locationData => 
          locationData.location.name === locationName 
            ? updatedLocationData 
            : locationData
        )
      );

      // Update cache stats after successful refresh
      updateCacheStats();
      
      console.log(`🔄 Refreshed data for ${locationName}`);
    } catch (err) {
      console.error(`Error refreshing data for ${locationName}:`, err);
      
      // Update the location with error state
      setLocationsData(prevData => 
        prevData.map(locationData => 
          locationData.location.name === locationName 
            ? {
                ...locationData,
                error: err instanceof Error ? err.message : "Failed to refresh data"
              }
            : locationData
        )
      );
    } finally {
      // Remove location from refreshing set
      setRefreshingLocations(prev => {
        const newSet = new Set(prev);
        newSet.delete(locationName);
        return newSet;
      });
    }
  }, [selectedDate, safetyService, weatherService, updateCacheStats, refreshingLocations]);

  const fetchAllLocationData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const locationIds = weatherService.getLocationIds();
      const locationNames = weatherService.getLocationNames();
      const targetDate = new Date(selectedDate + "T12:00:00");
      const qldTargetDate = utcToZonedTime(targetDate, QUEENSLAND_TIMEZONE);

      const locationDataPromises = locationNames.map(async (locationName) => {
        const locationId = locationIds[locationName];



        try {
          // Fetch combined weather and tide data (includes location info)
          const combinedResult = await weatherService.getCombinedForecast(
            locationId,
            selectedDate
          );
          const combinedData = combinedResult.data;
          const dataSource = combinedResult.dataSource;

          // Extract current weather
          const weather = combinedData.forecasts.weather
            ? weatherService.extractCurrentWeather(
                combinedData,
                qldTargetDate
              )
            : null;



          // Extract tide points
          const tides = combinedData.forecasts.tides
            ? weatherService.extractTidePoints({
                location: combinedData.location,
                forecasts: { tides: combinedData.forecasts.tides },
              })
            : [];

          // Calculate safety
          const isSafe = safetyService.isSafeToDrive(tides, utcToZonedTime(new Date(), QUEENSLAND_TIMEZONE));
          const safetyStatus = safetyService.getSafetyStatus(tides, utcToZonedTime(new Date(), QUEENSLAND_TIMEZONE));
          const safeWindows = safetyService.calculateSafeWindows(
            tides,
            qldTargetDate
          );

          return {
            location: {
              ...combinedData.location,
              name: locationName, // Use hardcoded name instead of API name
            },
            weather,
            tides,
            isSafe,
            safetyStatus,
            safeWindows,
            dataSource, // Include data source metadata
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
            safetyStatus: 'unsafe' as const,
            safeWindows: [],
            error: err instanceof Error ? err.message : "Failed to fetch data",
          } as LocationData;
        }
      });

      const results = await Promise.all(locationDataPromises);
      setLocationsData(results);
      
      // Update cache stats after successful fetch
      updateCacheStats();
    } catch (err) {
      console.error("Error fetching location data:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch data";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, safetyService, weatherService, updateCacheStats]);

  // Initialize with current Queensland time
  useEffect(() => {
    const qldTime = utcToZonedTime(new Date(), QUEENSLAND_TIMEZONE);
    setCurrentTime(qldTime);
    setSelectedDate(format(qldTime, "yyyy-MM-dd"));
    
    // Initial cache stats load
    updateCacheStats();
  }, [updateCacheStats]);

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

  // Cache management functions
  const handleClearCache = () => {
    if (weatherService && typeof (weatherService as any).clearCache === 'function') {
      (weatherService as any).clearCache();
      updateCacheStats();
      console.log('🧹 Cache cleared manually');
    }
  };

  const toggleCacheDebug = () => {
    setShowCacheDebug(!showCacheDebug);
    if (!showCacheDebug) {
      updateCacheStats();
    }
  };



  const isToday =
    selectedDate ===
    format(utcToZonedTime(new Date(), QUEENSLAND_TIMEZONE), "yyyy-MM-dd");

  return (
    <div className="App" style={{ position: "relative" }}>
      {/* Background Banner Image */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          zIndex: -1,
          overflow: "hidden",
        }}
      >
        <img
          src={BannerImage}
          alt="Queensland Beach Driving Safety"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            objectPosition: "center top",
            display: "block",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.7))",
          }}
        />
      </div>

      <div className="container" style={{ position: "relative", zIndex: 1 }}>
        <header
          className="header"
          style={{
            textAlign: "center",
            padding: "40px 25px",
            color: "white",
          }}
        >

          <div
            className="date-picker-container"
            style={{
              backgroundColor: "rgba(255,255,255,0.9)",
              padding: "15px 20px",
              borderRadius: "10px",
              boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
              marginBottom: "15px",
              display: "inline-block",
            }}
          >
            <label
              htmlFor="date-picker"
              style={{
                color: "#2c3e50",
                fontWeight: "bold",
                marginBottom: "8px",
                display: "block",
              }}
            >
              Select Date for Beach Conditions:
            </label>
            <input
              id="date-picker"
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
              min={format(new Date(), "yyyy-MM-dd")}
              max={format(endOfMonth(addMonths(new Date(), 1)), "yyyy-MM-dd")}
              style={{
                padding: "8px 12px",
                borderRadius: "5px",
                border: "1px solid #ddd",
                fontSize: "16px",
                width: "100%",
                maxWidth: "200px",
              }}
            />
            {isToday && (
              <div
                style={{
                  fontSize: "12px",
                  color: "#27ae60",
                  marginTop: "5px",
                  fontWeight: "bold",
                }}
              >
                Showing current conditions
              </div>
            )}
            
          </div>

          <div
            style={{
              fontSize: "14px",
              color: "rgba(255,255,255,0.9)",
              textShadow: "1px 1px 2px rgba(0,0,0,0.7)",
            }}
          >
            Current Queensland Time:{" "}
            {format(utcToZonedTime(new Date(), QUEENSLAND_TIMEZONE), "PPpp")}
          </div>
          
          {/* Cache Debug Toggle */}
          {/* <div style={{ marginTop: "10px" }}>
            <button
              onClick={toggleCacheDebug}
              style={{
                padding: "5px 10px",
                backgroundColor: "rgba(255,255,255,0.2)",
                color: "white",
                border: "1px solid rgba(255,255,255,0.3)",
                borderRadius: "5px",
                fontSize: "12px",
                cursor: "pointer",
              }}
            >
              {showCacheDebug ? "Hide" : "Show"} Cache Info
            </button>
          </div> */}
        </header>

        {/* Cache Debug Panel */}
        {showCacheDebug && cacheStats && (
          <div
            style={{
              backgroundColor: "rgba(0,0,0,0.8)",
              color: "white",
              padding: "15px",
              borderRadius: "10px",
              margin: "10px 0",
              fontSize: "12px",
              fontFamily: "monospace",
            }}
          >
            <h4 style={{ margin: "0 0 10px 0", color: "#4CAF50" }}>
              📊 Cache Statistics
            </h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div>
                <strong>Total Entries:</strong> {cacheStats.totalEntries}
              </div>
              <div>
                <strong>Expired Entries:</strong> {cacheStats.expiredEntries}
              </div>
              <div>
                <strong>Storage Used:</strong> {Math.round(cacheStats.storageUsed / 1024)} KB
              </div>
              <div>
                <strong>Memory Fallback:</strong> {cacheStats.memoryFallbackActive ? "Yes" : "No"}
              </div>
            </div>
            <div style={{ marginTop: "10px" }}>
              <button
                onClick={handleClearCache}
                style={{
                  padding: "5px 10px",
                  backgroundColor: "#e74c3c",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  fontSize: "11px",
                  cursor: "pointer",
                  marginRight: "10px",
                }}
              >
                Clear Cache
              </button>
              <button
                onClick={updateCacheStats}
                style={{
                  padding: "5px 10px",
                  backgroundColor: "#3498db",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  fontSize: "11px",
                  cursor: "pointer",
                }}
              >
                Refresh Stats
              </button>
            </div>
          </div>
        )}

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
                onRefresh={refreshLocationData}
                isRefreshing={refreshingLocations.has(locationData.location.name)}
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

        {/* Buy Me a Coffee PayPal Button */}
        <PayPalButton 
          amount="5.00" 
          currency="USD" 
          description="Support Beach Driving Safety App ☕" 
        />
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
