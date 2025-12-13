import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";

// Pages principales
import Home from "./pages/Home";

// Pages admin/dashboard
import Dashboard from "./pages/Dashboard";
import HospitalsMonitoring from "./pages/HospitalsMonitoring";
import RoundsExplorer from "./pages/RoundsExplorer";
import ModelAnalytics from "./pages/ModelAnalytics";
import DatasetPrivacy from "./pages/DatasetPrivacy";
import ModelTesting from "./pages/ModelTesting";

import "./App.css";

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <BrowserRouter>
      <div className="app">
        <Sidebar 
          collapsed={sidebarCollapsed} 
          setCollapsed={setSidebarCollapsed} 
        />
        
        <div className={`main-content ${sidebarCollapsed ? 'collapsed' : ''}`}>
          
          <div className="content-container">
            <Routes>
              {/* Route racine et accueil */}
              <Route path="/" element={<Home />} />
              <Route path="/home" element={<Home />} />
              
              {/* Route démo */}
              
              {/* Routes admin/dashboard */}
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/hospitals-monitoring" element={<HospitalsMonitoring />} />
              <Route path="/hospitals" element={<Navigate to="/hospitals-monitoring" replace />} />
              
              <Route path="/rounds-explorer" element={<RoundsExplorer />} />
              <Route path="/rounds" element={<Navigate to="/rounds-explorer" replace />} />
              
              <Route path="/model-analytics" element={<ModelAnalytics />} />
              <Route path="/model" element={<Navigate to="/model-analytics" replace />} />
              
              <Route path="/dataset-privacy" element={<DatasetPrivacy />} />
              <Route path="/privacy" element={<Navigate to="/dataset-privacy" replace />} />
              
              <Route path="/model-testing" element={<ModelTesting />} />
              <Route path="/testing" element={<Navigate to="/model-testing" replace />} />
              

              
              {/* Page 404 */}
              <Route path="*" element={
                <div className="page-not-found">
                  <h1>404</h1>
                  <p>Page non trouvée</p>
                </div>
              } />
            </Routes>
          </div>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;