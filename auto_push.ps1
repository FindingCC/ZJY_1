# Daily auto backup: commit all changes in ZJY_1 repo and push to GitHub (SSH)
# Called by Windows scheduled task; logs to D:\claude-backups\auto_push.log
$ErrorActionPreference = "Continue"
$repo = "D:\biandianproject1\ZJY_1"
$log = "D:\claude-backups\auto_push.log"
$stamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

Set-Location $repo

git add -A 2>&1 | Out-Null
$changed = git status --porcelain
if (-not $changed) {
    Add-Content $log "$stamp nothing to commit"
    exit 0
}

git commit -m "auto backup $stamp" 2>&1 | Out-Null
$commitCode = $LASTEXITCODE
if ($commitCode -ne 0) {
    Add-Content $log "$stamp COMMIT FAILED (code $commitCode)"
    exit 1
}

git push origin master 2>&1 | Out-Null
$pushCode = $LASTEXITCODE
if ($pushCode -eq 0) {
    Add-Content $log "$stamp pushed $($changed.Count) files"
} else {
    Add-Content $log "$stamp PUSH FAILED (code $pushCode)"
}
exit $pushCode
