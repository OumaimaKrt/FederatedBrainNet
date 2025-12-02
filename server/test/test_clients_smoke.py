import os
import sys
import importlib.util
import numpy as np
from sklearn.model_selection import train_test_split

# Ajouter le chemin parent pour les imports
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.insert(0, parent_dir)

# Liste des hôpitaux
hopitaux = ["hopital_1", "hopital_2", "hopital_3"]

for hopital in hopitaux:
    print(f"\n=== Tests pour {hopital} ===")
    
    #  CORRECTION : Chemin absolu correct
    hopital_path = os.path.abspath(os.path.join("..", "..", "clients", hopital))
    train_file = os.path.join(hopital_path, "train.py")
    
    print(f"Recherche de: {train_file}")
    print(f"Le fichier existe: {os.path.exists(train_file)}")
    
    if not os.path.exists(train_file):
        print(f" Impossible de trouver train.py dans {hopital}")
        print(f"   Chemin essayé: {train_file}")
        continue

    # Import dynamique du train.py de l'hôpital
    spec = importlib.util.spec_from_file_location("train", train_file)
    train = importlib.util.module_from_spec(spec)
    
    try:
        spec.loader.exec_module(train)
        print(f" train.py chargé avec succès pour {hopital}")
    except FileNotFoundError:
        print(f"Les dossiers de données sont introuvables pour {hopital}, tests limités aux fonctions.")
    except Exception as e:
        print(f" Erreur lors du chargement: {e}")
        continue
    
    # --- Test 1 : build_model ---
    if hasattr(train, "build_model"):
        try:
            model = train.build_model()
            X_dummy = np.random.rand(2, 224, 224, 1)
            preds = model.predict(X_dummy)
            assert preds.shape == (2, 1)
            print(" test_model_build passed")
        except Exception as e:
            print(f"test_model_build failed: {e}")

    # --- Test 2 : BrainClient get_parameters ---
    if hasattr(train, "BrainClient"):
        try:
            X_dummy = np.random.rand(10, 224, 224, 1)
            y_dummy = np.random.randint(0, 2, 10)
            X_train_dummy, X_val_dummy, y_train_dummy, y_val_dummy = train_test_split(
                X_dummy, y_dummy, test_size=0.2, random_state=42
            )
            
            client = train.BrainClient(X_train_dummy, y_train_dummy, X_val_dummy, y_val_dummy)
            params = client.get_parameters({})
            assert len(params) > 0
            print(" test_client_get_parameters passed")
        except Exception as e:
            print(f" test_client_get_parameters failed: {e}")

        # --- Test 3 et 4 : fit et evaluate avec données réelles si disponibles ---
        tumor_dir = os.path.join(hopital_path, "data", "Brain_Tumor")
        healthy_dir = os.path.join(hopital_path, "data", "Healthy")
        
        print(f"Recherche données dans: {tumor_dir}")
        print(f"Le dossier existe: {os.path.exists(tumor_dir)}")
        
        if os.path.exists(tumor_dir) and os.path.exists(healthy_dir):
            try:
                tumor_images = [os.path.join(tumor_dir, f) for f in os.listdir(tumor_dir) if f.lower().endswith(('.jpg', '.png', '.jpeg'))]
                healthy_images = [os.path.join(healthy_dir, f) for f in os.listdir(healthy_dir) if f.lower().endswith(('.jpg', '.png', '.jpeg'))]
                
                print(f"Images tumor trouvées: {len(tumor_images)}")
                print(f"Images healthy trouvées: {len(healthy_images)}")
                
                X = np.array([train.preprocess_image(f) for f in tumor_images + healthy_images])
                y = np.array([1]*len(tumor_images) + [0]*len(healthy_images))
                X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.2, random_state=42)
                client_real = train.BrainClient(X_train, y_train, X_val, y_val)
                
                weights, n_train, metrics = client_real.fit(client_real.get_parameters({}), {})
                assert "accuracy" in metrics and "loss" in metrics
                print("test_client_fit passed")

                loss, n_val, metrics_eval = client_real.evaluate(client_real.get_parameters({}), {})
                assert "accuracy" in metrics_eval and "loss" in metrics_eval
                print(" test_client_evaluate passed")
            except Exception as e:
                print(f"Tests fit/evaluate avec données réelles échoués: {e}")
        else:
            print(" Dossiers de données absents : fit/evaluate réels ignorés")

    # --- Test 5 : simulation erreur serveur ---
    try:
        import flwr as fl
        X_dummy = np.random.rand(10, 224, 224, 1)
        y_dummy = np.random.randint(0, 2, 10)
        client_fake = train.BrainClient(X_dummy, y_dummy, X_dummy, y_dummy)
        fl.client.start_client(server_address="localhost:9999", client=client_fake.to_client())
    except Exception as e:
        print(f"test_client_server_connection_error passée : {e}")

print(f"\n Tests terminés pour tous les hôpitaux!")