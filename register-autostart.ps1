# register-autostart.ps1 — Registra Sinergy en el Programador de Tareas de Windows
# Ejecutar UNA SOLA VEZ como Administrador en el servidor.
# Desde ese momento, Sinergy arranca automáticamente en cada reinicio del servidor.

$taskName   = "Sinergy - Autostart"
$scriptPath = "$PSScriptRoot\start.ps1"

# Eliminar tarea previa si existe
Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue

$action  = New-ScheduledTaskAction `
    -Execute "powershell.exe" `
    -Argument "-NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$scriptPath`""

$trigger = New-ScheduledTaskTrigger -AtStartup

$settings = New-ScheduledTaskSettingsSet `
    -ExecutionTimeLimit (New-TimeSpan -Hours 0) `
    -RestartCount 3 `
    -RestartInterval (New-TimeSpan -Minutes 1) `
    -StartWhenAvailable

Register-ScheduledTask `
    -TaskName $taskName `
    -Action   $action `
    -Trigger  $trigger `
    -Settings $settings `
    -RunLevel Highest `
    -Force | Out-Null

Write-Host "Tarea '$taskName' registrada. Sinergy iniciara automaticamente en cada reinicio del servidor."
