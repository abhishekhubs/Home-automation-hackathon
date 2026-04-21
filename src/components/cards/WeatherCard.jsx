import React from 'react';
import { CloudRain, Wind, Droplets } from 'lucide-react';
import { useHome } from '../../context/HomeContext';

export default function WeatherCard() {
  const { state } = useHome();
  
  // Calculate average home temperature to use as mock "weather" temp
  const totalRooms = Object.keys(state.rooms).length;
  const avgTemp = Object.values(state.rooms).reduce((s, r) => s + r.temp, 0) / totalRooms;

  return (
    <div className="lovelace-card flex flex-col gap-4 overflow-hidden relative">
      {/* Background illustration mock */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 to-[#1c1c1c] pointer-events-none" />
      
      <div className="relative z-10 flex justify-between items-start">
        <div>
          <h3 className="text-xl font-semibold text-white">Home</h3>
          <p className="text-sm text-blue-200">Partly Cloudy</p>
        </div>
        <div className="text-4xl font-light text-white flex items-start">
          {avgTemp.toFixed(1)}<span className="text-xl mt-1 text-gray-300">°C</span>
        </div>
      </div>
      
      <div className="relative z-10 flex items-center justify-between mt-2 pt-4 border-t border-gray-700/50">
        <div className="flex items-center gap-1.5 text-sm text-gray-300">
          <Droplets className="w-4 h-4 text-blue-400" />
          <span>64%</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-gray-300">
          <Wind className="w-4 h-4 text-gray-400" />
          <span>12 km/h</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-gray-300">
          <CloudRain className="w-4 h-4 text-blue-300" />
          <span>10%</span>
        </div>
      </div>
    </div>
  );
}
