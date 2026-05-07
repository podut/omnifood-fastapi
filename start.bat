@echo off
TITLE Omnifood - Start Server
SETLOCAL EnableExtensions

:: Verificare Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [EROARE] Python nu este instalat sau nu este in PATH.
    echo Te rugam sa instalezi Python (recomandat 3.10+) de pe https://www.python.org/
    pause
    exit /b 1
)

:: Creare mediu virtual daca nu exista
if not exist ".venv" (
    echo [INFO] Se creeaza mediul virtual .venv...
    python -m venv .venv
    if %errorlevel% neq 0 (
        echo [EROARE] Nu s-a putut crea mediul virtual.
        pause
        exit /b 1
    )
)

:: Activare mediu virtual si instalare dependente
echo [INFO] Se activeaza mediul virtual si se verifica dependentele...
call .venv\Scripts\activate
python -m pip install --upgrade pip --quiet
pip install -r requirements.txt --quiet

:: Pornire server
echo.
echo ===================================================
echo   Omnifood este gata!
echo   Serverul porneste la: http://localhost:8000
echo   Documentatie API: http://localhost:8000/docs
echo ===================================================
echo.

:: Rulare backend din radacina proiectului
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload

if %errorlevel% neq 0 (
    echo [EROARE] Serverul s-a oprit neasteptat.
    pause
)

deactivate
