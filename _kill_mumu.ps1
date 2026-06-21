Write-Host "Stopping MuMu services..." -ForegroundColor Yellow
Get-Service -Name "*MuMu*","*NeteaseMu*","*nemu*" -ErrorAction SilentlyContinue | ForEach-Object {
    Write-Host "  Stopping: $($_.Name) ($($_.Status))" -ForegroundColor Gray
    Stop-Service -Name $_.Name -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
}

Write-Host "Killing any remaining MuMu/Netease processes..." -ForegroundColor Yellow
Get-Process -Name "*MuMu*","*Netease*","*nemu*" -ErrorAction SilentlyContinue | ForEach-Object {
    Write-Host "  Killing: $($_.ProcessName) (PID $($_.Id))" -ForegroundColor Gray
    Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
}
Start-Sleep -Seconds 3

Write-Host "Deleting remaining Netease..." -ForegroundColor Yellow
$path = "C:\Program Files\Netease"
if (Test-Path $path) {
    # Delete files first
    Get-ChildItem $path -Recurse -File -Force -ErrorAction SilentlyContinue | ForEach-Object {
        try { Remove-Item $_.FullName -Force -ErrorAction Stop } catch {}
    }
    # Then directories bottom-up
    Get-ChildItem $path -Recurse -Directory -Force -ErrorAction SilentlyContinue | Sort-Object FullName.Length -Descending | ForEach-Object {
        try { Remove-Item $_.FullName -Force -Recurse -ErrorAction Stop } catch {}
    }
    # Root
    try { Remove-Item $path -Force -Recurse -ErrorAction Stop } catch {}
}

if (Test-Path $path) {
    $left = Get-ChildItem $path -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "FAIL: $($left.Count) items remain" -ForegroundColor Red
    $left | Select FullName | Format-Table -AutoSize
} else {
    Write-Host "OK: Netease completely removed!" -ForegroundColor Green
}

# C: status
$c = Get-PSDrive -Name C
$free = $c.Free
$used = $c.Used
$pct = [math]::Round(($used / ($free + $used)) * 100, 1)
Write-Host ""
Write-Host "C: Free: $([math]::Round($free/1GB,2)) GB | Usage: $pct%" -ForegroundColor Cyan
