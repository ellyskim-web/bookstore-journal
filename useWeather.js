'use client';
import { useState, useCallback } from 'react';

export function useWeather() {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchWeather = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const lat = process.env.NEXT_PUBLIC_STORE_LAT || '37.3800';
      const lon = process.env.NEXT_PUBLIC_STORE_LON || '126.8035';
      
      const res = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || '날씨 조회 실패');
      }
      const data = await res.json();
      setWeatherData(data);
      return data;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { weatherData, loading, error, fetchWeather };
}
