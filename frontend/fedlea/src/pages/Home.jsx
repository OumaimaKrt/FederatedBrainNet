import React from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

  const handleTryDemo = () => {
    // Redirect to the ModelTesting page
    navigate('/model-testing');
  };

  const handleDocumentation = () => {
    // Your documentation logic
    console.log('Documentation to implement');
  };

  return (
    <div className="home-page">
      <div className="home-container">
        <h1 className="main-title">
          Brain Tumor Detection via<br />
          <span className="highlight">Federated Learning</span>
        </h1>
        
        <p className="subtitle">
          A distributed, secure, and privacy-preserving Artificial Intelligence.
        </p>
        
        <div className="action-buttons">
          <button 
            className="primary-btn" 
            onClick={handleTryDemo}
          >
            Try the demo
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
