// src/pages/DatasetPrivacy.js
import React, { useEffect, useState } from "react";
import "../App.css";
import { 
  FiDatabase, 
  FiShield, 
  FiLock, 
  FiEyeOff,
  FiUsers,
  FiImage,
  FiActivity,
  FiCheckCircle,
  FiLoader,
  FiBarChart2
} from "react-icons/fi";

function DatasetPrivacy() {
  const [clientsData, setClientsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [privacyStats, setPrivacyStats] = useState({
    totalImages: 0,
    tumorRatio: 0,
    healthyRatio: 0,
    hospitalsCount: 0,
    totalTumor: 0,
    totalHealthy: 0
  });

  const hospitalIds = ['hopital_1', 'hopital_2', 'hopital_3'];

  const formatHospitalName = (id) => id.replace('_', ' ').toUpperCase();

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        // Fetch global clients stats depuis le backend Flask
        const res = await fetch("http://127.0.0.1:5000/api/clients_stats");
        if (!res.ok) throw new Error("Impossible de récupérer clients_stats.json");
        const data = await res.json();

        const dataArr = [];
        let totalImages = 0;
        let totalTumor = 0;
        let totalHealthy = 0;

        hospitalIds.forEach(hospitalId => {
          const stats = data[hospitalId] || { total_images: 0, tumor: 0, healthy: 0 };
          const { total_images, tumor, healthy } = stats;

          const tumorPercentage = total_images > 0 ? ((tumor / total_images) * 100).toFixed(1) : '0.0';
          const healthyPercentage = total_images > 0 ? ((healthy / total_images) * 100).toFixed(1) : '0.0';

          dataArr.push({
            client: formatHospitalName(hospitalId),
            hospitalId,
            total_images,
            tumor,
            healthy,
            tumorPercentage,
            healthyPercentage
          });

          totalImages += total_images;
          totalTumor += tumor;
          totalHealthy += healthy;
        });

        // Tri des hôpitaux par numéro
        dataArr.sort((a, b) => {
          const numA = parseInt(a.hospitalId.match(/\d+/)[0]);
          const numB = parseInt(b.hospitalId.match(/\d+/)[0]);
          return numA - numB;
        });

        setClientsData(dataArr);

        setPrivacyStats({
          totalImages: totalImages.toLocaleString(),
          tumorRatio: totalImages ? ((totalTumor / totalImages) * 100).toFixed(1) : '0.0',
          healthyRatio: totalImages ? ((totalHealthy / totalImages) * 100).toFixed(1) : '0.0',
          hospitalsCount: dataArr.length,
          totalTumor,
          totalHealthy
        });

      } catch (err) {
        console.error("Erreur lors du chargement des données :", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="dataset-privacy-page">
        <div className="loading-container">
          <FiLoader className="spin" size={48} />
          <p className="loading-text">Loading hospital statistics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dataset-privacy-page">
      {/* Page Header */}
      <div className="dataset-header">
        <h1 className="main-title">
          <FiBarChart2 /> Dataset & Privacy
        </h1>
        <p className="main-subtitle">
          Data privacy and distribution per hospital
        </p>
      </div>

      {/* Global Stats - Total Images */}
      <div className="main-stat-card">
        <div className="main-stat-content">
          <div className="main-stat-icon">
            <FiDatabase />
          </div>
          <div className="main-stat-text">
            <div className="main-stat-value">{privacyStats.totalImages}</div>
            <div className="main-stat-label">Total Federated Images</div>
            <div className="main-stat-breakdown">
              <span className="breakdown-tumor">{privacyStats.totalTumor} tumor</span>
              <span className="breakdown-divider">•</span>
              <span className="breakdown-healthy">{privacyStats.totalHealthy} healthy</span>
            </div>
          </div>
        </div>
      </div>

      {/* Privacy Section */}
      <div className="section-title">
        <h2>Data Privacy</h2>
      </div>
      
      <div className="privacy-grid">
        <div className="privacy-card">
          <div className="privacy-card-header">
            <div className="privacy-icon">
              <FiShield />
            </div>
            <h3>Data Privacy</h3>
          </div>
          <div className="privacy-card-content">
            <p>
              Medical images remain <strong>strictly local</strong> inside each hospital.
              Only model gradients are exchanged through the federated network.
            </p>
          </div>
        </div>

        <div className="privacy-card">
          <div className="privacy-card-header">
            <div className="privacy-icon">
              <FiLock />
            </div>
            <h3>AES-256 Encryption</h3>
          </div>
          <div className="privacy-card-content">
            <p>
              All communications are encrypted and anonymized.  
              Maximum protection for sensitive data.
            </p>
          </div>
        </div>

        <div className="privacy-card">
          <div className="privacy-card-header">
            <div className="privacy-icon">
              <FiEyeOff />
            </div>
            <h3>Local Processing</h3>
          </div>
          <div className="privacy-card-content">
            <p>
              <strong>100% of the data</strong> is processed locally.  
              No images are ever transferred to the central server.
            </p>
          </div>
        </div>
      </div>

      {/* Hospital Distribution */}
      <div className="section-title">
        <h2><FiDatabase /> Hospital Distribution</h2>
        <p className="section-subtitle">
          {privacyStats.hospitalsCount} active hospitals out of {hospitalIds.length}
        </p>
      </div>

      <div className="hospitals-grid">
        {clientsData.map(client => (
          <div key={client.client} className="hospital-card">
            <div className="hospital-card-header">
              <div className="hospital-header-left">
                <h3>{client.client}</h3>
                <span className="hospital-image-count">
                  {client.total_images.toLocaleString()} images
                </span>
              </div>
            </div>

            <div className="hospital-metrics">
              <div className="hospital-metric">
                <div className="metric-label">
                  <FiImage /> Total Images
                </div>
                <div className="metric-value-large">
                  {client.total_images.toLocaleString()}
                </div>
              </div>

              <div className="hospital-metric">
                <div className="metric-label">
                  <FiActivity /> Tumor
                </div>
                <div className="metric-value-danger">
                  {client.tumor.toLocaleString()}
                  <span className="metric-percentage">({client.tumorPercentage}%)</span>
                </div>
              </div>

              <div className="hospital-metric">
                <div className="metric-label">
                  <FiCheckCircle /> Healthy
                </div>
                <div className="metric-value-success">
                  {client.healthy.toLocaleString()}
                  <span className="metric-percentage">({client.healthyPercentage}%)</span>
                </div>
              </div>
            </div>

            <div className="distribution-section">
              <div className="distribution-bar">
                <div 
                  className="distribution-segment tumor" 
                  style={{ width: `${client.tumorPercentage}%` }}
                  title={`Tumor: ${client.tumorPercentage}%`}
                >
                  {parseFloat(client.tumorPercentage) > 15 && (
                    <span className="segment-label">Tumor</span>
                  )}
                </div>

                <div 
                  className="distribution-segment healthy" 
                  style={{ width: `${client.healthyPercentage}%` }}
                  title={`Healthy: ${client.healthyPercentage}%`}
                >
                  {parseFloat(client.healthyPercentage) > 15 && (
                    <span className="segment-label">Healthy</span>
                  )}
                </div>
              </div>
              
              <div className="distribution-numbers">
                <div className="distribution-number">
                  <span className="number-label tumor">Tumor</span>
                  <span className="number-value">{client.tumor} ({client.tumorPercentage}%)</span>
                </div>
                <div className="distribution-number">
                  <span className="number-label healthy">Healthy</span>
                  <span className="number-value">{client.healthy} ({client.healthyPercentage}%)</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Global Statistics */}
      <div className="section-title">
        <h2><FiUsers /> Global Statistics</h2>
        <p className="section-subtitle">
          Overview of all federated data
        </p>
      </div>

      <div className="global-stats-grid">
        <div className="global-stat-card">
          <div className="global-stat-header">
            <div className="global-stat-icon">
              <FiDatabase />
            </div>
            <h3>Total Images</h3>
          </div>
          <div className="global-stat-content">
            <div className="global-stat-value">{privacyStats.totalImages}</div>
            <div className="global-stat-breakdown">
              <div className="breakdown-item">
                <span className="breakdown-label tumor">Tumor</span>
                <span className="breakdown-value">{privacyStats.totalTumor}</span>
              </div>
              <div className="breakdown-item">
                <span className="breakdown-label healthy">Healthy</span>
                <span className="breakdown-value">{privacyStats.totalHealthy}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="global-stat-card">
          <div className="global-stat-header">
            <div className="global-stat-icon">
              <FiActivity />
            </div>
            <h3>Tumor Rate</h3>
          </div>
          <div className="global-stat-content">
            <div className="global-stat-value">{privacyStats.tumorRatio}%</div>
            <p className="global-stat-description">
              Average across {privacyStats.hospitalsCount} participating hospitals
            </p>
          </div>
        </div>

        <div className="global-stat-card">
          <div className="global-stat-header">
            <div className="global-stat-icon">
              <FiCheckCircle />
            </div>
            <h3>Healthy Rate</h3>
          </div>
          <div className="global-stat-content">
            <div className="global-stat-value">{privacyStats.healthyRatio}%</div>
            <p className="global-stat-description">
              Images with no detected pathology
            </p>
          </div>
        </div>

        <div className="global-stat-card">
          <div className="global-stat-header">
            <div className="global-stat-icon">
              <FiUsers />
            </div>
            <h3>Participating Hospitals</h3>
          </div>
          <div className="global-stat-content">
            <div className="global-stat-value">
              {privacyStats.hospitalsCount}<span className="value-denominator">/{hospitalIds.length}</span>
            </div>
            <p className="global-stat-description">
              {privacyStats.hospitalsCount === hospitalIds.length 
                ? "All hospitals are active" 
                : "Some files are missing"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DatasetPrivacy;
