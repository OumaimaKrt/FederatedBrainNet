import unittest
import os
import sys

sys.path.append('.')

class TestServerStructure(unittest.TestCase):
    
    def test_server_import(self):
        """Test que le module server peut être importé"""
        try:
            import server
            self.assertTrue(True)
            print("Module server importé avec succès")
        except Exception as e:
            self.fail(f"Erreur import server: {e}")
    
    def test_required_components_exist(self):
        """Test que tous les composants requis existent"""
        import server
        
        required_items = [
            'save_global_model',
            'save_metrics', 
            'FedAvgWithLogging',
            'main'
        ]
        
        for item in required_items:
            with self.subTest(component=item):
                self.assertTrue(hasattr(server, item))
                print(f"{item} existe")
    
    def test_functions_are_callable(self):
        """Test que les fonctions sont callables"""
        import server
        
        functions = ['save_global_model', 'save_metrics', 'main']
        
        for func_name in functions:
            with self.subTest(function=func_name):
                func = getattr(server, func_name)
                self.assertTrue(callable(func))
                print(f"{func_name} est callable")
    
    def test_fedavg_inheritance(self):
        """Test que FedAvgWithLogging hérite correctement"""
        import server
        from flwr.server.strategy import FedAvg
        
        self.assertTrue(issubclass(server.FedAvgWithLogging, FedAvg))
        print("FedAvgWithLogging hérite correctement de FedAvg")
    
    def test_strategy_initialization(self):
        """Test que la stratégie peut être initialisée"""
        import server
        
        strategy = server.FedAvgWithLogging(
            fraction_fit=1.0,
            fraction_evaluate=1.0,
            min_fit_clients=3,
            min_available_clients=3,
            min_evaluate_clients=3,
        )
        
        self.assertIsNotNone(strategy)
        print("Stratégie FedAvgWithLogging initialisée")

if __name__ == '__main__':
    unittest.main()