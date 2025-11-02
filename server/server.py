import flwr as fl
import numpy as np
import os
import json
from flwr.common import parameters_to_ndarrays

# --- Création des dossiers ---
os.makedirs("saved_models", exist_ok=True)
os.makedirs("metrics_logs", exist_ok=True)

# --- Fonction pour sauvegarder le modèle global ---
def save_global_model(parameters, round_num):
    """Convertit et sauvegarde les poids globaux du modèle"""
    weights = parameters_to_ndarrays(parameters)
    np.savez(f"saved_models/global_model_round{round_num}.npz", *weights)
    print(f"Modèle global du round {round_num} sauvegardé.")

# --- Fonction pour sauvegarder les métriques ---
def save_metrics(metrics, round_num):
    """Sauvegarde les métriques locales et la moyenne"""
    with open(f"metrics_logs/metrics_round{round_num}.json", "w") as f:
        json.dump(metrics, f, indent=4)
    print(f"Métriques du round {round_num} sauvegardées.")

# --- Stratégie personnalisée ---
class FedAvgWithLogging(fl.server.strategy.FedAvg):
    def aggregate_fit(self, rnd, results, failures):
        """Agrégation des poids et des métriques des clients"""
        aggregated_result = super().aggregate_fit(rnd, results, failures)

        if aggregated_result is None:
            return None

        aggregated_parameters, _ = aggregated_result
        save_global_model(aggregated_parameters, rnd)

        metrics_dict = {}
        accuracies = []

        # Lecture correcte des métriques de chaque client
        for idx, (client, fit_res) in enumerate(results):
            client_name = f"client_{idx+1}"
            client_metrics = getattr(fit_res, "metrics", {}) or {}
            metrics_dict[client_name] = client_metrics

            if "accuracy" in client_metrics:
                accuracies.append(client_metrics["accuracy"])

        avg_accuracy = float(np.mean(accuracies)) if accuracies else 0.0
        metrics_dict["avg_accuracy"] = avg_accuracy

        print(f"🔹 Accuracy moyenne agrégée : {avg_accuracy:.4f}")
        save_metrics(metrics_dict, rnd)

        return aggregated_result

# --- Fonction principale ---
def main():
    strategy = FedAvgWithLogging(
        fraction_fit=1.0,
        fraction_evaluate=1.0,
        min_fit_clients=3,
        min_available_clients=3,
        min_evaluate_clients=3,
    )

    print("Serveur Flower démarré sur le port 8081 ...")

    fl.server.start_server(
        server_address="0.0.0.0:8081",
        config=fl.server.ServerConfig(num_rounds=3),
        strategy=strategy,
    )

if __name__ == "__main__":
    main()
