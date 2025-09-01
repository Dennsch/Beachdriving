import {
  Location,
  WeatherData,
  TidePoint,
  WeatherForecast,
  TideData,
  CombinedForecastData,
  DataSourceInfo,
} from "../types";
import { addHours, startOfDay } from "date-fns";

export class MockDataService {
  private static instance: MockDataService;

  public static getInstance(): MockDataService {
    if (!MockDataService.instance) {
      MockDataService.instance = new MockDataService();
    }
    return MockDataService.instance;
  }

  private locations: { [key: number]: Location } = {
    4988: {
      id: 4988,
      name: "Bribie Island",
      region: "Moreton Bay",
      state: "QLD",
      postcode: "4507",
      timeZone: "Australia/Brisbane",
      lat: -27.0833,
      lng: 153.1667,
      typeId: 2,
    },
    4990: {
      id: 4990,
      name: "Moreton Island",
      region: "Moreton Bay",
      state: "QLD",
      postcode: "4025",
      timeZone: "Australia/Brisbane",
      lat: -27.1667,
      lng: 153.4,
      typeId: 2,
    },
    4989: {
      id: 4989,
      name: "North Stradbroke Island",
      region: "Redland City",
      state: "QLD",
      postcode: "4183",
      timeZone: "Australia/Brisbane",
      lat: -27.5,
      lng: 153.4167,
      typeId: 2,
    },
  };

  async getLocation(locationId: number): Promise<Location> {
    // Simulate API delay
    await this.delay(500);

    const location = this.locations[locationId];
    if (!location) {
      throw new Error(`Location ${locationId} not found`);
    }

    return location;
  }

  async getWeatherForecast(
    locationId: number,
    date: string
  ): Promise<WeatherForecast> {
    await this.delay(800);

    const location = this.locations[locationId];
    if (!location) {
      throw new Error(`Location ${locationId} not found`);
    }

    // Generate mock weather data
    const baseTemp = 22 + Math.random() * 8; // 22-30°C
    const humidity = 60 + Math.random() * 30; // 60-90%
    const windSpeed = 5 + Math.random() * 15; // 5-20 km/h
    const rainChance = Math.floor(Math.random() * 40); // 0-40%

    const mockWeatherForecast: WeatherForecast = {
      location,
      forecasts: {
        weather: {
          days: [
            {
              dateTime: date + "T00:00:00+10:00",
              entries: [
                {
                  dateTime: date + "T12:00:00+10:00",
                  precisCode: "partly-cloudy",
                  precis: "Partly cloudy with light winds",
                  precisOverlayCode: null,
                  night: false,
                  min: Math.round(baseTemp - 3),
                  max: Math.round(baseTemp + 5),
                  temp: Math.round(baseTemp),
                  apparentTemp: Math.round(baseTemp + 2),
                  humidity: Math.round(humidity),
                  dewPoint: Math.round(baseTemp - 5),
                  pressure: 1013 + Math.random() * 20,
                  windSpeed: Math.round(windSpeed),
                  windDirection: Math.floor(Math.random() * 360),
                  windGust: Math.round(windSpeed * 1.5),
                  cloudCover: Math.floor(Math.random() * 80),
                  uvIndex: Math.floor(Math.random() * 10),
                  visibility: 10 + Math.random() * 5,
                  precipitationRate: 0,
                  precipitationProbability: rainChance,
                  precipitationType: rainChance > 20 ? "rain" : "none",
                },
              ],
            },
          ],
          units: {
            temperature: "c",
          },
          issueDateTime: new Date().toISOString(),
        },
      },
    };

    return mockWeatherForecast;
  }

  async getTideForecast(locationId: number, date: string): Promise<TideData> {
    await this.delay(600);

    const location = this.locations[locationId];
    if (!location) {
      throw new Error(`Location ${locationId} not found`);
    }

    // Generate realistic tide data for Queensland beaches
    const dayStart = startOfDay(new Date(date));
    const tidePoints = this.generateTidePoints(dayStart, locationId);

    const mockTideData: TideData = {
      location,
      forecasts: {
        tides: {
          days: [
            {
              dateTime: date + "T00:00:00+10:00",
              entries: tidePoints,
            },
          ],
          units: {
            height: "m",
          },
          issueDateTime: new Date().toISOString(),
          carousel: {
            size: 1,
            start: 0,
          },
        },
      },
    };

    return mockTideData;
  }

  async getCombinedForecast(
    locationId: number,
    date: string
  ): Promise<{ data: CombinedForecastData; dataSource: DataSourceInfo }> {
    await this.delay(700);

    const location = this.locations[locationId];
    if (!location) {
      throw new Error(`Location ${locationId} not found`);
    }

    // Get both weather and tide data
    const weatherForecast = await this.getWeatherForecast(locationId, date);
    const tideForecast = await this.getTideForecast(locationId, date);

    const combinedData: CombinedForecastData = {
      location,
      forecasts: {
        weather: weatherForecast.forecasts.weather,
        tides: tideForecast.forecasts.tides,
      },
    };

    const now = Date.now();
    const dataSource: DataSourceInfo = {
      isLive: true, // Mock service simulates live data
      fetchedAt: now,
      retrievedAt: now,
      cacheUsed: false,
      isFallback: false,
    };

    return { data: combinedData, dataSource };
  }

