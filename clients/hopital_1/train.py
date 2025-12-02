import os
import numpy as np
import tensorflow as tf
from tensorflow.keras.preprocessing.image import load_img, img_to_array
from sklearn.model_selection import train_test_split
import flwr as fl

# ──────────────────────────────────────────────
# 1. Prétraitement des images
# ──────────────────────────────────────────────
def preprocess_image(path, target_size=(224, 224)):
    img = load_img(path, target_size=target_size, color_mode="grayscale")
    return img_to_array(img) / 255.0

# ──────────────────────────────────────────────
# 2. Construction du modèle CNN
# ──────────────────────────────────────────────
def build_model():
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

    model.compile(
        optimizer='adam',
        loss='binary_crossentropy',
        metrics=['accuracy']
    )
    return model

# ──────────────────────────────────────────────
# 3. Classe client Flower
# ──────────────────────────────────────────────
class BrainClient(fl.client.NumPyClient):
    def __init__(self, X_train, y_train, X_val, y_val):
        self.model = build_model()
        self.X_train = X_train
        self.y_train = y_train
        self.X_val = X_val
        self.y_val = y_val

    def get_parameters(self, config):
        return self.model.get_weights()

    def fit(self, parameters, config):
        self.model.set_weights(parameters)

        if self.X_train is not None and len(self.X_train) > 0:
            self.model.fit(
                self.X_train, self.y_train,
                epochs=5,
                batch_size=32,
                validation_data=(self.X_val, self.y_val),
                shuffle=True,          
                verbose=1
            )

        loss, acc = self.model.evaluate(self.X_val, self.y_val, verbose=0)
        metrics = {"loss": float(loss), "accuracy": float(acc)}

        return self.model.get_weights(), len(self.X_train), metrics

    def evaluate(self, parameters, config):
        self.model.set_weights(parameters)

        loss, acc = self.model.evaluate(self.X_val, self.y_val, verbose=0)
        metrics = {"loss": float(loss), "accuracy": float(acc)}

        return loss, len(self.X_val), metrics

# ──────────────────────────────────────────────
# 4. Code principal
# ──────────────────────────────────────────────
if __name__ == "__main__":

    DATA_DIR = "data"

    tumor_dir = os.path.join(DATA_DIR, "Brain_Tumor")
    healthy_dir = os.path.join(DATA_DIR, "Healthy")

    if not os.path.exists(tumor_dir) or not os.path.exists(healthy_dir):
        raise FileNotFoundError("Dossiers Brain_Tumor ou Healthy introuvables.")

    # Charger les images
    tumor_images = [os.path.join(tumor_dir, f) for f in os.listdir(tumor_dir)
                    if f.lower().endswith(('.jpg', '.png', '.jpeg'))]
    healthy_images = [os.path.join(healthy_dir, f) for f in os.listdir(healthy_dir)
                      if f.lower().endswith(('.jpg', '.png', '.jpeg'))]

    X = np.array([preprocess_image(f) for f in tumor_images + healthy_images])
    y = np.array([1] * len(tumor_images) + [0] * len(healthy_images))

    # Split train/val
    X_train, X_val, y_train, y_val = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    # Démarrer le client
    client = BrainClient(X_train, y_train, X_val, y_val)

    try:
        print("hopital_1 connecté au serveur Flower...")
        fl.client.start_client(
            server_address="federated_server:8080",
            client=client.to_client()
        )
    except Exception as e:
        print(f"Erreur lors de la connexion au serveur : {e}")
