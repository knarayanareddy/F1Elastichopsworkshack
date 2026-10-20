"""ASGI entrypoint for Vercel's credential-free bundled-data showcase."""
from demo import create_demo_app

app = create_demo_app()
