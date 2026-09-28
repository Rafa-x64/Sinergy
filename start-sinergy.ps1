# ============================================================
#  Sinergy - Script de arranque en produccion (Modo Servicio / Task Scheduler)
#  Uso: .\start-sinergy.ps1
#  Uso con puertos custom: .\start-sinergy.ps1 -BackendPort 3080 -FrontendPort 8080
# ============================================================

param(
    [int]$BackendPort  = 3000,
    [int]$FrontendPort = 4173,
    [switch]$NoWait
)

$ROOT          = $PSScriptRoot
$BACKEND_DIR   = Join-Path $ROOT "apps\backend"
$BACKEND_ENTRY = Join-Path $ROOT "apps\backend\dist\src\index.js"
$FRONTEND_DIR  = Join-Path $ROOT "apps\frontend"

# --- 1. Validar que los builds existen antes de arrancar ------------------------
if (-not (Test-Path $BACKEND_ENTRY)) {
    Write-Host "[ERROR] No existe el artefacto compilado del Backend: $BACKEND_ENTRY" -ForegroundColor Red
    Write-Host "        Ejecuta primero: pnpm build:backend" -ForegroundColor Yellow
    exit 1
}

if (-not (Test-Path (Join-Path $FRONTEND_DIR "dist\index.html"))) {
    Write-Host "[ERROR] No existe el artefacto compilado del Frontend: $FRONTEND_DIR\dist\index.html" -ForegroundColor Red
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

# --- 2. Limpiar instancias previas colgadas si existen --------------------------
$stopScript = Join-Path $ROOT "stop-sinergy.ps1"
if (Test-Path $stopScript) {
    & $stopScript -BackendPort $BackendPort -FrontendPort $FrontendPort
}

# --- 3. Preparar directorio de logs ---------------------------------------------
$logsDir = Join-Path $ROOT "logs"
if (-not (Test-Path $logsDir)) {
    New-Item -ItemType Directory -Path $logsDir -Force | Out-Null
}

$backendLogOut  = Join-Path $logsDir "backend.log"
$backendLogErr  = Join-Path $logsDir "backend.err.log"
$frontendLogOut = Join-Path $logsDir "frontend.log"
$frontendLogErr = Join-Path $logsDir "frontend.err.log"

# Configurar variables de entorno para que los subprocesos las hereden
$env:PORT = "$BackendPort"
$env:BACKEND_URL = "http://localhost:$BackendPort"

# --- 4. Iniciar Backend (Oculto, sin ventana emergente) --------------------------
Write-Host "Iniciando Backend en segundo plano..." -ForegroundColor Cyan

$backendArgs = if ($BACKEND_ENTRY -match '\s') { "`"$BACKEND_ENTRY`"" } else { $BACKEND_ENTRY }

$backendProc = Start-Process -FilePath "node" `
    -ArgumentList $backendArgs `
    -WorkingDirectory $BACKEND_DIR `
    -WindowStyle Hidden `
    -RedirectStandardOutput $backendLogOut `
    -RedirectStandardError $backendLogErr `
    -PassThru

if (-not $backendProc -or -not $backendProc.Id) {
    Write-Host "[ERROR] No se pudo crear el proceso del Backend." -ForegroundColor Red
    exit 1
}

# Verificar activamente que el Backend levante en su puerto
Write-Host "  Esperando respuesta en puerto $BackendPort..." -ForegroundColor DarkGray
$backendListo = $false
for ($i = 0; $i -lt 10; $i++) {
    Start-Sleep -Milliseconds 500
    if ($backendProc.HasExited) { break }
    $check = Get-NetTCPConnection -LocalPort $BackendPort -State Listen -ErrorAction SilentlyContinue
    if ($check) {
        $backendListo = $true
        break
    }
}

if (-not $backendListo) {
    Write-Host "[ERROR] El Backend (PID $($backendProc.Id)) no respondio en el puerto $BackendPort." -ForegroundColor Red
    if (Test-Path $backendLogErr) {
        $errLogs = Get-Content $backendLogErr -Tail 10 -ErrorAction SilentlyContinue
        if ($errLogs) {
            Write-Host "Ultimas lineas del log de error:" -ForegroundColor Yellow
            $errLogs | ForEach-Object { Write-Host "  $_" -ForegroundColor DarkYellow }
        }
    }
    if (-not $backendProc.HasExited) {
        & taskkill.exe /PID $backendProc.Id /T /F 2>&1 | Out-Null
    }
    exit 1
}

Write-Host "  [OK] Backend iniciado con PID $($backendProc.Id) (Puerto $BackendPort listo)" -ForegroundColor Green

# --- 5. Iniciar Frontend (Oculto, sin ventana emergente) -------------------------
Write-Host "Iniciando Frontend en segundo plano..." -ForegroundColor Cyan
$viteCmd = Join-Path $FRONTEND_DIR "node_modules\.bin\vite.cmd"
if (Test-Path $viteCmd) {
    $frontendFilePath = $viteCmd
    $frontendArgs     = "preview --port $FrontendPort --host"
} else {
    $frontendFilePath = "npx"
    $frontendArgs     = "vite preview --port $FrontendPort --host"
}

$frontendProc = Start-Process -FilePath $frontendFilePath `
    -ArgumentList $frontendArgs `
    -WorkingDirectory $FRONTEND_DIR `
    -WindowStyle Hidden `
    -RedirectStandardOutput $frontendLogOut `
    -RedirectStandardError $frontendLogErr `
    -PassThru

if (-not $frontendProc -or -not $frontendProc.Id) {
    Write-Host "[ERROR] No se pudo crear el proceso del Frontend." -ForegroundColor Red
    exit 1
}

# Verificar activamente que el Frontend levante en su puerto
Write-Host "  Esperando respuesta en puerto $FrontendPort..." -ForegroundColor DarkGray
$frontendListo = $false
for ($i = 0; $i -lt 10; $i++) {
    Start-Sleep -Milliseconds 500
    if ($frontendProc.HasExited) { break }
    $check = Get-NetTCPConnection -LocalPort $FrontendPort -State Listen -ErrorAction SilentlyContinue
    if ($check) {
        $frontendListo = $true
        break
    }
}

if (-not $frontendListo) {
    Write-Host "[ERROR] El Frontend (PID $($frontendProc.Id)) no respondio en el puerto $FrontendPort." -ForegroundColor Red
    if (Test-Path $frontendLogErr) {
        $errLogs = Get-Content $frontendLogErr -Tail 10 -ErrorAction SilentlyContinue
        if ($errLogs) {
            Write-Host "Ultimas lineas del log de error:" -ForegroundColor Yellow
            $errLogs | ForEach-Object { Write-Host "  $_" -ForegroundColor DarkYellow }
        }
    }
    if (-not $frontendProc.HasExited) {
        & taskkill.exe /PID $frontendProc.Id /T /F 2>&1 | Out-Null
    }
    exit 1
}

Write-Host "  [OK] Frontend iniciado con PID $($frontendProc.Id) (Puerto $FrontendPort listo)" -ForegroundColor Green
Write-Host ""
Write-Host "Servicios iniciados sin ventanas emergentes." -ForegroundColor Green
Write-Host "Logs disponibles en: $logsDir" -ForegroundColor DarkGray

if ($NoWait) {
    Write-Host "Modo NoWait: finalizando proceso monitor (servicios continuan en segundo plano)." -ForegroundColor Yellow
    exit 0
}

Write-Host "Supervisando servicios (Detén la tarea en el Programador de Tareas o presiona Ctrl+C para finalizar)..." -ForegroundColor Cyan
Write-Host ""

# --- 6. Bucle de supervisión para el Programador de Tareas ---------------------
try {
    while ($true) {
        Start-Sleep -Seconds 2

        if ($backendProc.HasExited) {
            Write-Host "[ALERTA] El Backend (PID $($backendProc.Id)) se detuvo con código $($backendProc.ExitCode)." -ForegroundColor Red
            break
        }
        if ($frontendProc.HasExited) {
            Write-Host "[ALERTA] El Frontend (PID $($frontendProc.Id)) se detuvo con código $($frontendProc.ExitCode)." -ForegroundColor Red
            break
        }
    }
}
finally {
    Write-Host ""
    Write-Host "Deteniendo servicios y liberando puertos..." -ForegroundColor Yellow
    if ($backendProc -and -not $backendProc.HasExited) {
        & taskkill.exe /PID $backendProc.Id /T /F 2>&1 | Out-Null
    }
    if ($frontendProc -and -not $frontendProc.HasExited) {
        & taskkill.exe /PID $frontendProc.Id /T /F 2>&1 | Out-Null
    }
    if (Test-Path $stopScript) {
        & $stopScript -BackendPort $BackendPort -FrontendPort $FrontendPort
    }
    Write-Host "[OK] Todos los servicios de Sinergy fueron detenidos." -ForegroundColor Green
}
