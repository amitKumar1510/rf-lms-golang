@echo off
cd /d E:\TBV\backend-main
call venv\Scripts\activate.bat
echo Starting LMS Backend Server...
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
pause