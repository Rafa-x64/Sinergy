# register-autostart.ps1 - Registra Sinergy en el Programador de Tareas de Windows
# REQUIERE: Ejecutar en PowerShell como Administrador.
# Configura el servicio para iniciar con Windows (SYSTEM) sin requerir inicio de sesion manual.

$taskName   = "Sinergy - Autostart"
$scriptPath = "$PSScriptRoot\start.ps1"

# 1. Validar que start.ps1 existe
if (-not (Test-Path $scriptPath)) {
    Write-Error "No se encontro start.ps1 en $PSScriptRoot"
    exit 1
}

# 2. Validar privilegios de administrador
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host ""
    Write-Host "[ERROR] Este script requiere privilegios de Administrador para registrar la tarea en Windows." -ForegroundColor Red
    Write-Host "Por favor:" -ForegroundColor Yellow
    Write-Host "  1. Clic derecho sobre el icono de PowerShell o Windows Terminal." -ForegroundColor Yellow
    Write-Host "  2. Selecciona 'Ejecutar como administrador'." -ForegroundColor Yellow
    Write-Host "  3. Ejecuta: cd C:\xampp\htdocs\Sinergy ; .\register-autostart.ps1" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

# 3. Eliminar tarea previa si existe
Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue

# 4. Definir accion
$action = New-ScheduledTaskAction `
    -Execute "powershell.exe" `
    -Argument "-NoProfile -NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$scriptPath`"" `
    -WorkingDirectory $PSScriptRoot

# 5. Definir disparadores (Al arrancar el sistema y al iniciar sesion como respaldo)
$triggerBoot  = New-ScheduledTaskTrigger -AtStartup
$triggerLogon = New-ScheduledTaskTrigger -AtLogOn

# 6. Configuracion de resiliencia
$settings = New-ScheduledTaskSettingsSet `
    -ExecutionTimeLimit (New-TimeSpan -Hours 0) `
    -RestartCount 3 `
    -RestartInterval (New-TimeSpan -Minutes 1) `
    -StartWhenAvailable `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -MultipleInstances IgnoreNew

# 7. Registrar tarea como SYSTEM (arranca con el SO antes de que ningun usuario ingrese)
Register-ScheduledTask `
    -TaskName  $taskName `
    -Action    $action `
    -Trigger   @($triggerBoot, $triggerLogon) `
    -Settings  $settings `
    -RunLevel  Highest `
    -User      "SYSTEM" `
    -Force | Out-Null

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  [OK] Tarea '$taskName' registrada exitosamente." -ForegroundColor Green
Write-Host "  Usuario de ejecucion: SYSTEM (arranca automaticamente al reiniciar)" -ForegroundColor Green
Write-Host "  Triggers: Boot del Sistema + Inicio de Sesion" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
