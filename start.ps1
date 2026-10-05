# start.ps1 — Inicia Sinergy (backend + frontend compilados) via PM2
Set-Location $PSScriptRoot
pm2 start ecosystem.config.cjs
pm2 save
