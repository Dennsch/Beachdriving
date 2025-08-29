export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-payload'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { locationId, ...params } = req.query;
  const headers = req.headers;
  
  try {
    const API_KEY = "ZWY2Y2FlZmZlNzQ0NzZhYzI4ZDNiNG";
    const targetUrl = `https://api.willyweather.com.au/v2/${API_KEY}/locations/${locationId}/weather.json`;
    
    // Forward the request to WillyWeather API
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'x-payload': headers['x-payload'] || '',
        'Accept': 'application/json'
      }
    });

    const data = await response.json();
    
    if (!response.ok) {
      return res.status(response.status).json({ error: data });
    }

    res.status(200).json(data);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
}