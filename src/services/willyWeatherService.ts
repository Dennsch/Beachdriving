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
  Bribie: 20006, // Bribie Island, QLD 
  "Moreton Island": 37401, // Moreton Island, QLD
  Straddie: 19623, // North Stradbroke Island, QLD
};

// Configure axios with timeout and retry logic
const apiClient = axios.create({
  timeout: 10000, // 10 second timeout
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

// Add request interceptor for error handling
apiClient.interceptors.request.use(
  (config) => {
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

      const url =
        process.env.NODE_ENV === "production"
          ? `${BASE_URL}/weather?locationId=${locationId}`
          : `${BASE_URL}/${API_KEY}/locations/${locationId}/weather.json`;

      const headers = {
        "Content-Type": "application/json",
        "x-payload": JSON.stringify({
          forecasts: ["tides", "weather","rainfallprobability","rainfall"],
          days: 1,
          startDate: date,
        }),
      };



      const response = await apiClient.get(url, { headers });
      
      // Log first weather entry if available for debugging
      if (response.data?.forecasts?.weather?.days?.[0]?.entries?.[0]) {
        console.log("Sample weather entry:", response.data.forecasts.weather.days[0].entries[0]);
      }

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
    combinedForecast: CombinedForecastData,
    targetDateTime: Date
  ): WeatherData | null {
    try {
      if (!combinedForecast?.forecasts?.weather?.days) {
        console.warn("Invalid weather forecast structure - missing days array");
        return null;
      }

      const targetTime = targetDateTime.getTime();
      const days = combinedForecast.forecasts.weather.days;

      for (let dayIndex = 0; dayIndex < days.length; dayIndex++) {
        const day = days[dayIndex];

        if (!day.entries || !Array.isArray(day.entries)) {
          console.warn(`Day ${dayIndex} has no valid entries`);
          continue;
        }

        for (let entryIndex = 0; entryIndex < day.entries.length; entryIndex++) {
          const entry = day.entries[entryIndex];

          if (!entry.dateTime) {
            continue;
          }

          const entryTime = new Date(entry.dateTime).getTime();
          const timeDiff = Math.abs(entryTime - targetTime);
          
          // Expand the time window to 6 hours to be more flexible
          if (timeDiff <= 6 * 60 * 60 * 1000) {
            const weatherData = this.createWeatherData(entry, combinedForecast, targetDateTime);
            return weatherData;
          }
        }
      }

      // If no exact match, return the first valid entry of the first day
      if (days.length > 0 && days[0].entries && days[0].entries.length > 0) {
        const firstEntry = days[0].entries[0];
        const weatherData = this.createWeatherData(firstEntry, combinedForecast, targetDateTime);
        return weatherData;
      }

      console.warn("No valid weather entries found in any day");
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

  private createWeatherData(entry: any, combinedForecast: CombinedForecastData, targetDateTime: Date): WeatherData {
    console.log("Creating weather data from entry:", {
      dateTime: entry.dateTime,
      availableFields: Object.keys(entry),
      temp: entry.temp,
      precis: entry.precis
    });
    
    // Check for different possible field names
    const temperature = entry.temp ?? entry.temperature ?? entry.min ?? entry.max ?? 0;
    const apparentTemperature = entry.apparentTemp ?? entry.apparentTemperature ?? entry.feelsLike ?? temperature;
    const windSpeed = entry.windSpeed ?? entry.wind_speed ?? entry.windSpeedKmh ?? 0;
    const windDirection = entry.windDirection ?? entry.wind_direction ?? entry.windDirectionDeg ?? 0;
    const windGust = entry.windGust ?? entry.wind_gust ?? entry.windGustKmh ?? windSpeed;
    const precipitationProbability = entry.precipitationProbability ?? entry.precipitation_probability ?? entry.rainChance ?? 0;
    const summary = entry.precis ?? entry.summary ?? entry.description ?? "No description available";
    const icon = entry.precisCode ?? entry.icon ?? entry.code ?? "unknown";

    // Extract rainfall information from combined forecast
    const rainfallInfo = this.extractRainfallInfo(combinedForecast, targetDateTime);

    const weatherData = {
      temperature,
      apparentTemperature,
      humidity: entry.humidity ?? entry.relativeHumidity ?? 0,
      dewPoint: entry.dewPoint ?? entry.dew_point ?? 0,
      pressure: entry.pressure ?? entry.pressureHpa ?? entry.pressureMsl ?? 0,
      windSpeed,
      windDirection,
      windGust,
      cloudCover: entry.cloudCover ?? entry.cloud_cover ?? entry.cloudiness ?? 0,
      uvIndex: entry.uvIndex ?? entry.uv_index ?? entry.uvi ?? 0,
      visibility: entry.visibility ?? entry.visibilityKm ?? 0,
      precipitationRate: entry.precipitationRate ?? entry.precipitation_rate ?? entry.rainRate ?? 0,
      precipitationProbability: rainfallInfo.detailedProbability || precipitationProbability,
      precipitationType: entry.precipitationType ?? entry.precipitation_type ?? "none",
      icon,
      summary,
      rainfallAmount: rainfallInfo.amount,
      rainfallProbabilityDetailed: rainfallInfo.detailedProbability,
    };

    console.log("Created weather data:", {
      temperature: weatherData.temperature,
      apparentTemperature: weatherData.apparentTemperature,
      summary: weatherData.summary,
      windSpeed: weatherData.windSpeed,
      precipitationProbability: weatherData.precipitationProbability,
      rainfallAmount: weatherData.rainfallAmount,
      hasValidTemp: weatherData.temperature > 0
    });
    
    return weatherData;
  }

  private extractRainfallInfo(combinedForecast: CombinedForecastData, targetDateTime: Date): {
    amount?: {
      startRange: number | null;
      endRange: number | null;
      rangeDivide: string;
      rangeCode: string;
      probability: number;
    };
    detailedProbability?: number;
  } {
    const result: any = {};

    try {
      const targetTime = targetDateTime.getTime();
      const timeWindow = 3 * 60 * 60 * 1000; // 3 hour window for matching

      // Extract detailed rainfall probability
      if (combinedForecast.forecasts.rainfallprobability?.days) {
        for (const day of combinedForecast.forecasts.rainfallprobability.days) {
          if (day.entries) {
            for (const entry of day.entries) {
              const entryTime = new Date(entry.dateTime).getTime();
              if (Math.abs(entryTime - targetTime) <= timeWindow) {
                result.detailedProbability = entry.probability;
                break;
              }
            }
          }
          if (result.detailedProbability !== undefined) break;
        }
      }

      // Extract rainfall amount information
      if (combinedForecast.forecasts.rainfall?.days) {
        for (const day of combinedForecast.forecasts.rainfall.days) {
          if (day.entries) {
            for (const entry of day.entries) {
              const entryTime = new Date(entry.dateTime).getTime();
              // Use a wider time window for daily rainfall data
              if (Math.abs(entryTime - targetTime) <= 12 * 60 * 60 * 1000) {
                result.amount = {
                  startRange: entry.startRange,
                  endRange: entry.endRange,
                  rangeDivide: entry.rangeDivide,
                  rangeCode: entry.rangeCode,
                  probability: entry.probability,
                };
                break;
              }
            }
          }
          if (result.amount) break;
        }
      }

      console.log("Extracted rainfall info:", result);
    } catch (error) {
      console.error("Error extracting rainfall info:", error);
    }

    return result;
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
