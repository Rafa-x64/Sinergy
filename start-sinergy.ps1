# ============================================================
#  Sinergy - Script de arranque y supervision resiliente en produccion
#  (Modo Servicio / Windows Task Scheduler / Watchdog)
#
#  Uso: .\start-sinergy.ps1
#  Uso con puertos custom: .\start-sinergy.ps1 -BackendPort 3000 -FrontendPort 4173
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
$LOGS_DIR      = Join-Path $ROOT "logs"
$PID_FILE      = Join-Path $LOGS_DIR "sinergy.pids"
$STOP_SCRIPT   = Join-Path $ROOT "stop-sinergy.ps1"

# --- 1. Preparar directorio de logs ---------------------------------------------
if (-not (Test-Path $LOGS_DIR)) {
    New-Item -ItemType Directory -Path $LOGS_DIR -Force | Out-Null
}

$supervisorLog  = Join-Path $LOGS_DIR "supervisor.log"
$backendLogOut  = Join-Path $LOGS_DIR "backend.log"
$backendLogErr  = Join-Path $LOGS_DIR "backend.err.log"
$frontendLogOut = Join-Path $LOGS_DIR "frontend.log"
$frontendLogErr = Join-Path $LOGS_DIR "frontend.err.log"

function Log-Message([string]$msg, [string]$color = "Cyan") {
    $timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    $formatted = "[$timestamp] $msg"
    Write-Host $formatted -ForegroundColor $color
    Add-Content -Path $supervisorLog -Value $formatted -ErrorAction SilentlyContinue
}

# --- 2. Validar que los builds existen antes de arrancar ------------------------
if (-not (Test-Path $BACKEND_ENTRY)) {
    Log-Message "[ERROR] No existe el artefacto compilado del Backend: $BACKEND_ENTRY" "Red"
    Log-Message "        Ejecuta primero: pnpm build" "Yellow"
    exit 1
}

if (-not (Test-Path (Join-Path $FRONTEND_DIR "dist\index.html"))) {
    Log-Message "[ERROR] No existe el artefacto compilado del Frontend: $FRONTEND_DIR\dist\index.html" "Red"
    Log-Message "        Ejecuta primero: pnpm build" "Yellow"
    exit 1
}

Log-Message "============================================================" "Cyan"
Log-Message "  Sinergy - Iniciando servicios en produccion (Watchdog ON)" "Cyan"
Log-Message "============================================================" "Cyan"
Log-Message "  Backend  -> http://localhost:$BackendPort" "Green"
Log-Message "  Frontend -> http://localhost:$FrontendPort" "Green"
Log-Message "============================================================" "Cyan"

# --- 3. Limpieza profunda inicial de instancias previas --------------------------
if (Test-Path $STOP_SCRIPT) {
    & $STOP_SCRIPT -BackendPort $BackendPort -FrontendPort $FrontendPort
}

# Configurar variables de entorno para los subprocesos
$env:PORT = "$BackendPort"
$env:BACKEND_URL = "http://localhost:$BackendPort"

