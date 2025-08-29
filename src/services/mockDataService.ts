import { Location, WeatherData, TidePoint, WeatherForecast, TideData, CombinedForecastData } from '../types';
import { addHours, startOfDay } from 'date-fns';

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
      name: 'Bribie Island',
      region: 'Moreton Bay',
      state: 'QLD',
      postcode: '4507',
      timeZone: 'Australia/Brisbane',
      lat: -27.0833,
      lng: 153.1667,
      typeId: 2
    },
    4990: {
      id: 4990,
      name: 'Moreton Island',
      region: 'Moreton Bay',
      state: 'QLD',
      postcode: '4025',
      timeZone: 'Australia/Brisbane',
      lat: -27.1667,
      lng: 153.4000,
      typeId: 2
    },
    4989: {
      id: 4989,
      name: 'North Stradbroke Island',
      region: 'Redland City',
      state: 'QLD',
      postcode: '4183',
      timeZone: 'Australia/Brisbane',
      lat: -27.5000,
      lng: 153.4167,
      typeId: 2
    }
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

  async getWeatherForecast(locationId: number, date: string): Promise<WeatherForecast> {
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
          days: [{
            dateTime: date + 'T00:00:00+10:00',
            entries: [{
              dateTime: date + 'T12:00:00+10:00',
              precisCode: 'partly-cloudy',
              precis: 'Partly cloudy with light winds',
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
              precipitationType: rainChance > 20 ? 'rain' : 'none'
            }]
          }],
          units: {
            temperature: 'c'
          },
          issueDateTime: new Date().toISOString()
        }
      }
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
    const tidePoints = this.generateTidePoints(dayStart);

    const mockTideData: TideData = {
      location,
      forecasts: {
        tides: {
          days: [{
            dateTime: date + 'T00:00:00+10:00',
            entries: tidePoints
          }],
          units: {
            height: 'm'
          },
          issueDateTime: new Date().toISOString(),
          carousel: {
            size: 1,
            start: 0
          }
        }
      }
    };

    return mockTideData;
  }

  private generateTidePoints(dayStart: Date): TidePoint[] {
    const tidePoints: TidePoint[] = [];
    
    // Typical Queensland beach tide pattern: 2 high tides and 2 low tides per day
    // High tides around 6am and 6pm, low tides around 12pm and 12am
    
    // First high tide (early morning)
    const firstHigh = addHours(dayStart, 6 + Math.random() * 2); // 6-8am
    tidePoints.push({
      dateTime: firstHigh.toISOString(),
      height: 1.8 + Math.random() * 0.6, // 1.8-2.4m
      type: 'high'
    });

    // First low tide (midday)
    const firstLow = addHours(dayStart, 12 + Math.random() * 2); // 12-2pm
    tidePoints.push({
      dateTime: firstLow.toISOString(),
      height: 0.2 + Math.random() * 0.4, // 0.2-0.6m
      type: 'low'
    });

    // Second high tide (evening)
    const secondHigh = addHours(dayStart, 18 + Math.random() * 2); // 6-8pm
    tidePoints.push({
      dateTime: secondHigh.toISOString(),
      height: 1.7 + Math.random() * 0.7, // 1.7-2.4m
      type: 'high'
    });

    // Second low tide (late night - next day)
    const secondLow = addHours(dayStart, 24 + Math.random() * 2); // 12-2am next day
    tidePoints.push({
      dateTime: secondLow.toISOString(),
      height: 0.1 + Math.random() * 0.5, // 0.1-0.6m
      type: 'low'
    });

    return tidePoints.sort((a, b) => 
      new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()
    );
  }

  extractCurrentWeather(combinedForecast: CombinedForecastData, targetDateTime: Date): WeatherData | null {
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
      rainfallAmount: (entry.precipitationProbability ?? 0) > 0 ? {
        startRange: 0,
        endRange: 5,
        rangeDivide: "<",
        rangeCode: "0",
        probability: entry.precipitationProbability ?? 0
      } : undefined,
      rainfallProbabilityDetailed: entry.precipitationProbability
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
      'Bribie Island': 4988,
      'Moreton Island': 4990,
      'North Stradbroke Island': 4989
    };
  }

  getLocationNames(): string[] {
    return Object.keys(this.getLocationIds());
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}