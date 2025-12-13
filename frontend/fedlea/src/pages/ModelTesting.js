import React, { useState } from "react";
import { 
  FiUpload, 
  FiPlay, 
  FiPause, 
  FiRefreshCw,
  FiBarChart2,
  FiAlertCircle,
  FiCheckCircle
} from "react-icons/fi";
import "../App.css";

function ModelTesting() {
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  // --------------------------
  // (1) UPLOAD IMAGE
  // --------------------------
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  // --------------------------
  // (2) SEND IMAGE TO BACKEND
  // --------------------------
  const startTesting = async () => {
    if (!selectedFile) return;

    setIsTesting(true);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch("http://127.0.0.1:5000/predict", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      setTestResults(data);

    } catch (error) {
      console.error("Erreur API:", error);
    }

    setIsTesting(false);
  };

  return (
    <div className="page-content">
      <div className="dashboard-header">
        <div>
          <h1>Model Testing</h1>
          <p className="dashboard-subtitle">
            Test the model on new input data
          </p>
        </div>
      </div>

      <div className="charts-section">

        {/* Upload Section */}
        <div className="chart-container">
          <div className="chart-header">
            <h2 className="chart-title">
              <FiUpload /> Test Data Upload
            </h2>
          </div>
          
          <div className="upload-section">
            <div className="upload-area">
              <input
                type="file"
                id="file-upload"
                className="file-input"
                onChange={handleFileUpload}
                accept=".jpg,.jpeg,.png"
              />
              <label htmlFor="file-upload" className="upload-label">
                <FiUpload size={48} />
                <span>Drag & drop or click to upload</span>
                <span className="upload-hint">
                  Supported formats: JPG, PNG
                </span>
              </label>
              
              {selectedFile && (
                <div className="file-info">
                  <FiCheckCircle color="#10b981" />
                  <span>{selectedFile.name}</span>
                  <span className="file-size">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
              )}
            </div>
            
            <button 
              className="download-btn" 
              onClick={startTesting}
              disabled={isTesting || !selectedFile}
            >
              {isTesting ? (
                <>
                  <FiRefreshCw className="spin" /> Testing in progress...
                </>
              ) : (
                <>
                  <FiPlay /> Start Testing
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results Section */}
        <div className="chart-container">
          <div className="chart-header">
            <h2 className="chart-title">
              <FiBarChart2 /> Test Results
            </h2>
          </div>
          
          {testResults ? (
            <div className="test-results">
              <div className="result-card">

                <div className="result-header">
                  <h3>Prediction</h3>
                  <span 
                    className={`prediction ${
                      testResults.prediction?.includes("Tumor") ? "danger" : "success"
                    }`}
                  >
                    {testResults.prediction}
                  </span>
                </div>

                <div className="result-metrics">
                  <div className="metric">
                    <span className="metric-label">Confidence</span>
                    <span className="metric-value">
                      {(testResults.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div className="result-actions">
                  <button 
                    className="download-btn"
                    onClick={() => { setSelectedFile(null); setTestResults(null); }}
                  >
                    <FiRefreshCw /> Test Another File
                  </button>
                </div>

              </div>
            </div>

          ) : (
            <div className="no-results">
              <FiAlertCircle size={48} />
              <p>No test performed yet. Upload a file to begin.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default ModelTesting;
