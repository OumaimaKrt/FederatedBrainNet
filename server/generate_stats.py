import os
import json

def count_images_in_directory(directory_path):
    """Compte les images dans un dossier de façon récursive."""
    if not os.path.exists(directory_path):
        return 0
    
    extensions = ['.jpg', '.jpeg', '.png', '.bmp', '.gif', '.tiff', '.dcm', '.nii', '.nii.gz']
    count = 0
    
    for item in os.listdir(directory_path):
        item_path = os.path.join(directory_path, item)
        if os.path.isfile(item_path) and any(item.lower().endswith(ext) for ext in extensions):
            count += 1
        elif os.path.isdir(item_path):
            count += count_images_in_directory(item_path)
    return count

def generate_global_stats():
    """Génère le fichier JSON global contenant les stats de tous les clients."""
    
    # Le script est exécuté depuis le dossier server
    server_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Remonter au dossier parent (FEDERATEDBRAINNET) puis aller dans clients
    project_root = os.path.dirname(server_dir)  # dossier FEDERATEDBRAINNET
    clients_dir = os.path.join(project_root, "clients")  # dossier clients

    if not os.path.exists(clients_dir):
        print("Erreur : dossier 'clients' introuvable")
        return
    
    global_stats = {}

    for client in os.listdir(clients_dir):
        client_path = os.path.join(clients_dir, client)
        if os.path.isdir(client_path) and client.startswith(('hopital_', 'hospital_')):
            tumor_dir = os.path.join(client_path, "data", "Brain_Tumor")
            healthy_dir = os.path.join(client_path, "data", "Healthy")
            
            tumor_count = count_images_in_directory(tumor_dir) if os.path.exists(tumor_dir) else 0
            healthy_count = count_images_in_directory(healthy_dir) if os.path.exists(healthy_dir) else 0
            total_images = tumor_count + healthy_count
            
            global_stats[client] = {
                "total_images": total_images,
                "tumor": tumor_count,
                "healthy": healthy_count,
                "tumorPercentage": round((tumor_count / total_images) * 100, 1) if total_images > 0 else 0.0,
                "healthyPercentage": round((healthy_count / total_images) * 100, 1) if total_images > 0 else 0.0
            }
            print(f"{client}: {total_images} images ({tumor_count} tumor, {healthy_count} healthy)")
    
    # Écrire le fichier JSON dans le dossier server (où se trouve ce script)
    global_json_path = os.path.join(server_dir, "clients_stats.json")
    with open(global_json_path, 'w', encoding='utf-8') as f:
        json.dump(global_stats, f, indent=4, ensure_ascii=False)
    
    print(f"\nFichier global généré automatiquement : {global_json_path}")


if __name__ == "__main__":
    print("="*60)
    print("FEDERATEDBRAINNET - GENERATE GLOBAL CLIENT STATS")
    print("="*60)

    generate_global_stats()