"""The credential-free showcase ignores cloud config and remains read-only."""
import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def demo_client(monkeypatch):
    from src import connections
    from src.settings import Settings
    import requests
    from demo import create_demo_app

    previous = connections.RUNTIME
    monkeypatch.setenv('PITLANE_DATA_MODE', 'elastic')
    monkeypatch.setenv('PITLANE_FEATURE_MODE', 'hopsworks')
    monkeypatch.setenv('ELASTIC_SOURCE_API_KEY', 'OFFLINE_TEST_SENTINEL')
    monkeypatch.setenv('HOPSWORKS_API_KEY', 'OFFLINE_TEST_SENTINEL')

    def forbidden(*args, **kwargs):
        raise AssertionError('Local demo must not load credentials or make provider HTTP requests')

    monkeypatch.setattr(Settings, 'load', forbidden)
    monkeypatch.setattr(requests.Session, 'request', forbidden)
    app = create_demo_app()
    try:
        with TestClient(app) as client:
            yield client
    finally:
        connections.RUNTIME.pool.shutdown(wait=True)
        connections.RUNTIME = previous


def test_demo_ignores_configured_environment(demo_client):
    import os

    status = demo_client.get('/api/connections/status').json()
    assert status['modes'] == {'data': 'local', 'features': 'local'}
    assert not status['cloud_connected'] and not status['admin_configured']
    assert not status['elastic']['configured'] and not status['hopsworks']['configured']
    assert not status['feature_writes_enabled'] and status['configuration_error'] is None
    assert os.environ['PITLANE_DATA_MODE'] == 'elastic'
    assert os.environ['HOPSWORKS_API_KEY'] == 'OFFLINE_TEST_SENTINEL'


def test_demo_main_data_paths_work(demo_client):
    for path in [
        '/', '/api/health', '/api/bootstrap', '/api/ghost', '/api/ghost/field',
        '/api/replay/race', '/api/replay/driver/NOR', '/api/strategy', '/api/pace',
        '/api/dna/challenge', '/api/pipeline', '/api/dashboard/catalog',
        '/api/dashboard/season', '/api/dashboard/race', '/api/dashboard/timing',
        '/api/dashboard/coverage',
    ]:
        assert demo_client.get(path).status_code == 200, path
    assert demo_client.get('/api/dashboard/catalog').json()['counts']['events'] == 46
    assert len(demo_client.get('/api/ghost/field').json()['drivers']) == 4
    assert demo_client.get('/api/replay/race').json()['manifest']['driver_count'] == 20


def test_demo_does_not_enable_cloud_controls(demo_client):
    for path in ['/api/connections/test/elastic', '/api/connections/test/hopsworks', '/api/connections/reload']:
        assert demo_client.post(path).status_code == 503
