# Round 3 — kill processes, force delete Netease + Package Cache + Update Download
$ErrorActionPreference = 'Continue'
$totalFreed = 0

function Format-Size($Bytes) {
    if ($Bytes -ge 1TB) { return "{0:N2} TB" -f ($Bytes / 1TB) }
    if ($Bytes -ge 1GB) { return "{0:N2} GB" -f ($Bytes / 1GB) }
    if ($Bytes -ge 1MB) { return "{0:N2} MB" -f ($Bytes / 1MB) }
    return "{0:N0} KB" -f ($Bytes / 1KB)
}

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  Force Cleanup Round 3" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

# --- Step 0: Kill all related processes ---
Write-Host "[0] Killing target processes..." -ForegroundColor Yellow
$procs = @(
    "*MuMu*", "*Netease*", "*netease*", "*mumu*", "*NEMU*",
    "*CloudMusic*", "*cloudmusic*"
)
$killed = @()
foreach ($p in $procs) {
    Get-Process -Name $p -ErrorAction SilentlyContinue | ForEach-Object {
        $killed += $_.ProcessName
        Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
    }
}
if ($killed.Count -gt 0) {
    Write-Host "  Killed: $($killed -join ', ')" -ForegroundColor Green
    Start-Sleep -Seconds 5
} else {
    Write-Host "  No matching processes found" -ForegroundColor Gray
}

# --- Netease ---
Write-Host "[1] Netease Games..." -ForegroundColor Yellow
$netease = "C:\Program Files\Netease"
if (Test-Path $netease) {
    $sizeBefore = (Get-ChildItem $netease -Recurse -Force -File -ErrorAction SilentlyContinue | Measure-Object Length -Sum).Sum
    if (-not $sizeBefore) { $sizeBefore = 0 }

    Write-Host "  takeown..." -ForegroundColor Gray
    takeown /F "$netease" /R /D Y 2>&1 | Out-Null
    Write-Host "  icacls..." -ForegroundColor Gray
    icacls "$netease" /grant "Administrators:F" /T /C /Q 2>&1 | Out-Null
    Write-Host "  rmdir..." -ForegroundColor Gray
    cmd /c "rmdir /s /q `"$netease`"" 2>&1 | Out-Null

    if (Test-Path $netease) {
        # Try removing readonly/hidden/system attributes first
        Write-Host "  attrib -r -s -h..." -ForegroundColor Gray
        attrib -R -S -H "$netease\*.*" /S /D 2>&1 | Out-Null
        cmd /c "rmdir /s /q `"$netease`"" 2>&1 | Out-Null
    }

    if (Test-Path $netease) {
        # Last resort: delete file by file
        Write-Host "  Recursive file-by-file delete..." -ForegroundColor Gray
        Get-ChildItem $netease -Recurse -Force -File -ErrorAction SilentlyContinue | ForEach-Object {
            try { Remove-Item $_.FullName -Force -ErrorAction Stop } catch {}
        }
        Get-ChildItem $netease -Recurse -Force -Directory -ErrorAction SilentlyContinue | Sort-Object FullName.Length -Descending | ForEach-Object {
            try { Remove-Item $_.FullName -Force -Recurse -ErrorAction Stop } catch {}
        }
        try { Remove-Item $netease -Force -Recurse -ErrorAction Stop } catch {}
    }

    if (Test-Path $netease) {
        $remaining = (Get-ChildItem $netease -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object).Count
        Write-Host "  PARTIAL: $remaining items remain in Netease" -ForegroundColor Yellow
    } else {
        Write-Host "  OK: Netease removed — freed $(Format-Size $sizeBefore)" -ForegroundColor Green
        $totalFreed += $sizeBefore
    }
} else {
    Write-Host "  OK: Already removed" -ForegroundColor Green
}

# --- Package Cache ---
Write-Host "[2] Package Cache..." -ForegroundColor Yellow
$pkg = "C:\ProgramData\Package Cache"
if (Test-Path $pkg) {
    $sizeBefore = (Get-ChildItem $pkg -Recurse -Force -File -ErrorAction SilentlyContinue | Measure-Object Length -Sum).Sum
    if (-not $sizeBefore) { $sizeBefore = 0 }
    attrib -R -S -H "$pkg\*.*" /S /D 2>&1 | Out-Null
    takeown /F "$pkg" /R /D Y 2>&1 | Out-Null
    icacls "$pkg" /grant "Administrators:F" /T /C /Q 2>&1 | Out-Null
    cmd /c "rmdir /s /q `"$pkg`"" 2>&1 | Out-Null
    if (-not (Test-Path $pkg)) {
        Write-Host "  OK: Package Cache removed — freed $(Format-Size $sizeBefore)" -ForegroundColor Green
        $totalFreed += $sizeBefore
    } else {
        Write-Host "  FAIL: still exists" -ForegroundColor Red
    }
} else {
    Write-Host "  OK: Already removed" -ForegroundColor Green
}

# --- Windows Update Download ---
Write-Host "[3] Windows Update Download..." -ForegroundColor Yellow
$wu = "C:\Windows\SoftwareDistribution\Download"
if (Test-Path $wu) {
    $sizeBefore = (Get-ChildItem $wu -Recurse -Force -File -ErrorAction SilentlyContinue | Measure-Object Length -Sum).Sum
    if (-not $sizeBefore) { $sizeBefore = 0 }

    Stop-Service -Name "wuauserv" -Force -ErrorAction SilentlyContinue
    Stop-Service -Name "BITS" -Force -ErrorAction SilentlyContinue
    Stop-Service -Name "DoSvc" -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 3

    attrib -R -S -H "$wu\*.*" /S /D 2>&1 | Out-Null
    takeown /F "$wu" /R /D Y 2>&1 | Out-Null
    icacls "$wu" /grant "Administrators:F" /T /C /Q 2>&1 | Out-Null
    cmd /c "rmdir /s /q `"$wu`"" 2>&1 | Out-Null

    if (-not (Test-Path $wu)) {
        Write-Host "  OK: Update download removed — freed $(Format-Size $sizeBefore)" -ForegroundColor Green
        $totalFreed += $sizeBefore
    } else {
        Write-Host "  FAIL: still exists (TrustedInstaller locked)" -ForegroundColor Red
        # Recreate empty directory so updates still work
        New-Item -ItemType Directory -Path $wu -Force -ErrorAction SilentlyContinue | Out-Null
    }

    Start-Service -Name "wuauserv" -ErrorAction SilentlyContinue
    Start-Service -Name "BITS" -ErrorAction SilentlyContinue
} else {
    Write-Host "  OK: Already removed" -ForegroundColor Green
}

# ============================================================
Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  Round 3 freed: $(Format-Size $totalFreed)" -ForegroundColor Green
$cDrive = Get-PSDrive -Name C -ErrorAction SilentlyContinue
if ($cDrive) {
    $free = $cDrive.Free
    $used = $cDrive.Used
    $pct = [math]::Round(($used / ($free + $used)) * 100, 1)
    Write-Host "  C: Free  : $(Format-Size $free)" -ForegroundColor Green
    Write-Host "  C: Usage : $pct%" -ForegroundColor $(if($pct -gt 90){'Red'}elseif($pct -gt 80){'Yellow'}else{'Green'})
}
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""
