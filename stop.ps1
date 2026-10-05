# stop.ps1 - Sinergy Production Shutdown
# Lee los PIDs guardados y asegura la liberacion total de puertos y procesos.

$root = $PSScriptRoot
$pidsFile = "$root\.sinergy.pids"

# 1. Detener procesos por archivo de PID
if (Test-Path $pidsFile) {
    Get-Content $pidsFile | ForEach-Object {
        $id = [int]$_
        if ($id -gt 0) {
            Stop-Process -Id $id -Force -ErrorAction SilentlyContinue
            & taskkill.exe /PID $id /F /T 2>$null
            Write-Host "Proceso $id terminado."
        }
    }
    Remove-Item $pidsFile -Force -ErrorAction SilentlyContinue
}

# 2. Asegurar que los puertos 3000 y 4173 esten liberados
@(3000, 4173) | ForEach-Object {
    $conn = Get-NetTCPConnection -LocalPort $_ -State Listen -ErrorAction SilentlyContinue
    if ($conn -and $conn.OwningProcess) {
        $pidToKill = $conn.OwningProcess
        Stop-Process -Id $pidToKill -Force -ErrorAction SilentlyContinue
        & taskkill.exe /PID $pidToKill /F /T 2>$null
        Write-Host "Puerto $_ liberado (PID $pidToKill terminado)."
    }
}

Write-Host "Sinergy detenido correctamente."
