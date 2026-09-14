    @echo off
    setlocal EnableExtensions EnableDelayedExpansion

    set "APP_DIR=%~dp0"
    if not exist "%APP_DIR%package.json" if exist "%APP_DIR%Projeto-almoxarifado\package.json" set "APP_DIR=%APP_DIR%Projeto-almoxarifado\"
    if not exist "%APP_DIR%package.json" if exist "%APP_DIR%..\Projeto-almoxarifado\package.json" set "APP_DIR=%APP_DIR%..\Projeto-almoxarifado\"

    if not exist "%APP_DIR%package.json" (
        echo ERRO: package.json nao foi encontrado.
        echo Coloque este arquivo dentro da pasta do projeto ou ao lado dela.
        echo Pasta esperada: %APP_DIR%
        pause
        exit /b 1
    )

    cd /d "%APP_DIR%"

    where node >nul 2>&1
    if errorlevel 1 (
        echo ERRO: Node.js nao foi encontrado.
        echo Instale o Node.js LTS e tente novamente.
        pause
        exit /b 1
    )

    where npm >nul 2>&1
    if errorlevel 1 (
        echo ERRO: npm nao foi encontrado.
        echo Reinstale o Node.js LTS e tente novamente.
        pause
        exit /b 1
    )

    if not exist ".env" (
        echo ERRO: O arquivo .env nao foi encontrado na pasta do projeto.
        echo Crie o arquivo .env com as configuracoes do PostgreSQL.
        pause
        exit /b 1
    )

    echo.
    echo ========================================
    echo     Sistema de Almoxarifado
    echo ========================================
    echo.

    set "PORTA="
    set /p "PORTA=Digite a porta do sistema [3000]: "
    if not defined PORTA set "PORTA=3000"

    for /f "delims=0123456789" %%A in ("%PORTA%") do set "INVALIDA=1"
    if defined INVALIDA (
        echo.
        echo Porta invalida. Digite apenas numeros.
        pause
        exit /b 1
    )

    if %PORTA% LSS 1 (
        echo.
        echo A porta deve estar entre 1 e 65535.
        pause
        exit /b 1
    )

    if %PORTA% GTR 65535 (
        echo.
        echo A porta deve estar entre 1 e 65535.
        pause
        exit /b 1
    )

    echo.
    echo Iniciando o sistema na porta %PORTA%...
    echo Acesse: http://localhost:%PORTA%
    echo.

    start "" cmd /c "timeout /t 3 /nobreak >nul & start http://localhost:%PORTA%"

    set "PORT=%PORTA%"
    call npm start

    set "CODIGO=%ERRORLEVEL%"
    echo.
    echo O servidor foi encerrado com codigo %CODIGO%.
    echo Verifique a mensagem de erro acima.

    pause
