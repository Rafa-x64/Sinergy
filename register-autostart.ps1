# ============================================================
#  Sinergy — Registro de auto-inicio en Windows Task Scheduler
#  REQUIERE: Ejecutar en PowerShell como Administrador
#
#  Uso normal (puertos por defecto 3000 y 4173):
#    .\register-autostart.ps1
#
#  Uso con puertos custom:
#    .\register-autostart.ps1 -BackendPort 3000 -FrontendPort 4173
#
#  Para remover la tarea:
#    Unregister-ScheduledTask -TaskName "Sinergy Production" -Confirm:$false
# ============================================================

param(
    [int]$BackendPort  = 3000,
    [int]$FrontendPort = 4173
)

$TASK_NAME   = "Sinergy Production"
$SCRIPT_PATH = "$PSScriptRoot\start-sinergy.ps1"

# ─── 1. Verificar que el script de arranque existe ───────────────────────────
if (-not (Test-Path $SCRIPT_PATH)) {
    Write-Host "[ERROR] No se encontro start-sinergy.ps1 en $PSScriptRoot" -ForegroundColor Red
    exit 1
}

# ─── 2. Verificar privilegios de administrador ───────────────────────────────
$esAdmin = ([Security.Principal.WindowsPrincipal] `
    [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
    [Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $esAdmin) {
    Write-Host "[ERROR] Este script debe ejecutarse en PowerShell como Administrador." -ForegroundColor Red
    Write-Host "        Click derecho sobre PowerShell -> 'Ejecutar como administrador'" -ForegroundColor Yellow
    exit 1
}

# ─── 3. Eliminar tarea previa si existe ───────────────────────────────────────
$tareaExistente = Get-ScheduledTask -TaskName $TASK_NAME -ErrorAction SilentlyContinue
if ($tareaExistente) {
    Write-Host "[INFO] Tarea previa detectada. Reemplazando con configuracion optimizada..." -ForegroundColor Yellow
    Unregister-ScheduledTask -TaskName $TASK_NAME -Confirm:$false
}

# ─── 4. Definir la accion con maximos privilegios y modo no interactivo ───────
$accion = New-ScheduledTaskAction `
    -Execute "powershell.exe" `
    -Argument "-NoProfile -NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$SCRIPT_PATH`" -BackendPort $BackendPort -FrontendPort $FrontendPort" `
    -WorkingDirectory $PSScriptRoot

# ─── 5. Disparador: al arrancar el servidor (Boot) ───────────────────────────
$disparador = New-ScheduledTaskTrigger -AtStartup

# ─── 6. Configuracion de Alta Disponibilidad y Resiliencia ────────────────────
# - Sin limite de tiempo de ejecucion (TimeSpan 0)
# - Reinicio automatico ilimitado si cae (RestartCount 999 cada 1 min)
# - Detener instancia existente si se vuelve a disparar (MultipleInstances StopExisting)
# - Arrancar aunque el equipo este en bateria o despues de un fallo de red
$configuracion = New-ScheduledTaskSettingsSet `
    -ExecutionTimeLimit (New-TimeSpan -Hours 0) `
    -RestartCount 999 `
    -RestartInterval (New-TimeSpan -Minutes 1) `
    -StartWhenAvailable `
    -MultipleInstances StopExisting `
    -Priority 4 `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries

# ─── 7. Registrar la tarea con cuenta SYSTEM (RunLevel Highest) ───────────────
Register-ScheduledTask `
    -TaskName    $TASK_NAME `
    -Action      $accion `
    -Trigger     $disparador `
    -Settings    $configuracion `
    -RunLevel    Highest `
    -User        "SYSTEM" `
    -Force | Out-Null

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  [OK] Tarea '$TASK_NAME' registrada exitosamente." -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  Nivel de Ejecucion : Maximos Privilegios (SYSTEM / Highest)" -ForegroundColor Green
Write-Host "  Backend Port       : $BackendPort" -ForegroundColor Green
Write-Host "  Frontend Port      : $FrontendPort" -ForegroundColor Green
Write-Host "  Auto-Recuperacion  : Habilitada (Watchdog interno + 999 reintentos OS)" -ForegroundColor Green
Write-Host "  Comportamiento Stop: Limpieza total de procesos y liberacion de puertos" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Para iniciar la tarea ahora sin reiniciar el servidor:" -ForegroundColor Yellow
Write-Host "  Start-ScheduledTask -TaskName `"$TASK_NAME`"" -ForegroundColor Cyan
Write-Host ""
