from backend.app import create_app

# Vercel entry point
app = create_app()

# If running on Vercel, Flask will be served automatically through this 'app' object.
