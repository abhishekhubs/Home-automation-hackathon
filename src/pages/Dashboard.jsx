import React from 'react';

export default function Dashboard() {
  return (
    <div className="w-full h-[calc(100vh-64px)] bg-black overflow-hidden animate-fade-in">
      <iframe
        src="https://demo.home-assistant.io/#/lovelace/home"
        title="Home Assistant Dashboard"
        className="w-full h-full border-0"
        allowFullScreen
      />
    </div>
  );
}
