# Run as Administrator cleanup — remaining items
$ErrorActionPreference = 'Continue'

function Format-Size($Bytes) {
    if ($Bytes -ge 1TB) { return "{0:N2} TB" -f ($Bytes / 1TB) }
    if ($Bytes -ge 1GB) { return "{0:N2} GB" -f ($Bytes / 1GB) }
    if ($Bytes -ge 1MB) { return "{0:N2} MB" -f ($Bytes / 1MB) }
    return "{0:N0} KB" -f ($Bytes / 1KB)
}

$totalFreed = 0

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  Admin Cleanup Round 2" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

# --- Netease: takeown + icacls + force delete ---
Write-Host "[1/3] Netease Games..." -ForegroundColor Yellow
$netease = "C:\Program Files\Netease"
if (Test-Path $netease) {
    $sizeBefore = (Get-ChildItem $netease -Recurse -Force -File -ErrorAction SilentlyContinue | Measure-Object Length -Sum).Sum
    if (-not $sizeBefore) { $sizeBefore = 0 }

    # take ownership
    Write-Host "  Taking ownership..." -ForegroundColor Gray
    takeown /F "$netease" /R /D Y 2>&1 | Out-Null
    icacls "$netease" /grant "Administrators:F" /T /C /Q 2>&1 | Out-Null

    # force delete with cmd (bypasses some PS restrictions)
    Write-Host "  Deleting..." -ForegroundColor Gray
    cmd /c "rmdir /s /q `"$netease`"" 2>&1 | Out-Null

    if (Test-Path $netease) {
        # Still exists, try one more thing: stop MuMu processes
        Get-Process -Name "*MuMu*","*Netease*","*netease*" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
        cmd /c "rmdir /s /q `"$netease`"" 2>&1 | Out-Null
    }

    if (Test-Path $netease) {
        Write-Host "  FAIL: Netease still exists. May need safe mode." -ForegroundColor Red
    } else {
        Write-Host "  OK:   Netease removed — freed $(Format-Size $sizeBefore)" -ForegroundColor Green
        $totalFreed += $sizeBefore
    }
} else {
    Write-Host "  OK:   Already removed" -ForegroundColor Green
}

# --- Package Cache: same method ---
Write-Host "[2/3] Package Cache..." -ForegroundColor Yellow
$pkgCache = "C:\ProgramData\Package Cache"
if (Test-Path $pkgCache) {
    $sizeBefore = (Get-ChildItem $pkgCache -Recurse -Force -File -ErrorAction SilentlyContinue | Measure-Object Length -Sum).Sum
    if (-not $sizeBefore) { $sizeBefore = 0 }

    takeown /F "$pkgCache" /R /D Y 2>&1 | Out-Null
    icacls "$pkgCache" /grant "Administrators:F" /T /C /Q 2>&1 | Out-Null
    cmd /c "rmdir /s /q `"$pkgCache`"" 2>&1 | Out-Null

    if (Test-Path $pkgCache) {
        Write-Host "  FAIL: Package Cache still exists" -ForegroundColor Red
    } else {
        Write-Host "  OK:   Package Cache removed — freed $(Format-Size $sizeBefore)" -ForegroundColor Green
        $totalFreed += $sizeBefore
    }
} else {
    Write-Host "  OK:   Already removed" -ForegroundColor Green
}

# --- Windows Update Download: stop service first ---
Write-Host "[3/3] Windows Update Download..." -ForegroundColor Yellow
$wuDownload = "C:\Windows\SoftwareDistribution\Download"
if (Test-Path $wuDownload) {
    $sizeBefore = (Get-ChildItem $wuDownload -Recurse -Force -File -ErrorAction SilentlyContinue | Measure-Object Length -Sum).Sum
    if (-not $sizeBefore) { $sizeBefore = 0 }

    # Stop Windows Update service
    Write-Host "  Stopping Windows Update service..." -ForegroundColor Gray
    Stop-Service -Name "wuauserv" -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2

    # Also stop BITS and Delivery Optimization
    Stop-Service -Name "BITS" -Force -ErrorAction SilentlyContinue
    Stop-Service -Name "DoSvc" -Force -ErrorAction SilentlyContinue

    takeown /F "$wuDownload" /R /D Y 2>&1 | Out-Null
    icacls "$wuDownload" /grant "Administrators:F" /T /C /Q 2>&1 | Out-Null
    cmd /c "rmdir /s /q `"$wuDownload`"" 2>&1 | Out-Null

    if (Test-Path $wuDownload) {
        Write-Host "  FAIL: Update download still exists" -ForegroundColor Red
    } else {
        Write-Host "  OK:   Update download removed — freed $(Format-Size $sizeBefore)" -ForegroundColor Green
        $totalFreed += $sizeBefore
    }

    # Restart services
    Start-Service -Name "wuauserv" -ErrorAction SilentlyContinue
    Start-Service -Name "BITS" -ErrorAction SilentlyContinue
} else {
    Write-Host "  OK:   Already removed or empty" -ForegroundColor Green
}

# ============================================================
Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  Round 2 freed: $(Format-Size $totalFreed)" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Cyan

$cDrive = Get-PSDrive -Name C -ErrorAction SilentlyContinue
if ($cDrive) {
    $free = $cDrive.Free
    $used = $cDrive.Used
    $total = $free + $used
    $pct = [math]::Round(($used / $total) * 100, 1)
    Write-Host "  C: Free  : $(Format-Size $free)" -ForegroundColor Green
    Write-Host "  C: Usage : $pct%" -ForegroundColor $(if($pct -gt 90){'Red'}elseif($pct -gt 70){'Yellow'}else{'Green'})
}
Write-Host ""
