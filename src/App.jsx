import { useState } from 'react';
import { HomeProvider } from './context/HomeContext';
import NavBar from './components/NavBar';
import GlobalBanner from './components/GlobalBanner';
import Dashboard from './pages/Dashboard';
import CommandCenter from './pages/CommandCenter';
import EnergyAuction from './pages/EnergyAuction';
import KidSafe from './pages/KidSafe';
import CareWatch from './pages/CareWatch';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [commandContext, setCommandContext] = useState('');

  const renderPage = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard
            setActiveTab={setActiveTab}
            setCommandContext={setCommandContext}
          />
        );
      case 'command':
        return <CommandCenter initialContext={commandContext} />;
      case 'energy':
        return <EnergyAuction />;
      case 'kidsafe':
        return <KidSafe />;
      case 'carewatch':
        return <CareWatch />;
      default:
        return null;
    }
  };

  return (
    <HomeProvider>
      <div className="min-h-screen bg-gray-50 flex flex-col text-gray-900">
        <NavBar activeTab={activeTab} setActiveTab={setActiveTab} />
        <GlobalBanner />
        <main className="flex-1 flex flex-col overflow-auto">
          <div
            key={activeTab}
            className="animate-fade-in flex-1 flex flex-col"
          >
            {renderPage()}
          </div>
        </main>
        {/* Background ambient glow - adapted for light mode */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-200/40 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-200/40 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-200/20 rounded-full blur-3xl" />
        </div>
      </div>
    </HomeProvider>
  );
}
