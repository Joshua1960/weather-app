export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const lat = req.query.lat;
  const lon = req.query.lon;
  if (!lat || !lon) {
    return res.status(400).json({ error: 'lat and lon are required' });
  }

  const parsedLat = parseFloat(lat);
  const parsedLon = parseFloat(lon);

  // 1. Try Nominatim with street-level precision (zoom=18) and proper User-Agent
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&zoom=18&format=json&addressdetails=1`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'GCIWeatherPlatform/2.0 (weather@gciweather.org)',
      },
    });

    if (response.ok) {
      const data = await response.json();
      const addr = data.address || {};

      // Identify the most specific pinpoint landmark, road, building, or neighborhood
      const pinpoint =
        data.name ||
        addr.amenity ||
        addr.building ||
        addr.road ||
        addr.pedestrian ||
        addr.neighbourhood ||
        addr.suburb;

      const subDistrict =
        (addr.neighbourhood && addr.neighbourhood !== pinpoint ? addr.neighbourhood : '') ||
        (addr.suburb && addr.suburb !== pinpoint ? addr.suburb : '') ||
        addr.quarter ||
        addr.residential ||
        addr.borough ||
        addr.city_district ||
        addr.county;

      const city =
        addr.city ||
        addr.town ||
        addr.village ||
        addr.municipality ||
        addr.county ||
        addr.state;

      let displayName = '';
      if (pinpoint && subDistrict && pinpoint.toLowerCase() !== subDistrict.toLowerCase()) {
        displayName = `${pinpoint}, ${subDistrict}`;
      } else if (pinpoint && city && pinpoint.toLowerCase() !== city.toLowerCase()) {
        displayName = `${pinpoint}, ${city}`;
      } else if (pinpoint) {
        displayName = pinpoint;
      } else if (subDistrict && city) {
        displayName = `${subDistrict}, ${city}`;
      } else if (city) {
        displayName = city;
      } else {
        displayName = addr.state || addr.country || 'Local Area';
      }

      const admin1 = [
        addr.county || addr.city_district,
        addr.state || addr.province || addr.region,
      ]
        .filter(Boolean)
        .filter((v, i, a) => a.indexOf(v) === i)
        .join(', ');

      return res.status(200).json({
        name: displayName,
        country: addr.country || '',
        admin1: admin1,
        latitude: parsedLat,
        longitude: parsedLon,
        timezone: 'auto',
      });
    }
  } catch (err: any) {
    console.warn('Nominatim reverse geocode error:', err?.message || err);
  }

  // 2. High-reliability fallback: BigDataCloud Reverse Geocode API
  try {
    const bdcUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`;
    const bdcRes = await fetch(bdcUrl);
    if (bdcRes.ok) {
      const bdcData = await bdcRes.json();
      const locality = bdcData.locality || bdcData.city || bdcData.principalSubdivision;
      const district = bdcData.localityInfo?.administrative?.[3]?.name || bdcData.localityInfo?.administrative?.[2]?.name;

      let name = locality;
      if (district && locality && district.toLowerCase() !== locality.toLowerCase()) {
        name = `${locality}, ${district}`;
      }

      return res.status(200).json({
        name: name || 'Local Area',
        country: bdcData.countryName || '',
        admin1: bdcData.principalSubdivision || '',
        latitude: parsedLat,
        longitude: parsedLon,
        timezone: 'auto',
      });
    }
  } catch (err) {
    console.warn('BigDataCloud reverse geocode fallback failed:', err);
  }

  return res.status(200).json({
    name: 'Local Area',
    country: '',
    admin1: '',
    latitude: parsedLat,
    longitude: parsedLon,
    timezone: 'auto',
  });
}
