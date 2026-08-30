@echo off
title Sai Balaji Silverworks Expo App Launcher (Live Tunnel)
cls
echo ========================================================
echo   Launching Sai Balaji Silverworks Expo Mobile App (LIVE)
echo ========================================================
echo.
cd /d "%~dp0"

echo Setting Ngrok Authtoken...
set NGROK_AUTHTOKEN=3EZeGZR926Vvt7YsiV7fo95IdPG_7EjLv3YgfrxMcREY7yjbh

echo Starting Expo in Live Tunnel Mode...
echo Scan the QR code on any device with Expo Go to open the app live anywhere!
echo.
cmd /c npx expo start --tunnel

pause
