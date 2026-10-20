"""Best recorded race lap per driver for the original, ADE-inspired data-art lab.
No network, provider credentials, copyrighted music or invented racing samples.
"""
from pathlib import Path
from functools import lru_cache
from bisect import bisect_right,bisect_left
import hashlib,json
from fastapi import APIRouter,HTTPException
ROOT=Path(__file__).resolve().parents[1]
router=APIRouter(prefix='/api/afterhours',tags=['Apex Afterhours'])

def read(path):return json.loads(path.read_text())
def lap_slice(series,start,duration):
    times=series['time'];lo=max(0,bisect_right(times,start)-1);hi=min(len(times),bisect_left(times,start+duration)+1)
    if hi-lo<2 or times[lo]>start or times[hi-1]<start+duration:
        raise ValueError('The best lap is not completely bracketed by the recorded stream')
    return {k:[round(t-start,6) for t in values[lo:hi]] if k=='time' else values[lo:hi] for k,values in series.items()}

@lru_cache(maxsize=1)
def best_laps():
    catalog=read(ROOT/'data/dashboard/catalog.json');race=read(ROOT/'data/dashboard/race_2024_15.json');manifest=read(ROOT/'data/replay/manifest.json');ghosts=read(ROOT/'data/ghosts.json')
    results=sorted([r for r in catalog['results'] if (r['season'],r['round_number'],r['session_name'])==(2024,15,'Race')],key=lambda r:r['driver_number'])
    drivers=[];missing=[]
    for r in results:
        code=r['driver_code'];lap=next((l for l in race['laps'] if l['driver_code']==code and l['lap_number']==r['fastest_lap_number']),None)
        try:
            if not lap or lap['lap_start_s'] is None or r['fastest_lap_ms'] is None:raise ValueError('Official best lap timing is unavailable')
            if lap['lap_duration_ms']!=r['fastest_lap_ms']:raise ValueError('Public timing and official fastest-lap duration do not agree')
            file=ROOT/'data/replay'/f'{code}.json'
            if hashlib.sha256(file.read_bytes()).hexdigest()!=manifest['sha256'][file.name]:raise ValueError('Position/telemetry checksum mismatch')
            source=read(file);start=lap['lap_start_s'];duration=r['fastest_lap_ms']/1000
            location=lap_slice(source['location'],start,duration);car=lap_slice(source['car_data'],start,duration)
            drivers.append({'code':code,'number':r['driver_number'],'name':r['full_name'],'team':r['team_name'],'team_id':r['team_id'],'lap_number':r['fastest_lap_number'],'lap_time_s':duration,'lap_start_session_s':start,
                'compound':lap['compound'],'tyre_life':lap['tyre_life'],'fastest_lap_rank':r['fastest_lap_rank'],'location':location,'car_data':car,
                'source_file_sha256':manifest['sha256'][file.name],'source':'Jolpica official fastest race lap, matched exactly to OpenF1 lap timing; observed position/car-data slices from the curated replay archive.'})
        except (ValueError,KeyError,FileNotFoundError) as e:missing.append({'code':code,'reason':str(e)})
    if not drivers:raise HTTPException(503,'Best-lap observations are unavailable. No laps are fabricated for this experience.')
    return {'schema_version':1,'season':2024,'round_number':15,'session_name':'Race','event_name':'Dutch Grand Prix','circuit':'Zandvoort','drivers':drivers,'driver_count':len(drivers),'missing':missing,
        'reference':ghosts['NOR'],'source_manifest':'data/replay/manifest.json','synthetic_race_observations':0,
        'notes':['One official fastest race lap per driver, not a same-time race replay or an all-time personal best.',
                 'Original source timestamps are retained relative to lap start; bracketing observations may lie just outside the lap.',
                 'Dance formation deliberately staggers lap phases; aligned mode starts laps together. Neither is actual race order.',
                 'Musical/visual identities are original creative assignments, not driver preferences, licensed songs or an official ADE/F1 collaboration.']}

@router.get('')
def afterhours():return best_laps()
