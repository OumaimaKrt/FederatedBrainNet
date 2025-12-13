from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import tensorflow as tf
from PIL import Image
import io
import os
import json

app = Flask(__name__)
CORS(app)

# -------------------------------------------------
# 1. Chemin du modèle global
# -------------------------------------------------
MODEL_PATH = r"C:\Users\user\Documents\GitHub\FederatedBrainNet\server\saved_models\global_model_round10.npz"

# -------------------------------------------------
# 2. Reconstruction du modèle
# -------------------------------------------------
def build_model():
    """Reconstruit l'architecture exacte du modèle."""
    model = tf.keras.Sequential([
        tf.keras.layers.Input(shape=(224, 224, 1)),
        tf.keras.layers.Conv2D(16, (3, 3), activation='relu', padding='same'),
        tf.keras.layers.MaxPooling2D(2, 2),

        tf.keras.layers.Conv2D(32, (3, 3), activation='relu', padding='same'),
        tf.keras.layers.MaxPooling2D(2, 2),

        tf.keras.layers.Conv2D(64, (3, 3), activation='relu', padding='same'),
        tf.keras.layers.MaxPooling2D(2, 2),

        tf.keras.layers.Flatten(),
        tf.keras.layers.Dense(128, activation='relu'),
        tf.keras.layers.Dense(1, activation='sigmoid'),
    ])
    return model

# -------------------------------------------------
# 3. Charger les poids du fichier .npz
# -------------------------------------------------
def load_model_from_npz(path):
    """Charge les poids depuis un fichier .npz et les applique au modèle."""
    data = np.load(path, allow_pickle=True)

    # Tri des clés pour respecter l'ordre
    sorted_keys = sorted(data.files, key=lambda x: int(x.split("_")[1]))
    weights = [data[key] for key in sorted_keys]

    model = build_model()
    try:
        model.set_weights(weights)
        print("✅ Poids chargés avec succès")
    except Exception as e:
        print("❌ Erreur lors du chargement des poids :", e)

    return model

model = load_model_from_npz(MODEL_PATH)

# -------------------------------------------------
# 4. Endpoint /predict
# -------------------------------------------------
@app.route("/predict", methods=["POST"])
def predict():
    """Fait une prédiction sur une image envoyée par POST."""
    try:
        if "file" not in request.files:
            return jsonify({"error": "Image non trouvée dans la requête"}), 400

        file = request.files["file"]
        img = Image.open(io.BytesIO(file.read())).convert("L")
        img = img.resize((224, 224))

        img_array = np.array(img) / 255.0
        img_array = np.expand_dims(img_array, axis=-1)
        img_array = np.expand_dims(img_array, axis=0)

        prob = float(model.predict(img_array)[0][0])
        prediction = "Tumor Detected" if prob >= 0.5 else "No Tumor Detected"
        confidence = prob if prob >= 0.5 else (1 - prob)

        return jsonify({
            "prediction": prediction,
            "confidence": round(confidence, 4),
            "probability": round(prob, 4)
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# -------------------------------------------------
# 5. Endpoint /metrics
# -------------------------------------------------
@app.route("/metrics", methods=["GET"])
def get_metrics():
    """Retourne tous les fichiers JSON de metrics_logs triés par round."""
    metrics_dir = "metrics_logs"
    if not os.path.exists(metrics_dir):
        return jsonify({"error": "metrics_logs introuvable"}), 404

    logs = []
    for filename in os.listdir(metrics_dir):
        if filename.endswith(".json"):
            try:
                with open(os.path.join(metrics_dir, filename), "r") as f:
                    logs.append(json.load(f))
            except:
                pass

    logs = sorted(logs, key=lambda x: x.get("round", 0))
    return jsonify({"metrics": logs})

# -------------------------------------------------
# 6. Endpoint /api/clients_stats
# -------------------------------------------------
@app.route("/api/clients_stats", methods=["GET"])
def get_clients_stats():
    project_root = os.path.dirname(os.path.abspath(__file__))
    global_json_path = os.path.join(project_root, "clients_stats.json")

    print("Chemin du fichier recherché :", global_json_path)  

    if not os.path.exists(global_json_path):
        return jsonify({"error": "Fichier clients_stats.json introuvable"}), 404

    try:
        with open(global_json_path, "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception as e:
        return jsonify({"error": f"Impossible de lire clients_stats.json: {e}"}), 500

    return jsonify(data)



# -------------------------------------------------
# 7. Lancement du serveur
# -------------------------------------------------
if __name__ == "__main__":
    print("Backend API lancée : http://127.0.0.1:5000")
    app.run(host="127.0.0.1", port=5000, debug=True)
