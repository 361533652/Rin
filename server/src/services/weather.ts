import Elysia, { t } from "elysia";
import { setup } from "../setup";
import { getEnv } from "../utils/di";

export function WeatherService() {
  const env = getEnv();
  const WEATHER_API_KEY = env.WEATHER_API_KEY;
  const DEFAULT_CITY = 'Beijing';

  return new Elysia({ aot: false })
    .use(setup())
    .group('/weather', (group) =>
      group
        .get('/', async ({ query, set }) => {
          if (!WEATHER_API_KEY) {
            set.status = 500;
            return { error: 'WEATHER_API_KEY is not definedddd', 'env': getEnv() };
          }

          const { lat, lon, city } = query;
          let targetCity = city || DEFAULT_CITY;
          const UNITS = 'metric';

          try {
            // 如果提供了经纬度，使用逆地理编码获取城市名称
            if (lat && lon) {
              const geocodingResponse = await fetch(
                `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${WEATHER_API_KEY}`
              );

              if (!geocodingResponse.ok) {
                throw new Error('获取城市信息失败');
              }

              const geocodingData = await geocodingResponse.json();
              if (Array.isArray(geocodingData) && geocodingData.length > 0) {
                targetCity = geocodingData[0].name.replace(/\s*City\s*$/, '').trim();
              }
            }

            // 调用天气 API
            const response = await fetch(
              `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(targetCity)}&appid=${WEATHER_API_KEY}&units=${UNITS}&lang=zh_cn`
            );

            if (!response.ok) {
              throw new Error('获取天气数据失败');
            }

            // 直接返回原始数据
            const data = await response.json();
            return data;
          } catch (e: any) {
            set.status = 400;
            return { error: e.message };
          }
        }, {
          query: t.Object({
            lat: t.Optional(t.String()),
            lon: t.Optional(t.String()),
            city: t.Optional(t.String())
          })
        })
    );
}