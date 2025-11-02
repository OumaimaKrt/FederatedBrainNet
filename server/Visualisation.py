import os
import json
import matplotlib.pyplot as plt

metrics_dir = "metrics_logs"  

accuracies = []
losses = []

for round_file in sorted(os.listdir(metrics_dir)):
    if round_file.endswith(".json"):
        with open(os.path.join(metrics_dir, round_file), "r") as f:
            data = json.load(f)

            if "avg_accuracy" in data:
                accuracies.append(data["avg_accuracy"])

            round_losses = [
                m.get("loss", None) for m in data.values() 
                if isinstance(m, dict) and "loss" in m
            ]
            if round_losses:
                losses.append(sum(round_losses) / len(round_losses))

rounds = range(1, len(accuracies) + 1)

plt.figure(figsize=(10, 5))
plt.plot(rounds, accuracies, marker="o", label="Accuracy moyenne", color="blue")
plt.title("Évolution de l'Accuracy globale")
plt.xlabel("Round")
plt.ylabel("Accuracy")
plt.grid(True)
plt.legend()
plt.show()

plt.figure(figsize=(10, 5))
plt.plot(rounds, losses, marker="o", label="Loss moyenne", color="red")
plt.title("Évolution de la Loss globale")
plt.xlabel("Round")
plt.ylabel("Loss")
plt.grid(True)
plt.legend()
plt.show()
