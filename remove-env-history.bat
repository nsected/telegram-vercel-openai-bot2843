@echo off
SETLOCAL ENABLEEXTENSIONS

REM === WARNING ===
echo ==================================================
echo [WARNING] This script will REWRITE Git history!
echo This is IRREVERSIBLE. Proceed ONLY if you know
echo what you are doing.
echo ==================================================
echo.
set /p CONFIRM="Type YES to continue: "
if /I not "%CONFIRM%"=="YES" (
  echo Operation canceled.
  pause
  exit /b
)

REM Path to git-filter-repo.py
set FILTER_REPO_PY=C:\Users\abc\Downloads\git-filter-repo-2.47.0.tar\git-filter-repo-2.47.0\git-filter-repo.py

REM Check that the script exists
if not exist "%FILTER_REPO_PY%" (
  echo [ERROR] git-filter-repo.py not found at: %FILTER_REPO_PY%
  pause
  exit /b 1
)

REM Check if Python is available
where python >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Python is not installed or not in PATH
  pause
  exit /b 1
)

REM Check if inside a Git repository
if not exist ".git" (
  echo [ERROR] Current folder is not a Git repository
  pause
  exit /b 1
)

echo [INFO] Removing .env from Git history (forced)...
python "%FILTER_REPO_PY%" --force --path .env --invert-paths

if errorlevel 1 (
  echo [ERROR] git-filter-repo failed
  pause
  exit /b 1
)

echo [INFO] Pushing changes to remote (force)...
git push --force

echo [DONE] .env has been removed from Git history.
pause
