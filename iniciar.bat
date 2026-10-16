@echo off
cd /d "%~dp0"
start "" http://localhost:2037
node server.js
