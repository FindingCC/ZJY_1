Write-Host "Deleting Netease..." -ForegroundColor Yellow
$path = "C:\Program Files\Netease"

if (-not (Test-Path $path)) {
    Write-Host "OK: Already removed" -ForegroundColor Green
    exit
}

# File by file first
Get-ChildItem $path -Recurse -File -Force -ErrorAction SilentlyContinue | ForEach-Object {
    try { Remove-Item $_.FullName -Force -ErrorAction Stop } catch {}
}
# Directories bottom-up
Get-ChildItem $path -Recurse -Directory -Force -ErrorAction SilentlyContinue | Sort-Object FullName.Length -Descending | ForEach-Object {
    try { Remove-Item $_.FullName -Force -Recurse -ErrorAction Stop } catch {}
}
# Root
Remove-Item $path -Recurse -Force -ErrorAction SilentlyContinue

if (Test-Path $path) {
    $left = Get-ChildItem $path -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "FAIL: $($left.Count) items remain" -ForegroundColor Red
    $left | Select-Object FullName | Format-Table -AutoSize
} else {
    Write-Host "OK: Netease deleted!" -ForegroundColor Green
}

$c = Get-PSDrive -Name C
Write-Host ("C: Free: " + [math]::Round($c.Free/1GB,2) + " GB | Usage: " + [math]::Round($c.Used/($c.Used+$c.Free)*100,1) + "%") -ForegroundColor Cyan
