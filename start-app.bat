@echo off
echo ========================================
echo      USB MKT PRO - INICIANDO APP
echo ========================================
echo.

echo [1/3] Verificando dependencias...
if not exist "node_modules" (
    echo ❌ Dependencias nao instaladas!
    echo Execute primeiro: install-windows.bat
    pause
    exit /b 1
)
echo ✅ Dependencias OK!

echo.
echo [2/3] Iniciando Backend (porta 12001)...
start "USB MKT PRO - Backend" cmd /k "npm run dev:server"

echo Aguardando backend inicializar...
timeout /t 5 /nobreak >nul

echo.
echo [3/3] Iniciando Frontend (porta 12000)...
start "USB MKT PRO - Frontend" cmd /k "npm run dev:client"

echo.
echo ========================================
echo        🚀 USB MKT PRO INICIADO!
echo ========================================
echo.
echo 📊 Dashboard: http://localhost:12000
echo 🔧 API: http://localhost:12001
echo 📝 Logs: logs\app.log
echo 🗃️  Database: Excel (local)
echo.
echo ⚠️  IMPORTANTE: Mantenha as duas janelas abertas!
echo    - Uma para o Backend (porta 12001)
echo    - Uma para o Frontend (porta 12000)
echo.
echo Para parar o aplicativo, feche ambas as janelas.
echo.
pause
