// ── 날씨 API 유틸리티 ──
// OpenWeatherMap API를 사용하여 서점 위치의 현재 날씨를 자동 조회

const WEATHER_CODE_MAP = {
  // OpenWeatherMap 날씨 코드 → 앱 내부 코드 매핑
  '2xx': 'rainy',     // Thunderstorm
  '3xx': 'rainy',     // Drizzle
  '5xx': 'rainy',     // Rain
  '600': 'snowy',     // Snow
  '6xx': 'snowy',     // Snow
  '701': 'foggy',     // Mist
  '711': 'foggy',     // Smoke
  '721': 'foggy',     // Haze
  '741': 'foggy',     // Fog
  '751': 'windy',     // Sand
  '761': 'foggy',     // Dust
  '771': 'windy',     // Squalls
  '800': 'sunny',     // Clear sky
  '801': 'sunny',     // Few clouds
  '802': 'cloudy',    // Scattered clouds
  '803': 'cloudy',    // Broken clouds
  '804': 'cloudy',    // Overcast
};

function mapWeatherCode(code) {
  // 정확한 코드 매칭
  if (WEATHER_CODE_MAP[String(code)]) return WEATHER_CODE_MAP[String(code)];
  
  // 범위 매칭
  const codeStr = String(code);
  if (codeStr.startsWith('2')) return 'rainy';
  if (codeStr.startsWith('3')) return 'rainy';
  if (codeStr.startsWith('5')) return 'rainy';
  if (codeStr.startsWith('6')) return 'snowy';
  if (codeStr.startsWith('7')) return 'foggy';
  
  return 'sunny';
}

function getWeatherDescription(data) {
  const temp = Math.round(data.main.temp);
  const feelsLike = Math.round(data.main.feels_like);
  const description = data.weather[0]?.description || '';
  const humidity = data.main.humidity;
  const windSpeed = data.wind?.speed || 0;

  const parts = [];
  
  // 기온 표현
  if (temp <= -5) parts.push('매우 춥고');
  else if (temp <= 5) parts.push('춥고');
  else if (temp <= 15) parts.push('쌀쌀하고');
  else if (temp <= 22) parts.push('선선하고');
  else if (temp <= 28) parts.push('따뜻하고');
  else if (temp <= 33) parts.push('덥고');
  else parts.push('매우 덥고');

  // 날씨 상태
  const weatherMain = data.weather[0]?.main || '';
  if (weatherMain === 'Clear') parts.push('맑은 하늘');
  else if (weatherMain === 'Clouds') {
    const cloudiness = data.clouds?.all || 0;
    if (cloudiness > 80) parts.push('구름이 많음');
    else parts.push('구름이 약간 있음');
  }
  else if (weatherMain === 'Rain') parts.push('비가 내림');
  else if (weatherMain === 'Drizzle') parts.push('이슬비가 내림');
  else if (weatherMain === 'Snow') parts.push('눈이 내림');
  else if (weatherMain === 'Thunderstorm') parts.push('천둥번개');
  else if (['Mist', 'Fog', 'Haze'].includes(weatherMain)) parts.push('안개가 낌');
  else parts.push(description);

  // 바람
  if (windSpeed > 10) parts.push('강풍 주의');
  else if (windSpeed > 5) parts.push('바람이 약간 있음');

  return `${parts.join(', ')} (${temp}°C, 체감 ${feelsLike}°C, 습도 ${humidity}%)`;
}

function getWeatherAppCode(data) {
  const temp = data.main.temp;
  const weatherCode = data.weather[0]?.id;
  
  let mapped = mapWeatherCode(weatherCode);
  
  // 기온에 따라 hot/cold 오버라이드
  if (temp >= 33 && mapped === 'sunny') mapped = 'hot';
  if (temp <= 0 && !['rainy', 'snowy'].includes(mapped)) mapped = 'cold';
  
  return mapped;
}

// ── 서버 사이드 API 호출 (Route Handler에서 사용) ──
export async function fetchCurrentWeather(lat, lon) {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENWEATHER_API_KEY가 설정되지 않았습니다.');
  }

  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=kr`;
  
  const response = await fetch(url, { 
    next: { revalidate: 1800 } // 30분 캐시
  });
  
  if (!response.ok) {
    throw new Error(`날씨 API 오류: ${response.status}`);
  }

  const data = await response.json();

  return {
    weather: getWeatherAppCode(data),
    weather_detail: getWeatherDescription(data),
    weather_temp: Math.round(data.main.temp * 10) / 10,
    weather_humidity: data.main.humidity,
    weather_auto_fetched: true,
    // 원본 데이터 (디버깅용)
    _raw: {
      temp: data.main.temp,
      feels_like: data.main.feels_like,
      description: data.weather[0]?.description,
      code: data.weather[0]?.id,
      wind_speed: data.wind?.speed,
      clouds: data.clouds?.all,
    }
  };
}

// ── 특정 날짜의 과거 날씨 (유료 API 필요, 대안 제공) ──
export async function fetchHistoricalWeather(lat, lon, date) {
  // OpenWeatherMap의 과거 날씨는 One Call API 3.0 (유료) 필요
  // 대안: 당일 날씨만 자동 지원, 과거는 수동 입력 유도
  const today = new Date().toISOString().split('T')[0];
  
  if (date === today) {
    return fetchCurrentWeather(lat, lon);
  }
  
  return null; // 과거 날씨는 수동 입력
}
