import axios, { AxiosError } from "axios";
import {
  WeatherForecast,
  TideData,
  TidePoint,
  WeatherData,
  CombinedForecastData,
} from "../types";

const API_KEY = "ZWY2Y2FlZmZlNzQ0NzZhYzI4ZDNiNG";
// Use Vercel API routes for production, proxy for development
const BASE_URL = process.env.NODE_ENV === "production" ? "/api" : "/v2";

// Correct Queensland beach location IDs from WillyWeather API
const LOCATIONS = {
  "Bribie Island": 20006, // Bribie Island, QLD
  "Moreton Island": 20007, // Moreton Island, QLD
  "North Stradbroke Island": 8624, // North Stradbroke Island, QLD
};

// Configure axios with timeout and retry logic
const apiClient = axios.create({
  timeout: 10000, // 10 second timeout
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

// Add request interceptor for logging
apiClient.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error("API Request Error:", error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error: AxiosError) => {
    console.error("API Response Error:", error.message);
    if (error.code === "ECONNABORTED") {
      throw new Error(
        "Request timeout - please check your internet connection"
      );
    }
    if (error.response?.status === 401) {
      throw new Error("API authentication failed - invalid API key");
    }
    if (error.response?.status === 403) {
      throw new Error("API access forbidden - check API permissions");
    }
    if (error.response?.status === 429) {
      throw new Error("API rate limit exceeded - please try again later");
    }
    if (error.response?.status && error.response.status >= 500) {
      throw new Error("Weather service temporarily unavailable");
    }
    throw error;
  }
);

export class WillyWeatherService {
  private static instance: WillyWeatherService;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  public static getInstance(): WillyWeatherService {
    if (!WillyWeatherService.instance) {
      WillyWeatherService.instance = new WillyWeatherService();
    }
    return WillyWeatherService.instance;
  }

  private getCacheKey(endpoint: string, params?: any): string {
    return `${endpoint}_${JSON.stringify(params || {})}`;
  }

  private getCachedData(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log(`Cache hit for: ${key}`);
      return cached.data;
    }
    return null;
  }

  private setCachedData(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  async getCombinedForecast(
    locationId: number,
    date: string
  ): Promise<CombinedForecastData> {
    const cacheKey = this.getCacheKey(`combined_${locationId}`, { date });
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      console.log(
        `Fetching combined forecast for location ${locationId}, date: ${date}`
      );
      const url =
        process.env.NODE_ENV === "production"
          ? `${BASE_URL}/weather?locationId=${locationId}`
          : `${BASE_URL}/${API_KEY}/locations/${locationId}/weather.json`;

      const headers = {
        "Content-Type": "application/json",
        "x-payload": JSON.stringify({
          forecasts: ["tides", "weather"],
          days: 1,
          startDate: date,
        }),
      };

      console.log(`Combined API URL: ${url}`, "Headers:", headers);

      const response = await apiClient.get(url, { headers });
      console.log(`Combined API response:`, response.data);

      if (!response.data || !response.data.forecasts) {
        throw new Error("Invalid combined forecast data received from API");
      }

      const combinedData = this.validateCombinedData(response.data);
      this.setCachedData(cacheKey, combinedData);
      return combinedData;
    } catch (error) {
      console.error(
        `Error fetching combined forecast for location ${locationId}:`,
        error
      );
      if (error instanceof AxiosError) {
        console.error("Combined API error details:", {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          url: error.config?.url,
          headers: error.config?.headers,
        });
      }
      throw new Error(
        `Failed to fetch combined forecast data: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async getWeatherForecast(
    locationId: number,
    date: string
  ): Promise<WeatherForecast> {
    // Use the combined forecast and extract weather data
    const combinedData = await this.getCombinedForecast(locationId, date);

    if (!combinedData.forecasts.weather) {
      throw new Error("No weather data available in combined forecast");
    }

    return {
      location: combinedData.location,
      forecasts: {
        weather: combinedData.forecasts.weather,
      },
    } as WeatherForecast;
  }

  async getTideForecast(locationId: number, date: string): Promise<TideData> {
    // Use the combined forecast and extract tide data
    const combinedData = await this.getCombinedForecast(locationId, date);

    if (!combinedData.forecasts.tides) {
      throw new Error(
        `No tide data available for location ${locationId} from WillyWeather API`
      );
    }

    return {
      location: combinedData.location,
      forecasts: {
        tides: combinedData.forecasts.tides,
      },
    } as TideData;
  }

  extractCurrentWeather(
    weatherForecast: WeatherForecast,
    targetDateTime: Date
  ): WeatherData | null {
    try {
      if (!weatherForecast?.forecasts?.weather?.days) {
        console.warn("Invalid weather forecast structure");
        return null;
      }

      const targetTime = targetDateTime.getTime();
      const days = weatherForecast.forecasts.weather.days;

      for (const day of days) {
        if (!day.entries || !Array.isArray(day.entries)) continue;

        for (const entry of day.entries) {
          if (!entry.dateTime) continue;

          const entryTime = new Date(entry.dateTime).getTime();
          // Find the closest entry within 3 hours
          if (Math.abs(entryTime - targetTime) <= 3 * 60 * 60 * 1000) {
            return this.createWeatherData(entry);
          }
        }
      }

      // If no exact match, return the first valid entry of the day
      if (days.length > 0 && days[0].entries && days[0].entries.length > 0) {
        return this.createWeatherData(days[0].entries[0]);
      }

      return null;
    } catch (error) {
      console.error("Error extracting current weather:", error);
      return null;
    }
  }

  extractTidePoints(tideData: TideData): TidePoint[] {
    try {
      const tidePoints: TidePoint[] = [];

      if (!tideData?.forecasts?.tides?.days) {
        console.warn("Invalid tide data structure - no days array found");
        return [];
      }

      // Extract tide points from days array
      for (const day of tideData.forecasts.tides.days) {
        if (day.entries && Array.isArray(day.entries)) {
          // Validate each tide point
          const validPoints = day.entries.filter(
            (point) =>
              point &&
              point.dateTime &&
              typeof point.height === "number" &&
              (point.type === "high" || point.type === "low")
          );
          tidePoints.push(...validPoints);
        }
      }

      // Sort by date/time and remove duplicates
      return tidePoints
        .sort(
          (a, b) =>
            new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()
        )
        .filter(
          (point, index, array) =>
            index === 0 ||
            new Date(point.dateTime).getTime() !==
              new Date(array[index - 1].dateTime).getTime()
        );
    } catch (error) {
      console.error("Error extracting tide points:", error);
      return [];
    }
  }

  private validateCombinedData(data: any): CombinedForecastData {
    if (!data || !data.forecasts) {
      throw new Error("Invalid combined forecast structure");
    }

    // Validate that we have at least one forecast type
    if (!data.forecasts.weather && !data.forecasts.tides) {
      throw new Error("No weather or tide data found in combined forecast");
    }

    return data as CombinedForecastData;
  }

  private createWeatherData(entry: any): WeatherData {
    return {
      temperature: entry.temp ?? 0,
      apparentTemperature: entry.apparentTemp ?? entry.temp ?? 0,
      humidity: entry.humidity ?? 0,
      dewPoint: entry.dewPoint ?? 0,
      pressure: entry.pressure ?? 0,
      windSpeed: entry.windSpeed ?? 0,
      windDirection: entry.windDirection ?? 0,
      windGust: entry.windGust ?? entry.windSpeed ?? 0,
      cloudCover: entry.cloudCover ?? 0,
      uvIndex: entry.uvIndex ?? 0,
      visibility: entry.visibility ?? 0,
      precipitationRate: entry.precipitationRate ?? 0,
      precipitationProbability: entry.precipitationProbability ?? 0,
      precipitationType: entry.precipitationType ?? "none",
      icon: entry.precisCode ?? "unknown",
      summary: entry.precis ?? "No description available",
    };
  }

  getLocationIds(): { [key: string]: number } {
    return LOCATIONS;
  }

  getLocationNames(): string[] {
    return Object.keys(LOCATIONS);
  }

  // Method to search for locations by name
  async searchLocations(query: string): Promise<any[]> {
    try {
      console.log(`Searching for locations: ${query}`);
      const searchUrl =
        process.env.NODE_ENV === "production"
          ? `${BASE_URL}/search?query=${encodeURIComponent(query)}`
          : `${BASE_URL}/${API_KEY}/search.json?query=${encodeURIComponent(
              query
            )}`;

      const response = await apiClient.get(searchUrl);
      console.log("Search results:", response.data);
      return response.data || [];
    } catch (error) {
      console.error("Location search failed:", error);
      return [];
    }
  }

  // Method to test the new combined API format
  async testCombinedAPI(): Promise<boolean> {
    try {
      console.log("Testing combined API format...");
      const testLocationId = 6720; // Bribie Island
      const testDate = new Date().toISOString().split("T")[0]; // Today's date

      const combinedData = await this.getCombinedForecast(
        testLocationId,
        testDate
      );

      console.log("Combined API test successful:", {
        location: combinedData.location?.name,
        hasWeather: !!combinedData.forecasts?.weather,
        hasTides: !!combinedData.forecasts?.tides,
        weatherDays: combinedData.forecasts?.weather?.days?.length || 0,
        tideDays: combinedData.forecasts?.tides?.days?.length || 0,
      });

      return true;
    } catch (error) {
      console.error("Combined API test failed:", error);
      return false;
    }
  }

  // Method to test API connectivity
  async testConnection(): Promise<boolean> {
    try {
      console.log("Testing API connection...");
      console.log("Base URL:", BASE_URL);
      console.log("Environment:", process.env.NODE_ENV);

      const testUrl =
        process.env.NODE_ENV === "production"
          ? `${BASE_URL}/location?locationId=6720`
          : `${BASE_URL}/${API_KEY}/locations/6720.json`;
      console.log("Test URL:", testUrl);

      const response = await apiClient.get(testUrl);
      console.log("API test successful:", response.data);
      return response.status === 200;
    } catch (error) {
      console.error("API connection test failed:", error);
      if (error instanceof AxiosError) {
        console.error("Error details:", {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          url: error.config?.url,
          message: error.message,
          code: error.code,
        });
      }
      return false;
    }
  }
}
