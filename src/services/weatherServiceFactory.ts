import { WillyWeatherService } from './willyWeatherService';
import { MockDataService } from './mockDataService';
import { DataSourceInfo } from '../types';

export interface WeatherServiceInterface {
  getCombinedForecast(locationId: number, date: string): Promise<{ data: any; dataSource: DataSourceInfo }>;
  extractCurrentWeather(combinedForecast: any, targetDateTime: Date): any;
  extractTidePoints(tideData: any): any[];
  getLocationIds(): { [key: string]: number };
  getLocationNames(): string[];
}

export class WeatherServiceFactory {
  static getWeatherService(): WeatherServiceInterface {
    const useMockData = process.env.REACT_APP_USE_MOCK_DATA === 'true';
    
    if (useMockData) {
      console.log('🔧 Using Mock Data Service');
      return MockDataService.getInstance() as WeatherServiceInterface;
    } else {
      console.log('🌐 Using WillyWeather API Service');
      return WillyWeatherService.getInstance();
    }
  }
}