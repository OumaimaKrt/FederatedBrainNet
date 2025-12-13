import React, { useEffect, useState } from "react";
import "../App.css";
import {
  FiDownload,
  FiUsers,
  FiPackage,
  FiTrendingUp,
  FiCalendar,
  FiCheckCircle,
  FiAlertCircle,
  FiDatabase,
  FiLoader
} from "react-icons/fi";

function RoundsExplorer() {
  const [rounds, setRounds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState({});

  // ---------------------------
  // Charger rounds depuis backend
  // ---------------------------
  useEffect(() => {
    async function loadRoundsData() {
      try {
        const res = await fetch("http://127.0.0.1:5000/metrics");
        if (!res.ok) throw new Error("Impossible de charger /metrics");

        const backendData = await res.json();

        if (!backendData.metrics || backendData.metrics.length === 0) {
          throw new Error("Aucune métrique trouvée dans backend");
        }

        const roundsData = await Promise.all(
          backendData.metrics.map(async (data, index) => {
            // ---------------------------
            // Déterminer le numéro du round
            // ---------------------------
            let roundNumber = data.round || data.round_number || 0;

            // Si backend renvoie "file": "metrics_round3.json"
            if ((!roundNumber || roundNumber === 0) && data.file) {
              const match = data.file.match(/round(\d+)/);
              roundNumber = match ? parseInt(match[1]) : 0;
            }

            // Fallback si encore 0 → utiliser l'index + 1
            if (!roundNumber || roundNumber === 0) {
              roundNumber = index + 1;
            }

            // ---------------------------
            // Détection clients
            // ---------------------------
            const clients = Object.keys(data).filter((k) =>
              k.startsWith("client_") || k.startsWith("hopital_")
            );

            // ---------------------------
            // Calcul de l'accuracy moyenne
            // ---------------------------
            let avgAccuracy = 0;
            if (clients.length > 0) {
              const accuracies = clients.map((c) => data[c]?.accuracy ?? 0);
              avgAccuracy =
                accuracies.reduce((a, b) => a + b, 0) / accuracies.length;
            }

            // ---------------------------
            // Vérifier si le modèle .npz existe
            // ---------------------------
            const modelPath = `/saved_models/global_model_round${roundNumber}.npz`;
            const hasModel = await checkModelExists(modelPath);

            return {
              round: roundNumber,
              clients,
              clientCount: clients.length,
              accuracy: avgAccuracy,
              modelVersion: `global_model_round${roundNumber}`,
              modelPath,
              hasModel,
              ...data
            };
          })
        );

        setRounds(roundsData);
      } catch (err) {
        console.error("Error loading rounds:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadRoundsData();
  }, []);

  // ---------------------------
  // Vérifier si .npz existe
  // ---------------------------
  const checkModelExists = async (modelPath) => {
    try {
      const res = await fetch(modelPath, { method: "HEAD" });
      return res.ok;
    } catch {
      return false;
    }
  };

  // ---------------------------
  // Télécharger un modèle
  // ---------------------------
  const handleDownloadModel = async (roundNumber, modelPath, modelName) => {
    setDownloading((prev) => ({ ...prev, [roundNumber]: true }));

    try {
      const checkRes = await fetch(modelPath, { method: "HEAD" });
      if (!checkRes.ok) throw new Error("Le modèle .npz est introuvable");

      const response = await fetch(modelPath);
      if (!response.ok) throw new Error("Erreur lors du téléchargement");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = modelName;
      document.body.appendChild(a);
      a.click();

      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert(`Erreur: ${err.message}`);
      console.error("Download error:", err);
    } finally {
      setDownloading((prev) => ({ ...prev, [roundNumber]: false }));
    }
  };

  // ---------------------------
  // UI
  // ---------------------------
  if (loading) {
    return (
      <div className="page-content">
        <div className="loading-spinner">
          <FiLoader className="spin" size={40} />
          <p style={{ marginTop: "20px", color: "#94a3b8" }}>
            Loading round data...
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
          <h2>Error loading rounds</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="dashboard-header">
        <div>
          <h1>Rounds Explorer</h1>
          <p className="dashboard-subtitle">
            Download trained models in .npz format
          </p>
        </div>

        <div className="kpi-card" style={{ minWidth: "220px" }}>
          <div className="kpi-card-content">
            <div className="kpi-card-title">
              <FiDatabase /> .NPZ MODELS
            </div>
            <div className="kpi-card-value">
              {rounds.filter((r) => r.hasModel).length}
            </div>
            <div className="kpi-card-trend">
              <FiCheckCircle /> out of {rounds.length} rounds
            </div>
          </div>
        </div>
      </div>

      <div className="rounds-grid">
        {rounds.map((round) => (
          <div key={round.round} className="round-card">

            <div className="round-card-header">
              <div className="round-title">
                <h3>Round {round.round}</h3>
                <div className="round-version">
                  <FiPackage /> {round.modelVersion}
                </div>
              </div>

              <div className={`model-status ${round.hasModel ? "available" : "unavailable"}`}>
                {round.hasModel ? <FiCheckCircle /> : <FiAlertCircle />}
                {round.hasModel ? ".npz available" : ".npz missing"}
              </div>
            </div>

            <div className="round-metrics">
              <div className="metric-card">
                <div className="metric-header">
                  <FiTrendingUp /> Accuracy
                </div>
                <div className="metric-value accuracy">
                  {(round.accuracy * 100).toFixed(2)}%
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-header">
                  <FiUsers /> Clients
                </div>
                <div className="metric-value clients">
                  {round.clientCount}
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-header">
                  <FiCalendar /> Round
                </div>
                <div className="metric-value date">
                  {round.round}/10
                </div>
              </div>
            </div>

            <div className="round-actions">
              {round.hasModel ? (
                <button
                  className={`download-model-btn ${downloading[round.round] ? "downloading" : ""}`}
                  onClick={() =>
                    handleDownloadModel(
                      round.round,
                      round.modelPath,
                      `${round.modelVersion}.npz`
                    )
                  }
                  disabled={downloading[round.round]}
                >
                  {downloading[round.round] ? (
                    <>
                      <FiLoader className="spin" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <FiDownload />
                      Download global_model_round{round.round}.npz
                    </>
                  )}
                </button>
              ) : (
                <button className="download-model-btn unavailable" disabled>
                  <FiAlertCircle />
                  .npz file missing
                </button>
              )}
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}

export default RoundsExplorer;
