import os
import numpy as np
import tensorflow as tf
from tensorflow.keras.preprocessing.image import load_img, img_to_array
from sklearn.model_selection import train_test_split
import flwr as fl

DATA_DIR = "data"

# --- Prétraitement des images ---
def preprocess_image(path, target_size=(224, 224)):
    img = load_img(path, target_size=target_size, color_mode="grayscale")
    return img_to_array(img) / 255.0

tumor_dir = os.path.join(DATA_DIR, "Brain_Tumor")
healthy_dir = os.path.join(DATA_DIR, "Healthy")

if not os.path.exists(tumor_dir) or not os.path.exists(healthy_dir):
    raise FileNotFoundError(f"Les dossiers {tumor_dir} ou {healthy_dir} sont introuvables.")

tumor_images = [os.path.join(tumor_dir, f) for f in os.listdir(tumor_dir) if f.lower().endswith(('.jpg', '.png', '.jpeg'))]
healthy_images = [os.path.join(healthy_dir, f) for f in os.listdir(healthy_dir) if f.lower().endswith(('.jpg', '.png', '.jpeg'))]

X = np.array([preprocess_image(f) for f in tumor_images + healthy_images])
y = np.array([1] * len(tumor_images) + [0] * len(healthy_images))

X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.2, random_state=42)

# --- Construction du modèle ---
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
    model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])
    return model

model = build_model()

# --- Classe client Flower ---
class BrainClient(fl.client.NumPyClient):
    def get_parameters(self, config):
        return model.get_weights()

    def fit(self, parameters, config):
        model.set_weights(parameters)
        history = model.fit(
            X_train, y_train,
            epochs=5,
            batch_size=32,
            verbose=1,
            validation_data=(X_val, y_val)
        )
        loss, acc = model.evaluate(X_val, y_val, verbose=0)
        print(f"Client accuracy locale après entraînement : {acc:.4f}")
        metrics = {"loss": float(loss), "accuracy": float(acc)}
        return model.get_weights(), len(X_train), metrics

    def evaluate(self, parameters, config):
        model.set_weights(parameters)
        loss, acc = model.evaluate(X_val, y_val, verbose=0)
        print(f"Évaluation locale - Accuracy : {acc:.4f}, Loss : {loss:.4f}")
        return loss, len(X_val), {"accuracy": float(acc)}

# --- Lancement du client ---
if __name__ == "__main__":
    print("Client connecté au serveur Flower.")
    fl.client.start_client(
        server_address="localhost:8081",
        client=BrainClient().to_client()
    )
