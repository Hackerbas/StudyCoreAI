import os
import sys

# Add the parent directory (project root) to PYTHONPATH
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from full import app
