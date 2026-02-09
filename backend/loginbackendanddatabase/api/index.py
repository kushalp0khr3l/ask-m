import os
import sys
from pathlib import Path

# Dynamically add the directory containing main.py to sys.path
# This handles cases where Vercel runs from the repo root or the folder root.
current_dir = Path(__file__).parent
project_root = current_dir.parent
if str(project_root) not in sys.path:
    sys.path.append(str(project_root))

from main import app
