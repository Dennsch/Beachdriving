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
  const [refreshingLocations, setRefreshingLocations] = useState<Set<string>>(new Set());

  const weatherService = WeatherServiceFactory.getWeatherService();
  const safetyService = SafetyService.getInstance();

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
  }, [selectedDate, safetyService, weatherService, refreshingLocations]);

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
    } catch (err) {
      console.error("Error fetching location data:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch data";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, safetyService, weatherService]);

  // Initialize with current Queensland time
  useEffect(() => {
    const qldTime = utcToZonedTime(new Date(), QUEENSLAND_TIMEZONE);
    setCurrentTime(qldTime);
    setSelectedDate(format(qldTime, "yyyy-MM-dd"));
  }, []);

  // Tick the live Queensland clock every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime((prev) => new Date(prev.getTime() + 1000));
    }, 1000);
    return () => clearInterval(interval);
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
      <div className="app-viewport">
        <img
          className="banner-image"
          src={BannerImage}
          alt="Aussie Beach 4x4 Conditions Header Banner"
        />

        <header className="date-header">
          <h1 className="date-header__title">
            Select Date for Beach Conditions:
          </h1>
          <div className="date-header__input-wrap">
            <input
              className="date-header__input"
              aria-label="Select Date"
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
              min={format(new Date(), "yyyy-MM-dd")}
              max={format(endOfMonth(addMonths(new Date(), 1)), "yyyy-MM-dd")}
            />
          </div>
          {isToday && (
            <p className="current-conditions">
              <span className="current-conditions__dot" />
              Showing current conditions
            </p>
          )}
          <div className="qld-time">
            <span className="qld-time__dot" />
            <span>
              Current Queensland Time:{" "}
              {format(currentTime, "MMM d, yyyy, h:mm:ss a")}
            </span>
          </div>
        </header>

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
                className="spin"
                style={{
                  width: "50px",
                  height: "50px",
                  border: "3px solid rgba(12,74,110,0.15)",
                  borderTop: "3px solid #0ea5e9",
                  borderRadius: "50%",
                  margin: "0 auto",
                }}
              ></div>
            </div>
          </div>
        ) : locationsData.length === 0 ? (
          <div className="no-data">
            <div style={{ fontSize: "48px", marginBottom: "20px" }}>🌊</div>
            <h3>No Beach Data Available</h3>
            <p>
              We're unable to fetch current beach conditions at this time.
              <br />
              Please check your internet connection and try again.
            </p>
            <button onClick={() => window.location.reload()}>
              Refresh Page
            </button>
          </div>
        ) : (
          <div className="location-card-list">
            {locationsData.map((locationData, index) => (
              <LocationCard
                key={`${locationData.location.name}-${index}`}
                locationData={locationData}
                currentTime={currentTime}
                onRefresh={refreshLocationData}
                isRefreshing={refreshingLocations.has(locationData.location.name)}
                isToday={isToday}
              />
            ))}
          </div>
        )}

        <article className="safety-info">
          <h3 className="safety-info__title">
            <span className="safety-info__badge">ℹ</span>
            Beach Driving Safety Information
          </h3>
          <ul className="safety-info__list">
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
              <strong>Always:</strong> Check current local conditions and follow
              park regulations
            </li>
            <li>
              <strong>Emergency:</strong> Carry recovery equipment and inform
              others of your plans
            </li>
          </ul>
          <p className="safety-info__disclaimer">
            <strong>Disclaimer:</strong> This tool provides guidance only.
            Always check current local conditions, weather warnings, and park
            regulations before beach driving. Drive at your own risk.
          </p>
        </article>

        {/* Buy Me a Coffee PayPal Button */}
        <PayPalButton
          amount="5.00"
          currency="USD"
          description="Support Beach Driving Safety App ☕"
        />
      </div>
    </div>
  );
};

export default App;
