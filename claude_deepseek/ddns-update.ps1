param([string]$Username, [string]$Password)

$Domain = "3ve11805ew84.vicp.fun"

function Get-MyIPv6 {
    $addrs = Get-NetIPAddress -AddressFamily IPv6 | Where-Object {
        $_.PrefixOrigin -eq "RouterAdvertisement" -and
        $_.SuffixOrigin -eq "Link" -and
        $_.AddressState -eq "Preferred"
    } | Select-Object -First 1
    if ($addrs) { return $addrs.IPAddress }
    return $null
}

$ip = Get-MyIPv6
if (-not $ip) {
    Write-Host "FAIL: No IPv6 found"
    exit 1
}

if (-not $Username -or -not $Password) {
    Write-Host "Usage: .\ddns-update.ps1 -Username USER -Password PASS"
    Write-Host "IPv6: $ip"
    exit 0
}

$now = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

# Method 1: Basic Auth header
$pair = "$($Username):$($Password)"
$bytes = [System.Text.Encoding]::UTF8.GetBytes($pair)
$base64 = [System.Convert]::ToBase64String($bytes)
$headers = @{ Authorization = "Basic $base64" }
$uri1 = "http://ddns.oray.com/ph/update?hostname=${Domain}&myipv6=${ip}"
try {
    $res = Invoke-WebRequest -Uri $uri1 -Headers $headers -TimeoutSec 10 -UseBasicParsing
    $body = $res.Content.Trim()
    Write-Host "$now Method1 $body"
    if ($body -like "good*" -or $body -like "nochg*") { exit 0 }
} catch {
    Write-Host "$now Method1 FAIL: $_"
}

# Method 2: URL auth
$encUser = [Uri]::EscapeDataString($Username)
$encPass = [Uri]::EscapeDataString($Password)
$uri2 = "http://${encUser}:${encPass}@ddns.oray.com/ph/update?hostname=${Domain}&myipv6=${ip}"
try {
    $res = Invoke-WebRequest -Uri $uri2 -TimeoutSec 10 -UseBasicParsing
    Write-Host "$now Method2 $($res.Content.Trim())"
} catch {
    Write-Host "$now Method2 FAIL: $_"
}

# Method 3: No auth, just URL with params
$uri3 = "http://ddns.oray.com/ph/update?hostname=${Domain}&myipv6=${ip}"
try {
    $res = Invoke-WebRequest -Uri $uri3 -TimeoutSec 10 -UseBasicParsing
    Write-Host "$now Method3 $($res.Content.Trim())"
} catch {
    Write-Host "$now Method3 FAIL: $_"
}
