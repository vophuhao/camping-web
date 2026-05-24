'use client';

import { useQuery } from '@tanstack/react-query';
import { differenceInDays, format, isValid } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  Cloud,
  CloudDrizzle,
  CloudLightning,
  CloudRain,
  CloudSnow,
  Info,
  Sun,
  Thermometer,
  Wind,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface WeatherAdviceProps {
  latitude: number;
  longitude: number;
  checkIn?: Date;
  checkOut?: Date;
}

interface DayForecast {
  date: string;
  weathercode: number;
  tempMax: number;
  tempMin: number;
  windspeed: number;
  precipitationSum: number;
}

interface OpenMeteoResponse {
  daily: {
    time: string[];
    weathercode: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    windspeed_10m_max: number[];
    precipitation_sum: number[];
  };
}

// ---------------------------------------------------------------------------
// Weather code helpers (WMO Weather Interpretation Codes)
// ---------------------------------------------------------------------------
function getWeatherInfo(code: number): {
  label: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
} {
  if (code === 0)
    return {
      label: 'Trời quang đãng',
      icon: <Sun className="h-5 w-5" />,
      color: 'text-yellow-500',
      bg: 'bg-yellow-50 dark:bg-yellow-950/30',
    };
  if (code <= 2)
    return {
      label: 'Ít mây',
      icon: <Sun className="h-5 w-5" />,
      color: 'text-yellow-400',
      bg: 'bg-yellow-50 dark:bg-yellow-950/30',
    };
  if (code === 3)
    return {
      label: 'Nhiều mây',
      icon: <Cloud className="h-5 w-5" />,
      color: 'text-gray-400',
      bg: 'bg-gray-50 dark:bg-gray-800/40',
    };
  if (code <= 49)
    return {
      label: 'Sương mù',
      icon: <Wind className="h-5 w-5" />,
      color: 'text-gray-400',
      bg: 'bg-gray-50 dark:bg-gray-800/40',
    };
  if (code <= 59)
    return {
      label: 'Mưa phùn',
      icon: <CloudDrizzle className="h-5 w-5" />,
      color: 'text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-950/30',
    };
  if (code <= 69)
    return {
      label: 'Mưa',
      icon: <CloudRain className="h-5 w-5" />,
      color: 'text-blue-500',
      bg: 'bg-blue-50 dark:bg-blue-950/30',
    };
  if (code <= 79)
    return {
      label: 'Tuyết',
      icon: <CloudSnow className="h-5 w-5" />,
      color: 'text-sky-300',
      bg: 'bg-sky-50 dark:bg-sky-950/30',
    };
  if (code <= 84)
    return {
      label: 'Mưa rào',
      icon: <CloudRain className="h-5 w-5" />,
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-950/30',
    };
  if (code <= 94)
    return {
      label: 'Mưa tuyết',
      icon: <CloudSnow className="h-5 w-5" />,
      color: 'text-sky-400',
      bg: 'bg-sky-50 dark:bg-sky-950/30',
    };
  return {
    label: 'Giông bão',
    icon: <CloudLightning className="h-5 w-5" />,
    color: 'text-purple-500',
    bg: 'bg-purple-50 dark:bg-purple-950/30',
  };
}

