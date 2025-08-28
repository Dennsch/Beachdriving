import React from 'react';
import { LocationData, TidePoint } from '../types';
import { format } from 'date-fns';

interface LocationCardProps {
  locationData: LocationData;
  currentTime: Date;
}

const LocationCard: React.FC<LocationCardProps> = ({ locationData, currentTime }) => {
  const { location, weather, tides, isSafe, safeWindows, error } = locationData;

  if (error) {
    return (
      <div className="location-card">
        <h2>{location.name}</h2>
        <div className="error">
          Error loading data: {error}
        </div>
      </div>
    );
  }

  const formatTideTime = (dateTime: string) => {
    return format(new Date(dateTime), 'HH:mm');
  };

  const formatTideHeight = (height: number) => {
    return `${height.toFixed(2)}m`;
  };

  const getTodaysTides = () => {
    const today = format(currentTime, 'yyyy-MM-dd');
    return tides.filter(tide => {
      const tideDate = format(new Date(tide.dateTime), 'yyyy-MM-dd');
      return tideDate === today;
    });
  };

  const todaysTides = getTodaysTides();
  const highTides = todaysTides.filter(tide => tide.type === 'high');
  const lowTides = todaysTides.filter(tide => tide.type === 'low');

  return (
    <div className="location-card">
      <h2>{location.name}</h2>
      
      {/* Safety Status */}
      <div className={`safety-status ${isSafe ? 'safe' : 'unsafe'}`}>
        {isSafe ? '✅ SAFE TO DRIVE' : '⚠️ UNSAFE TO DRIVE'}
        <div style={{ fontSize: '14px', marginTop: '5px', fontWeight: 'normal' }}>
          {isSafe 
            ? 'Beach driving conditions are currently safe'
            : 'Too close to high tide - avoid beach driving'
          }
        </div>
      </div>

      {/* Weather Information */}
      {weather && (
        <div className="weather-info">
          <div className="weather-item">
            <div className="label">Temperature</div>
            <div className="value">{Math.round(weather.temperature)}°C</div>
          </div>
          <div className="weather-item">
            <div className="label">Feels Like</div>
            <div className="value">{Math.round(weather.apparentTemperature)}°C</div>
          </div>
          <div className="weather-item">
            <div className="label">Rain Chance</div>
            <div className="value">{weather.precipitationProbability}%</div>
          </div>
          <div className="weather-item">
            <div className="label">Wind</div>
            <div className="value">{Math.round(weather.windSpeed)} km/h</div>
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
          <p style={{ color: '#e74c3c', fontStyle: 'italic' }}>
            No safe driving windows available today due to tide conditions.
          </p>
        </div>
      )}

      {/* Weather Summary */}
      {weather && weather.summary && (
        <div style={{ 
          marginTop: '15px', 
          padding: '10px', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '5px',
          fontSize: '14px',
          color: '#6c757d'
        }}>
          <strong>Conditions:</strong> {weather.summary}
        </div>
      )}
    </div>
  );
};

export default LocationCard;