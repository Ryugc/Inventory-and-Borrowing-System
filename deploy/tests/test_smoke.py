"""Offline unit tests for deploy/smoke_test.py (the network is mocked).

Run (repo root):  python3 -m unittest discover -s deploy/tests -p 'test_smoke.py'
CI runs it too (.github/workflows/ci-docker.yml).

Covers: public checks pass and the optional login is skipped without credentials;
a database that is not ready fails even if HTTP answers; an API that answers
without a login fails; the optional login check works and fails when it should.
"""
import importlib.util
import urllib.error
from pathlib import Path
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('smoke', Path(__file__).parents[1] / 'smoke_test.py')
smoke = importlib.util.module_from_spec(spec)
spec.loader.exec_module(smoke)


class SmokeTests(unittest.TestCase):
    def response(self, base, path, data=None, token=None):
        if path == '/api/assets':
            if token is None:
                raise urllib.error.HTTPError(base + path, 401, 'Unauthorized', {}, None)
            return b'[]'
        return {
            '/api/health': b'{"status":"ok"}',
            '/api/ready': b'{"status":"ready"}',
            '/': b'<html></html>',
            '/api/auth/login': b'{"token":"test-session"}',
        }[path]

    @patch.dict('os.environ', {}, clear=True)
    def test_public_checks_pass_and_skip_optional_login(self):
        with patch.object(smoke, 'request', side_effect=self.response) as req:
            smoke.check('https://demo.test')
            self.assertEqual(req.call_count, 4)

    @patch.dict('os.environ', {}, clear=True)
    def test_db_not_ready_fails_even_when_http_responds(self):
        def unavailable(base, path, data=None, token=None):
            if path == '/api/ready':
                return b'{"status":"unavailable"}'
            return self.response(base, path, data, token)
        with patch.object(smoke, 'request', side_effect=unavailable), patch.object(smoke.time, 'sleep'):
            with self.assertRaisesRegex(RuntimeError, '/api/ready'):
                smoke.check('https://demo.test')

    @patch.dict('os.environ', {}, clear=True)
    def test_api_that_answers_without_login_fails(self):
        def open_api(base, path, data=None, token=None):
            if path == '/api/assets':
                return b'[]'
            return self.response(base, path, data, token)
        with patch.object(smoke, 'request', side_effect=open_api):
            with self.assertRaisesRegex(RuntimeError, '/api/assets'):
                smoke.check('https://demo.test')

    @patch.dict('os.environ', {'SMOKE_EMAIL': 'smoke@example.test', 'SMOKE_PASSWORD': 'test-only'}, clear=True)
    def test_optional_login_check_passes(self):
        with patch.object(smoke, 'request', side_effect=self.response) as req:
            smoke.check('https://demo.test')
            self.assertEqual(req.call_count, 6)

    @patch.dict('os.environ', {'SMOKE_EMAIL': 'smoke@example.test', 'SMOKE_PASSWORD': 'test-only'}, clear=True)
    def test_optional_login_check_fails_when_authenticated_call_breaks(self):
        def broken(base, path, data=None, token=None):
            if path == '/api/assets' and token:
                raise ValueError('Broken response')
            return self.response(base, path, data, token)
        with patch.object(smoke, 'request', side_effect=broken):
            with self.assertRaisesRegex(RuntimeError, 'Login smoke'):
                smoke.check('https://demo.test')


if __name__ == '__main__':
    unittest.main()