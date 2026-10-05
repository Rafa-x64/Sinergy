# stop.ps1 — Sinergy Production Shutdown
# Lee los PIDs guardados por start.ps1 y termina los procesos limpiamente.

$pidsFile = "$PSScriptRoot\.sinergy.pids"

if (-not (Test-Path $pidsFile)) {
    Write-Host "No hay procesos de Sinergy activos (archivo .sinergy.pids no encontrado)."
    exit 0
}

Get-Content $pidsFile | ForEach-Object {
    $id = [int]$_
    Stop-Process -Id $id -Force -ErrorAction SilentlyContinue
    Write-Host "Proceso $id detenido."
}

Remove-Item $pidsFile -Force
Write-Host "Sinergy detenido."
