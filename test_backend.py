import os
import unittest
import tempfile
import json
from io import BytesIO
import sys

# Assume we are in StudyCoreAI directory
import full

class StudyCoreTestCase(unittest.TestCase):
    def setUp(self):
        self.db_fd, full.app.config['DATABASE'] = tempfile.mkstemp()
        full.app.config['TESTING'] = True
        full.app.config['WTF_CSRF_ENABLED'] = False
        
        # Override DB name for testing
        full.DB_NAME = 'test_studycore.db'
        full.init_db()
        
        self.app = full.app.test_client()

    def tearDown(self):
        os.close(self.db_fd)
        try:
            if os.path.exists(full.DB_NAME):
                os.remove(full.DB_NAME)
        except:
            pass

    def register(self, username, password, role='Student'):
        return self.app.post('/api/register',
                             data=json.dumps(dict(username=username, password=password, role=role)),
                             content_type='application/json')

    def login(self, username, password):
        return self.app.post('/api/login',
                             data=json.dumps(dict(username=username, password=password)),
                             content_type='application/json')

    def logout(self):
        return self.app.post('/api/logout')

    def test_home(self):
        rv = self.app.get('/')
        # It should serve index.html (or text pointing to it)
        # Verify status code 200
        assert rv.status_code == 200

    def test_register_login(self):
        rv = self.register('testuser', 'password')
        assert b'User registered successfully' in rv.data
        rv = self.login('testuser', 'password')
        assert b'Login successful' in rv.data
        rv = self.logout()
        assert b'Logged out' in rv.data

    def test_role_access(self):
        # Register Teacher
        self.register('teacher1', 'pass', 'Teacher')
        self.login('teacher1', 'pass')
        
        # Teacher checks library (should be empty initially)
        rv = self.app.get('/api/library')
        data = json.loads(rv.data)
        assert 'books' in data

        self.logout()
        
        # Student check
        self.register('student1', 'pass', 'Student')
        self.login('student1', 'pass')
        
        # Student tries to upload (should fail)
        rv = self.app.post('/api/upload', data={
            'file': (BytesIO(b'my file contents'), 'test.pdf')
        })
        assert rv.status_code == 403

if __name__ == '__main__':
    unittest.main()
