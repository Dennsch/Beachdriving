# 🏖️ Queensland Beach Driving Safety App

A React TypeScript application that helps determine safe beach driving conditions for popular Queensland beaches by analyzing tide data and weather conditions.

## Features

- **Real-time Safety Assessment**: Determines if it's safe to drive on the beach based on tide conditions
- **Multi-location Support**: Covers three popular Queensland beaches:
  - Bribie Island
  - Moreton Island  
  - North Stradbroke Island
- **Comprehensive Weather Data**: Displays temperature, rain probability, wind conditions, and more
- **Tide Information**: Shows high/low tide times and heights
- **Safe Driving Windows**: Calculates optimal time periods for beach driving
- **Date Selection**: View conditions for future dates (through the end of next month)
- **Queensland Timezone**: All times displayed in Australian Eastern Time
- **🆕 Persistent Caching**: Local storage caching reduces API calls and improves performance
- **☕ Buy Me a Coffee**: PayPal-powered donation button to support the app's development

## Safety Rules

The app follows the **2-hour rule**: Beach driving is considered unsafe within 2 hours before or after high tide, when sand conditions are typically softer and more dangerous.

## Installation & Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure PayPal (Optional)**
   
   To enable the "Buy Me a Coffee" donation button:
   
   a. **Get PayPal Client ID**:
      - Visit [PayPal Developer Dashboard](https://developer.paypal.com/developer/applications/)
      - Create a new app or use an existing one
      - Copy your Client ID
   
   b. **Set Environment Variable**:
      ```bash
      # Copy the example environment file
      cp .env.example .env
      
      # Edit .env and replace with your PayPal Client ID
      REACT_APP_PAYPAL_CLIENT_ID=your-actual-paypal-client-id-here
      ```
   
   c. **For Testing**: Use PayPal's sandbox environment for development

3. **Start Development Server**
   ```bash
   npm start
   ```

4. **Open in Browser**
   Navigate to `http://localhost:3000`

## API Integration & Caching

This app integrates with the Willy Weather API to fetch:
- Current weather conditions
- Tide forecasts and timing
- Location-specific data

### 🚀 Smart Caching System

The application now features a sophisticated caching system that:

- **Persists data across browser sessions** using localStorage
- **Reduces API calls** by caching responses for 5 minutes
- **Automatically cleans up expired entries** to prevent storage bloat
- **Falls back to memory cache** if localStorage is unavailable
- **Provides cache statistics** for monitoring and debugging

#### Cache Features:
- ✅ **Persistent Storage**: Data survives page refreshes and browser restarts
- ✅ **Automatic Expiration**: Cached data expires after 5 minutes
- ✅ **Storage Management**: Automatically manages storage quota and cleanup
- ✅ **Fallback Support**: Uses memory cache when localStorage is unavailable
- ✅ **Debug Interface**: Toggle cache statistics display for monitoring

#### Cache Debug Panel:
Click "Show Cache Info" in the app to view:
- Total cached entries
- Expired entries count
- Storage space used
- Memory fallback status
- Manual cache clearing options

## Technology Stack

- **React 18** with TypeScript
- **date-fns** for date/time manipulation
- **axios** for API requests
- **CSS Grid & Flexbox** for responsive layout
- **Willy Weather API** for weather and tide data
- **🆕 LocalStorage API** for persistent caching
- **☕ PayPal JavaScript SDK** for donation processing

## Project Structure

```
src/
├── components/
│   ├── LocationCard.tsx          # Individual location display component
│   └── PayPalButton.tsx          # ☕ PayPal donation button component
├── services/
│   ├── willyWeatherService.ts    # API integration service with caching
│   ├── localStorageCache.ts      # 🆕 Persistent cache service
│   ├── weatherServiceFactory.ts  # Service factory pattern
│   └── safetyService.ts          # Safety calculation logic
├── types.ts                      # TypeScript type definitions
├── App.tsx                       # Main application component
├── App.css                       # Application-specific styles
├── index.tsx                     # React entry point
└── index.css                     # Global styles
```

## Usage

1. **Current Conditions**: By default, the app shows current conditions for all three beaches
2. **Date Selection**: Use the date picker to view conditions for future dates
3. **Safety Status**: Each location card shows whether it's currently safe to drive
4. **Safe Windows**: View optimal driving times for the selected day
5. **Weather Details**: Check temperature, rain probability, and wind conditions
6. **Tide Times**: See high and low tide times and heights
7. **🆕 Cache Monitoring**: Toggle cache info to monitor API usage and performance

## Performance Benefits

With the new caching system:
- **Faster Loading**: Subsequent visits load instantly from cache
- **Reduced API Usage**: Fewer API calls mean better performance and lower costs
- **Offline Resilience**: Recently viewed data remains available even with poor connectivity
- **Better User Experience**: Smooth navigation between dates and locations

## Safety Disclaimer

⚠️ **Important**: This tool provides guidance only. Always:
- Check current local conditions and weather warnings
- Follow park regulations and local authorities' advice
- Carry appropriate recovery equipment
- Inform others of your beach driving plans
- Drive at your own risk

## Development

### Available Scripts

- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm eject` - Eject from Create React App

### Adding New Locations

To add new beach locations:
1. Find the location ID from Willy Weather API
2. Add to the `LOCATIONS` object in `willyWeatherService.ts`
3. The app will automatically include the new location

### Cache Configuration

The cache system can be configured in `localStorageCache.ts`:
- `CACHE_DURATION`: How long data stays cached (default: 5 minutes)
- `MAX_STORAGE_SIZE`: Maximum localStorage usage (default: 5MB)
- `CLEANUP_INTERVAL`: How often to clean expired entries (default: 1 hour)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly (including cache functionality)
5. Submit a pull request

## License

This project is for educational and personal use. Please respect the Willy Weather API terms of service.