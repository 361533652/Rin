import { useEffect, useState } from 'react';

interface WeatherData {
  temperature: number;
  condition: string;
  icon: string;
  location: string;
}

export function Weather() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 模拟天气数据，实际项目中可以使用真实的天气 API
    const fetchWeather = async () => {
      try {
        // 这里可以替换为真实的天气 API 调用
        // 例如：const response = await fetch('https://api.weatherapi.com/v1/current.json?key=YOUR_API_KEY&q=Beijing');
        // const data = await response.json();
        
        // 模拟数据
        const mockWeather: WeatherData = {
          temperature: 22,
          condition: '晴',
          icon: 'ri-sun-fill',
          location: '北京'
        };
        
        setWeather(mockWeather);
      } catch (error) {
        console.error('Error fetching weather:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, []);

  if (loading || !weather) {
    return (
      <div className="flex rounded-full border dark:border-neutral-600 px-2 bg-w aspect-[1] items-center justify-center t-primary bg-button">
        <i className="ri-cloud-sun-line" />
      </div>
    );
  }

  return (
    <div className="flex flex-row items-center space-x-1 px-2 py-1 rounded-full border dark:border-neutral-600 bg-w t-primary bg-button">
      <i className={`${weather.icon} text-yellow-500`} />
      <span className="text-sm font-medium">{weather.temperature}°</span>
      <span className="text-xs text-neutral-500">{weather.condition}</span>
    </div>
  );
}