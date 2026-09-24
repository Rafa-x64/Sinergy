# ============================================================
#  Sinergy - Script de detención segura de procesos
#  Uso: .\stop-sinergy.ps1
#  Uso con puertos custom: .\stop-sinergy.ps1 -BackendPort 3080 -FrontendPort 8080
# ============================================================

param(
    [int]$BackendPort  = 3000,
    [int]$FrontendPort = 4173
)

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  Sinergy - Deteniendo servicios en ejecucion" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  Backend Port  : $($BackendPort)" -ForegroundColor DarkGray
Write-Host "  Frontend Port : $($FrontendPort)" -ForegroundColor DarkGray
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

$pidsToKill = [System.Collections.Generic.HashSet[int]]::new()
$targetPorts = @($BackendPort, $FrontendPort)

# ─── 1. Buscar PIDs por puertos TCP en escucha ─────────────────────────────
foreach ($port in $targetPorts) {
    try {
        $connections = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
        foreach ($conn in $connections) {
            $pidFound = $conn.OwningProcess
            if ($pidFound -and $pidFound -gt 0 -and $pidFound -ne $PID) {
                # Validar que el proceso pertenezca al stack (node, powershell, cmd)
                $proc = Get-Process -Id $pidFound -ErrorAction SilentlyContinue
                if ($proc -and ($proc.ProcessName -match "node|powershell|pwsh|cmd")) {
                    $null = $pidsToKill.Add($pidFound)
                    Write-Host "[DETECTADO] Puerto $($port) ocupado por PID $($pidFound) ($($proc.ProcessName))" -ForegroundColor Yellow
                }
            }
        }
    } catch {
        # Ignorar si Get-NetTCPConnection no encuentra registros
    }
}

# ─── 2. Buscar procesos por CommandLine especifico de Sinergy ───────────────
try {
    $processes = Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | Where-Object {
        $cmd = $_.CommandLine
        if ([string]::IsNullOrWhiteSpace($cmd)) { return $false }

        return ($cmd -like "*sinergy-backend.ps1*" -or `
                $cmd -like "*sinergy-frontend.ps1*" -or `
                $cmd -like "*apps\backend\dist\src\index.js*" -or `
                ($cmd -like "*vite preview*" -and $cmd -like "*$FrontendPort*") -or `
                ($cmd -like "*start-sinergy.ps1*"))
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

# ─── 3. Terminar arboles de procesos detectados ──────────────────────────────
if ($pidsToKill.Count -eq 0) {
    Write-Host "[OK] No se encontraron procesos de Sinergy en ejecucion." -ForegroundColor Green
    Write-Host ""
    exit 0
}

Write-Host ""
Write-Host "Terminando $($pidsToKill.Count) proceso(s) y sus subprocesos..." -ForegroundColor Cyan

$huboAccesoDenegado = $false

foreach ($targetPid in $pidsToKill) {
    try {
        $proc = Get-Process -Id $targetPid -ErrorAction SilentlyContinue
        if ($proc) {
            # taskkill /T /F asegura matar el proceso padre y todos sus hijos/hilos
            $resultado = & taskkill.exe /PID $targetPid /T /F 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Host "  [X] PID $($targetPid) ($($proc.ProcessName)) terminado exitosamente." -ForegroundColor Green
            } else {
                if ($resultado -like "*Acceso denegado*" -or $resultado -like "*Access is denied*") {
                    $huboAccesoDenegado = $true
                    Write-Host "  [!] PID $($targetPid) ($($proc.ProcessName)): Acceso denegado (Requiere PowerShell como Administrador)." -ForegroundColor Red
                } else {
                    Write-Host "  [!] PID $($targetPid): $($resultado)" -ForegroundColor DarkYellow
                }
            }
        }
    } catch {
        Write-Host "  [!] Error al detener PID $($targetPid): $_" -ForegroundColor DarkYellow
    }
}

# ─── 4. Limpieza de scripts temporales generados ─────────────────────────────
$tempBackend = Join-Path $env:TEMP "sinergy-backend.ps1"
$tempFrontend = Join-Path $env:TEMP "sinergy-frontend.ps1"

if (Test-Path $tempBackend) {
    Remove-Item $tempBackend -Force -ErrorAction SilentlyContinue
}
if (Test-Path $tempFrontend) {
    Remove-Item $tempFrontend -Force -ErrorAction SilentlyContinue
}

# ─── 5. Verificacion final de puertos ────────────────────────────────────────
Start-Sleep -Milliseconds 500

$puertosAunOcupados = @()
foreach ($port in $targetPorts) {
    $check = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    if ($check) {
        $puertosAunOcupados += $port
    }
}

Write-Host ""
if ($puertosAunOcupados.Count -eq 0) {
    Write-Host "[OK] Todos los procesos de Sinergy fueron detenidos y los puertos liberados." -ForegroundColor Green
} else {
    Write-Host "[ALERTA] Los siguientes puertos siguen ocupados: $($puertosAunOcupados -join ', ')" -ForegroundColor DarkYellow
}
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
