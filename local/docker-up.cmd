@echo off
setlocal
cd /d "%~dp0"

where python >nul 2>&1
if %ERRORLEVEL%==0 (
  python "%~dp0docker-up.py" %*
  exit /b %ERRORLEVEL%
)

where py >nul 2>&1
if %ERRORLEVEL%==0 (
  py "%~dp0docker-up.py" %*
  exit /b %ERRORLEVEL%
)

sh "%~dp0docker-up.sh" %*
exit /b %ERRORLEVEL%