# --- Funciones de lanzamiento de procesos ---------------------------------------
function Start-BackendProcess {
    Log-Message "Lanzando proceso de Backend..." "Cyan"
    $backendArgs = if ($BACKEND_ENTRY -match '\s') { "`"$BACKEND_ENTRY`"" } else { $BACKEND_ENTRY }

    $proc = Start-Process -FilePath "node" `
        -ArgumentList $backendArgs `
        -WorkingDirectory $BACKEND_DIR `
        -WindowStyle Hidden `
        -RedirectStandardOutput $backendLogOut `
        -RedirectStandardError $backendLogErr `
        -PassThru

    if (-not $proc -or -not $proc.Id) {
        Log-Message "[ERROR] No se pudo instanciar el proceso de Backend." "Red"
        return $null
    }

    # Esperar hasta 8 segundos a que escuche en el puerto
    $listo = $false
    for ($i = 0; $i -lt 16; $i++) {
        Start-Sleep -Milliseconds 500
        if ($proc.HasExited) { break }
        $check = Get-NetTCPConnection -LocalPort $BackendPort -State Listen -ErrorAction SilentlyContinue
        if ($check) {
            $listo = $true
            break
        }
    }

    if ($listo) {
        Log-Message "  [OK] Backend activo (PID $($proc.Id)) en puerto $BackendPort" "Green"
        return $proc
    } else {
        Log-Message "[ERROR] Backend (PID $($proc.Id)) no respondio en puerto $BackendPort." "Red"
        if (-not $proc.HasExited) {
            & taskkill.exe /PID $proc.Id /T /F 2>&1 | Out-Null
        }
        return $null
    }
}

function Start-FrontendProcess {
    Log-Message "Lanzando proceso de Frontend..." "Cyan"
    $viteCmd = Join-Path $FRONTEND_DIR "node_modules\.bin\vite.cmd"
    if (Test-Path $viteCmd) {
        $frontendFilePath = $viteCmd
        $frontendArgs     = "preview --port $FrontendPort --host"
    } else {
        $frontendFilePath = "npx"
        $frontendArgs     = "vite preview --port $FrontendPort --host"
    }

    $proc = Start-Process -FilePath $frontendFilePath `
        -ArgumentList $frontendArgs `
        -WorkingDirectory $FRONTEND_DIR `
        -WindowStyle Hidden `
        -RedirectStandardOutput $frontendLogOut `
        -RedirectStandardError $frontendLogErr `
        -PassThru

    if (-not $proc -or -not $proc.Id) {
        Log-Message "[ERROR] No se pudo instanciar el proceso de Frontend." "Red"
        return $null
    }

    # Esperar hasta 8 segundos a que escuche en el puerto
    $listo = $false
    for ($i = 0; $i -lt 16; $i++) {
        Start-Sleep -Milliseconds 500
        if ($proc.HasExited) { break }
        $check = Get-NetTCPConnection -LocalPort $FrontendPort -State Listen -ErrorAction SilentlyContinue
        if ($check) {
            $listo = $true
            break
        }
    }

    if ($listo) {
        Log-Message "  [OK] Frontend activo (PID $($proc.Id)) en puerto $FrontendPort" "Green"
        return $proc
    } else {
        Log-Message "[ERROR] Frontend (PID $($proc.Id)) no respondio en puerto $FrontendPort." "Red"
        if (-not $proc.HasExited) {
            & taskkill.exe /PID $proc.Id /T /F 2>&1 | Out-Null
        }
        return $null
    }
}

function Guardar-Pids($bPid, $fPid) {
    $info = @{
        BackendPid  = $bPid
        FrontendPid = $fPid
        SupervisorPid = $PID
        UpdatedAt   = (Get-Date).ToString("o")
    } | ConvertTo-Json
    Set-Content -Path $PID_FILE -Value $info -Force -ErrorAction SilentlyContinue
}

# --- 4. Arranque inicial --------------------------------------------------------
$backendProc  = Start-BackendProcess
$frontendProc = Start-FrontendProcess

if (-not $backendProc -or -not $frontendProc) {
    Log-Message "[CRITICO] Fallo el arranque inicial de uno o mas servicios." "Red"
    if (Test-Path $STOP_SCRIPT) { & $STOP_SCRIPT -BackendPort $BackendPort -FrontendPort $FrontendPort }
    exit 1
}

Guardar-Pids $backendProc.Id $frontendProc.Id

if ($NoWait) {
    Log-Message "Modo NoWait: servicios continuan en segundo plano." "Yellow"
    exit 0
}

Log-Message "Supervision activa iniciada. (Presiona Ctrl+C o detén la tarea en Task Scheduler para finalizar)" "Green"

# --- 5. Bucle de Supervision Resiliente (Watchdog / Auto-Recuperacion) ------------
try {
    while ($true) {
        Start-Sleep -Seconds 3

        # Verificar Backend
        if (-not $backendProc -or $backendProc.HasExited) {
            $codigoSalida = if ($backendProc) { $backendProc.ExitCode } else { "N/A" }
            Log-Message "[ALERTA] Backend caido (Codigo $codigoSalida). Reiniciando proceso..." "Red"
            
            # Liberar puerto 
            $conn = Get-NetTCPConnection -LocalPort $BackendPort -State Listen -ErrorAction SilentlyContinue
            if ($conn -and $conn.OwningProcess) {
                & taskkill.exe /PID $conn.OwningProcess /T /F 2>&1 | Out-Null
            }
            Start-Sleep -Milliseconds 500

            $backendProc = Start-BackendProcess
            if ($backendProc) {
                Guardar-Pids $backendProc.Id ($frontendProc.Id)
                Log-Message "[RECUPERADO] Backend restablecido exitosamente con PID $($backendProc.Id)" "Green"
            } else {
                Log-Message "[ERROR] No se pudo recuperar el Backend. Reintentando en el proximo ciclo..." "DarkYellow"
            }
        }

        # Verificar Frontend
        if (-not $frontendProc -or $frontendProc.HasExited) {
            $codigoSalida = if ($frontendProc) { $frontendProc.ExitCode } else { "N/A" }
            Log-Message "[ALERTA] Frontend caido (Codigo $codigoSalida). Reiniciando proceso..." "Red"
            
            # Liberar puerto
            $conn = Get-NetTCPConnection -LocalPort $FrontendPort -State Listen -ErrorAction SilentlyContinue
            if ($conn -and $conn.OwningProcess) {
                & taskkill.exe /PID $conn.OwningProcess /T /F 2>&1 | Out-Null
            }
            Start-Sleep -Milliseconds 500

            $frontendProc = Start-FrontendProcess
            if ($frontendProc) {
                Guardar-Pids ($backendProc.Id) $frontendProc.Id
                Log-Message "[RECUPERADO] Frontend restablecido exitosamente con PID $($frontendProc.Id)" "Green"
            } else {
                Log-Message "[ERROR] No se pudo recuperar el Frontend. Reintentando en el proximo ciclo..." "DarkYellow"
            }
        }
    }
}
finally {
    Log-Message "Finalizando todos los servicios de Sinergy de forma segura..." "Yellow"
    
    # 1. Matar PIDs registrados
    if ($backendProc -and -not $backendProc.HasExited) {
        & taskkill.exe /PID $backendProc.Id /T /F 2>&1 | Out-Null
    }
    if ($frontendProc -and -not $frontendProc.HasExited) {
        & taskkill.exe /PID $frontendProc.Id /T /F 2>&1 | Out-Null
    }
    
    # 2. Ejecutar stop-sinergy para barrer cualquier subproceso remanente
    if (Test-Path $STOP_SCRIPT) {
        & $STOP_SCRIPT -BackendPort $BackendPort -FrontendPort $FrontendPort
    }

    if (Test-Path $PID_FILE) {
        Remove-Item $PID_FILE -Force -ErrorAction SilentlyContinue
    }

    Log-Message "[OK] Todos los servicios fueron completamente detenidos." "Green"
}
