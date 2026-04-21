import React from 'react';
import { Power } from 'lucide-react';
import { useHome } from '../../context/HomeContext';

export default function EntitiesCard({ title, entities, roomId }) {
  const { state, dispatch } = useHome();
  const room = state.rooms[roomId];

  if (!room) return null;

  const handleToggle = (device, currentState) => {
    dispatch({
      type: 'TOGGLE_DEVICE',
      payload: { roomId, device, state: !currentState }
    });
  };

  return (
    <div className="lovelace-card flex flex-col gap-3">
      {title && <h3 className="text-lg font-medium text-gray-200 mb-1 px-1">{title}</h3>}
      <div className="flex flex-col gap-1">
        {entities.map(({ device, label, icon: Icon, color }) => {
          const isOn = room.devices[device];
          return (
            <div key={device} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-800/50 transition-colors">
              <div className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isOn ? color.bg : 'bg-gray-800'}`}>
                  <Icon className={`w-4 h-4 ${isOn ? color.icon : 'text-gray-400'}`} />
                </div>
                <span className="text-sm font-medium text-gray-300">{label}</span>
              </div>
              
              <button 
                onClick={() => handleToggle(device, isOn)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${isOn ? 'bg-indigo-500' : 'bg-gray-700'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isOn ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
