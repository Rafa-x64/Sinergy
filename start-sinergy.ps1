# ============================================================
#  Sinergy - Script de arranque en produccion
#  Uso: .\start-sinergy.ps1
#  Uso con puertos custom: .\start-sinergy.ps1 -BackendPort 3080 -FrontendPort 8080
# ============================================================

param(
    [int]$BackendPort  = 3080,
    [int]$FrontendPort = 4173
)

# Pre-computar rutas absolutas para evitar problemas de interpolacion en Start-Process
$ROOT         = $PSScriptRoot
$BACKEND_ENTRY = Join-Path $ROOT "apps\backend\dist\src\index.js"
$FRONTEND_DIR  = Join-Path $ROOT "apps\frontend"

# ─── Validar que los builds existen antes de arrancar ────────────────────────
if (-not (Test-Path $BACKEND_ENTRY)) {
    Write-Host "[ERROR] No existe: $BACKEND_ENTRY" -ForegroundColor Red
    Write-Host "        Ejecuta primero: pnpm build:backend" -ForegroundColor Yellow
    exit 1
}

if (-not (Test-Path (Join-Path $FRONTEND_DIR "dist\index.html"))) {
    Write-Host "[ERROR] No existe: $FRONTEND_DIR\dist\index.html" -ForegroundColor Red
    Write-Host "        Ejecuta primero: pnpm build:frontend" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  Sinergy - Iniciando servicios en produccion" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  Backend  -> http://localhost:$BackendPort" -ForegroundColor Green
Write-Host "  Frontend -> http://localhost:$FrontendPort" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# ─── Backend: generar script temporal y ejecutarlo en nueva ventana ───────────
$backendScript = Join-Path $env:TEMP "sinergy-backend.ps1"
Set-Content -Path $backendScript -Value @"
`$env:PORT = '$BackendPort'
node "$BACKEND_ENTRY"
"@

Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-File", $backendScript -WindowStyle Normal

# ─── Frontend: generar script temporal y ejecutarlo en nueva ventana ──────────
$frontendScript = Join-Path $env:TEMP "sinergy-frontend.ps1"
Set-Content -Path $frontendScript -Value @"
Set-Location "$FRONTEND_DIR"
npx vite preview --port $FrontendPort --host
"@

Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-File", $frontendScript -WindowStyle Normal

Write-Host "Ambos servicios iniciados en ventanas separadas." -ForegroundColor Green
Write-Host "Cierra esas ventanas para detener los servicios." -ForegroundColor Yellow
Write-Host ""
