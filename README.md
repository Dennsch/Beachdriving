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
- **Date Selection**: View conditions for future dates (up to 7 days ahead)
- **Queensland Timezone**: All times displayed in Australian Eastern Time

## Safety Rules

The app follows the **2-hour rule**: Beach driving is considered unsafe within 2 hours before or after high tide, when sand conditions are typically softer and more dangerous.

## Installation & Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm start
   ```

3. **Open in Browser**
   Navigate to `http://localhost:3000`

## API Integration

This app integrates with the Willy Weather API to fetch:
- Current weather conditions
- Tide forecasts and timing
- Location-specific data

The API key is embedded in the application for the specified locations.

## Technology Stack

- **React 18** with TypeScript
- **date-fns** for date/time manipulation
- **axios** for API requests
- **CSS Grid & Flexbox** for responsive layout
- **Willy Weather API** for weather and tide data

## Project Structure

```
src/
├── components/
│   └── LocationCard.tsx      # Individual location display component
├── services/
│   ├── willyWeatherService.ts # API integration service
│   └── safetyService.ts       # Safety calculation logic
├── types.ts                   # TypeScript type definitions
├── App.tsx                    # Main application component
├── App.css                    # Application-specific styles
├── index.tsx                  # React entry point
└── index.css                  # Global styles
```

## Usage

1. **Current Conditions**: By default, the app shows current conditions for all three beaches
2. **Date Selection**: Use the date picker to view conditions for future dates
3. **Safety Status**: Each location card shows whether it's currently safe to drive
4. **Safe Windows**: View optimal driving times for the selected day
5. **Weather Details**: Check temperature, rain probability, and wind conditions
6. **Tide Times**: See high and low tide times and heights

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

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is for educational and personal use. Please respect the Willy Weather API terms of service.