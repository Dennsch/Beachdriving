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
      dataConfig: {
        series: {
          config: {
            id: string;
            color: string;
            lineWidth: number;
            lineFill: boolean;
            lineRenderer: string;
            showPoints: boolean;
            pointFormatter: string;
          };
          yAxisDataMin: number;
          yAxisDataMax: number;
          yAxisMin: number;
          yAxisMax: number;
          groups: {
            dateTime: number;
            entries: {
              dateTime: string;
              height: number;
            }[];
          }[];
          controlPoints: TidePoint[];
        }[];
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
          temp: number;
          apparentTemp: number;
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
        }[];
      }[];
    };
  };
}

export interface SafeWindow {
  start: string;
  end: string;
  duration: string;
}

export interface LocationData {
  location: Location;
  weather: WeatherData | null;
  tides: TidePoint[];
  isSafe: boolean;
  safeWindows: SafeWindow[];
  error?: string;
}