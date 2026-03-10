import subprocess, sys, os
os.chdir(os.path.dirname(__file__))
subprocess.run([sys.executable, "-m", "uvicorn", "app.main:app", "--reload", "--host", "0.0.0.0", "--port", "8000"])
