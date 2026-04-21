import { useHome } from '../context/HomeContext';
import { Shield, AlertTriangle, X } from 'lucide-react';

export default function GlobalBanner() {
  const { state, dispatch } = useHome();

  if (!state.homeSecurity && state.anomalies.filter(a => a.type === 'danger').length === 0) {
    return null;
  }

  const dangerAnomalies = state.anomalies.filter(a => a.type === 'danger');

  return (
    <div className="w-full">
      {state.homeSecurity && (
        <div className="bg-red-600/90 backdrop-blur text-white px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 animate-pulse" />
            <span className="font-bold text-sm">🚨 Home Secured — Emergency Mode Active</span>
          </div>
          <button
            onClick={() => dispatch({ type: 'SET_SECURITY_MODE', payload: false })}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {dangerAnomalies.map(a => (
        <div key={a.id} className="bg-orange-600/90 backdrop-blur text-white px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 animate-bounce" />
            <span className="font-semibold text-sm">{a.message}</span>
            <span className="text-xs text-orange-200">{a.timestamp}</span>
          </div>
          <button
            onClick={() => dispatch({ type: 'CLEAR_ANOMALY', payload: { id: a.id } })}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
