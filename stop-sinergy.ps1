# ============================================================
#  Sinergy - Script de detencion total y segura de procesos
#  Uso: .\stop-sinergy.ps1
#  Uso con puertos custom: .\stop-sinergy.ps1 -BackendPort 3000 -FrontendPort 4173
# ============================================================

param(
    [int]$BackendPort  = 3000,
    [int]$FrontendPort = 4173
)

$ROOT     = $PSScriptRoot
$LOGS_DIR = Join-Path $ROOT "logs"
$PID_FILE = Join-Path $LOGS_DIR "sinergy.pids"

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  Sinergy - Deteniendo servicios y liberando puertos" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  Backend Port  : $($BackendPort)" -ForegroundColor DarkGray
Write-Host "  Frontend Port : $($FrontendPort)" -ForegroundColor DarkGray
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

$pidsToKill = [System.Collections.Generic.HashSet[int]]::new()
$targetPorts = @($BackendPort, $FrontendPort, 3000, 3010, 4173) | Select-Object -Unique

# ─── 1. Leer PIDs guardados en archivo de estado ─────────────────────────────
if (Test-Path $PID_FILE) {
    try {
        $raw = Get-Content -Path $PID_FILE -Raw -ErrorAction SilentlyContinue
        if ($raw) {
            $json = $raw | ConvertFrom-Json
            if ($json.BackendPid -and $json.BackendPid -gt 0 -and $json.BackendPid -ne $PID) {
                $null = $pidsToKill.Add([int]$json.BackendPid)
            }
            if ($json.FrontendPid -and $json.FrontendPid -gt 0 -and $json.FrontendPid -ne $PID) {
                $null = $pidsToKill.Add([int]$json.FrontendPid)
            }
        }
    } catch {
        # Ignorar errores de parseo
    }
}

# ─── 2. Buscar PIDs por puertos TCP en escucha ─────────────────────────────
foreach ($port in $targetPorts) {
    try {
        $connections = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
        foreach ($conn in $connections) {
            $pidFound = [int]$conn.OwningProcess
            if ($pidFound -and $pidFound -gt 0 -and $pidFound -ne $PID) {
                $null = $pidsToKill.Add($pidFound)
                Write-Host "[DETECTADO] Puerto $($port) ocupado por PID $($pidFound)" -ForegroundColor Yellow
            }
        }
    } catch {
        # Ignorar
    }
}

# ─── 3. Buscar procesos por CommandLine especifico de Sinergy ───────────────
try {
    $processes = Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | Where-Object {
        $cmd = $_.CommandLine
        if ([string]::IsNullOrWhiteSpace($cmd)) { return $false }

        return ($cmd -like "*apps\backend\dist\src\index.js*" -or `
                $cmd -like "*apps/backend/dist/src/index.js*" -or `
                $cmd -like "*vite*preview*" -and ($cmd -like "*$FrontendPort*" -or $cmd -like "*4173*") -or `
                ($cmd -like "*start-sinergy.ps1*" -and $_.ProcessId -ne $PID))
    }

    foreach ($proc in $processes) {
        $procId = [int]$proc.ProcessId
        if ($procId -gt 0 -and $procId -ne $PID) {
            $null = $pidsToKill.Add($procId)
            Write-Host "[DETECTADO] Proceso Sinergy PID $($procId) ($($proc.Name))" -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "[WARN] No se pudo consultar Win32_Process: $_" -ForegroundColor DarkGray
}

# ─── 4. Terminar todos los arboles de procesos detectados ───────────────────
if ($pidsToKill.Count -gt 0) {
    Write-Host "Terminando $($pidsToKill.Count) proceso(s) de Sinergy..." -ForegroundColor Cyan

    foreach ($targetPid in $pidsToKill) {
        try {
            $proc = Get-Process -Id $targetPid -ErrorAction SilentlyContinue
            if ($proc) {
                & taskkill.exe /PID $targetPid /T /F 2>&1 | Out-Null
                Write-Host "  [X] PID $($targetPid) ($($proc.ProcessName)) terminado." -ForegroundColor Green
            }
        } catch {
            Write-Host "  [!] Error al detener PID $($targetPid): $_" -ForegroundColor DarkYellow
        }
    }
} else {
    Write-Host "[OK] No se detectaron procesos residuales." -ForegroundColor Green
}

# ─── 5. Limpieza de archivo de estado ─────────────────────────────────────────
if (Test-Path $PID_FILE) {
    Remove-Item $PID_FILE -Force -ErrorAction SilentlyContinue
}

# ─── 6. Verificacion y espera activa de liberacion de puertos ────────────────
$todosLiberados = $false
for ($intento = 0; $intento -lt 6; $intento++) {
    Start-Sleep -Milliseconds 400
    $ocupados = @()
    foreach ($port in @($BackendPort, $FrontendPort)) {
        $conn = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
        if ($conn -and $conn.OwningProcess -ne $PID) {
            $ocupados += $port
            # Forzar cierre del proceso que retiene el puerto
            & taskkill.exe /PID $conn.OwningProcess /T /F 2>&1 | Out-Null
        }
    }

    if ($ocupados.Count -eq 0) {
        $todosLiberados = $true
        break
    }
}

Write-Host ""
if ($todosLiberados) {
    Write-Host "[OK] Todos los servicios fueron detenidos y los puertos estan 100% disponibles." -ForegroundColor Green
} else {
    Write-Host "[WARN] Uno o mas puertos continuan respondiendo." -ForegroundColor Yellow
}
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
