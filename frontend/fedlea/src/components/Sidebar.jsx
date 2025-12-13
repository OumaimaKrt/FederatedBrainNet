import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Activity, 
  BarChart3, 
  Shield, 
  Cpu,
  Brain,
  Layers,
  TestTube,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import './Sidebar.css';

const Sidebar = ({ collapsed, setCollapsed }) => {
  const location = useLocation();

  // -------------------------
  //  MAIN SECTION
  // -------------------------
  const mainMenuItems = [
    {
      path: "/",
      label: "Home",
      icon: <Home size={22} />,
      description: "Main page"
    },
  ];

  // -------------------------
  //  ANALYSIS SECTION
  // -------------------------
  const analysisMenuItems = [
    {
      path: "/dashboard",
      label: "Dashboard",
      icon: <BarChart3 size={20} />,
      description: "Overview and metrics"
    },
    {
      path: "/hospitals-monitoring",
      label: "Hospitals Monitoring",
      icon: <Activity size={20} />,
      description: "Clients activity tracking"
    },
    {
      path: "/rounds-explorer",
      label: "Rounds Explorer",
      icon: <Layers size={20} />,
      description: "Training rounds analysis"
    },
    {
      path: "/model-analytics",
      label: "Model Analytics",
      icon: <Cpu size={20} />,
      description: "Model performance insights"
    },
    {
      path: "/dataset-privacy",
      label: "Dataset Privacy",
      icon: <Shield size={20} />,
      description: "Privacy and anonymity checks"
    },
    {
      path: "/model-testing",
      label: "Model Testing",
      icon: <TestTube size={20} />,
      description: "Evaluate model predictions"
    }
  ];

  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      
      {/* --------------------------------
           HEADER
      --------------------------------*/}
      <div className="sidebar-header">
        <div className="logo-container">
          <div className="logo-icon">
            <Brain size={24} />
          </div>

          {!collapsed && (
            <div className="logo-text">
              <h1 className="logo-title">FedBrainScan</h1>
              <p className="logo-subtitle">Federated Learning Platform</p>
            </div>
          )}
        </div>

        <button 
          className="collapse-btn"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* --------------------------------
            NAVIGATION MENU
      --------------------------------*/}
      <nav className="sidebar-menu">

        {/* SECTION TITLE */}
        {!collapsed && (
          <div className="menu-section-title">Navigation</div>
        )}

        {/* MAIN MENU */}
        {mainMenuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`menu-item ${location.pathname === item.path ? 'active' : ''}`}
            title={collapsed ? item.label : ''}
          >
            <div className="menu-icon">
              {item.icon}
              {location.pathname === item.path && (
                <div className="active-indicator"></div>
              )}
            </div>

            {!collapsed && (
              <div className="menu-content">
                <span className="menu-label">{item.label}</span>
                <span className="menu-description">{item.description}</span>
              </div>
            )}

            {!collapsed && location.pathname === item.path && (
              <div className="active-arrow">→</div>
            )}
          </Link>
        ))}

        {/* DIVIDER */}
        {!collapsed && (
          <div className="menu-divider">
            <span>Analysis & Monitoring</span>
          </div>
        )}

        {/* ANALYSIS MENU */}
        {analysisMenuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`menu-item ${location.pathname === item.path ? 'active' : ''}`}
            title={collapsed ? item.label : ''}
          >
            <div className="menu-icon">
              {item.icon}
              {location.pathname === item.path && (
                <div className="active-indicator"></div>
              )}
            </div>

            {!collapsed && (
              <div className="menu-content">
                <span className="menu-label">{item.label}</span>
                <span className="menu-description">{item.description}</span>
              </div>
            )}

            {!collapsed && location.pathname === item.path && (
              <div className="active-arrow">→</div>
            )}
          </Link>
        ))}

      </nav>
    </div>
  );
};

export default Sidebar;
