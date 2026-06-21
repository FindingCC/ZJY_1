<#
.SYNOPSIS
    C盘清理 — 已确认操作
    1. 休眠文件  2. 网易游戏  3. 安装包/更新包缓存  4. 临时文件/崩溃转储/缩略图/日志
#>
$ErrorActionPreference = 'Continue'
$totalFreed = 0

function Format-Size($Bytes) {
    if ($Bytes -ge 1TB) { return "{0:N2} TB" -f ($Bytes / 1TB) }
    if ($Bytes -ge 1GB) { return "{0:N2} GB" -f ($Bytes / 1GB) }
    if ($Bytes -ge 1MB) { return "{0:N2} MB" -f ($Bytes / 1MB) }
    return "{0:N0} KB" -f ($Bytes / 1KB)
}

function Remove-ItemSafe {
    param([string]$Path, [string]$Description)
    if (-not (Test-Path $Path)) {
        Write-Host "  SKIP: $Description — not found" -ForegroundColor DarkGray
        return 0
    }
    try {
        $sizeBefore = (Get-ChildItem $Path -Recurse -Force -File -ErrorAction SilentlyContinue | Measure-Object Length -Sum).Sum
        if (-not $sizeBefore) { $sizeBefore = 0 }
        Remove-Item $Path -Recurse -Force -ErrorAction Stop
        Write-Host "  OK:   $Description — freed $(Format-Size $sizeBefore)" -ForegroundColor Green
        return $sizeBefore
    } catch {
        Write-Host "  FAIL: $Description — $_" -ForegroundColor Red
        return 0
    }
}

# ============================================================
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  C Disk Cleanup / C盘清理" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

# --- 1. 休眠文件 ---
Write-Host "[1/8] Hibernate / 休眠文件..." -ForegroundColor Yellow
try {
    powercfg -h off 2>&1 | Out-Null
    if (Test-Path "C:\hiberfil.sys") {
        Write-Host "  FAIL: hiberfil.sys still exists" -ForegroundColor Red
    } else {
        $totalFreed += 12.77GB
        Write-Host "  OK:   hiberfil.sys removed — freed ~12.77 GB" -ForegroundColor Green
    }
} catch {
    Write-Host "  FAIL: powercfg -h off — needs Admin rights" -ForegroundColor Red
}

# --- 2. 网易游戏 ---
Write-Host "[2/8] Netease Games / 网易游戏..." -ForegroundColor Yellow
$freed = Remove-ItemSafe -Path "C:\Program Files\Netease" -Description "Netease games"
$totalFreed += $freed

# --- 3. 安装包缓存 ---
Write-Host "[3/8] Package Cache / 安装包缓存..." -ForegroundColor Yellow
$freed = Remove-ItemSafe -Path "C:\ProgramData\Package Cache" -Description "Package Cache"
$totalFreed += $freed

# --- 4. Windows 更新下载缓存 ---
Write-Host "[4/8] Windows Update Download / 更新包..." -ForegroundColor Yellow
$freed = Remove-ItemSafe -Path "C:\Windows\SoftwareDistribution\Download" -Description "Windows Update download cache"
$totalFreed += $freed

# --- 5. Windows Temp ---
Write-Host "[5/8] Windows Temp / 系统临时文件..." -ForegroundColor Yellow
$size = 0
if (Test-Path "C:\Windows\Temp") {
    Get-ChildItem "C:\Windows\Temp" -Recurse -Force -ErrorAction SilentlyContinue | ForEach-Object {
        $sz = $_.Length
        try {
            Remove-Item $_.FullName -Recurse -Force -ErrorAction Stop
            $size += $sz
        } catch { }
    }
}
Write-Host "  OK:   Windows Temp — freed $(Format-Size $size)" -ForegroundColor Green
$totalFreed += $size

# --- 6. 崩溃转储 ---
Write-Host "[6/8] CrashDumps / 崩溃转储..." -ForegroundColor Yellow
$freed = 0
Get-ChildItem "C:\Users" -Directory -ErrorAction SilentlyContinue | ForEach-Object {
    $dumpPath = Join-Path $_.FullName "AppData\Local\CrashDumps"
    $freed += Remove-ItemSafe -Path $dumpPath -Description "$($_.Name) CrashDumps"
}
$totalFreed += $freed

# --- 7. 缩略图缓存 ---
Write-Host "[7/8] Thumbcache / 缩略图缓存..." -ForegroundColor Yellow
$size = 0
Get-ChildItem "C:\Users" -Directory -ErrorAction SilentlyContinue | Where-Object { $_.Name -notin @('Default','Default User','Public','All Users') } | ForEach-Object {
    $explorerPath = Join-Path $_.FullName "AppData\Local\Microsoft\Windows\Explorer"
    if (Test-Path $explorerPath) {
        Get-ChildItem $explorerPath -Filter "thumbcache_*.db" -Force -ErrorAction SilentlyContinue | ForEach-Object {
            $sz = $_.Length
            try {
                Remove-Item $_.FullName -Force -ErrorAction Stop
                $size += $sz
            } catch { }
        }
    }
}
Write-Host "  OK:   Thumbcache — freed $(Format-Size $size)" -ForegroundColor Green
$totalFreed += $size

# --- 8. CBS/DISM 日志 ---
Write-Host "[8/8] CBS/DISM logs / 系统日志..." -ForegroundColor Yellow
$size = 0
"$env:SystemRoot\Logs\CBS", "$env:SystemRoot\Logs\DISM" | ForEach-Object {
    if (Test-Path $_) {
        Get-ChildItem $_ -File -Force -ErrorAction SilentlyContinue | ForEach-Object {
            $sz = $_.Length
            try {
                Remove-Item $_.FullName -Force -ErrorAction Stop
                $size += $sz
            } catch { }
        }
    }
}
Write-Host "  OK:   CBS/DISM logs — freed $(Format-Size $size)" -ForegroundColor Green
$totalFreed += $size

# ============================================================
# 结果
# ============================================================
Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  CLEANUP RESULT / 清理结果" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  Total freed / 合计释放: $(Format-Size $totalFreed)" -ForegroundColor Green

$cDrive = Get-PSDrive -Name C -ErrorAction SilentlyContinue
if ($cDrive) {
    $free = $cDrive.Free
    $used = $cDrive.Used
    $total = $free + $used
    $pct = [math]::Round(($used / $total) * 100, 1)
    Write-Host "  C: Free   / 可用:    $(Format-Size $free)" -ForegroundColor Green
    Write-Host "  C: Usage  / 使用率:  $pct%" -ForegroundColor $(if($pct -gt 90){'Red'}elseif($pct -gt 70){'Yellow'}else{'Green'})
}
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""
