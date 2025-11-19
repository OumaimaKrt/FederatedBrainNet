import unittest
import json
import numpy as np
import os
import glob
import sys

# Chemin correct
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

class TestIntegration(unittest.TestCase):
    
    def test_models_and_metrics_integration(self):
        """Test l'intégration entre modèles et métriques"""
        print("\n🔗 TEST D'INTÉGRATION MODÈLES/MÉTRIQUES")
        
        # Vérifier l'existence des dossiers
        self.assertTrue(os.path.exists("saved_models"), "Dossier saved_models manquant")
        self.assertTrue(os.path.exists("metrics_logs"), "Dossier metrics_logs manquant")
        
        # Compter les fichiers
        model_files = glob.glob("saved_models/global_model_round*.npz")
        metrics_files = glob.glob("metrics_logs/metrics_round*.json")
        
        print(f"Modèles trouvés: {len(model_files)}")
        print(f"Métriques trouvées: {len(metrics_files)}")
        
        self.assertGreater(len(model_files), 0, "Aucun modèle trouvé")
        self.assertGreater(len(metrics_files), 0, "Aucune métrique trouvée")

if __name__ == '__main__':
    unittest.main()