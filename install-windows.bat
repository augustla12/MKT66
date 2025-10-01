@echo off
echo ========================================
echo    USB MKT PRO - INSTALACAO WINDOWS
echo ========================================
echo.

echo [1/5] Verificando Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js nao encontrado!
    echo Por favor, instale Node.js 20+ de: https://nodejs.org
    pause
    exit /b 1
)
echo ✅ Node.js encontrado!

echo.
echo [2/5] Instalando dependencias...
call npm install --legacy-peer-deps
if %errorlevel% neq 0 (
    echo ❌ Erro ao instalar dependencias!
    pause
    exit /b 1
)

echo.
echo [3/5] Verificando banco de dados Excel...
if not exist "database\mkt2_local.xlsx" (
    echo ❌ Banco de dados nao encontrado!
    echo Certifique-se que o arquivo database\mkt2_local.xlsx existe
    pause
    exit /b 1
)
echo ✅ Banco de dados encontrado!

echo.
echo [4/5] Criando diretorios necessarios...
if not exist "uploads" mkdir uploads
if not exist "logs" mkdir logs
echo ✅ Diretorios criados!

echo.
echo [5/5] Instalacao concluida!
echo.
echo Para iniciar o aplicativo, execute: start-app.bat
echo.
pause
