import React from 'react';
import { useHome } from '../../context/HomeContext';

export default function ButtonCard({ roomId, device, label, icon: Icon, color, onClick }) {
  const { state, dispatch } = useHome();
  const room = state.rooms[roomId];

  if (!room) return null;

  const isOn = room.devices[device];

  const handlePress = () => {
    if (onClick) {
      onClick();
      return;
    }
    dispatch({
      type: 'TOGGLE_DEVICE',
      payload: { roomId, device, state: !isOn }
    });
  };

  return (
    <button
      onClick={handlePress}
      className={`lovelace-card flex flex-col items-center justify-center p-4 aspect-square transition-all duration-200 hover:bg-gray-800/80 active:scale-95 cursor-pointer ${isOn ? color.bg : 'bg-[#1c1c1c]'}`}
    >
      <Icon className={`w-8 h-8 mb-3 ${isOn ? color.icon : 'text-gray-500'}`} />
      <span className={`text-sm font-medium ${isOn ? 'text-white' : 'text-gray-400'}`}>
        {label}
      </span>
      <span className={`text-xs mt-1 ${isOn ? color.text : 'text-gray-600'}`}>
        {isOn ? 'On' : 'Off'}
      </span>
    </button>
  );
}
