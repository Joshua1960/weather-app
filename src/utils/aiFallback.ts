/**
 * Client & Server intelligent fallback engine.
 * Ensures the user ALWAYS gets a meaningful, sensible, tailored response
 * even when offline, during network issues, or on hosting platforms without serverless backend API keys.
 */

export function generateHeuristicAdvisory(current: any, airQuality: any, activities: string[], customActivity?: string) {
  const temp = current?.temperature ?? 20;
  const precip = current?.precipitation ?? 0;
  const wind = current?.windSpeed ?? 10;
  const uv = current?.uvIndex ?? 4;
  const aqi = airQuality?.usAqi ?? 40;
  const isRaining = precip > 0.1 || (current?.weatherCode >= 50 && current?.weatherCode <= 67);

  const list = customActivity ? [...activities, customActivity] : activities;

  const advisories = list.map((act) => {
    let score = 85;
    let rating: 'Optimal' | 'Good' | 'Fair' | 'Caution' | 'Avoid' = 'Good';
    let verdict = 'Conditions are favorable for this activity.';
    let bestTimeWindow = '10:00 - 18:00';
    let keyFactor = 'Mild temperature';

    const lower = act.toLowerCase();
    if (lower.includes('run') || lower.includes('jog')) {
      if (isRaining) {
        score = 45;
        rating = 'Caution';
        verdict = 'Wet pavement and active precipitation increase slip risk.';
        keyFactor = 'Rain & Traction';
      } else if (temp > 28) {
        score = 55;
        rating = 'Caution';
        verdict = 'High thermal load. Hydrate and run early morning or dusk.';
        bestTimeWindow = '06:00 - 08:30';
        keyFactor = 'High Temperature';
      } else if (temp >= 12 && temp <= 21 && wind < 25) {
        score = 96;
        rating = 'Optimal';
        verdict = 'Prime cardiovascular window with optimal thermal balance.';
        bestTimeWindow = '08:00 - 11:30';
        keyFactor = 'Ideal 16°C & Low Wind';
      }
    } else if (lower.includes('cycl') || lower.includes('bike')) {
      if (wind > 35) {
        score = 35;
        rating = 'Caution';
        verdict = `Crosswinds at ${wind} km/h require vigilant bike handling.`;
        keyFactor = 'High Crosswinds';
      } else if (isRaining) {
        score = 40;
        rating = 'Caution';
        verdict = 'Reduced braking efficiency and road spray.';
        keyFactor = 'Wet Roads';
      } else {
        score = 90;
        rating = 'Optimal';
        verdict = 'Dry surface, clear visibility, and manageable breeze.';
        bestTimeWindow = '13:00 - 17:00';
        keyFactor = 'Dry Asphalt';
      }
    } else if (lower.includes('photo')) {
      if (current?.cloudCover > 85 && !isRaining) {
        score = 88;
        rating = 'Good';
        verdict = 'Giant softbox cloud ceiling. Excellent for portraits and architecture.';
        bestTimeWindow = '11:00 - 15:00';
        keyFactor = 'Diffused Clouds';
      } else if (current?.cloudCover < 30) {
        score = 95;
        rating = 'Optimal';
        verdict = 'Sharp contrast and crisp horizons. Target golden hour 45 min before sunset.';
        bestTimeWindow = 'Golden Hour (18:15 - 19:15)';
        keyFactor = 'Clean Light & Blue Skies';
      }
    } else if (lower.includes('din') || lower.includes('patio') || lower.includes('picnic')) {
      if (isRaining || temp < 14 || wind > 25) {
        score = 30;
        rating = 'Avoid';
        verdict = 'Damp conditions and wind chill favor indoor dining.';
        keyFactor = 'Precipitation / Chill';
      } else {
        score = 92;
        rating = 'Optimal';
        verdict = 'Pleasant ambient warmth and calm air for alfresco seating.';
        bestTimeWindow = '12:30 - 14:30 & 19:00 - 21:30';
        keyFactor = 'Calm Air & 20°C';
      }
    } else if (lower.includes('laundry') || lower.includes('cloth') || lower.includes('dry')) {
      if (isRaining) {
        score = 25;
        rating = 'Avoid';
        verdict = 'Outdoor rain will prevent clothes from drying. Dry indoors.';
        keyFactor = 'Rainy Conditions';
      } else if (current?.humidity > 80) {
        score = 60;
        rating = 'Fair';
        verdict = 'High humidity will slow evaporation. Allow extra drying time.';
        bestTimeWindow = '11:00 - 16:00';
        keyFactor = 'High Humidity';
      } else {
        score = 94;
        rating = 'Optimal';
        verdict = 'Warm air and gentle breezes will dry clothes quickly outside.';
        bestTimeWindow = '09:00 - 16:00';
        keyFactor = 'Warm Sun & Air Flow';
      }
    } else if (lower.includes('football') || lower.includes('soccer') || lower.includes('match')) {
      if (isRaining) {
        score = 40;
        rating = 'Caution';
        verdict = 'Slippery pitch with heavy ball friction. Exercise caution.';
        keyFactor = 'Wet Pitch';
      } else if (temp > 30) {
        score = 65;
        rating = 'Fair';
        verdict = 'Very warm conditions. Plan hydration breaks every 15 minutes.';
        bestTimeWindow = '16:30 - 18:30';
        keyFactor = 'High Heat';
      } else {
        score = 92;
        rating = 'Optimal';
        verdict = 'Great temperature and solid surface grip for football.';
        bestTimeWindow = '16:00 - 18:30';
        keyFactor = 'Balanced Weather';
      }
    } else if (lower.includes('star') || lower.includes('astro')) {
      if (current?.cloudCover > 50 || isRaining) {
        score = 20;
        rating = 'Avoid';
        verdict = 'Cloud ceiling obstructs celestial observation.';
        keyFactor = 'Heavy Cloud Cover';
      } else {
        score = 90;
        rating = 'Optimal';
        verdict = 'Low atmospheric distortion and clear overhead visibility.';
        bestTimeWindow = '22:00 - 02:00';
        keyFactor = 'Under 15% Cloud Cover';
      }
    } else if (lower.includes('hike') || lower.includes('trail')) {
      if (isRaining) {
        score = 45;
        rating = 'Caution';
        verdict = 'Muddy trails and reduced ridge visibility.';
        keyFactor = 'Trail Mud & Mist';
      } else {
        score = 88;
        rating = 'Optimal';
        verdict = 'Stable barometric pressure and comfortable ambient pace.';
        bestTimeWindow = '09:00 - 16:00';
        keyFactor = 'Stable Pressure';
      }
    } else {
      score = isRaining ? 50 : 85;
      rating = isRaining ? 'Fair' : 'Good';
      verdict = isRaining ? 'Carrying light rainwear recommended.' : 'Favorable overall climate parameters.';
    }

    return {
      name: act,
      rating,
      score,
      bestTimeWindow,
      verdict,
      keyFactor,
    };
  });

  const weatherMeaning = isRaining
    ? `Rain is falling at ${temp}°C with damp air and wet surfaces outdoors.`
    : temp >= 28
    ? `It feels hot and sunny at ${temp}°C, so expect warm air and strong sunshine.`
    : temp <= 14
    ? `The air is brisk and chilly at ${temp}°C with cool breezes.`
    : `The weather is pleasant and comfortable at ${temp}°C with clear skies and a gentle breeze.`;

  const clothingRecommendation = isRaining
    ? `Wear a waterproof jacket or carry an umbrella, with water-resistant footwear.`
    : temp >= 24
    ? `Wear lightweight cotton clothes, comfortable sneakers, and sunglasses if in direct sunlight.`
    : `Wear comfortable layers like a light jacket or sweater with long trousers.`;

  const foodRecommendation = isRaining
    ? `Enjoy hot vegetable soup, spiced tea, or warm coffee to stay cozy.`
    : temp >= 24
    ? `Stay refreshed with chilled water, watermelon or citrus fruits, and light meals.`
    : `Warm hearty meals, fresh tea, and nourishing soups are ideal today.`;

  return {
    overallSummary: `${weatherMeaning} ${clothingRecommendation} ${foodRecommendation}`,
    weatherMeaning,
    clothingRecommendation,
    foodRecommendation,
    advisories,
  };
}

