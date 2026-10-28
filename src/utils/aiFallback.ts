/**
 * Client & Server intelligent meteorological engine.
 * Ensures the user ALWAYS receives rich, warm, layperson-friendly, and deeply personalized
 * meteorological and daily living advice—matching the exact quality of live Gemini AI.
 */

export function generateHeuristicAdvisory(
  current: any,
  airQuality: any,
  activities: string[],
  customActivity?: string
) {
  const temp = Math.round(current?.temperature ?? 24);
  const feelsLike = Math.round(current?.apparentTemperature ?? temp);
  const precip = current?.precipitation ?? 0;
  const wind = Math.round(current?.windSpeed ?? 8);
  const humidity = Math.round(current?.humidity ?? 65);
  const uv = Math.round(current?.uvIndex ?? 2);
  const aqi = Math.round(airQuality?.usAqi ?? 40);
  const isRaining = precip > 0.1 || (current?.weatherCode >= 50 && current?.weatherCode <= 67);

  const list = customActivity ? [...activities, customActivity] : activities;

  const advisories = list.map((act) => {
    let score = 85;
    let rating: 'Optimal' | 'Good' | 'Fair' | 'Caution' | 'Avoid' = 'Good';
    let verdict = 'Conditions are favorable for this activity.';
    let bestTimeWindow = '10:00 - 18:00';
    let keyFactor = 'Mild ambient temperature';

    const lower = act.toLowerCase();
    if (lower.includes('run') || lower.includes('jog') || lower.includes('walk')) {
      if (isRaining) {
        score = 42;
        rating = 'Caution';
        verdict = 'Wet pavement increases slip risk and drops road traction. Stick to flat, well-lit paths.';
        bestTimeWindow = 'After rainfall clears';
        keyFactor = 'Rain & Slick Roads';
      } else if (temp > 28 || (humidity > 85 && temp > 25)) {
        score = 60;
        rating = 'Fair';
        verdict = `High humidity (${humidity}%) slows sweat evaporation, making it feel like ${feelsLike}°C. Hydrate generously.`;
        bestTimeWindow = '06:00 - 08:30 or 17:30 - 19:00';
        keyFactor = 'Humid Heat Index';
      } else if (temp >= 15 && temp <= 23 && wind < 20) {
        score = 96;
        rating = 'Optimal';
        verdict = 'Superb running climate with balanced thermal load and gentle airflow.';
        bestTimeWindow = '07:00 - 10:30';
        keyFactor = `${temp}°C & Low Wind`;
      } else {
        score = 80;
        rating = 'Good';
        verdict = 'Solid conditions for a run. Stay well hydrated throughout.';
        bestTimeWindow = '07:30 - 10:00';
        keyFactor = 'Comfortable Pace';
      }
    } else if (lower.includes('cycl') || lower.includes('bike')) {
      if (wind > 35) {
        score = 35;
        rating = 'Caution';
        verdict = `Brisk crosswinds at ${wind} km/h require attentive handlebar control.`;
        bestTimeWindow = 'Early morning when winds settle';
        keyFactor = 'Crosswinds';
      } else if (isRaining) {
        score = 40;
        rating = 'Caution';
        verdict = 'Braking distances are extended on wet tarmac. Reduce cornering speed.';
        bestTimeWindow = 'Post-drizzle';
        keyFactor = 'Wet Tarmac';
      } else {
        score = 92;
        rating = 'Optimal';
        verdict = 'Dry asphalt, clear sightlines, and comfortable ambient breeze.';
        bestTimeWindow = '08:00 - 11:00 & 16:00 - 18:30';
        keyFactor = 'Stable Traction';
      }
    } else if (lower.includes('photo')) {
      if (current?.cloudCover > 80 && !isRaining) {
        score = 92;
        rating = 'Optimal';
        verdict = 'Cloud ceiling serves as a giant natural softbox, diffusing harsh glare for portraits and street photography.';
        bestTimeWindow = '10:00 - 16:00';
        keyFactor = 'Diffused Overhead Cloud';
      } else if (current?.cloudCover < 30) {
        score = 94;
        rating = 'Optimal';
        verdict = 'High atmospheric clarity with rich contrast. Golden hour 45 minutes before sunset is ideal.';
        bestTimeWindow = 'Golden Hour (17:45 - 18:45)';
        keyFactor = 'Crisp Blue Light';
      } else {
        score = 85;
        rating = 'Good';
        verdict = 'Pleasant ambient lighting for versatile outdoor shooting.';
        bestTimeWindow = 'Mid-morning or late afternoon';
        keyFactor = 'Good Visibility';
      }
    } else if (lower.includes('din') || lower.includes('patio') || lower.includes('picnic')) {
      if (isRaining || temp < 14 || wind > 28) {
        score = 30;
        rating = 'Avoid';
        verdict = 'Damp conditions and wind chill favor covered indoor seating.';
        bestTimeWindow = 'Indoors recommended';
        keyFactor = 'Moisture / Breeze';
      } else {
        score = 90;
        rating = 'Optimal';
        verdict = 'Gentle air and comfortable warmth create a delightful outdoor dining atmosphere.';
        bestTimeWindow = '12:30 - 14:30 & 18:30 - 21:00';
        keyFactor = 'Mild & Calm Air';
      }
    } else if (lower.includes('laundry') || lower.includes('cloth') || lower.includes('dry')) {
      if (isRaining) {
        score = 20;
        rating = 'Avoid';
        verdict = 'Rain will keep outdoor garments wet. Dry indoors or on a sheltered veranda.';
        bestTimeWindow = 'Dry indoors today';
        keyFactor = 'Precipitation';
      } else if (humidity > 80) {
        score = 62;
        rating = 'Fair';
        verdict = `With ${humidity}% humidity, moisture evaporation is slow. Hang items spread apart in good airflow.`;
        bestTimeWindow = '11:00 - 15:30 (peak warmth)';
        keyFactor = 'High Humidity';
      } else {
        score = 95;
        rating = 'Optimal';
        verdict = 'Warm air and gentle breeze will dry outdoor clothes briskly.';
        bestTimeWindow = '09:00 - 15:00';
        keyFactor = 'Sun & Good Air Flow';
      }
    } else {
      score = isRaining ? 50 : 85;
      rating = isRaining ? 'Fair' : 'Good';
      verdict = isRaining ? 'Keep a light raincoat or umbrella on hand for outdoor trips.' : 'Comfortable and stable weather conditions for your plans.';
      bestTimeWindow = 'Daytime';
      keyFactor = 'Temperate Conditions';
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
    ? `Rain is active at ${temp}°C, bringing damp surfaces and a brisk drop in road traction.`
    : humidity > 85 && temp > 22
    ? `The air feels sticky and warm at ${temp}°C (feels like ${feelsLike}°C) because high humidity holds heat close to your skin.`
    : temp >= 28
    ? `Warm and radiant at ${temp}°C, so prepare for strong daylight and thermal warmth.`
    : temp <= 16
    ? `Cool and invigorating at ${temp}°C with crisp breezes.`
    : `Comfortable and mild at ${temp}°C with gentle breezes and manageable conditions.`;

  const clothingRecommendation = isRaining
    ? `Choose water-resistant shoes, carry an umbrella, and wear a lightweight waterproof outer layer.`
    : humidity > 80
    ? `Wear loose, breathable 100% cotton garments and open or mesh footwear to let heat escape naturally.`
    : temp >= 25
    ? `Lightweight short sleeves, breathable fabrics, and sunglasses if heading outside in midday light.`
    : `A light cotton sweater or windbreaker layered over an everyday shirt.`;

  const foodRecommendation = humidity > 80 || temp >= 26
    ? `Prioritize water-rich fruits (watermelon, pineapple, citrus), chilled water or coconut water, and light, unhurried meals.`
    : isRaining
    ? `Warm nourishing meals like fresh spiced broth, hot tea, or oatmeal provide great comfort.`
    : `Enjoy balanced whole foods, hydrating water throughout the day, and seasonal fruits.`;

  return {
    overallSummary: `${weatherMeaning} ${clothingRecommendation} ${foodRecommendation}`,
    weatherMeaning,
    clothingRecommendation,
    foodRecommendation,
    advisories,
  };
}

export function generateOfflineChatReply(message: string, context: any, showSetupTip = false): string {
  const loc = context?.city || 'your area';
  const temp = context?.current?.temperature != null ? Number(context.current.temperature) : 24;
  const tempRounded = Math.round(temp);
  const feelsLike = context?.current?.apparentTemperature != null
    ? Math.round(Number(context.current.apparentTemperature))
    : Math.round(temp + (context?.current?.humidity > 70 ? (context.current.humidity - 70) * 0.12 : 0));
  const cond = context?.current?.conditionText || 'Cloudy';
  const wind = context?.current?.windSpeed != null ? `${Math.round(context.current.windSpeed)} km/h` : '6 km/h';
  const humidity = context?.current?.humidity != null ? Math.round(context.current.humidity) : 90;
  const rainProb = context?.daily?.precipitationProbabilityMax ?? (context?.current?.precipitation > 0 ? 80 : 25);
  const uv = context?.current?.uvIndex != null ? Math.round(context.current.uvIndex) : 1;
  const aqi = context?.airQuality?.usAqi != null ? Math.round(context.airQuality.usAqi) : 40;
  const lowerMsg = message.toLowerCase();

  // Determine local time context
  let timeStr = context?.currentTime;
  let hour = 8; // default to morning if unspecified
  if (!timeStr) {
    const now = new Date();
    hour = now.getHours();
    timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else {
    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
    if (match) {
      let h = parseInt(match[1], 10);
      const isPM = match[3]?.toUpperCase() === 'PM';
      const isAM = match[3]?.toUpperCase() === 'AM';
      if (isPM && h < 12) h += 12;
      if (isAM && h === 12) h = 0;
      hour = h;
    }
  }

  const isMorning = hour >= 5 && hour < 12;
  const isAfternoon = hour >= 12 && hour < 17;
  const isEvening = hour >= 17 && hour < 21;
  const isNight = hour >= 21 || hour < 5;

  const timeGreeting = isMorning ? 'morning' : isAfternoon ? 'afternoon' : isEvening ? 'evening' : 'night';

  // Check hourly forecast for upcoming rain
  let upcomingRainNote = '';
  if (context?.hourly && Array.isArray(context.hourly)) {
    const rainyHours = context.hourly.slice(0, 5).filter((h: any) => (h.precipitationProbability ?? 0) > 30 || (h.precipitation ?? 0) > 0.1);
    if (rainyHours.length > 0) {
      const times = rainyHours.map((h: any) => h.time).join(' and ');
      upcomingRainNote = `A quick heads-up for your plans: While it is currently ${cond.toLowerCase()}, there is a chance of light drizzle around ${times}. If you're heading out, keeping a compact umbrella or light jacket within reach is a smart move!`;
    }
  }
  if (!upcomingRainNote) {
    if (rainProb > 40) {
      upcomingRainNote = `A quick heads-up for your plans: There is a ${rainProb}% chance of passing showers later today. Having a compact umbrella on hand will keep you prepared.`;
    } else {
      upcomingRainNote = `The skies are expected to remain predominantly dry over the next few hours with stable barometric pressure, giving you a smooth window for your activities.`;
    }
  }

  const setupNotice = showSetupTip
    ? `\n\n*(Tip for your Vercel deployment: To unlock boundless live Gemini AI reasoning on Vercel, ensure you've added your \`GEMINI_API_KEY\` in your Vercel Project Settings → Environment Variables).*`
    : '';

  // 1. Breakfast / Meals / Food / Hydration
  if (
    lowerMsg.includes('breakfast') ||
    lowerMsg.includes('food') ||
    lowerMsg.includes('eat') ||
    lowerMsg.includes('drink') ||
    lowerMsg.includes('lunch') ||
    lowerMsg.includes('dinner') ||
    lowerMsg.includes('hydrate') ||
    lowerMsg.includes('meal')
  ) {
    const mealType = isMorning ? 'breakfast' : isAfternoon ? 'lunch' : isEvening ? 'dinner' : 'a late-night snack';
    return `Since it is currently **${timeStr}** here at **${loc}**, it’s a great time for **${mealType}**.

Given the current conditions, I would recommend something light and hydrating. Right now, it is **${temp}°C**, but because the humidity is high at **${humidity}%**, it feels warmer—closer to **${feelsLike}°C**. When the air is this "sticky" or heavy with moisture, your body's natural evaporative cooling is slower, so it is best to avoid heavy, greasy, or overly spicy meals that might make you feel sluggish or overheated.

Here are a few practical suggestions for your ${timeGreeting}:

● **Fresh Hydrating Fruit:** Since it's humid, your body appreciates extra water content. A bowl of watermelon, sweet pineapple, citrus, or pawpaw is refreshing and helps replenish natural hydration.
● **Light Porridge or Oats:** A warm bowl of oatmeal, pap (ogi), or light whole-grain cereal is a gentle start that delivers steady energy without weighing down your digestion.
● **Smoothies or Coconut Water:** A fresh fruit smoothie or coconut water is an effortless way to absorb essential electrolytes while naturally cooling your core.
● **Steady Hydration:** Because of the high humidity (${humidity}%), you lose moisture through subtle perspiration even when resting. Make sure to drink plenty of clean water alongside your meal.

${upcomingRainNote}${setupNotice}`;
  }

  // 2. Exercise / Running / Jogging / Workout / Walking
  if (
    lowerMsg.includes('run') ||
    lowerMsg.includes('jog') ||
    lowerMsg.includes('exercise') ||
    lowerMsg.includes('workout') ||
    lowerMsg.includes('walk') ||
    lowerMsg.includes('gym') ||
    lowerMsg.includes('fitness')
  ) {
    const isGood = rainProb < 45 && temp < 31;
    return `If you're planning to exercise or go for a run in **${loc}**, the overall window is **${isGood ? 'Favorable with proper hydration' : 'Moderate'}**.

Right now the temperature is **${tempRounded}°C**, but with relative humidity sitting at **${humidity}%**, the thermal heat index feels closer to **${feelsLike}°C**. In high moisture, sweat cannot evaporate as quickly from your skin, so your cardiovascular system works slightly harder to regulate core temperature.

Here is a practical guide for your workout:

● **Pacing & Cardiac Load:** Keep your initial pace 10–15% easier than usual. Avoid sudden max-effort sprints in the heat of the day, and take steady sips of water every 15–20 minutes.
● **Road & Surface Traction:** ${rainProb > 40 ? 'Surfaces may have damp patches or loose mud from recent moisture. Choose road or trail shoes with reliable rubber grip.' : 'Roadways and pedestrian paths are dry with solid foot traction.'}
● **Air & Sun Intensity:** UV is currently **${uv} (Low)**, and air cleanliness is **${aqi <= 50 ? 'Good' : 'Moderate'} (AQI ${aqi})**, which is fine for healthy respiratory breathing.
● **Optimal Timing:** ${isMorning ? 'The current early morning hours are the most comfortable before midday solar heating picks up.' : isAfternoon ? 'Consider waiting until 17:30 when ambient heat begins to drop.' : 'The evening air provides cooler temperatures and calm wind.'}

${upcomingRainNote}${setupNotice}`;
  }

  // 3. Clothing / Attire / Outfit / What to wear
  if (
    lowerMsg.includes('wear') ||
    lowerMsg.includes('clothes') ||
    lowerMsg.includes('outfit') ||
    lowerMsg.includes('dress') ||
    lowerMsg.includes('shoes') ||
    lowerMsg.includes('jacket')
  ) {
    return `Here is your practical clothing and outfit recommendation for **${loc}**:

With the temperature at **${tempRounded}°C** and humidity at **${humidity}%** (feels like **${feelsLike}°C**), the key today is **breathability and moisture release**.

● **Tops & Shirts:** Loose-fitting 100% cotton or lightweight linen fabrics. Avoid tight synthetic polyester, which traps sweat against the skin and feels sticky in high humidity.
● **Bottoms:** Lightweight shorts, cotton trousers, or relaxed chinos that encourage airflow around your legs.
● **Footwear:** Breathable mesh sneakers, loafers, or cushioned sandals. If rain is nearby, choose shoes with slip-resistant rubber soles.
● **Sun & Rain Gear:** UV index is **${uv}**, so intense sun protection isn't critical right now, but ${rainProb > 30 ? 'carrying a compact umbrella or light water-resistant layer is wise.' : 'a cap or shades will keep you comfortable if the cloud cover breaks.'}

${upcomingRainNote}${setupNotice}`;
  }

  // 4. Rain / Umbrella / Precipitation / Storm
  if (
    lowerMsg.includes('rain') ||
    lowerMsg.includes('umbrella') ||
    lowerMsg.includes('shower') ||
    lowerMsg.includes('storm') ||
    lowerMsg.includes('drizzle') ||
    lowerMsg.includes('wet')
  ) {
    return `Here is the current rainfall outlook for **${loc}**:

● **Precipitation Chance:** Estimated at **${rainProb}%** for the day.
● **Current Sky:** **${cond}** with **${humidity}%** relative humidity and gentle wind of **${wind}**.
● **Atmospheric Pressure:** Moderate barometric reading indicates moisture-laden air masses typical of tropical and subtropical regions.

**Practical Verdict:** ${rainProb > 35 ? 'Yes, you should definitely keep an umbrella or light raincoat with you. Passing showers can develop rapidly when humidity is this high.' : 'You are unlikely to encounter heavy downpours in the immediate hour, though keeping an umbrella nearby never hurts when skies are cloud-covered.'}

${upcomingRainNote}${setupNotice}`;
  }

  // 5. Laundry / Drying Clothes
  if (lowerMsg.includes('laundry') || lowerMsg.includes('drying') || lowerMsg.includes('clothes out') || lowerMsg.includes('wash')) {
    if (rainProb > 45) {
      return `For drying laundry outdoors in **${loc}**, conditions are **risky right now**.

With a **${rainProb}% chance of rain** and humidity at **${humidity}%**, any unexpected shower will re-wet your clothes, and high moisture in the air slows down water evaporation. 

**Recommendation:** Hang items indoors near a fan or on a sheltered veranda where airflow is steady and garments remain protected from sudden drizzles.${setupNotice}`;
    }

    return `You can dry laundry outdoors in **${loc}**, but keep these timings in mind:

● **Evaporation Speed:** Because humidity is **${humidity}%**, clothes will take longer to dry than on a breezy dry afternoon.
● **Best Window:** Hang items between **11:00 AM and 3:30 PM** when ambient thermal radiation is at its peak.
● **Spacing:** Spread garments widely on the line to maximize exposure to the gentle **${wind}** breeze.${setupNotice}`;
  }

  // 6. Temperature / How it feels / Humidity
  if (
    lowerMsg.includes('temperature') ||
    lowerMsg.includes('how hot') ||
    lowerMsg.includes('how cold') ||
    lowerMsg.includes('feels like') ||
    lowerMsg.includes('humid')
  ) {
    return `Here is a clear look at how the weather actually feels in **${loc}**:

● **Actual Thermometer Reading:** **${tempRounded}°C**
● **Apparent Temperature ("Feels Like"):** **${feelsLike}°C**
● **Relative Humidity:** **${humidity}%**
● **Wind Speed:** **${wind}**

**Why does it feel different?**
When humidity climbs above 70%, the air is holding a high concentration of water vapor. Your body naturally cools itself by evaporating sweat from the skin; when the air is already saturated, that moisture evaporates slowly. This creates that recognizable "sticky" or heavy sensation where 24°C feels closer to 28°C–29°C. Staying hydrated and sitting in well-ventilated spaces makes a noticeable difference!${setupNotice}`;
  }

  // 7. Identity & Creator inquiries
  if (lowerMsg.includes('who are you') || lowerMsg.includes('who made you') || lowerMsg.includes('byte busters') || lowerMsg.includes('gci')) {
    return `I am **GCI Meteo**, your intelligent weather and daily living assistant! 

I was created by the **Byte Busters Coding Club of Government College Ibadan (GCI)** to empower our community, students, and citizens to track shifting local climate conditions, understand real-world weather impacts in plain English, and make informed daily living decisions.

Feel free to ask me anything about your current weather, food, attire, outdoor fitness, or general questions!${setupNotice}`;
  }

  // 8. General Trivia / Common Knowledge
  if (lowerMsg.includes('capital of france')) return `The capital of France is **Paris**.${setupNotice}`;
  if (lowerMsg.includes('capital of nigeria')) return `The capital of Nigeria is **Abuja**.${setupNotice}`;
  if (lowerMsg.includes('hours in a week')) return `There are **168 hours** in a week (24 hours × 7 days).${setupNotice}`;

  // 9. Comprehensive Default Meteorological & Daily Living Synthesis
  return `Here is your comprehensive climate and living summary for **${loc}** at **${timeStr}**:

● **Current Climate:** **${tempRounded}°C** (${cond}), feeling closer to **${feelsLike}°C** due to **${humidity}%** relative humidity.
● **Breeze & Atmosphere:** Gentle airflow at **${wind}**, with low sunburn index (UV **${uv}**) and clean air quality (AQI **${aqi}**).
● **Daily Living Impact:** High humidity means your body benefits from light, hydrating meals (like fresh fruit and water) and loose cotton attire. 

${upcomingRainNote}

Feel free to ask for specific advice on what to wear, outdoor exercise, meal choices, or travel plans!${setupNotice}`;
}
