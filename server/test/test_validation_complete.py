import unittest
import json
import numpy as np
import os
import glob
import matplotlib.pyplot as plt

class TestValidationComplete(unittest.TestCase):
    """
    Test de validation COMPLET du système fédéré
    """
    
    def get_correct_path(self, relative_path):
        """Retourne le chemin correct depuis le dossier parent"""
        current_dir = os.path.dirname(os.path.abspath(__file__))
        parent_dir = os.path.dirname(current_dir)
        return os.path.join(parent_dir, relative_path)
    
    def test_validation_systeme_complet(self):
        """Test de validation de tout le système"""
        print("\n" + "="*60)
        print("VALIDATION COMPLÈTE DU SYSTÈME FÉDÉRÉ")
        print("="*60)
        
        # === PHASE 1: VÉRIFICATION STRUCTURELLE ===
        print("\nPHASE 1: VÉRIFICATION STRUCTURELLE")
        
        # 1.1 Dossiers
        saved_models_path = self.get_correct_path("saved_models")
        metrics_logs_path = self.get_correct_path("metrics_logs")
        
        dossiers_requis = [
            ("saved_models", saved_models_path),
            ("metrics_logs", metrics_logs_path)
        ]
        
        for dossier_name, dossier_path in dossiers_requis:
            if os.path.exists(dossier_path):
                fichiers = os.listdir(dossier_path)
                print(f" {dossier_name}: {len(fichiers)} fichiers trouvés")
            else:
                self.fail(f" {dossier_name}: DOSSIER MANQUANT à {dossier_path}")
        
        # 1.2 Fichiers modèles
        model_files = glob.glob(os.path.join(saved_models_path, "global_model_round*.npz"))
        self.assertGreater(len(model_files), 0, "Aucun modèle trouvé")
        print(f" Modèles: {len(model_files)} fichiers .npz")
        
        # 1.3 Fichiers métriques
        metrics_files = glob.glob(os.path.join(metrics_logs_path, "metrics_round*.json"))
        self.assertGreater(len(metrics_files), 0, "Aucune métrique trouvée")
        print(f" Métriques: {len(metrics_files)} fichiers .json")
        
        # === PHASE 2: VÉRIFICATION INTÉGRITÉ ===
        print("\n PHASE 2: VÉRIFICATION D'INTÉGRITÉ")
        
        # 2.1 Modèles
        modeles_valides = 0
        modeles_info = []
        for model_file in sorted(model_files):
            try:
                with np.load(model_file) as model:
                    n_couches = len(model.files)
                    taille_ko = os.path.getsize(model_file) / 1024
                    n_params = sum(model[key].size for key in model.files)
                    
                    if n_couches > 0:
                        modeles_valides += 1
                        modeles_info.append({
                            'fichier': os.path.basename(model_file),
                            'couches': n_couches,
                            'taille_ko': taille_ko,
                            'parametres': n_params
                        })
                        print(f" {os.path.basename(model_file)}: {n_couches} couches, {taille_ko:.1f} KB, {n_params} params")
            except Exception as e:
                self.fail(f" {model_file} corrompu: {e}")
        
        # 2.2 Métriques
        metrics_valides = 0
        accuracies = []
        metrics_info = []
        for metrics_file in sorted(metrics_files):
            try:
                with open(metrics_file, 'r') as f:
                    data = json.load(f)
                
                round_num = int(os.path.basename(metrics_file).split("round")[1].split(".json")[0])
                clients = [k for k in data.keys() if k.startswith('client_')]
                
                if 'avg_accuracy' in data:
                    accuracies.append(data['avg_accuracy'])
                    metrics_valides += 1
                    metrics_info.append({
                        'round': round_num,
                        'accuracy': data['avg_accuracy'],
                        'clients': len(clients)
                    })
                    print(f"{os.path.basename(metrics_file)}: accuracy={data['avg_accuracy']:.4f}, {len(clients)} clients")
            except Exception as e:
                self.fail(f" {metrics_file} corrompu: {e}")
        
        self.assertEqual(modeles_valides, len(model_files), "Certains modèles invalides")
        self.assertEqual(metrics_valides, len(metrics_files), "Certaines métriques invalides")
        
        # === PHASE 3: VÉRIFICATION COHÉRENCE ===
        print("\nPHASE 3: VÉRIFICATION DE COHÉRENCE")
        
        # 3.1 Correspondance rounds
        rounds_modeles = set(int(os.path.basename(f).split("round")[1].split(".npz")[0]) for f in model_files)
        rounds_metrics = set(int(os.path.basename(f).split("round")[1].split(".json")[0]) for f in metrics_files)
        
        self.assertEqual(rounds_modeles, rounds_metrics, 
                        f"Rounds incompatibles: modèles{rounds_modeles} vs métriques{rounds_metrics}")
        print(f"Rounds cohérents: {sorted(rounds_modeles)}")
        
        # 3.2 Progression apprentissage
        if len(accuracies) > 1:
            accuracy_initiale = accuracies[0]
            accuracy_finale = accuracies[-1]
            amelioration = accuracy_finale - accuracy_initiale
            pourcentage_amelioration = (amelioration / accuracy_initiale) * 100
            
            print(f" PROGRESSION APPRENTISSAGE:")
            print(f"   Round 1: {accuracy_initiale:.4f}")
            print(f"   Round {len(accuracies)}: {accuracy_finale:.4f}")
            print(f"   Amélioration: {amelioration:+.4f} ({pourcentage_amelioration:+.1f}%)")
            
            # L'apprentissage devrait montrer une progression
            self.assertGreater(accuracy_finale, 0.5, "Accuracy finale trop basse")
            
            if amelioration > 0:
                print(" APPRENTISSAGE: PROGRESSION POSITIVE")
            else:
                print(" APPRENTISSAGE: STAGNATION")
        
        # === PHASE 4: GÉNÉRATION RAPPORT ===
        print("\n PHASE 4: GÉNÉRATION DU RAPPORT")
        
        # Graphique de progression
        if accuracies:
            plt.figure(figsize=(12, 5))
            
            # Graphique Accuracy
            plt.subplot(1, 2, 1)
            rounds = range(1, len(accuracies) + 1)
            plt.plot(rounds, accuracies, 'o-', linewidth=3, markersize=8, color='blue', label='Accuracy')
            plt.title('Progression Accuracy Fédérée', fontsize=14, fontweight='bold')
            plt.xlabel('Round')
            plt.ylabel('Accuracy')
            plt.grid(True, alpha=0.3)
            plt.legend()
            
            # Ajouter les valeurs
            for i, (r, acc) in enumerate(zip(rounds, accuracies)):
                plt.annotate(f'{acc:.3f}', (r, acc), xytext=(0, 15), 
                            textcoords='offset points', ha='center', fontsize=10, fontweight='bold')
            
            # Graphique tailles modèles
            plt.subplot(1, 2, 2)
            if modeles_info:
                tailles = [m['taille_ko'] for m in modeles_info]
                rounds_modeles = sorted(rounds_modeles)
                couleurs = ['green', 'orange', 'red'][:len(tailles)]
                bars = plt.bar(rounds_modeles, tailles, color=couleurs, alpha=0.7, label='Taille (KB)')
                plt.title('Taille des Modèles par Round', fontsize=14, fontweight='bold')
                plt.xlabel('Round')
                plt.ylabel('Taille (KB)')
                
                # Ajouter les valeurs sur les barres
                for bar, taille in zip(bars, tailles):
                    height = bar.get_height()
                    plt.text(bar.get_x() + bar.get_width()/2., height + 5,
                            f'{taille:.0f} KB', ha='center', va='bottom', fontweight='bold')
            
            plt.tight_layout()
            plt.savefig('validation_report.png', dpi=300, bbox_inches='tight')
            plt.show()
            print("Graphique de validation sauvegardé: validation_report.png")
        
        # === PHASE 5: RAPPORT FINAL ===
        print("\n RAPPORT FINAL DE VALIDATION:")
        print("=" * 50)
        print(f"    Modèles validés: {modeles_valides}/{len(model_files)}")
        print(f"    Métriques validées: {metrics_valides}/{len(metrics_files)}")
        print(f"    Rounds complets: {len(rounds_modeles)}")
        
        if accuracies:
            print(f"    Accuracy initiale: {accuracies[0]:.4f}")
            print(f"    Accuracy finale: {accuracies[-1]:.4f}")
            print(f"    Amélioration: {accuracies[-1]-accuracies[0]:+.4f}")
        
        # Calcul score global
        score_total = (modeles_valides / len(model_files) * 100 + 
                      metrics_valides / len(metrics_files) * 100) / 2
        
        print(f"   SCORE GLOBAL: {score_total:.1f}%")
        
        if score_total >= 90:
            print("   STATUT: SYSTÈME FÉDÉRÉ EXCELLENT")
        elif score_total >= 75:
            print("   STATUT: SYSTÈME FÉDÉRÉ VALIDÉ")
        else:
            print("   STATUT: PROBLÈMES DÉTECTÉS")
        
        # Sauvegarder le rapport détaillé
        rapport = {
            "validation_date": "2024-01-01",
            "modeles_valides": modeles_valides,
            "metriques_valides": metrics_valides,
            "rounds_complets": len(rounds_modeles),
            "accuracies": accuracies,
            "score_global": score_total,
            "statut": "EXCELLENT" if score_total >= 90 else "VALIDE" if score_total >= 75 else "PROBLEMES"
        }
        
        with open('rapport_validation.json', 'w') as f:
            json.dump(rapport, f, indent=2)
        
        print("Rapport détaillé sauvegardé: rapport_validation.json")

if __name__ == '__main__':
    unittest.main()