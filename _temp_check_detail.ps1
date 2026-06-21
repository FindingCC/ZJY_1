<#
.SYNOPSIS
    C 盘全盘空间占用拆解 — 仅扫描，不删除
#>
$ErrorActionPreference = 'SilentlyContinue'

function Format-Size($Bytes) {
    if ($Bytes -ge 1TB) { return "{0:N2} TB" -f ($Bytes / 1TB) }
    if ($Bytes -ge 1GB) { return "{0:N2} GB" -f ($Bytes / 1GB) }
    if ($Bytes -ge 1MB) { return "{0:N2} MB" -f ($Bytes / 1MB) }
    return "{0:N0} KB" -f ($Bytes / 1KB)
}

function Get-FolderSize($Path) {
    if (-not (Test-Path $Path)) { return 0 }
    $size = (Get-ChildItem $Path -Recurse -Force -File -ErrorAction SilentlyContinue | Measure-Object Length -Sum).Sum
    if (-not $size) { return 0 }
    return $size
}

Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  C: Full Disk Usage Breakdown / 全盘空间拆解" -ForegroundColor Cyan
Write-Host "  Read-only scan, no delete / 只读，不删除" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

$startTime = Get-Date
$results = [System.Collections.ArrayList]::new()

# ============================================================
# 1. C:\ 根目录大文件 (pagefile.sys, hiberfil.sys, swapfile.sys)
# ============================================================
Write-Host "[1/8] C:\ root large files / 根目录大文件..." -ForegroundColor Gray
Get-ChildItem "C:\" -Force -ErrorAction SilentlyContinue | ForEach-Object {
    if ($_.PSIsContainer) { return }
    $sz = $_.Length
    if ($sz -gt 10MB) {
        [void]$results.Add(([PSCustomObject]@{Category="C:\ 根目录大文件"; Item=$_.Name; Size=$sz; Note=""}))
    }
}

