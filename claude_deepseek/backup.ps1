$Server  = "175.178.132.248"
$User    = "ubuntu"
$KeyFile = "$env:USERPROFILE\.ssh\TXY.pem"
$Dest    = "D:\Backup\施工管理系统"

New-Item -ItemType Directory -Path $Dest -Force | Out-Null
$Time = Get-Date -Format "yyyyMMdd_HHmmss"
$Local = Join-Path $Dest "backup_${Time}.zip"

Write-Host "Downloading from server..."
scp -i $KeyFile -o StrictHostKeyChecking=no -o ConnectTimeout=10 "${User}@${Server}:/backups/latest.zip" $Local 2>&1

if (Test-Path $Local) {
    $size = [math]::Round((Get-Item $Local).Length / 1KB)
    Write-Host "Done: $Local ($size KB)"

    # 删掉旧的，只留最新
    Get-ChildItem $Dest "backup_*.zip" | Sort-Object LastWriteTime -Descending | Select-Object -Skip 1 | Remove-Item
} else {
    Write-Host "FAILED"
}
