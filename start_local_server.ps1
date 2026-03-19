$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$python = "C:\Program Files\Python314\python.exe"
$pidFile = Join-Path $root ".local-server.pid"
$runtimeLog = Join-Path $root ".local-server.runtime.log"
$stdoutLog = Join-Path $root ".local-server.out.log"
$stderrLog = Join-Path $root ".local-server.err.log"
$url = "http://127.0.0.1:8004/index.html"

if (Test-Path $pidFile) {
    $existingPid = Get-Content $pidFile -ErrorAction SilentlyContinue
    if ($existingPid) {
        $existingProcess = Get-Process -Id $existingPid -ErrorAction SilentlyContinue
        if ($existingProcess) {
            Stop-Process -Id $existingPid -Force
            Start-Sleep -Milliseconds 500
        }
    }
}

$process = Start-Process $python `
    -ArgumentList "local_server.py" `
    -WorkingDirectory $root `
    -RedirectStandardOutput $stdoutLog `
    -RedirectStandardError $stderrLog `
    -WindowStyle Hidden `
    -PassThru

$process.Id | Set-Content $pidFile

for ($attempt = 0; $attempt -lt 10; $attempt++) {
    Start-Sleep -Milliseconds 500

    if ($process.HasExited) {
        Write-Output "FAILED:$($process.Id) EXITED:$($process.ExitCode)"
        if (Test-Path $stderrLog) {
            Get-Content $stderrLog
        }
        exit 1
    }

    try {
        $response = Invoke-WebRequest -UseBasicParsing $url -TimeoutSec 2
        Write-Output "RUNNING:$($process.Id) STATUS:$($response.StatusCode) URL:$url"
        exit 0
    } catch {
        continue
    }
}

Write-Output "FAILED:$($process.Id) ERROR:Timed out waiting for $url"
if (Test-Path $runtimeLog) {
    Get-Content $runtimeLog
}
if (Test-Path $stderrLog) {
    Get-Content $stderrLog
}
exit 1
