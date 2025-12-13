// src/pages/ModelAnalytics.js
import React, { useEffect, useState } from "react";
import "../App.css";
import { Line } from "react-chartjs-2";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

import {
  FiCpu, FiLayers, FiUsers, FiPackage,
  FiTrendingUp, FiTrendingDown, FiLoader,
  FiFilter, FiMaximize, FiBox
} from "react-icons/fi";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

function ModelAnalytics() {
  const [metrics, setMetrics] = useState([]);
  const [latest, setLatest] = useState(null);
  const [loading, setLoading] = useState(true);

  // architecture (unchanged)
  const modelArchitecture = [
    { layer: "Input", shape: "(224, 224, 1)", icon: <FiBox /> },
    { layer: "Conv2D", filters: 16, kernel: "(3, 3)", activation: "ReLU", padding: "same", icon: <FiFilter /> },
    { layer: "MaxPooling2D", poolSize: "(2, 2)", icon: <FiMaximize /> },
    { layer: "Conv2D", filters: 32, kernel: "(3, 3)", activation: "ReLU", padding: "same", icon: <FiFilter /> },
    { layer: "MaxPooling2D", poolSize: "(2, 2)", icon: <FiMaximize /> },
    { layer: "Conv2D", filters: 64, kernel: "(3, 3)", activation: "ReLU", padding: "same", icon: <FiFilter /> },
    { layer: "MaxPooling2D", poolSize: "(2, 2)", icon: <FiMaximize /> },
    { layer: "Flatten", icon: <FiLayers /> },
    { layer: "Dense", units: 128, activation: "ReLU", icon: <FiCpu /> },
    { layer: "Dense", units: 1, activation: "sigmoid", icon: <FiCpu /> },
  ];

  // -------------------------------
  // Chargement — APPELER /metrics UNE FOIS
  // -------------------------------
  useEffect(() => {
    async function loadAllMetricsOnce() {
      setLoading(true);
      try {
        const res = await fetch("http://127.0.0.1:5000/metrics");
        if (!res.ok) throw new Error("Impossible de charger /metrics depuis le backend");

        const json = await res.json();

        // Le backend peut renvoyer soit { metrics: [...] } soit [...] directement
        const logs = Array.isArray(json) ? json : (json.metrics || json);

        if (!Array.isArray(logs) || logs.length === 0) {
          throw new Error("Aucune métrique trouvée dans la réponse du backend");
        }

        // Construire les rounds (round = index + 1)
        const rounds = logs.map((entry, idx) => {
          // entry est un objet comme { client_1: {accuracy:..., loss:...}, client_2: {...}, avg_accuracy: ... }
          const clientKeys = Object.keys(entry).filter(k =>
            k.startsWith("client_") || k.startsWith("hopital_")
          );

          // Calculer avg_accuracy proprement : si backend fournit avg_accuracy on l'utilise, sinon on calcule
          const avg_accuracy = (typeof entry.avg_accuracy === "number")
            ? entry.avg_accuracy
            : (clientKeys.length > 0
                ? clientKeys.reduce((s, c) => s + (entry[c]?.accuracy || 0), 0) / clientKeys.length
                : 0
              );

          // Calculer avg_loss (pareil)
          const avg_loss = (typeof entry.avg_loss === "number")
            ? entry.avg_loss
            : (clientKeys.length > 0
                ? clientKeys.reduce((s, c) => s + (entry[c]?.loss || 0), 0) / clientKeys.length
                : 0
              );

          return {
            round: idx + 1,
            ...entry,
            avg_accuracy,
            avg_loss,
            clientKeys
          };
        });

        setMetrics(rounds);
        setLatest(rounds[rounds.length - 1]);
      } catch (err) {
        console.error("Erreur loadAllMetricsOnce:", err);
        setMetrics([]); setLatest(null);
      } finally {
        setLoading(false);
      }
    }

    loadAllMetricsOnce();
  }, []);

  const clients = latest
    ? (latest.clientKeys || Object.keys(latest).filter(k => k.startsWith("client_") || k.startsWith("hopital_")))
    : [];

  // approx param calc (unchanged)
  const calculateTotalParams = () => {
    let total = 0;
    total += 160;
    total += 4640;
    total += 18496;
    const flattenedSize = 50176;
    total += (flattenedSize + 1) * 128;
    total += 129;
    return total.toLocaleString();
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { color: '#e2e8f0', font: { size: 12 } } }
    },
    scales: {
      y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#94a3b8' } },
      x: { grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#94a3b8' } }
    }
  };

  const accuracyData = {
    labels: metrics.map(m => `R${m.round}`),
    datasets: [{
      label: "Accuracy",
      data: metrics.map(m => m.avg_accuracy ?? 0),
      borderColor: "#10b981",
      backgroundColor: "rgba(16, 185, 129, 0.1)",
      fill: true,
      tension: 0.4,
      borderWidth: 3,
      pointBackgroundColor: "#10b981",
      pointBorderColor: "#ffffff",
      pointBorderWidth: 2,
      pointRadius: 5
    }]
  };

  const lossData = {
    labels: metrics.map(m => `R${m.round}`),
    datasets: [{
      label: "Loss",
      data: metrics.map(m => m.avg_loss ?? 0),
      borderColor: "#ef4444",
      backgroundColor: "rgba(239, 68, 68, 0)",
      fill: false,
      tension: 0.4,
      borderWidth: 3,
      pointBackgroundColor: "#ef4444",
      pointBorderColor: "#ffffff",
      pointBorderWidth: 2,
      pointRadius: 5
    }]
  };

  if (loading) {
    return (
      <div className="page-content">
        <div className="loading-spinner">
          <FiLoader className="spin" size={40} />
          <p style={{ marginTop: '20px', color: '#94a3b8' }}>Chargement des métriques...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="dashboard-header">
        <div>
          <h1>Global Model Analytics</h1>
          <p className="dashboard-subtitle">CNN Architecture for Brain Tumor Detection</p>
        </div>
        <div className="kpi-card" style={{ minWidth: "220px" }}>
          <div className="kpi-card-content">
            <div className="kpi-card-title"><FiLayers /> ARCHITECTURE</div>
            <div className="kpi-card-value">10 layers</div>
            <div className="kpi-card-trend"><FiCpu /> Full CNN</div>
          </div>
        </div>
      </div>

      {/* Architecture (identique à ton design) */}
      <div className="chart-container" style={{ marginBottom: "30px" }}>
        <div className="chart-header">
          <h2 className="chart-title"><FiLayers /> TensorFlow/Keras Model Architecture</h2>
        </div>

        <div className="architecture-grid">
          {modelArchitecture.map((layer, idx) => (
            <div key={idx} className="architecture-card">
              <div className="architecture-layer-header">
                <div className="layer-icon">{layer.icon}</div>
                <span className="layer-name">{layer.layer}</span>
              </div>
              <div className="layer-details">
                {layer.shape && <div className="layer-detail"><span className="detail-label">Shape:</span><span className="detail-value">{layer.shape}</span></div>}
                {layer.filters && <div className="layer-detail"><span className="detail-label">Filters:</span><span className="detail-value">{layer.filters}</span></div>}
                {layer.units && <div className="layer-detail"><span className="detail-label">Units:</span><span className="detail-value">{layer.units}</span></div>}
                {layer.kernel && <div className="layer-detail"><span className="detail-label">Kernel:</span><span className="detail-value">{layer.kernel}</span></div>}
                {layer.poolSize && <div className="layer-detail"><span className="detail-label">Pool Size:</span><span className="detail-value">{layer.poolSize}</span></div>}
                {layer.activation && <div className="layer-detail"><span className="detail-label">Activation:</span><span className="detail-value activation">{layer.activation}</span></div>}
                {layer.padding && <div className="layer-detail"><span className="detail-label">Padding:</span><span className="detail-value">{layer.padding}</span></div>}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px", marginTop: "25px" }}>
          <div className="info-card-small"><div className="info-label">Total Parameters</div><div className="info-value">{calculateTotalParams()}</div><div className="info-desc">Trainable weights</div></div>
          <div className="info-card-small"><div className="info-label">Model Version</div><div className="info-value" style={{ fontSize:"0.95rem", fontFamily:"Monaco, Consolas, monospace", color:"#3b82f6", padding:"8px", background:"rgba(59,130,246,0.1)", borderRadius:"6px", border:"1px solid rgba(59,130,246,0.2)" }}>{latest ? `global_model_round${latest.round}` : "--"}</div></div>
          <div className="info-card-small"><div className="info-label">Connected Hospitals</div><div className="info-value">{clients.length}</div><div className="info-desc">Active participants</div></div>
          <div className="info-card-small"><div className="info-label">Completed Rounds</div><div className="info-value">{metrics.length}</div><div className="info-desc">Federated training</div></div>
        </div>
      </div>

      {/* Charts */}
      {metrics.length > 0 && (
        <div className="charts-section">
          <div className="chart-container">
            <div className="chart-header"><h2 className="chart-title"><FiTrendingUp /> Global Accuracy per Round</h2></div>
            <div className="chart-wrapper"><Line data={accuracyData} options={chartOptions} /></div>
          </div>

          <div className="chart-container">
            <div className="chart-header"><h2 className="chart-title"><FiTrendingDown /> Global Loss per Round</h2></div>
            <div className="chart-wrapper"><Line data={lossData} options={chartOptions} /></div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ModelAnalytics;