  private generateTidePoints(dayStart: Date, locationId: number): TidePoint[] {
    const tidePoints: TidePoint[] = [];
    // Use current time to calculate relative tide positions
    const now = new Date();
    const currentHour = now.getHours();

    // Check if we're generating tides for today
    const isToday = dayStart.toDateString() === now.toDateString();

    // Generate different tide patterns for each location to ensure all safety states
    let highTideHours: number[];

    if (isToday) {
      // For today, use current time as reference to create different safety states
      switch (locationId) {
        case 4988: // Bribie Island - UNSAFE (high tide within 2 hours)
          // Set high tide close to current time to make it unsafe
          highTideHours = [currentHour + 1, currentHour + 13]; // 1 hour from now, and 12 hours later
          console.log(
            "🔴 Mock: Bribie Island set to UNSAFE - high tide in 1 hour"
          );
          break;

        case 4990: // Moreton Island - HURRY (high tide in 2.5 hours)
          // Set high tide in hurry window (2-3 hours from now)
          highTideHours = [currentHour + 3, currentHour + 14.5]; // 2.5 hours from now
          console.log(
            "🟡 Mock: Moreton Island set to HURRY - high tide in 2.5 hours"
          );
          break;

        case 4989: // North Stradbroke Island - SAFE (high tide far away)
          // Set high tide well outside unsafe window (5+ hours away)
          highTideHours = [currentHour + 6, currentHour + 18]; // 6 hours from now
          console.log(
            "🟢 Mock: North Stradbroke Island set to SAFE - high tide in 6 hours"
          );
          break;

        default:
          highTideHours = [6, 18]; // Default pattern
      }
    } else {
      // For other dates, use standard tide patterns
      switch (locationId) {
        case 4988: // Bribie Island
          highTideHours = [7, 19]; // 7am and 7pm
          break;
        case 4990: // Moreton Island
          highTideHours = [8, 20]; // 8am and 8pm
          break;
        case 4989: // North Stradbroke Island
          highTideHours = [6, 18]; // 6am and 6pm
          break;
        default:
          highTideHours = [6, 18]; // Default pattern
      }
    }

    // Generate tide points based on the calculated hours
    highTideHours.forEach((hour, index) => {
      // Normalize hour to 0-23 range
      const normalizedHour = hour % 24;
      const tideDate = addHours(dayStart, normalizedHour);

      // High tide
      tidePoints.push({
        dateTime: tideDate.toISOString(),
        height: 1.8 + Math.random() * 0.6, // 1.8-2.4m
        type: "high",
      });

      // Low tide (6 hours after high tide)
      const lowTideDate = addHours(tideDate, 6);
      tidePoints.push({
        dateTime: lowTideDate.toISOString(),
        height: 0.2 + Math.random() * 0.4, // 0.2-0.6m
        type: "low",
      });
    });

    return tidePoints.sort(
      (a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()
    );
  }

  extractCurrentWeather(
    combinedForecast: CombinedForecastData,
    targetDateTime: Date
  ): WeatherData | null {
    if (!combinedForecast?.forecasts?.weather?.days?.[0]?.entries?.[0]) {
      return null;
    }

    const entry = combinedForecast.forecasts.weather.days[0].entries[0];
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
      // Mock rainfall data for testing
      rainfallAmount:
        (entry.precipitationProbability ?? 0) > 0
          ? {
              startRange: 0,
              endRange: 5,
              rangeDivide: "<",
              rangeCode: "0",
              probability: entry.precipitationProbability ?? 0,
            }
          : undefined,
      rainfallProbabilityDetailed: entry.precipitationProbability,
    };
  }

  extractTidePoints(tideData: TideData): TidePoint[] {
    if (!tideData?.forecasts?.tides?.days?.[0]?.entries) {
      return [];
    }

    return tideData.forecasts.tides.days[0].entries;
  }

  getLocationIds(): { [key: string]: number } {
    return {
      "Bribie Island": 4988,
      "Moreton Island": 4990,
      "North Stradbroke Island": 4989,
    };
  }

  getLocationNames(): string[] {
    return Object.keys(this.getLocationIds());
  }

  // Cache management methods (no-op for mock service)
  clearCache(): void {
    console.log("🧹 Mock service: Cache clear requested (no-op)");
  }

  removeCacheEntry(locationId: number, date: string): void {
    console.log(
      `🗑️ Mock service: Remove cache entry requested for location ${locationId}, date ${date} (no-op)`
    );
  }

  getCacheStats(): any {
    return {
      totalEntries: 0,
      expiredEntries: 0,
      storageUsed: 0,
      memoryFallbackActive: false,
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
