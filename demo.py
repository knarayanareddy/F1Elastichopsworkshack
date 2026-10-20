"""Launch the bundled-data showcase without loading cloud credentials.

Usage: python demo.py --host 0.0.0.0 --port 8000
This does not edit .env or contact Elastic/Hopsworks. The normal cloud-capable
entrypoint remains `uvicorn app:app`; stop this demo before reusing its port.
"""
import argparse


def create_demo_app():
    from src import connections
    from src.settings import Settings

    # Explicit defaults keep .env and provider keys out of this runtime.
    connections.RUNTIME = connections.Runtime(settings=Settings())
    from app import app
    return app


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--host', default='0.0.0.0')
    parser.add_argument('--port', type=int, default=8000)
    args = parser.parse_args()
    if not 1 <= args.port <= 65535:
        parser.error('--port must be between 1 and 65535')
    import uvicorn
    print('Pitlane local demo: bundled observations + SQLite. Provider credentials are not loaded; cloud actions are disabled.', flush=True)
    uvicorn.run(create_demo_app(), host=args.host, port=args.port)


if __name__ == '__main__':
    main()
