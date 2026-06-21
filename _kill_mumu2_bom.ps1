Write-Host "Disabling MuMu service..." -ForegroundColor Yellow
sc.exe config MuMuRemoteService start= disabled 2>&1 | Out-Null
sc.exe stop MuMuRemoteService 2>&1 | Out-Null
Start-Sleep -Seconds 2

Write-Host "Killing processes..." -ForegroundColor Yellow
Get-Process -Name "*MuMu*","*Netease*","*nemu*" -ErrorAction SilentlyContinue | ForEach-Object {
    Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
}
Start-Sleep -Seconds 3

Write-Host "Deleting Netease..." -ForegroundColor Yellow
Remove-Item "C:\Program Files\Netease" -Recurse -Force -ErrorAction SilentlyContinue

if (Test-Path "C:\Program Files\Netease") {
    Write-Host "FAIL: still exists. 26 files locked by restarting service." -ForegroundColor Red
    Write-Host "Need Safe Mode or uninstall MuMu Player via Control Panel." -ForegroundColor Red
} else {
    Write-Host "OK: Netease completely removed!" -ForegroundColor Green
}

$c = Get-PSDrive -Name C
$free = [math]::Round($c.Free / 1GB, 2)
$pct = [math]::Round(($c.Used / ($c.Used + $c.Free)) * 100, 1)
Write-Host ""
Write-Host "C: Free: $free GB  |  Usage: $pct%" -ForegroundColor Cyan
