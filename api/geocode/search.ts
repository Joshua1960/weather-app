export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const q = req.query.q;
  if (!q || typeof q !== 'string' || q.trim().length < 2) {
    return res.status(200).json([]);
  }

  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      q.trim()
    )}&format=json&addressdetails=1&limit=8`;

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'GCIWeatherPlatform/2.0 (weather@gciweather.org)',
      },
    });

    if (!response.ok) {
      return res.status(200).json([]);
    }

    const data = await response.json();
    if (!Array.isArray(data)) return res.status(200).json([]);

    const results = data.map((item: any) => {
      const addr = item.address || {};
      const title = item.name || item.display_name.split(',')[0];
      const admin = [
        addr.suburb || addr.neighbourhood || addr.city_district || addr.road,
        addr.city || addr.town || addr.county,
        addr.state,
      ]
        .filter(Boolean)
        .filter((v, i, a) => a.indexOf(v) === i)
        .join(', ');

      return {
        name: title,
        country: addr.country || '',
        admin1: admin || addr.state || '',
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon),
        timezone: 'auto',
      };
    });

    return res.status(200).json(results);
  } catch (error: any) {
    console.warn('Geocode search proxy error:', error?.message || error);
    return res.status(200).json([]);
  }
}
