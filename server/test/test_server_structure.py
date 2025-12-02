import unittest
import os
import sys

class TestServerStructure(unittest.TestCase):
    
    def test_server_file_exists(self):
        """Test que le fichier server.py existe"""
        server_path = os.path.join(os.path.dirname(__file__), '..', 'server.py')
        self.assertTrue(os.path.exists(server_path), "server.py n'existe pas")
        print("server.py existe")
    
    def test_required_files_exist(self):
        """Test que tous les fichiers requis existent"""
        required_files = [
            '../server.py',
            '../saved_models/',
            '../metrics_logs/'
        ]
        
        for file_path in required_files:
            with self.subTest(file=file_path):
                full_path = os.path.join(os.path.dirname(__file__), file_path)
                self.assertTrue(os.path.exists(full_path), f"{file_path} non trouvé")
                print(f" {file_path} existe")
    
    def test_imports_work(self):
        """Test que les imports de base fonctionnent"""
        try:
            import flwr
            import tensorflow as tf
            import numpy as np
            print("Tous les imports de base fonctionnent")
        except ImportError as e:
            self.fail(f" Import échoué: {e}")

if __name__ == '__main__':
    unittest.main()