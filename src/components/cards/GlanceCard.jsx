import React from 'react';
import { Thermometer, Droplets, Activity } from 'lucide-react';
import { useHome } from '../../context/HomeContext';

export default function GlanceCard({ title, roomId }) {
  const { state } = useHome();
  const room = state.rooms[roomId];

  if (!room) return null;

  const sensors = [
    {
      id: 'temp',
      label: 'Temperature',
      value: `${room.temp.toFixed(1)}°C`,
      icon: Thermometer,
      color: 'text-orange-400'
    },
    {
      id: 'humidity',
      label: 'Humidity',
      value: `${room.humidity.toFixed(0)}%`,
      icon: Droplets,
      color: 'text-cyan-400'
    },
    {
      id: 'motion',
      label: 'Occupancy',
      value: room.motion ? 'Active' : 'Clear',
      icon: Activity,
      color: room.motion ? 'text-emerald-400' : 'text-gray-500'
    }
  ];

  return (
    <div className="lovelace-card flex flex-col gap-3">
      {title && <h3 className="text-lg font-medium text-gray-200 mb-2 px-1">{title}</h3>}
      <div className="flex justify-around items-end">
        {sensors.map((sensor) => (
          <div key={sensor.id} className="flex flex-col items-center gap-2">
            <div className={`p-2 rounded-full bg-gray-800/50 ${sensor.color}`}>
              <sensor.icon className="w-5 h-5" />
            </div>
            <div className="text-sm font-semibold text-gray-100">{sensor.value}</div>
            <div className="text-xs text-gray-500">{sensor.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
