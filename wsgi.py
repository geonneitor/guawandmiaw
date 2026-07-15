import sys
import os

# Automatically determine the project directory
project_home = os.path.dirname(os.path.abspath(__file__))
if project_home not in sys.path:
    sys.path.insert(0, project_home)

# Initialize the Flask application
from backend.app import create_app

application = create_app()
