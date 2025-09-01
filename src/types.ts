export interface Location {
  id: number;
  name: string;
  region: string;
  state: string;
  postcode: string;
  timeZone: string;
  lat: number;
  lng: number;
  typeId: number;
}

export interface WeatherData {
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  dewPoint: number;
  pressure: number;
  windSpeed: number;
  windDirection: number;
  windGust: number;
  cloudCover: number;
  uvIndex: number;
  visibility: number;
  precipitationRate: number;
  precipitationProbability: number;
  precipitationType: string;
  icon: string;
  summary: string;
  // Enhanced rainfall information
  rainfallAmount?: {
    startRange: number | null;
    endRange: number | null;
    rangeDivide: string;
    rangeCode: string;
    probability: number;
  };
  rainfallProbabilityDetailed?: number; // More detailed probability from rainfallprobability forecast
}

export interface TidePoint {
  dateTime: string;
  height: number;
  type: 'high' | 'low';
}

export interface TideData {
  location: Location;
  forecasts: {
    tides: {
      days: {
        dateTime: string;
        entries: TidePoint[];
      }[];
      units: {
        height: string;
      };
      issueDateTime: string;
      carousel: {
        size: number;
        start: number;
      };
    };
  };
}

export interface WeatherForecast {
  location: Location;
  forecasts: {
    weather: {
      days: {
        dateTime: string;
        entries: {
          dateTime: string;
          precisCode: string;
          precis: string;
          precisOverlayCode: string | null;
          night: boolean;
          min: number;
          max: number;
          temp?: number;
          apparentTemp?: number;
          humidity?: number;
          dewPoint?: number;
          pressure?: number;
          windSpeed?: number;
          windDirection?: number;
          windGust?: number;
          cloudCover?: number;
          uvIndex?: number;
          visibility?: number;
          precipitationRate?: number;
          precipitationProbability?: number;
          precipitationType?: string;
        }[];
      }[];
      units: {
        temperature: string;
      };
      issueDateTime: string;
    };
  };
}

// Combined API response interface for weather and tides
export interface CombinedForecastData {
  location: Location;
  forecasts: {
    tides?: {
      days: {
        dateTime: string;
        entries: TidePoint[];
      }[];
      units: {
        height: string;
      };
      issueDateTime: string;
      carousel: {
        size: number;
        start: number;
      };
    };
    weather?: {
      days: {
        dateTime: string;
        entries: {
          dateTime: string;
          precisCode: string;
          precis: string;
          precisOverlayCode: string | null;
          night: boolean;
          min: number;
          max: number;
          temp?: number;
          apparentTemp?: number;
          humidity?: number;
          dewPoint?: number;
          pressure?: number;
          windSpeed?: number;
          windDirection?: number;
          windGust?: number;
          cloudCover?: number;
          uvIndex?: number;
          visibility?: number;
          precipitationRate?: number;
          precipitationProbability?: number;
          precipitationType?: string;
        }[];
      }[];
      units: {
        temperature: string;
      };
      issueDateTime: string;
    };
    rainfallprobability?: {
      days: {
        dateTime: string;
        entries: {
          dateTime: string;
          probability: number;
        }[];
      }[];
      units: {
        percentage: string;
      };
      issueDateTime: string;
      carousel: {
        size: number;
        start: number;
      };
    };
    rainfall?: {
      days: {
        dateTime: string;
        entries: {
          dateTime: string;
          startRange: number | null;
          endRange: number | null;
          rangeDivide: string;
          rangeCode: string;
          probability: number;
        }[];
      }[];
      units: {
        amount: string;
      };
      issueDateTime: string;
    };
  };
}

export interface SafeWindow {
  start: string;
  end: string;
  duration: string;
}

export interface DataSourceInfo {
  isLive: boolean; // true if from API, false if from cache
  fetchedAt: number; // timestamp when data was originally fetched from API
  retrievedAt: number; // timestamp when data was retrieved (could be from cache)
  cacheUsed: boolean; // true if cache was used (either fresh or fallback)
  isFallback: boolean; // true if cache was used due to network failure
}

export interface LocationData {
  location: Location;
  weather: WeatherData | null;
  tides: TidePoint[];
  isSafe: boolean;
  safeWindows: SafeWindow[];
  error?: string;
  dataSource?: DataSourceInfo; // metadata about data source
}