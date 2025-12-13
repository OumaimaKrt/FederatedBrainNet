import numpy as np

path = r"C:\Users\user\Documents\GitHub\FederatedBrainNet\server\saved_models\global_model_round10.npz"
data = np.load(path, allow_pickle=True)

print(data.files)
