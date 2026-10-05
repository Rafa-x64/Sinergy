# start.ps1 - Sinergy Production Startup
# Inicia backend y frontend compilados en segundo plano para produccion.

$root = $PSScriptRoot
New-Item -ItemType Directory -Force -Path "$root\logs" | Out-Null

# 1. Verificar si ya estan corriendo ambos servicios
$backendListening  = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
$frontendListening = Get-NetTCPConnection -LocalPort 4173 -State Listen -ErrorAction SilentlyContinue

if ($backendListening -and $frontendListening) {
    Write-Host "Sinergy ya se encuentra en ejecucion (Backend :3000, Frontend :4173)."
    exit 0
}

# 2. Localizar binario de Node.js
$nodeCmd = "node"
$nodeFound = Get-Command "node" -ErrorAction SilentlyContinue
if ($nodeFound) {
    $nodeCmd = $nodeFound.Source
} elseif (Test-Path "C:\Program Files\nodejs\node.exe") {
    $nodeCmd = "C:\Program Files\nodejs\node.exe"
}

# 3. Liberar puertos si quedaron procesos zombies
@(3000, 4173) | ForEach-Object {
    $conn = Get-NetTCPConnection -LocalPort $_ -State Listen -ErrorAction SilentlyContinue
    if ($conn -and $conn.OwningProcess) {
        & taskkill.exe /PID $conn.OwningProcess /F /T 2>$null
    }
}
Start-Sleep -Milliseconds 300

# 4. Iniciar Backend
$backendLogOut = "$root\logs\backend.log"
$backendLogErr = "$root\logs\backend.err.log"
$backend = Start-Process `
    -FilePath $nodeCmd `
    -ArgumentList "dist\src\index.js" `
    -WorkingDirectory "$root\apps\backend" `
    -WindowStyle Hidden `
    -RedirectStandardOutput $backendLogOut `
    -RedirectStandardError $backendLogErr `
    -PassThru

# 5. Iniciar Frontend (Vite preview escuchando en todas las interfaces)
$frontendLogOut = "$root\logs\frontend.log"
$frontendLogErr = "$root\logs\frontend.err.log"
$viteScript = "$root\apps\frontend\node_modules\vite\bin\vite.js"

$frontend = Start-Process `
    -FilePath $nodeCmd `
    -ArgumentList "`"$viteScript`"", "preview", "--host", "0.0.0.0", "--port", "4173" `
    -WorkingDirectory "$root\apps\frontend" `
    -WindowStyle Hidden `
    -RedirectStandardOutput $frontendLogOut `
    -RedirectStandardError $frontendLogErr `
    -PassThru

# 6. Guardar PIDs para administracion
"$($backend.Id)`n$($frontend.Id)" | Set-Content "$root\.sinergy.pids" -Force

Write-Host "Sinergy iniciado correctamente:"
Write-Host "  -> Backend  PID: $($backend.Id) en http://localhost:3000"
Write-Host "  -> Frontend PID: $($frontend.Id) en http://localhost:4173"
