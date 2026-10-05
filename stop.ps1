# stop.ps1 — Detiene todos los servicios de Sinergy
Set-Location $PSScriptRoot
pm2 stop all
