import { useEffect, useState } from 'react';
import { client } from '../main';

// 定义OpenWeather响应结构
interface OpenWeatherResponse {
  coord: {
    lon: number;
    lat: number;
  };
  weather: Array<{
    id: number;
    main: string;
    description: string;
    icon: string;
  }>;
  base: string;
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    humidity: number;
    sea_level: number;
    grnd_level: number;
  };
  visibility: number;
  wind: {
    speed: number;
    deg: number;
    gust: number;
  };
  clouds: {
    all: number;
  };
  dt: number;
  sys: {
    country: string;
    sunrise: number;
    sunset: number;
  };
  timezone: number;
  id: number;
  name: string;
  cod: number;
}

export function Weather() {
  const [weather, setWeather] = useState<OpenWeatherResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setLoading(true);
        setError(null);
        setWeather(null);
        
        // 尝试获取用户地理位置
        let lat: number | null = null;
        let lon: number | null = null;
        
        try {
          // 获取用户地理位置
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            if (!navigator.geolocation) {
              reject(new Error('浏览器不支持地理位置功能'));
              return;
            }
            
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: false,
              timeout: 10000,
              maximumAge: 300000 // 5分钟内的缓存位置有效
            });
          });
          lat = position.coords.latitude;
          lon = position.coords.longitude;
        } catch (geoError) {
          console.error('获取地理位置失败:', geoError);
          // 地理位置获取失败，使用默认城市
        }

        // 调用后端天气 API
        const queryParams: { lat?: string; lon?: string } = {};
        if (lat && lon) {
          queryParams.lat = lat.toString();
          queryParams.lon = lon.toString();
        }
        
        const { data, error } = await client.weather.index.get({
          query: queryParams
        });
        
        if (error) {
          throw new Error('获取天气数据失败');
        }
        
        if (data && typeof data === 'object' && data !== null && !('error' in data)) {
          setWeather(data as OpenWeatherResponse);
        }
      } catch (err) {
        console.error('Error fetching weather:', err);
        setError(err instanceof Error ? err.message : '获取天气数据失败');
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, []);

  // 映射天气状况到图标
  const getWeatherIcon = (iconCode: string) => {
    if (iconCode.includes('01')) {
      return 'ri-sun-fill'; // 晴天
    } else if (iconCode.includes('02') || iconCode.includes('03') || iconCode.includes('04')) {
      return 'ri-cloud-fill'; // 多云
    } else if (iconCode.includes('09') || iconCode.includes('10')) {
      return 'ri-rainy-fill'; // 雨
    } else if (iconCode.includes('11')) {
      return 'ri-lightning-fill'; // 雷雨
    } else if (iconCode.includes('13')) {
      return 'ri-snowy-fill'; // 雪
    } else if (iconCode.includes('50')) {
      return 'ri-cloud-fog-fill'; // 雾
    } else {
      return 'ri-cloud-sun-line'; // 默认
    }
  };

  if (loading) {
    return (
      <div className="flex rounded-full border dark:border-neutral-600 px-2 bg-w aspect-[1] items-center justify-center t-primary bg-button">
        <i className="ri-cloud-sun-line" />
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className="flex rounded-full border dark:border-neutral-600 px-2 bg-w aspect-[1] items-center justify-center t-primary bg-button">
        <i className="ri-error-warning-line text-yellow-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-row items-center space-x-1 px-2 py-1 rounded-full border dark:border-neutral-600 bg-w t-primary bg-button">
      <i className={`${getWeatherIcon(weather.weather[0].icon)} text-yellow-500`} />
      <span className="text-sm font-medium">{Math.round(weather.main.temp)}°</span>
      <span className="text-xs text-neutral-500">{weather.weather[0].description}</span>
    </div>
  );
}