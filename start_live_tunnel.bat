@echo off
title Sai Balaji Silverworks Live ngrok Tunnel Launcher
cls
echo ========================================================
echo   Sai Balaji Silverworks - Live ngrok Tunnel Launcher
echo ========================================================
echo.
cd /d "%~dp0"

echo Configuring ngrok authtoken...
set NGROK_AUTHTOKEN=3EZeGZR926Vvt7YsiV7fo95IdPG_7EjLv3YgfrxMcREY7yjbh
call cmd /c "npx @expo/ngrok config add-authtoken 3EZeGZR926Vvt7YsiV7fo95IdPG_7EjLv3YgfrxMcREY7yjbh" 2>nul

echo.
echo Launching Expo Live Tunnel...
echo Anyone with the Expo Go app or QR code can access the app live!
echo.
cmd /c npx expo start --tunnel

pause
