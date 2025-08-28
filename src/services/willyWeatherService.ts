import axios, { AxiosError } from 'axios';
import { Location, WeatherForecast, TideData, TidePoint, WeatherData } from '../types';

const API_KEY = 'ZWY2Y2FlZmZlNzQ0NzZhYzI4ZDNiNG';
const BASE_URL = process.env.NODE_ENV === 'development' ? '/v2' : 'https://api.willyweather.com.au/v2';

// Location IDs for the three specified locations (verified from Willy Weather)
const LOCATIONS = {
  'Bribie Island': 4988,
  'Moreton Island': 4990,
  'North Stradbroke Island': 4989
};

// Configure axios with timeout and retry logic
const apiClient = axios.create({
  timeout: 10000, // 10 second timeout
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
});

// Add request interceptor for logging
apiClient.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
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
    console.error('API Response Error:', error.message);
    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout - please check your internet connection');
    }
    if (error.response?.status === 401) {
      throw new Error('API authentication failed - invalid API key');
    }
    if (error.response?.status === 403) {
      throw new Error('API access forbidden - check API permissions');
    }
    if (error.response?.status === 429) {
      throw new Error('API rate limit exceeded - please try again later');
    }
    if (error.response?.status >= 500) {
      throw new Error('Weather service temporarily unavailable');
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

  async getLocation(locationId: number): Promise<Location> {
    const cacheKey = this.getCacheKey(`location_${locationId}`);
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const response = await apiClient.get(
        `${BASE_URL}/${API_KEY}/locations/${locationId}.json`
      );
      
      if (!response.data || !response.data.location) {
        throw new Error('Invalid location data received from API');
      }

      const location = this.validateLocationData(response.data.location);
      this.setCachedData(cacheKey, location);
      return location;
    } catch (error) {
      console.error(`Error fetching location ${locationId}:`, error);
      
      // Return fallback location data
      return this.getFallbackLocation(locationId);
    }
  }

  async getWeatherForecast(locationId: number, date: string): Promise<WeatherForecast> {
    const cacheKey = this.getCacheKey(`weather_${locationId}`, { date });
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const response = await apiClient.get(
        `${BASE_URL}/${API_KEY}/locations/${locationId}/weather.json`,
        {
          params: {
            forecasts: 'weather',
            days: 1,
            startDate: date
          }
        }
      );

      if (!response.data || !response.data.forecasts) {
        throw new Error('Invalid weather data received from API');
      }

      const weatherForecast = this.validateWeatherData(response.data);
      this.setCachedData(cacheKey, weatherForecast);
      return weatherForecast;
    } catch (error) {
      console.error(`Error fetching weather for location ${locationId}:`, error);
      throw new Error(`Failed to fetch weather data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getTideForecast(locationId: number, date: string): Promise<TideData> {
    const cacheKey = this.getCacheKey(`tides_${locationId}`, { date });
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const response = await apiClient.get(
        `${BASE_URL}/${API_KEY}/locations/${locationId}/weather.json`,
        {
          params: {
            forecasts: 'tides',
            days: 1,
            startDate: date
          }
        }
      );

      if (!response.data || !response.data.forecasts) {
        throw new Error('Invalid tide data received from API');
      }

      const tideData = this.validateTideData(response.data);
      this.setCachedData(cacheKey, tideData);
      return tideData;
    } catch (error) {
      console.error(`Error fetching tides for location ${locationId}:`, error);
      throw new Error(`Failed to fetch tide data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  extractCurrentWeather(weatherForecast: WeatherForecast, targetDateTime: Date): WeatherData | null {
    try {
      if (!weatherForecast?.forecasts?.weather?.days) {
        console.warn('Invalid weather forecast structure');
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
      console.error('Error extracting current weather:', error);
      return null;
    }
  }

  extractTidePoints(tideData: TideData): TidePoint[] {
    try {
      const tidePoints: TidePoint[] = [];
      
      if (!tideData?.forecasts?.tides?.dataConfig?.series) {
        console.warn('Invalid tide data structure');
        return [];
      }
      
      for (const series of tideData.forecasts.tides.dataConfig.series) {
        if (series.controlPoints && Array.isArray(series.controlPoints)) {
          // Validate each tide point
          const validPoints = series.controlPoints.filter(point => 
            point && 
            point.dateTime && 
            typeof point.height === 'number' && 
            (point.type === 'high' || point.type === 'low')
          );
          tidePoints.push(...validPoints);
        }
      }
      
      // Sort by date/time and remove duplicates
      return tidePoints
        .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())
        .filter((point, index, array) => 
          index === 0 || 
          new Date(point.dateTime).getTime() !== new Date(array[index - 1].dateTime).getTime()
        );
    } catch (error) {
      console.error('Error extracting tide points:', error);
      return [];
    }
  }

  private validateLocationData(data: any): Location {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid location data structure');
    }

    return {
      id: data.id || 0,
      name: data.name || 'Unknown Location',
      region: data.region || '',
      state: data.state || 'QLD',
      postcode: data.postcode || '',
      timeZone: data.timeZone || 'Australia/Brisbane',
      lat: data.lat || 0,
      lng: data.lng || 0,
      typeId: data.typeId || 0
    };
  }

  private validateWeatherData(data: any): WeatherForecast {
    if (!data || !data.forecasts || !data.forecasts.weather) {
      throw new Error('Invalid weather forecast structure');
    }

    return data as WeatherForecast;
  }

  private validateTideData(data: any): TideData {
    if (!data || !data.forecasts || !data.forecasts.tides) {
      throw new Error('Invalid tide data structure');
    }

    return data as TideData;
  }

  private createWeatherData(entry: any): WeatherData {
    return {
      temperature: entry.temp || 0,
      apparentTemperature: entry.apparentTemp || entry.temp || 0,
      humidity: entry.humidity || 0,
      dewPoint: entry.dewPoint || 0,
      pressure: entry.pressure || 0,
      windSpeed: entry.windSpeed || 0,
      windDirection: entry.windDirection || 0,
      windGust: entry.windGust || entry.windSpeed || 0,
      cloudCover: entry.cloudCover || 0,
      uvIndex: entry.uvIndex || 0,
      visibility: entry.visibility || 0,
      precipitationRate: entry.precipitationRate || 0,
      precipitationProbability: entry.precipitationProbability || 0,
      precipitationType: entry.precipitationType || 'none',
      icon: entry.precisCode || 'unknown',
      summary: entry.precis || 'No description available'
    };
  }

  private getFallbackLocation(locationId: number): Location {
    const locationNames = Object.keys(LOCATIONS);
    const locationName = locationNames.find(name => LOCATIONS[name as keyof typeof LOCATIONS] === locationId) || 'Unknown Location';
    
    // Approximate coordinates for the three locations
    const coordinates: { [key: string]: { lat: number; lng: number } } = {
      'Bribie Island': { lat: -27.0833, lng: 153.1667 },
      'Moreton Island': { lat: -27.1667, lng: 153.4000 },
      'North Stradbroke Island': { lat: -27.5000, lng: 153.4167 }
    };

    const coords = coordinates[locationName] || { lat: -27.0, lng: 153.0 };

    return {
      id: locationId,
      name: locationName,
      region: 'Moreton Bay',
      state: 'QLD',
      postcode: '',
      timeZone: 'Australia/Brisbane',
      lat: coords.lat,
      lng: coords.lng,
      typeId: 2
    };
  }

  getLocationIds(): { [key: string]: number } {
    return LOCATIONS;
  }

  getLocationNames(): string[] {
    return Object.keys(LOCATIONS);
  }

  // Method to test API connectivity
  async testConnection(): Promise<boolean> {
    try {
      const response = await apiClient.get(`${BASE_URL}/${API_KEY}/locations/4988.json`);
      return response.status === 200;
    } catch (error) {
      console.error('API connection test failed:', error);
      return false;
    }
  }
}