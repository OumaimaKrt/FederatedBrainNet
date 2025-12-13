import React, { useEffect, useState } from "react";
import "../App.css";
import { Line } from "react-chartjs-2";

import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  Title,
  Filler
} from "chart.js";

import { 
  FiActivity, 
  FiTrendingUp, 
  FiTrendingDown, 
  FiWifi, 
  FiBarChart2,
  FiAlertCircle,
  FiCheckCircle,
  FiDatabase,
  FiLoader
} from "react-icons/fi";

ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  Title,
  Filler
);

function HospitalsMonitoring() {
  const [metrics, setMetrics] = useState([]);
  const [latest, setLatest] = useState(null);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // -----------------------------------------------------------
  // 🔥 Correction ici : lire depuis le backend Flask
  // -----------------------------------------------------------
  useEffect(() => {
    async function loadMetrics() {
      setLoading(true);

      try {
        const res = await fetch("http://127.0.0.1:5000/metrics");

        if (!res.ok) {
          throw new Error("Impossible de charger les métriques depuis le backend.");
        }

        const data = await res.json();

        const logs = data.metrics;
        if (!logs || logs.length === 0) {
          throw new Error("Aucune métrique trouvée dans le backend.");
        }

        // Reconstruction des rounds
        const roundsData = logs.map((entry, index) => ({
          round: index + 1,
          ...entry
        }));

        // Extraction des clients
        const clientsSet = new Set();
        logs.forEach(entry => {
          Object.keys(entry).forEach(key => {
            if (key.startsWith("client_") || key.startsWith("hopital_")) {
              clientsSet.add(key);
            }
          });
        });

        setMetrics(roundsData);
        setLatest(roundsData[roundsData.length - 1]);
        setClients(Array.from(clientsSet));

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadMetrics();
  }, []);

  // -----------------------------------------------------------
  // Options des graphiques
  // -----------------------------------------------------------
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#e2e8f0',
          font: { size: 12 }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        min: 0.8,
        max: 1.0,
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
        ticks: {
          color: '#94a3b8',
          callback: value => (value * 100).toFixed(0) + '%'
        }
      },
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
        ticks: { color: '#94a3b8' }
      }
    }
  };

  // -----------------------------------------------------------
  // Calcul de la tendance d'un client
  // -----------------------------------------------------------
  const calculateTrend = (clientId) => {
    if (metrics.length < 2) return 0;

    const firstRound = metrics.find(m => m[clientId]?.accuracy !== undefined);
    const lastRound = metrics.findLast(m => m[clientId]?.accuracy !== undefined);

    if (!firstRound || !lastRound) return 0;

    return (lastRound[clientId]?.accuracy || 0) - (firstRound[clientId]?.accuracy || 0);
  };

  // -----------------------------------------------------------
  // Nombre de rounds dans lesquels le client a participé
  // -----------------------------------------------------------
  const calculateRoundsParticipated = (clientId) => {
    return metrics.filter(m => m[clientId] !== undefined).length;
  };

  // -----------------------------------------------------------
  // ÉTATS DE CHARGEMENT / ERREURS
  // -----------------------------------------------------------
  if (loading) {
    return (
      <div className="page-content">
        <div className="loading-spinner">
          <FiLoader className="spin" size={40} />
          <p style={{ marginTop: '20px', color: '#94a3b8' }}>
            Chargement des métriques depuis le backend...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-content">
        <div className="error-state">
          <FiAlertCircle size={48} color="#ef4444" />
          <h2>Erreur de chargement</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------
  // RENDU PRINCIPAL
  // -----------------------------------------------------------
  return (
    <div className="page-content">
      <div className="dashboard-header">
        <div>
          <h1>Hospitals Monitoring</h1>
        </div>

        <div className="kpi-card" style={{ minWidth: '220px' }}>
          <div className="kpi-card-content">
            <div className="kpi-card-title">
              <FiDatabase /> REAL DATA
            </div>
            <div className="kpi-card-value">{clients.length}</div>
            <div className="kpi-card-trend">
              <FiCheckCircle /> {metrics.length} rounds
            </div>
          </div>
        </div>
      </div>

      {/* --------------------------------------------------- */}
      {/*  ★ Cartes des hôpitaux */}
      {/* --------------------------------------------------- */}
      <div className="hospitals-cards-grid">
        {clients.map((clientId) => {
          const clientData = latest?.[clientId];
          const accuracy = clientData?.accuracy || 0;
          const loss = clientData?.loss || 0;
          const trend = calculateTrend(clientId);
          const roundsParticipated = calculateRoundsParticipated(clientId);
          const participationRate = (roundsParticipated / metrics.length) * 100;

          return (
            <div key={clientId} className="hospital-card">
              <div className="hospital-card-header">
                <h3>{clientId}</h3>
                <span className={`status-badge ${clientData ? "connected" : "disconnected"}`}>
                  <FiWifi />
                  {clientData ? "Connected" : "No Data"}
                </span>
              </div>

              <div className="hospital-stats">

                <div className="stat-row">
                  <span className="stat-label"><FiBarChart2 /> Accuracy</span>
                  <span className="stat-value high">{(accuracy * 100).toFixed(2)}%</span>
                </div>

                <div className="stat-row">
                  <span className="stat-label"><FiAlertCircle /> Loss</span>
                  <span className="stat-value medium">{loss.toFixed(4)}</span>
                </div>

                <div className="stat-row">
                  <span className="stat-label"><FiTrendingUp /> Trend</span>
                  <span className={`stat-value ${trend >= 0 ? "high" : "low"}`}>
                    {trend >= 0 ? <FiTrendingUp /> : <FiTrendingDown />}
                    {(trend * 100).toFixed(2)}%
                  </span>
                </div>

                <div className="stat-row">
                  <span className="stat-label">Rounds</span>
                  <span className="stat-value">
                    {roundsParticipated}
                    <span className={`percentage-badge ${participationRate === 100 ? "percentage-positive" : "percentage-negative"}`}>
                      {participationRate.toFixed(0)}%
                    </span>
                  </span>
                </div>

              </div>
            </div>
          );
        })}
      </div>

      {/* --------------------------------------------------- */}
      {/* ★ Graphiques */}
      {/* --------------------------------------------------- */}
      {metrics.length > 0 && clients.length > 0 && (
        <div className="charts-section">

          {/* Graphique Accuracy */}
          <div className="chart-container">
            <div className="chart-header">
              <h2 className="chart-title">
                <FiTrendingUp /> Accuracy Evolution
              </h2>
              <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                {clients.length} clients — {metrics.length} rounds
              </span>
            </div>

            <div className="chart-wrapper">
              <Line
                data={{
                  labels: metrics.map(m => `R${m.round}`),
                  datasets: clients.map((clientId, idx) => {
                    const colors = [
                      { bg: 'rgba(59, 130, 246, 0.1)', border: '#3b82f6' },
                      { bg: 'rgba(16, 185, 129, 0.1)', border: '#10b981' },
                      { bg: 'rgba(139, 92, 246, 0.1)', border: '#8b5cf6' },
                      { bg: 'rgba(245, 158, 11, 0.1)', border: '#f59e0b' },
                      { bg: 'rgba(239, 68, 68, 0.1)', border: '#ef4444' }
                    ];

                    const color = colors[idx % colors.length];

                    return {
                      label: clientId,
                      data: metrics.map(m => m[clientId]?.accuracy || null),
                      fill: true,
                      backgroundColor: color.bg,
                      borderColor: color.border,
                      tension: 0.4,
                      borderWidth: 3,
                      pointRadius: 4,
                      pointBackgroundColor: color.border,
                      pointBorderColor: "#ffffff",
                      pointBorderWidth: 1,
                      spanGaps: true
                    };
                  })
                }}
                options={chartOptions}
              />
            </div>
          </div>

          {/* Graphique Loss */}
          <div className="chart-container">
            <div className="chart-header">
              <h2 className="chart-title">
                <FiTrendingDown /> Loss Evolution
              </h2>
            </div>

            <div className="chart-wrapper">
              <Line
                data={{
                  labels: metrics.map(m => `R${m.round}`),
                  datasets: clients.map((clientId, idx) => {
                    const colors = [
                      { bg: 'rgba(59, 130, 246, 0.1)', border: '#3b82f6' },
                      { bg: 'rgba(16, 185, 129, 0.1)', border: '#10b981' },
                      { bg: 'rgba(139, 92, 246, 0.1)', border: '#8b5cf6' }
                    ];

                    const color = colors[idx % colors.length];

                    return {
                      label: clientId,
                      data: metrics.map(m => m[clientId]?.loss || null),
                      fill: true,
                      backgroundColor: color.bg,
                      borderColor: color.border,
                      tension: 0.4,
                      borderWidth: 3,
                      pointRadius: 4,
                      pointBackgroundColor: color.border,
                      pointBorderColor: "#ffffff",
                      pointBorderWidth: 1,
                      spanGaps: true
                    };
                  })
                }}
                options={{
                  ...chartOptions,
                  scales: {
                    ...chartOptions.scales,
                    y: {
                      beginAtZero: true,
                      ticks: { color: "#94a3b8" }
                    }
                  }
                }}
              />
            </div>

          </div>

        </div>
      )}

    </div>
  );
}

export default HospitalsMonitoring;
