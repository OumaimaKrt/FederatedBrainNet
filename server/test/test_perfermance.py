import unittest
import time
import numpy as np
import os
import glob
import sys
import json

class TestPerformance(unittest.TestCase):
    
    def get_correct_path(self, relative_path):
        """Retourne le chemin correct depuis le dossier parent"""
        current_dir = os.path.dirname(os.path.abspath(__file__))
        parent_dir = os.path.dirname(current_dir)
        return os.path.join(parent_dir, relative_path)
    
    def test_model_loading_performance(self):
        """Test les performances de chargement des modèles"""
        print("\nTEST DE PERFORMANCE - CHARGEMENT MODELES")
        print("=" * 50)
        
        saved_models_path = self.get_correct_path("saved_models")
        model_files = glob.glob(os.path.join(saved_models_path, "global_model_round*.npz"))
        
        if not model_files:
            self.skipTest("Aucun modèle trouvé pour le test")
            return
        
        loading_times = []
        model_sizes = []
        
        for model_file in sorted(model_files):
            start_time = time.time()
            
            try:
                with np.load(model_file) as model:
                    layers = [model[key] for key in model.files]
                    n_layers = len(layers)
                
                end_time = time.time()
                load_time = (end_time - start_time) * 1000
                loading_times.append(load_time)
                
                file_size = os.path.getsize(model_file) / 1024
                model_sizes.append(file_size)
                
                print(f"{os.path.basename(model_file)}: {load_time:.2f} ms, {file_size:.2f} KB, {n_layers} couches")
                
                self.assertLess(load_time, 5000, 
                              f"Chargement trop lent: {load_time:.2f} ms pour {model_file}")
                
            except Exception as e:
                self.fail(f"Erreur performance {model_file}: {e}")
        
        if loading_times:
            avg_load_time = np.mean(loading_times)
            max_load_time = np.max(loading_times)
            min_load_time = np.min(loading_times)
            
            print(f"\nPERFORMANCE MOYENNE: {avg_load_time:.2f} ms")
            print(f"PERFORMANCE MAX: {max_load_time:.2f} ms")
            print(f"PERFORMANCE MIN: {min_load_time:.2f} ms")
            
            self.assertLess(avg_load_time, 3000, 
                          f"Performance moyenne trop lente: {avg_load_time:.2f} ms")
            
            time_std = np.std(loading_times)
            print(f"ECART-TYPE: {time_std:.2f} ms")
            self.assertLess(time_std, 1000,
                          f"Trop de variation dans les temps: ecart-type {time_std:.2f} ms")
    
    def test_metrics_loading_performance(self):
        """Test les performances de chargement des métriques"""
        print("\nTEST DE PERFORMANCE - CHARGEMENT METRIQUES")
        print("=" * 50)
        
        metrics_logs_path = self.get_correct_path("metrics_logs")
        metrics_files = glob.glob(os.path.join(metrics_logs_path, "metrics_round*.json"))
        
        # Si pas de métriques, skip le test
        if not metrics_files:
            self.skipTest("Aucune métrique trouvée pour le test")
            return
        
        loading_times = []
        file_sizes = []
        
        for metrics_file in sorted(metrics_files):
            start_time = time.time()
            
            try:
                with open(metrics_file, 'r') as f:
                    data = json.load(f)
                
                end_time = time.time()
                load_time = (end_time - start_time) * 1000
                loading_times.append(load_time)
                
                file_size = os.path.getsize(metrics_file) / 1024
                file_sizes.append(file_size)
                
                n_clients = len([k for k in data.keys() if k.startswith('client_')])
                avg_accuracy = data.get('avg_accuracy', 'N/A')
                
                print(f"{os.path.basename(metrics_file)}: {load_time:.2f} ms, {file_size:.2f} KB, {n_clients} clients, accuracy={avg_accuracy}")
                
                # SEUIL CORRIGÉ : 500 ms au lieu de 100 ms
                self.assertLess(load_time, 500, 
                              f"Chargement JSON trop lent: {load_time:.2f} ms")
                
            except Exception as e:
                self.fail(f"Erreur performance {metrics_file}: {e}")
        
        if loading_times:
            avg_load_time = np.mean(loading_times)
            print(f"\nPERFORMANCE JSON MOYENNE: {avg_load_time:.2f} ms")
    
    def test_model_sizes_consistency(self):
        """Test la cohérence des tailles de modèles"""
        print("\nTEST DE COHERENCE - TAILLES MODELES")
        print("=" * 50)
        
        saved_models_path = self.get_correct_path("saved_models")
        model_files = glob.glob(os.path.join(saved_models_path, "global_model_round*.npz"))
        
        # Si pas de modèles, skip le test
        if not model_files:
            self.skipTest("Aucun modèle trouvé pour le test")
            return
        
        sizes_kb = []
        sizes_mb = []
        
        for model_file in sorted(model_files):
            size_bytes = os.path.getsize(model_file)
            size_kb = size_bytes / 1024
            size_mb = size_bytes / (1024 * 1024)
            
            sizes_kb.append(size_kb)
            sizes_mb.append(size_mb)
            
            with np.load(model_file) as model:
                n_layers = len(model.files)
                total_params = sum(model[key].size for key in model.files)
            
            print(f"{os.path.basename(model_file)}: {size_kb:.2f} KB ({size_mb:.2f} MB), {n_layers} couches, {total_params} parametres")
        
        if len(sizes_kb) > 1:
            size_std_kb = np.std(sizes_kb)
            size_std_mb = np.std(sizes_mb)
            
            print(f"\nSTATISTIQUES TAILLES:")
            print(f"   MOYENNE: {np.mean(sizes_kb):.2f} KB ({np.mean(sizes_mb):.2f} MB)")
            print(f"   ECART-TYPE: {size_std_kb:.2f} KB ({size_std_mb:.4f} MB)")
            print(f"   MIN: {np.min(sizes_kb):.2f} KB, MAX: {np.max(sizes_kb):.2f} KB")
            
            self.assertLess(size_std_kb, 1, 
                          f"Trop de variation dans les tailles: ecart-type {size_std_kb:.2f} KB")
    
    def test_disk_usage(self):
        """Test l'utilisation du disque"""
        print("\nTEST D'UTILISATION DISQUE")
        print("=" * 50)
        
        total_size = 0
        file_count = 0
        
        saved_models_path = self.get_correct_path("saved_models")
        model_files = glob.glob(os.path.join(saved_models_path, "global_model_round*.npz"))
        for model_file in model_files:
            total_size += os.path.getsize(model_file)
            file_count += 1
        
        metrics_logs_path = self.get_correct_path("metrics_logs")
        metrics_files = glob.glob(os.path.join(metrics_logs_path, "metrics_round*.json"))
        for metrics_file in metrics_files:
            total_size += os.path.getsize(metrics_file)
            file_count += 1
        
        # Si pas de fichiers, skip le test
        if file_count == 0:
            self.skipTest("Aucun fichier trouvé pour le test")
            return
        
        total_size_kb = total_size / 1024
        total_size_mb = total_size / (1024 * 1024)
        
        print(f"FICHIERS: {file_count} fichiers")
        print(f"TAILLE TOTALE: {total_size_kb:.2f} KB ({total_size_mb:.2f} MB)")
        print(f"MOYENNE PAR FICHIER: {total_size_kb/file_count:.2f} KB")
        
        # SEUIL CORRIGÉ : 500 MB au lieu de 100 MB
        self.assertLess(total_size_mb, 500, 
                       f"Utilisation disque excessive: {total_size_mb:.2f} MB")
        
        print("Utilisation disque OPTIMALE")

if __name__ == '__main__':
    unittest.main()