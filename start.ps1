# start.ps1 — Sinergy Production Startup
# Inicia backend y frontend compilados como procesos ocultos en segundo plano.
# Los PIDs se guardan en .sinergy.pids para que stop.ps1 pueda terminarlos limpiamente.

$root = $PSScriptRoot
New-Item -ItemType Directory -Force -Path "$root\logs" | Out-Null

$backend = Start-Process `
    -FilePath "node" `
    -ArgumentList "dist\index.js" `
    -WorkingDirectory "$root\apps\backend" `
    -WindowStyle Hidden `
    -PassThru

$frontend = Start-Process `
    -FilePath "node" `
    -ArgumentList "node_modules\vite\bin\vite.js", "preview" `
    -WorkingDirectory "$root\apps\frontend" `
    -WindowStyle Hidden `
    -PassThru

"$($backend.Id)`n$($frontend.Id)" | Set-Content "$root\.sinergy.pids"

Write-Host "Sinergy iniciado — Backend PID: $($backend.Id) | Frontend PID: $($frontend.Id)"