// ---------------------------------------------------------------------------
// Dynamic camping advice
// ---------------------------------------------------------------------------
function getCampingAdvice(
  code: number,
  tempMax: number,
  tempMin: number,
  windspeed: number,
  precipitationSum: number,
): { advice: string; level: 'great' | 'good' | 'caution' | 'bad' } {
  // Thunderstorm
  if (code >= 95)
    return {
      advice:
        '⛈️ Giông bão dự kiến — Không nên cắm trại trong điều kiện này. Hãy cân nhắc dời lịch hoặc chuẩn bị nơi trú ẩn kiên cố.',
      level: 'bad',
    };

  // Heavy rain
  if (precipitationSum > 10 || (code >= 63 && code <= 67))
    return {
      advice:
        '🌧️ Mưa lớn dự kiến — Hãy chuẩn bị lều chống thấm, áo mưa và ủng. Chọn vị trí cắm trại cao ráo để tránh ngập nước.',
      level: 'caution',
    };

  // Light/moderate rain or drizzle
  if (code >= 51 && code <= 67)
    return {
      advice:
        '🌦️ Có thể có mưa — Mang theo áo mưa, bạt che và túi ngủ chống ẩm. Đảm bảo lều được cắm chắc chắn.',
      level: 'caution',
    };

  // Snow
  if (code >= 71 && code <= 77)
    return {
      advice:
        '❄️ Tuyết rơi — Cần chuẩn bị túi ngủ 4 mùa, quần áo giữ ấm dày và đồ ăn nóng. Kiểm tra lối đi trước khi khởi hành.',
      level: 'caution',
    };

  // Very hot
  if (tempMax > 37)
    return {
      advice:
        '🥵 Nắng nóng gay gắt — Uống đủ nước, nghỉ ngơi trong bóng mát ban ngày, và tránh hoạt động mạnh vào buổi trưa. Mang kem chống nắng.',
      level: 'caution',
    };

  // Very cold
  if (tempMin < 10)
    return {
      advice:
        `🥶 Nhiệt độ ban đêm thấp (${tempMin}°C) — Chuẩn bị túi ngủ ấm, quần áo nhiều lớp và máy sưởi mini. Kiểm tra dự báo sương giá.`,
      level: 'caution',
    };

  // Strong wind
  if (windspeed > 40)
    return {
      advice:
        '💨 Gió mạnh — Cắm lều thật chắc chắn, chọn vị trí có cây cản gió. Tránh đốt lửa trại khi gió lớn.',
      level: 'caution',
    };

  // Cloudy but ok
  if (code === 3)
    return {
      advice:
        '⛅ Trời nhiều mây nhưng vẫn phù hợp để cắm trại. Không cần lo về nắng, nhiệt độ khá dễ chịu. Hãy tận hưởng!',
      level: 'good',
    };

  // Perfect weather
  if (code <= 2 && tempMax <= 35 && tempMin >= 15)
    return {
      advice:
        '☀️ Thời tiết tuyệt vời để cắm trại! Trời quang đãng, nhiệt độ lý tưởng. Nhớ mang kem chống nắng và đủ nước uống.',
      level: 'great',
    };

  // Generally good
  return {
    advice:
      '✅ Thời tiết khá thuận lợi. Chuẩn bị đầy đủ trang bị cơ bản là bạn đã sẵn sàng cho chuyến cắm trại rồi!',
    level: 'good',
  };
}

function getSeasonalAdvice(month: number): string {
  // Vietnam-centric seasonal advice
  if (month >= 11 || month <= 2)
    return '🍂 Mùa đông phía Bắc: Nhiệt độ có thể xuống thấp ban đêm. Chuẩn bị túi ngủ ấm và quần áo nhiều lớp. Miền Nam thường khô ráo, rất thích hợp cắm trại.';
  if (month >= 3 && month <= 4)
    return '🌸 Mùa xuân/đầu hè: Thời tiết khá lý tưởng ở nhiều vùng. Tuy nhiên có thể có mưa rào bất chợt ở miền Trung.';
  if (month >= 5 && month <= 7)
    return '☀️ Mùa hè: Nắng nóng, cần chuẩn bị kem chống nắng, nước uống và bóng mát. Khu vực núi cao như Sapa, Đà Lạt sẽ mát hơn.';
  return '🌧️ Mùa mưa (miền Nam/Trung): Thường có mưa chiều tối. Chuẩn bị áo mưa, lều chống thấm và bạt che. Kiểm tra dự báo thời tiết kỹ trước khi đi.';
}

