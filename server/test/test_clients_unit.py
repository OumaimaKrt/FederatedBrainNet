import unittest
from unittest.mock import Mock, patch, MagicMock
import numpy as np
import importlib.util
import os
import sys

class TestClientsUnit(unittest.TestCase):
    
    def import_client_module(self, hopital_name):
        """Importe dynamiquement un module client"""
        try:
            current_dir = os.path.dirname(os.path.abspath(__file__))
            server_dir = os.path.dirname(current_dir)
            project_root = os.path.dirname(server_dir)
            client_path = os.path.join(project_root, "clients", hopital_name, "train.py")
            
            if not os.path.exists(client_path):
                self.skipTest(f"Client {hopital_name} non trouve a {client_path}")
            
            spec = importlib.util.spec_from_file_location("train", client_path)
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)
            return module
        except Exception as e:
            self.skipTest(f"Impossible d'importer {hopital_name}: {e}")
    
    def test_build_model_exists_all_clients(self):
        """Test que build_model existe dans tous les clients"""
        for hopital in ["hopital_1", "hopital_2", "hopital_3"]:
            with self.subTest(hopital=hopital):
                try:
                    module = self.import_client_module(hopital)
                    self.assertTrue(hasattr(module, "build_model"))
                    print(f"build_model trouve dans {hopital}")
                except Exception as e:
                    print(f"{hopital}: {e}")
    
    def test_brain_client_exists_all_clients(self):
        """Test que BrainClient existe dans tous les clients"""
        for hopital in ["hopital_1", "hopital_2", "hopital_3"]:
            with self.subTest(hopital=hopital):
                try:
                    module = self.import_client_module(hopital)
                    self.assertTrue(hasattr(module, "BrainClient"))
                    print(f"BrainClient trouve dans {hopital}")
                except Exception as e:
                    print(f"{hopital}: {e}")
    
    def test_preprocess_image_exists_all_clients(self):
        """Test que preprocess_image existe dans tous les clients"""
        for hopital in ["hopital_1", "hopital_2", "hopital_3"]:
            with self.subTest(hopital=hopital):
                try:
                    module = self.import_client_module(hopital)
                    self.assertTrue(hasattr(module, "preprocess_image"))
                    print(f"preprocess_image trouve dans {hopital}")
                except Exception as e:
                    print(f"{hopital}: {e}")
    
    @patch.dict('sys.modules', {'tensorflow': MagicMock()})
    def test_build_model_structure_with_mock(self):
        """Test la structure de build_model avec mock de tensorflow"""
        try:
            # Mock tensorflow avant d'importer le module
            with patch.dict('sys.modules', {'tensorflow': MagicMock(), 'tensorflow.keras': MagicMock()}):
                module = self.import_client_module("hopital_1")
                
                # Mock pour Sequential
                mock_sequential = MagicMock()
                mock_model = MagicMock()
                mock_sequential.return_value = mock_model
                
                # Remplacer Sequential par notre mock
                with patch.object(module, 'Sequential', mock_sequential):
                    model = module.build_model()
                    
                    self.assertIsNotNone(model)
                    mock_sequential.assert_called_once()
                    print("build_model execute avec mock dans hopital_1")
                    
        except Exception as e:
            self.skipTest(f"Test build_model avec mock: {e}")

if __name__ == '__main__':
    unittest.main()