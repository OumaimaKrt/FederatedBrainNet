import os
import json
import matplotlib.pyplot as plt

metrics_dir = "metrics_logs"  
accuracies = []
losses = []
all_client_accuracies = []

for round_file in sorted(os.listdir(metrics_dir)):
    if round_file.endswith(".json"):
        with open(os.path.join(metrics_dir, round_file), "r") as f:
            data = json.load(f)
            
            # Accuracy moyenne
            if "avg_accuracy" in data:
                accuracies.append(data["avg_accuracy"])
            
            # Accuracies par client pour ce round
            round_client_accuracies = []
            round_losses = []
            
            for key, value in data.items():
                if key.startswith("client_") and isinstance(value, dict):
                    if "accuracy" in value:
                        round_client_accuracies.append(value["accuracy"])
                    if "loss" in value:
                        round_losses.append(value["loss"])
            
            if round_client_accuracies:
                all_client_accuracies.append(round_client_accuracies)
            if round_losses:
                losses.append(sum(round_losses) / len(round_losses))

rounds = list(range(1, len(accuracies) + 1))

# Graphique principal
plt.figure(figsize=(15, 5))

# Accuracy fédérée
plt.subplot(1, 3, 1)
plt.plot(rounds, accuracies, 'b-o', linewidth=3, markersize=8, label='Moyenne Fédérée')
plt.title("Accuracy Fédérée", fontsize=12, fontweight='bold')
plt.xlabel("Round")
plt.ylabel("Accuracy")
plt.grid(True, alpha=0.3)
plt.ylim(0.9, 1.0)

# Loss moyenne
plt.subplot(1, 3, 2)
plt.plot(rounds, losses, 'r-o', linewidth=2, markersize=8)
plt.title("Loss Moyenne", fontsize=12, fontweight='bold')
plt.xlabel("Round")
plt.ylabel("Loss")
plt.grid(True, alpha=0.3)

# Distribution des clients
plt.subplot(1, 3, 3)
if all_client_accuracies:
    # Boxplot de la distribution des accuracies par round
    plt.boxplot(all_client_accuracies, positions=rounds)
    plt.plot(rounds, accuracies, 'b-o', linewidth=2, markersize=6, label='Moyenne')
    plt.title("Distribution des Accuracies Clients", fontsize=12, fontweight='bold')
    plt.xlabel("Round")
    plt.ylabel("Accuracy")
    plt.grid(True, alpha=0.3)
    plt.legend()

plt.tight_layout()
plt.savefig('federated_analysis.png', dpi=300, bbox_inches='tight')
plt.show()

# Résultats
print(f" ANALYSE FÉDÉRÉE - {len(rounds)} Rounds")
print(f" Accuracy initiale: {accuracies[0]:.4f}")
print(f" Accuracy finale: {accuracies[-1]:.4f}")
print(f" Amélioration: +{(accuracies[-1]-accuracies[0])*100:.2f}%")
print(f"Loss finale: {losses[-1]:.4f}")