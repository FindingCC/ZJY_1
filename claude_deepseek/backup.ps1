$Server  = "175.178.132.248"
$User    = "ubuntu"
$KeyFile = "$env:USERPROFILE\.ssh\TXY.pem"
$Dest    = "D:\Backup\ZJY"

New-Item -ItemType Directory -Path $Dest -Force | Out-Null
$Time = Get-Date -Format "yyyyMMdd_HHmmss"
$Local = Join-Path $Dest "backup_${Time}.zip"

Write-Host "Downloading from server..."
$cmd = "scp -i `"$KeyFile`" -o StrictHostKeyChecking=no ${User}@${Server}:/backups/latest.zip `"$Local`" 2>&1"
cmd /c $cmd

if (Test-Path $Local) {
    $size = [math]::Round((Get-Item $Local).Length / 1KB)
    Write-Host "Done: $Local ($size KB)"
    Get-ChildItem $Dest "backup_*.zip" | Sort-Object LastWriteTime -Descending | Select-Object -Skip 1 | Remove-Item
} else {
    Write-Host "FAILED: cannot download"
}