// ---------------------------------------------------------------------------
// Fetch weather
// ---------------------------------------------------------------------------
async function fetchWeatherForecast(
  lat: number,
  lng: number,
): Promise<DayForecast[]> {
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', lat.toString());
  url.searchParams.set('longitude', lng.toString());
  url.searchParams.set(
    'daily',
    'weathercode,temperature_2m_max,temperature_2m_min,windspeed_10m_max,precipitation_sum',
  );
  url.searchParams.set('timezone', 'auto');
  url.searchParams.set('forecast_days', '16');

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Weather API error');
  const data: OpenMeteoResponse = await res.json();

  return data.daily.time.map((date, i) => ({
    date,
    weathercode: data.daily.weathercode[i],
    tempMax: Math.round(data.daily.temperature_2m_max[i]),
    tempMin: Math.round(data.daily.temperature_2m_min[i]),
    windspeed: Math.round(data.daily.windspeed_10m_max[i]),
    precipitationSum: Math.round(data.daily.precipitation_sum[i] * 10) / 10,
  }));
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export function WeatherAdvice({
  latitude,
  longitude,
  checkIn,
  checkOut,
}: WeatherAdviceProps) {
  const hasValidCoords =
    latitude !== 0 && longitude !== 0 && !isNaN(latitude) && !isNaN(longitude);
  const hasDate = checkIn && isValid(checkIn);

  const { data: forecasts, isLoading } = useQuery({
    queryKey: ['weather-forecast', latitude, longitude],
    queryFn: () => fetchWeatherForecast(latitude, longitude),
    enabled: hasValidCoords && !!hasDate,
    staleTime: 30 * 60 * 1000, // 30 min
    retry: 1,
  });

  if (!hasDate) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysUntilCheckIn = differenceInDays(checkIn, today);

  // Beyond forecast window
  if (daysUntilCheckIn > 15) {
    const month = checkIn.getMonth() + 1;
    return (
      <div className="rounded-xl border border-border/60 bg-muted/40 p-4">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
          <Info className="h-4 w-4 text-primary" />
          <span>Gợi ý theo mùa</span>
        </div>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {getSeasonalAdvice(month)}
        </p>
        <p className="text-muted-foreground mt-2 text-xs">
          📍 Ngày đã chọn còn quá xa để dự báo chính xác. Kiểm tra lại khi còn
          dưới 16 ngày.
        </p>
      </div>
    );
  }

  if (!hasValidCoords) {
    return (
      <div className="rounded-xl border border-border/60 bg-muted/40 p-4">
        <p className="text-muted-foreground text-xs">
          🗺️ Không có tọa độ địa điểm để tải dự báo thời tiết.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border/60 bg-muted/40 p-4">
        <div className="flex animate-pulse items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-muted" />
          <div className="space-y-1.5 flex-1">
            <div className="h-3 w-2/3 rounded bg-muted" />
            <div className="h-3 w-1/2 rounded bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  // Find matching forecast days for the trip
  const checkInStr = format(checkIn, 'yyyy-MM-dd');
  const checkOutStr = checkOut ? format(checkOut, 'yyyy-MM-dd') : null;

  const relevantForecasts =
    forecasts?.filter(f => {
      if (checkOutStr) {
        return f.date >= checkInStr && f.date <= checkOutStr;
      }
      return f.date === checkInStr;
    }) ?? [];

  const mainForecast = forecasts?.find(f => f.date === checkInStr);

  if (!mainForecast) {
    return (
      <div className="rounded-xl border border-border/60 bg-muted/40 p-4">
        <p className="text-muted-foreground text-xs">
          Không tìm thấy dữ liệu thời tiết cho ngày đã chọn.
        </p>
      </div>
    );
  }

  // Compute worst-case for multi-day trip
  const worstCode = relevantForecasts.reduce(
    (max, f) => (f.weathercode > max ? f.weathercode : max),
    0,
  );
  const maxTemp = Math.max(...relevantForecasts.map(f => f.tempMax));
  const minTemp = Math.min(...relevantForecasts.map(f => f.tempMin));
  const maxWind = Math.max(...relevantForecasts.map(f => f.windspeed));
  const totalPrecip = relevantForecasts.reduce(
    (sum, f) => sum + f.precipitationSum,
    0,
  );

  const weatherInfo = getWeatherInfo(mainForecast.weathercode);
  const { advice, level } = getCampingAdvice(
    worstCode,
    maxTemp,
    minTemp,
    maxWind,
    totalPrecip,
  );

  const levelColors = {
    great: 'border-green-400/50 bg-green-50 dark:bg-green-950/30',
    good: 'border-sky-400/50 bg-sky-50 dark:bg-sky-950/30',
    caution: 'border-amber-400/50 bg-amber-50 dark:bg-amber-950/30',
    bad: 'border-red-400/50 bg-red-50 dark:bg-red-950/30',
  };

  const levelBadge = {
    great: { label: 'Rất thuận lợi', cls: 'bg-green-500' },
    good: { label: 'Thuận lợi', cls: 'bg-sky-500' },
    caution: { label: 'Cần chuẩn bị', cls: 'bg-amber-500' },
    bad: { label: 'Không thuận lợi', cls: 'bg-red-500' },
  };

  return (
    <div
      className={`rounded-xl border p-4 transition-all ${levelColors[level]}`}
    >
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-semibold">☁️ Dự báo thời tiết</span>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-bold text-white ${levelBadge[level].cls}`}
        >
          {levelBadge[level].label}
        </span>
      </div>

      {/* Day cards */}
      {relevantForecasts.length > 1 ? (
        <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
          {relevantForecasts.map(day => {
            const info = getWeatherInfo(day.weathercode);
            const d = new Date(day.date + 'T00:00:00');
            return (
              <div
                key={day.date}
                className="flex min-w-[64px] flex-col items-center gap-1 rounded-lg bg-background/60 p-2 text-center"
              >
                <span className="text-[10px] text-muted-foreground font-medium">
                  {format(d, 'dd/MM', { locale: vi })}
                </span>
                <span className={info.color}>{info.icon}</span>
                <span className="text-xs font-semibold">{day.tempMax}°</span>
                <span className="text-[10px] text-muted-foreground">
                  {day.tempMin}°
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        /* Single day */
        <div className="mb-3 flex items-center gap-3">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-xl ${weatherInfo.bg} ${weatherInfo.color}`}
          >
            {weatherInfo.icon}
          </div>
          <div>
            <p className="font-semibold text-sm">{weatherInfo.label}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Thermometer className="h-3 w-3" />
              <span>
                {mainForecast.tempMin}° – {mainForecast.tempMax}°C
              </span>
              <Wind className="h-3 w-3 ml-1" />
              <span>{mainForecast.windspeed} km/h</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {format(checkIn, "EEEE, dd/MM/yyyy", { locale: vi })}
            </p>
          </div>
        </div>
      )}

      {/* Summary for multi-day */}
      {relevantForecasts.length > 1 && (
        <div className="mb-3 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Thermometer className="h-3 w-3" />
            {minTemp}° – {maxTemp}°C
          </span>
          <span className="flex items-center gap-1">
            <Wind className="h-3 w-3" />
            Gió tối đa {maxWind} km/h
          </span>
          {totalPrecip > 0 && (
            <span className="flex items-center gap-1">
              <CloudRain className="h-3 w-3" />
              {totalPrecip.toFixed(1)}mm
            </span>
          )}
        </div>
      )}

      {/* Advice */}
      <p className="text-sm leading-relaxed text-foreground/80">{advice}</p>

      {/* <p className="mt-2 text-[10px] text-muted-foreground">
        Nguồn: Open-Meteo · Cập nhật mỗi 30 phút
      </p> */}
    </div>
  );
}
