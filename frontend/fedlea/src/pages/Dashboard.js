import React, { useEffect, useState } from "react";
import "../App.css"
import { Line } from "react-chartjs-2";
import "chart.js/auto";

export default function Dashboard() {
  const [metrics, setMetrics] = useState([]);
  const [latest, setLatest] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMetrics() {
      try {
        const res = await fetch("http://127.0.0.1:5000/metrics");
        const data = await res.json();

        const rounds = data.metrics.map((m, index) => {
          const clients = Object.keys(m).filter((k) =>
            k.startsWith("client_")
          );

          const avg_loss =
            clients.reduce((acc, c) => acc + (m[c].loss || 0), 0) /
            clients.length;

          return {
            round: index + 1, // 🔥 FIX : Round généré automatiquement
            ...m,
            avg_loss,
            clientCount: clients.length,
          };
        });

        setMetrics(rounds);
        setLatest(rounds[rounds.length - 1]);
        setLoading(false);
      } catch (err) {
        console.error("Error loading metrics", err);
      }
    }

    loadMetrics();
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <div className="dashboard-container">

      {/* 🔥 TOP KPI CARDS */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <h3>Model Version</h3>
          <p>global_model_round{latest.round}</p>
        </div>

        <div className="kpi-card">
          <h3>Global Accuracy</h3>
          <p>{(latest.avg_accuracy * 100).toFixed(2)}%</p>
        </div>

        <div className="kpi-card">
          <h3>Connected Hospitals</h3>
          <p>{latest.clientCount}</p>
        </div>

        <div className="kpi-card">
          <h3>Completed Rounds</h3>
          <p>{metrics.length}</p>
        </div>
      </div>

      {/* 📈 GLOBAL ACCURACY LINE CHART */}
      <div className="chart-card">
        <h3>Global Accuracy Over Rounds</h3>
        <Line
          data={{
            labels: metrics.map((m) => m.round),
            datasets: [
              {
                label: "Accuracy",
                data: metrics.map((m) => m.avg_accuracy),
                borderWidth: 2,
              },
            ],
          }}
        />
      </div>

      {/* 📉 GLOBAL LOSS CHART */}
      <div className="chart-card">
        <h3>Global Loss Over Rounds</h3>
        <Line
          data={{
            labels: metrics.map((m) => m.round),
            datasets: [
              {
                label: "Loss",
                data: metrics.map((m) => m.avg_loss),
                borderWidth: 2,
              },
            ],
          }}
        />
      </div>

      {/* CLIENT ACCURACIES CHART */}
      <div className="chart-card">
        <h3>Client Accuracies (Latest Round)</h3>
        <Line
          data={{
            labels: Object.keys(latest)
              .filter((k) => k.startsWith("client_")),
            datasets: [
              {
                label: "Client Accuracy",
                data: Object.keys(latest)
                  .filter((k) => k.startsWith("client_"))
                  .map((c) => latest[c].accuracy),
                borderWidth: 2,
              },
            ],
          }}
        />
      </div>
    </div>
  );
}
