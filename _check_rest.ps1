$items = Get-ChildItem "C:\Program Files\Netease" -Recurse -Force -ErrorAction SilentlyContinue
$totalSize = ($items | Where-Object { -not $_.PSIsContainer } | Measure-Object Length -Sum).Sum
Write-Host "Remaining items under C:\Program Files\Netease: $($items.Count)"
Write-Host "Total size: $([math]::Round($totalSize/1MB,2)) MB"
Write-Host ""
$items | Select-Object @{N='Type';E={if($_.PSIsContainer){'DIR'}else{'FILE'}}}, FullName | Format-Table -AutoSize
