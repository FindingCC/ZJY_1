$total = 0
$paths = @(
    @{P="C:\ProgramData\Package Cache"; N="Package Cache"},
    @{P="C:\Windows\SoftwareDistribution\Download"; N="Update Download"}
)

foreach ($item in $paths) {
    $p = $item.P
    $n = $item.N
    if (-not (Test-Path $p)) {
        Write-Host "GONE: $n" -ForegroundColor Gray
        continue
    }
    $sz = (Get-ChildItem $p -Recurse -File -Force -ErrorAction SilentlyContinue | Measure-Object Length -Sum).Sum
    if (-not $sz) { $sz = 0 }

    # Try takeown + icacls + cmd rmdir
    takeown /F "$p" /R /D Y 2>&1 | Out-Null
    icacls "$p" /grant "Administrators:F" /T /C /Q 2>&1 | Out-Null
    cmd /c "rmdir /s /q `"$p`"" 2>&1 | Out-Null

    if (-not (Test-Path $p)) {
        Write-Host "OK: $n — freed $([math]::Round($sz/1MB,1)) MB" -ForegroundColor Green
        $total += $sz
    } else {
        Write-Host "FAIL: $n — TrustedInstaller locked" -ForegroundColor Red
    }
}

Write-Host ""
$c = Get-PSDrive -Name C
$free = [math]::Round($c.Free / 1GB, 2)
$pct = [math]::Round(($c.Used / ($c.Used + $c.Free)) * 100, 1)
Write-Host "Total freed: $([math]::Round($total/1MB,1)) MB" -ForegroundColor Green
Write-Host "C: Free: $free GB  |  Usage: $pct%" -ForegroundColor Cyan