# ============================================================
# 2. C:\Windows (一级子目录拆解)
# ============================================================
Write-Host "[2/8] C:\Windows subdirs / Windows 子目录..." -ForegroundColor Gray
$winDir = "C:\Windows"
Get-ChildItem $winDir -Directory -Force -ErrorAction SilentlyContinue | ForEach-Object {
    $sz = Get-FolderSize $_.FullName
    if ($sz -gt 50MB) {
        $note = ""
        if ($_.Name -eq "WinSxS") { $note = "组件存储，用 dism 清理" }
        elseif ($_.Name -eq "Installer") { $note = "补丁卸载缓存" }
        elseif ($_.Name -eq "System32") { $note = "系统核心，不可删" }
        elseif ($_.Name -eq "SysWOW64") { $note = "32位子系统" }
        elseif ($_.Name -eq "assembly") { $note = ".NET/COM 程序集" }
        elseif ($_.Name -eq "Microsoft.NET") { $note = ".NET Framework" }
        [void]$results.Add(([PSCustomObject]@{Category="C:\Windows 子目录"; Item="Windows\" + $_.Name; Size=$sz; Note=$note}))
    }
}
# Also get big files in Windows root
Get-ChildItem $winDir -File -Force -ErrorAction SilentlyContinue | ForEach-Object {
    if ($_.Length -gt 50MB) {
        [void]$results.Add(([PSCustomObject]@{Category="C:\Windows"; Item="Windows\" + $_.Name; Size=$_.Length; Note=""}))
    }
}

# ============================================================
# 3. C:\Program Files (一级目录)
# ============================================================
Write-Host "[3/8] C:\Program Files / 程序文件..." -ForegroundColor Gray
Get-ChildItem "C:\Program Files" -Directory -Force -ErrorAction SilentlyContinue | ForEach-Object {
    $sz = Get-FolderSize $_.FullName
    if ($sz -gt 50MB) {
        [void]$results.Add(([PSCustomObject]@{Category="Program Files"; Item="Program Files\" + $_.Name; Size=$sz; Note=""}))
    }
}

# ============================================================
# 4. C:\Program Files (x86) (一级目录)
# ============================================================
Write-Host "[4/8] C:\Program Files (x86) / 32位程序文件..." -ForegroundColor Gray
if (Test-Path "C:\Program Files (x86)") {
    Get-ChildItem "C:\Program Files (x86)" -Directory -Force -ErrorAction SilentlyContinue | ForEach-Object {
        $sz = Get-FolderSize $_.FullName
        if ($sz -gt 50MB) {
            [void]$results.Add(([PSCustomObject]@{Category="Program Files (x86)"; Item="PF(x86)\" + $_.Name; Size=$sz; Note=""}))
        }
    }
}

# ============================================================
# 5. C:\ProgramData (一级目录)
# ============================================================
Write-Host "[5/8] C:\ProgramData / 程序数据..." -ForegroundColor Gray
Get-ChildItem "C:\ProgramData" -Directory -Force -ErrorAction SilentlyContinue | ForEach-Object {
    $sz = Get-FolderSize $_.FullName
    if ($sz -gt 50MB) {
        [void]$results.Add(([PSCustomObject]@{Category="ProgramData"; Item="ProgramData\" + $_.Name; Size=$sz; Note=""}))
    }
}

# ============================================================
# 6. C:\Users (按用户 + 一级目录拆解)
# ============================================================
Write-Host "[6/8] C:\Users / 用户目录..." -ForegroundColor Gray
$skipUsers = @('Default', 'Default User', 'Public', 'All Users')
Get-ChildItem "C:\Users" -Directory -Force -ErrorAction SilentlyContinue | ForEach-Object {
    if ($skipUsers -contains $_.Name) {
        # Light scan for Default/Public
        $sz = Get-FolderSize $_.FullName
        if ($sz -gt 10MB) {
            [void]$results.Add(([PSCustomObject]@{Category="Users"; Item="Users\" + $_.Name; Size=$sz; Note=""}))
        }
        return
    }
    # Real users: break down by top-level folders
    $userDir = $_.FullName
    Get-ChildItem $userDir -Directory -Force -ErrorAction SilentlyContinue | ForEach-Object {
        $sz = Get-FolderSize $_.FullName
        if ($sz -gt 10MB) {
            $label = $_.Name
            if ($_.Name -eq 'AppData') {
                # Break AppData further
                Get-ChildItem $_.FullName -Directory -Force -ErrorAction SilentlyContinue | ForEach-Object {
                    $innerSz = Get-FolderSize $_.FullName
                    if ($innerSz -gt 10MB) {
                        [void]$results.Add(([PSCustomObject]@{Category="Users"; Item="Users\" + $userDir.Name + "\AppData\" + $_.Name; Size=$innerSz; Note=""}))
                    }
                }
                return
            }
            [void]$results.Add(([PSCustomObject]@{Category="Users"; Item="Users\" + $userDir.Name + "\" + $label; Size=$sz; Note=""}))
        }
    }
    # Hidden files in user root
    Get-ChildItem $userDir -File -Force -ErrorAction SilentlyContinue | ForEach-Object {
        if ($_.Length -gt 10MB) {
            [void]$results.Add(([PSCustomObject]@{Category="Users"; Item="Users\" + $userDir.Name + "\" + $_.Name; Size=$_.Length; Note="用户根目录隐藏大文件"}))
        }
    }
}

# ============================================================
# 7. 隐藏目录: System Volume Information, Recovery, etc
# ============================================================
Write-Host "[7/8] Hidden/system dirs / 隐藏系统目录..." -ForegroundColor Gray
$hiddenDirs = @(
    "C:\System Volume Information",
    "C:\Recovery",
    "C:\Config.Msi",
    "C:\PerfLogs",
    "C:\MSOCache",
    "C:\Intel",
    "C:\AMD",
    "C:\NVIDIA",
    "C:\DRIVERS"
)
foreach ($hd in $hiddenDirs) {
    if (Test-Path $hd) {
        $sz = Get-FolderSize $hd
        $name = Split-Path $hd -Leaf
        if ($sz -gt 1MB) {
            $note = ""
            if ($name -eq "System Volume Information") { $note = "系统还原点/卷影副本" }
            elseif ($name -eq "Recovery") { $note = "恢复分区镜像" }
            [void]$results.Add(([PSCustomObject]@{Category="隐藏/系统目录"; Item=$hd; Size=$sz; Note=$note}))
        }
    }
}

# ============================================================
# 8. 临时/缓存目录 (汇总到单独类别)
# ============================================================
Write-Host "[8/8] Temp caches / 临时缓存汇总..." -ForegroundColor Gray
$tempDirs = @(
    @{P="C:\Windows\Temp"; N="Windows Temp"},
    @{P="C:\Windows\Prefetch"; N="Prefetch"},
    @{P="C:\Windows\SoftwareDistribution\Download"; N="Windows Update Download"},
    @{P="C:\Windows\Logs"; N="Windows Logs"},
    @{P="C:\`$Recycle.Bin"; N="Recycle Bin"}
)
foreach ($td in $tempDirs) {
    if (Test-Path $td.P) {
        $sz = Get-FolderSize $td.P
        if ($sz -gt 1MB) {
            [void]$results.Add(([PSCustomObject]@{Category="临时/缓存"; Item=$td.N; Size=$sz; Note="可安全清理"}))
        }
    }
}

# ============================================================
# Presentation
# ============================================================
$duration = [math]::Round(((Get-Date) - $startTime).TotalSeconds, 1)
$grandTotal = ($results | Measure-Object Size -Sum).Sum

Write-Host ""
Write-Host "Scan done in $duration sec. Computing results..." -ForegroundColor Gray
Write-Host ""

# C drive overview
$cDrive = Get-PSDrive -Name C -ErrorAction SilentlyContinue
$totalDrive = $cDrive.Used + $cDrive.Free
$usedDrive = $cDrive.Used
$freeDrive = $cDrive.Free
$pctUsed = [math]::Round(($usedDrive / $totalDrive) * 100, 1)
$accounted = ($results | Measure-Object Size -Sum).Sum
$unaccounted = $usedDrive - $accounted

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  DISK OVERVIEW / 磁盘总览" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
$color = if ($pctUsed -gt 90) { "Red" } elseif ($pctUsed -gt 75) { "Yellow" } else { "Green" }
Write-Host ("  Total     / 总容量:    " + (Format-Size $totalDrive))
Write-Host ("  Used      / 已用:      " + (Format-Size $usedDrive))    -ForegroundColor $color
Write-Host ("  Free      / 可用:      " + (Format-Size $freeDrive))    -ForegroundColor Green
Write-Host ("  Usage     / 使用率:    " + $pctUsed.ToString() + "%")  -ForegroundColor $color
Write-Host ("  Accounted / 已归因:    " + (Format-Size $accounted))    -ForegroundColor White
Write-Host ("  Remainder / 未归因:    " + (Format-Size $unaccounted))  -ForegroundColor DarkGray
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

# Group and print by category
$categories = $results | Group-Object Category | Sort-Object { ($_.Group | Measure-Object Size -Sum).Sum } -Descending

foreach ($cat in $categories) {
    $catTotal = ($cat.Group | Measure-Object Size -Sum).Sum
    $catPct = if ($usedDrive -gt 0) { [math]::Round(($catTotal / $usedDrive) * 100, 1) } else { 0 }
    $catColor = "White"
    if ($catTotal -gt 20GB) { $catColor = "Red" }
    elseif ($catTotal -gt 5GB) { $catColor = "Yellow" }
    else { $catColor = "Cyan" }

    Write-Host ("---- " + $cat.Name + "  [" + (Format-Size $catTotal) + "  " + $catPct.ToString() + "% of used] ----") -ForegroundColor $catColor

    $cat.Group | Sort-Object Size -Descending | ForEach-Object {
        $szStr = Format-Size $_.Size
        $pctStr = if ($usedDrive -gt 0) { [math]::Round(($_.Size / $usedDrive) * 100, 1).ToString().PadLeft(5) + "%" } else { "" }
        Write-Host ("  " + $szStr.PadLeft(12) + "  " + $pctStr + "  " + $_.Item) -ForegroundColor White
        if ($_.Note) {
            Write-Host ("                     |-- " + $_.Note) -ForegroundColor DarkGray
        }
    }
    Write-Host ""
}

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  Breakdown complete. No files deleted. / 拆解完成。" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""
