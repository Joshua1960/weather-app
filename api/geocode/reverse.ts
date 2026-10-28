export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const lat = req.query.lat;
    const lon = req.query.lon;
    if (!lat || !lon) {
      return res.status(400).json({ error: 'lat and lon are required' });
    }

    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&zoom=16&format=json`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'GCIWeatherPlatform/2.0 (weather@gciweather.org)',
      },
    });

    if (!response.ok) {
      throw new Error(`Nominatim error: ${response.status}`);
    }

    const data = await response.json();
    const addr = data.address || {};

    const specific =
      addr.neighbourhood ||
      addr.suburb ||
      addr.quarter ||
      addr.residential ||
      addr.borough ||
      addr.district ||
      addr.road;

    const area =
      addr.city ||
      addr.town ||
      addr.village ||
      addr.municipality ||
      addr.county;

    let nichedName = '';
    if (specific && area && specific.toLowerCase() !== area.toLowerCase()) {
      nichedName = `${specific}, ${area}`;
    } else if (area) {
      nichedName = area;
    } else if (specific) {
      nichedName = specific;
    } else if (data.name) {
      nichedName = data.name;
    } else {
      nichedName = addr.state || addr.country || 'Local Area';
    }

    return res.status(200).json({
      name: nichedName,
      country: addr.country || '',
      admin1: addr.state || addr.province || addr.region || '',
      latitude: parseFloat(lat),
      longitude: parseFloat(lon),
      timezone: 'auto',
    });
  } catch (error: any) {
    console.warn('Vercel reverse geocode error:', error?.message || error);
    return res.status(200).json({
      name: 'Local Area',
      country: '',
      latitude: parseFloat(req.query.lat || '0'),
      longitude: parseFloat(req.query.lon || '0'),
      timezone: 'auto',
    });
  }
}
