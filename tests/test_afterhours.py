"""Afterhours uses real official best race laps; sound/visual identities are creative."""
from pathlib import Path
import json,pytest
from fastapi.testclient import TestClient
from src.afterhours import best_laps,lap_slice
ROOT=Path(__file__).resolve().parents[1]
DATA=best_laps();CODES=[d['code'] for d in DATA['drivers']]

def test_twenty_best_laps_with_no_fabricated_coverage():
    assert DATA['driver_count']==20 and len(set(CODES))==20 and DATA['missing']==[]
    assert DATA['synthetic_race_observations']==0 and DATA['season']==2024 and DATA['round_number']==15
    assert 'stagger' in ' '.join(DATA['notes']) and 'not driver preferences' in ' '.join(DATA['notes'])

@pytest.mark.parametrize('code',CODES)
def test_selected_lap_is_official_fastest_with_observed_brackets(code):
    row=next(d for d in DATA['drivers'] if d['code']==code)
    cat=json.loads((ROOT/'data/dashboard/catalog.json').read_text())
    official=next(r for r in cat['results'] if (r['season'],r['round_number'],r['session_name'],r['driver_code'])==(2024,15,'Race',code))
    assert row['lap_number']==official['fastest_lap_number']
    assert row['lap_time_s']==official['fastest_lap_ms']/1000
    source=json.loads((ROOT/f'data/replay/{code}.json').read_text())
    for name in ['location','car_data']:
        s=row[name];assert len(s['time'])>=65 and s['time'][0]<=0 and s['time'][-1]>=row['lap_time_s']
        assert all(b>a for a,b in zip(s['time'],s['time'][1:]))
        assert all(len(v)==len(s['time']) for v in s.values())
        original=source[name];lookup={round(t,6):i for i,t in enumerate(original['time'])}
        for i,t in enumerate(s['time']):
            j=lookup[round(t+row['lap_start_session_s'],6)]
            assert all(s[k][i]==original[k][j] for k in s if k!='time')

def test_slice_does_not_extrapolate_missing_lap():
    with pytest.raises(ValueError):lap_slice({'time':[10,11],'x':[1,2]},5,10)

def test_endpoint_is_available_in_credential_free_demo(monkeypatch):
    import requests
    from demo import create_demo_app
    from src import connections
    old=connections.RUNTIME
    def no_network(*a,**k):raise AssertionError('Unexpected external call')
    monkeypatch.setattr(requests.Session,'request',no_network)
    try:
        with TestClient(create_demo_app()) as c:
            r=c.get('/api/afterhours');assert r.status_code==200 and r.json()['driver_count']==20
            assert len(r.content)<250000
            assert c.get('/api/connections/status').json()['cloud_connected'] is False
    finally:connections.RUNTIME.pool.shutdown(wait=True);connections.RUNTIME=old
