# ============================================================
#  Sinergy — Registro de auto-inicio en Windows Task Scheduler
#  REQUIERE: Ejecutar como Administrador
#
#  Uso normal (puertos por defecto):
#    .\register-autostart.ps1
#
#  Uso con puertos custom:
#    .\register-autostart.ps1 -BackendPort 3080 -FrontendPort 4173
#
#  Para remover la tarea:
#    Unregister-ScheduledTask -TaskName "Sinergy Production" -Confirm:$false
# ============================================================

param(
    [int]$BackendPort  = 3010,
    [int]$FrontendPort = 4173
)

$TASK_NAME   = "Sinergy Production"
$SCRIPT_PATH = "$PSScriptRoot\start-sinergy.ps1"

# ─── Verificar que el script de arranque existe ───────────────────────────────
if (-not (Test-Path $SCRIPT_PATH)) {
    Write-Host "[ERROR] No se encontro start-sinergy.ps1 en $PSScriptRoot" -ForegroundColor Red
    exit 1
}

# ─── Verificar privilegios de administrador ───────────────────────────────────
$esAdmin = ([Security.Principal.WindowsPrincipal] `
    [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
    [Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $esAdmin) {
    Write-Host "[ERROR] Este script debe ejecutarse como Administrador." -ForegroundColor Red
    Write-Host "        Click derecho sobre PowerShell -> 'Ejecutar como administrador'" -ForegroundColor Yellow
    exit 1
}

# ─── Eliminar tarea previa si existe ─────────────────────────────────────────
$tareaExistente = Get-ScheduledTask -TaskName $TASK_NAME -ErrorAction SilentlyContinue
if ($tareaExistente) {
    Write-Host "[INFO] Tarea existente detectada. Reemplazando..." -ForegroundColor Yellow
    Unregister-ScheduledTask -TaskName $TASK_NAME -Confirm:$false
}

# ─── Definir la accion: correr el script de arranque con los puertos ─────────
$accion = New-ScheduledTaskAction `
    -Execute "powershell.exe" `
    -Argument "-NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$SCRIPT_PATH`" -BackendPort $BackendPort -FrontendPort $FrontendPort" `
    -WorkingDirectory $PSScriptRoot

# ─── Disparador: al iniciar el sistema ───────────────────────────────────────
$disparador = New-ScheduledTaskTrigger -AtStartup

# ─── Configuracion: correr aunque no haya usuario logueado ───────────────────
$configuracion = New-ScheduledTaskSettingsSet `
    -ExecutionTimeLimit (New-TimeSpan -Hours 0) `
    -RestartCount 3 `
    -RestartInterval (New-TimeSpan -Minutes 1) `
    -StartWhenAvailable

# ─── Registrar la tarea con cuenta SYSTEM (no requiere usuario logueado) ─────
Register-ScheduledTask `
    -TaskName    $TASK_NAME `
    -Action      $accion `
    -Trigger     $disparador `
    -Settings    $configuracion `
    -RunLevel    Highest `
    -User        "SYSTEM" `
    -Force

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  Tarea '$TASK_NAME' registrada exitosamente." -ForegroundColor Green
Write-Host "  Backend  -> puerto $BackendPort" -ForegroundColor Green
Write-Host "  Frontend -> puerto $FrontendPort" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "La proxima vez que inicie el servidor, Sinergy arrancara automaticamente." -ForegroundColor Green
Write-Host "Para verificar: Abre 'Programador de tareas' y busca '$TASK_NAME'" -ForegroundColor Yellow
Write-Host ""