export function generateOfflineChatReply(message: string, context: any): string {
  const loc = context?.city || 'your area';
  const temp = context?.current?.temperature ? parseInt(context.current.temperature, 10) : 25;
  const cond = context?.current?.conditionText || 'clear';
  const wind = context?.current?.windSpeed || '8 km/h';
  const humidity = context?.current?.humidity ? parseInt(context.current.humidity, 10) : 60;
  const rainProb = context?.daily?.precipitationProbabilityMax ?? 15;
  const lowerMsg = message.toLowerCase();

  // Attire / Clothes
  if (lowerMsg.includes('wear') || lowerMsg.includes('clothes') || lowerMsg.includes('outfit') || lowerMsg.includes('dress')) {
    const advice = temp > 24
      ? 'Light, breathable cotton clothing (T-shirt, shorts or light trousers) and comfortable shoes.'
      : temp > 16
      ? 'Comfortable everyday layers: a T-shirt paired with a light jacket or knit sweater.'
      : 'Warm layers, an insulated jacket, and long trousers.';

    const rainNote = rainProb > 30 ? ' Carrying a compact umbrella is highly recommended due to rain chances.' : '';
    return `In **${loc}**, the temperature is **${temp}°C** with **${cond}**.\n\n* **What to Wear:** ${advice}\n* **Accessories:** ${rainNote || 'Sunglasses or a hat if heading out in midday sun.'}\n* **How it Feels:** High humidity (${humidity}%) makes the air feel slightly warmer than the actual reading.`;
  }

  // Running / Jogging / Workout
  if (lowerMsg.includes('run') || lowerMsg.includes('jog') || lowerMsg.includes('exercise') || lowerMsg.includes('workout')) {
    const isGood = rainProb < 40 && temp < 30;
    return `Exercise viability in **${loc}** is **${isGood ? 'Favorable' : 'Moderate'}**.\n\n* **Current Conditions:** ${temp}°C, ${cond}, with ${humidity}% humidity.\n* **Surface & Rain:** ${rainProb > 30 ? `There is a ${rainProb}% rain chance, so watch out for slick roads.` : 'Surfaces are dry with good foot traction.'}\n* **Best Time:** Early morning or late afternoon when temperatures are cooler.`;
  }

  // Rain / Umbrella
  if (lowerMsg.includes('rain') || lowerMsg.includes('umbrella') || lowerMsg.includes('shower') || lowerMsg.includes('storm')) {
    return `The chance of rain in **${loc}** is **${rainProb}%**.\n\n* **Rain Outlook:** ${rainProb > 35 ? 'Rain or passing showers are likely. Keep an umbrella on hand.' : 'Conditions are predominantly dry. You should not need rain gear today.'}\n* **Current Sky:** ${cond} with ${humidity}% relative humidity.`;
  }

  // Laundry / Drying Clothes
  if (lowerMsg.includes('laundry') || lowerMsg.includes('drying') || lowerMsg.includes('clothes out')) {
    if (rainProb > 40) {
      return `It is **not recommended** to hang laundry outdoors in **${loc}** right now due to a **${rainProb}% rain chance**. Consider drying indoors or waiting for a clearer window.`;
    }
    return `Yes, you can dry laundry outside in **${loc}**.\n\n* **Conditions:** ${temp}°C and ${cond}.\n* **Drying Speed:** Relative humidity is ${humidity}%, so clothes will dry best between 11:00 AM and 4:00 PM when sunshine and air circulation are strongest.`;
  }

  // Food / Drinks
  if (lowerMsg.includes('food') || lowerMsg.includes('drink') || lowerMsg.includes('eat') || lowerMsg.includes('hydrate')) {
    if (temp >= 26) {
      return `With a warm **${temp}°C** in **${loc}**, prioritize hydration. Drink water regularly, and enjoy fresh fruits like watermelon, oranges, or fresh coconut water. Light meals will keep you energized without feeling sluggish.`;
    }
    return `At **${temp}°C** in **${loc}**, nourishing warm meals like fresh vegetable soups, warm tea, or oatmeal are comforting choices.`;
  }

  // Day vs Night
  if (lowerMsg.includes('morning') || lowerMsg.includes('night') || lowerMsg.includes('daytime') || lowerMsg.includes('dark outside')) {
    const isDay = context?.current?.isDay ?? (new Date().getUTCHours() + 1 >= 6 && new Date().getUTCHours() + 1 < 19 ? 1 : 0);
    return isDay === 1
      ? `It is currently **daytime** in **${loc}**.`
      : `It is currently **nighttime** in **${loc}**.`;
  }

  // Common identity & knowledge queries
  if (lowerMsg.includes('who are you') || lowerMsg.includes('your name')) {
    return 'I am **GCI Meteo**, your intelligent weather and daily living assistant built by the Byte Busters Coding Club of Government College Ibadan.';
  }
  if (lowerMsg.includes('capital of france')) return 'The capital of France is **Paris**.';
  if (lowerMsg.includes('capital of nigeria')) return 'The capital of Nigeria is **Abuja**.';
  if (lowerMsg.includes('hours in a week')) return 'There are **168 hours** in a week (24 hours × 7 days).';

  // General helpful weather summary response
  return `Here is the current overview for **${loc}**:\n\n* **Temperature:** ${temp}°C (${cond})\n* **Humidity:** ${humidity}% (${humidity >= 75 ? 'humid & sticky' : 'comfortable'})\n* **Wind:** ${wind}\n* **Rain Probability:** ${rainProb}%\n\nFeel free to ask about clothing, outdoor plans, rain timing, or any general questions!`;
}
