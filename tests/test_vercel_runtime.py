import json
import tomllib
from pathlib import Path

from src.dashboard import DashboardEngine
from src.engine import LocalFeatureStore
from src.settings import runtime_dir


def test_vercel_runtime_dir_defaults_to_tmp(monkeypatch):
    monkeypatch.setenv('VERCEL', '1')
    monkeypatch.delenv('PITLANE_RUNTIME_DIR', raising=False)

    assert runtime_dir() == Path('/tmp/pitlane')


def test_runtime_dir_respects_explicit_override(monkeypatch, tmp_path):
    expected = tmp_path / 'runtime'
    monkeypatch.setenv('VERCEL', '1')
    monkeypatch.setenv('PITLANE_RUNTIME_DIR', str(expected))

    assert runtime_dir() == expected


def test_vercel_feature_store_uses_writable_runtime_dir(monkeypatch, tmp_path):
    monkeypatch.setenv('VERCEL', '1')
    monkeypatch.setenv('PITLANE_RUNTIME_DIR', str(tmp_path))

    assert LocalFeatureStore().path == tmp_path / 'lab.sqlite'


def test_dashboard_database_uses_writable_runtime_dir(monkeypatch, tmp_path):
    monkeypatch.setenv('VERCEL', '1')
    monkeypatch.setenv('PITLANE_RUNTIME_DIR', str(tmp_path))
    dashboard = DashboardEngine()
    try:
        database = Path(dashboard.db.execute('PRAGMA database_list').fetchone()[2])
        assert database == tmp_path / 'dashboard-runtime.sqlite'
    finally:
        dashboard.db.close()


def test_vercel_bundle_excludes_local_secrets_and_runtime_cache():
    root = Path(__file__).resolve().parents[1]
    config = json.loads((root / 'vercel.json').read_text())
    excluded = config['functions']['vercel_demo.py']['excludeFiles']
    upload_ignored = (root / '.vercelignore').read_text().splitlines()

    for path in ('.env', '.env.local', '.env.*.local', '.cache/**', '.vercel/**', '.claude/**', '_uv/**', '.secrets/**'):
        assert path in excluded
    assert '.env.example' not in excluded
    assert 'pyproject.toml' not in excluded
    assert 'uv.lock' not in excluded
    for path in ('.env*', '_uv/', '.claude/'):
        assert path in upload_ignored
    assert '!**/.env.example' in upload_ignored
    assert 'pyproject.toml' not in upload_ignored
    assert 'uv.lock' not in upload_ignored


def test_vercel_entrypoint_uses_the_credential_free_factory():
    root = Path(__file__).resolve().parents[1]
    pyproject = tomllib.loads((root / 'pyproject.toml').read_text())
    assert pyproject['tool']['vercel']['entrypoint'] == 'vercel_demo:app'

    runtime_deps = {
        'fastapi==0.146.0',
        'pandas==2.2.3',
        'numpy==2.3.5',
        'scikit-learn==1.6.1',
        'requests==2.33.0',
        'python-dotenv>=1.0,<2',
    }
    assert set(pyproject['project']['dependencies']) == runtime_deps
    requirements = (root / 'requirements.txt').read_text().lower()
    assert 'hopsworks' not in requirements
    assert all(dependency.lower() in requirements for dependency in runtime_deps)


def test_static_overview_links_to_the_keyless_hosted_demo():
    root = Path(__file__).resolve().parents[1]
    overview = (root / 'index.html').read_text()
    readme = (root / 'README.md').read_text()

    assert 'https://f1hackdemo.kiranreddy.nl' in overview
    assert 'credential-free showcase' in overview
    assert 'GitHub Pages is a static overview' in overview
    assert 'https://f1hackdemo.kiranreddy.nl' in readme
    assert 'no Elastic/Hopsworks credentials' in readme
