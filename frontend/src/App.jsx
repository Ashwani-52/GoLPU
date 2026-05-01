import React, { useState } from 'react';
import ChatPanel from './components/ChatPanel';
import MapView from './components/MapView';

function App() {
  const [routeData, setRouteData] = useState(null);

  const handleRouteFound = (data) => {
    setRouteData(data);
  };

  return (
    <div className="flex h-screen w-full bg-navy-950 overflow-hidden font-body text-white">
      {/* Left Sidebar - Chat & Inputs */}
      <div className="w-full md:w-[400px] lg:w-[450px] flex-shrink-0 relative z-20 h-full">
        <ChatPanel onRouteFound={handleRouteFound} />
      </div>

      {/* Right Side - Map */}
      <div className="flex-1 relative z-10 h-full">
        <MapView routeData={routeData} />
      </div>
    </div>
  );
}

export default App;
