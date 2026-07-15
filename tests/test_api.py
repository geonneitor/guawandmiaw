import unittest
import json
from backend.app import create_app
from backend.extensions import db

class BasicTests(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.app.config['TESTING'] = True
        self.app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        self.client = self.app.test_client()
        with self.app.app_context():
            db.create_all()

    def tearDown(self):
        with self.app.app_context():
            db.drop_all()

    def test_health_check(self):
        response = self.client.get('/api/health')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json['success'], True)

    def test_status_endpoint(self):
        response = self.client.get('/api/status')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json['data']['status'], 'running')

    def test_404_handler(self):
        response = self.client.get('/api/v1/nonexistent')
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.json['success'], False)

if __name__ == '__main__':
    unittest.main()
