@echo off
chcp 65001 >nul
cd /d "%~dp0"
node scripts\open-local-preview.mjs
if errorlevel 1 pause
