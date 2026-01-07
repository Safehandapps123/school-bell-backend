# ============================
# CONFIG
# ============================
$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjkwLCJlbWFpbCI6InBhcmVudDk5QGdtYWlsLmNvbSIsImp0aSI6ImM5ZTA3ZGFiOTI5MjFjNDQyN2FhNWVkZTYyZGMzOTAxIiwiaWF0IjoxNzY0Nzk0MDM0LCJleHAiOjQ5MjA1NTQwMzR9.aNzzPCu75SpxCr4_04IZ28O76Sc3bvYoQpPuelMzXiY"

$endpoints = @(
    "https://school.safehandapps.com/api/v1/req-for-receipt/home-request",
    "https://school.safehandapps.com/api/v1/student?page=1&limit=10&sortOrder=ASC",
    "https://school.safehandapps.com/api/v1/req-for-receipt?page=1&limit=10&sortOrder=ASC"
)

# Number of requests per second (change this)
$requestsPerSecond = 10

$logFile = "load_test_errors.txt"

# ============================
# SCRIPT
# ============================
while ($true) {

    $jobs = @()
    $stats = @()
    
    $startSecond = Get-Date
    
    for ($i = 0; $i -lt $requestsPerSecond; $i++) {

        foreach ($url in $endpoints) {

            $jobs += Start-Job -ScriptBlock {
                param($url,$token,$logFile)

                $start = Get-Date

                try {
                    $response = Invoke-WebRequest -Uri $url `
                        -Headers @{Authorization="Bearer $token"} `
                        -Method GET `
                        -TimeoutSec 10 `
                        -ErrorAction Stop

                    $duration = ((Get-Date) - $start).TotalMilliseconds
                    
                    return @{
                        url = $url
                        code = $response.StatusCode
                        duration = $duration
                        error = $null
                    }
                }
                catch {
                    $duration = ((Get-Date) - $start).TotalMilliseconds
                    
                    Add-Content $logFile "$(Get-Date) ERROR $url - $_"

                    return @{
                        url = $url
                        code = 0
                        duration = $duration
                        error = $_.Exception.Message
                    }
                }

            } -ArgumentList $url,$token,$logFile
        }
    }

    Wait-Job -Job $jobs | Out-Null
    $results = Receive-Job -Job $jobs
    Remove-Job -Job $jobs -Force

    # ============================
    # STATISTICS
    # ============================

    $total = $results.Count
    $success = ($results | Where-Object { $_.code -ge 200 -and $_.code -lt 300 }).Count
    $failed = $total - $success

    $avgDuration = [Math]::Round(($results.duration | Measure-Object -Average).Average, 2)
    $minDuration = [Math]::Round(($results.duration | Measure-Object -Minimum).Minimum, 2)
    $maxDuration = [Math]::Round(($results.duration | Measure-Object -Maximum).Maximum, 2)

    Clear-Host
    Write-Host "========== LOAD TEST REPORT =========="
    Write-Host "Time: $(Get-Date)"
    Write-Host "Requests per second: $requestsPerSecond"
    Write-Host "Endpoints tested: $($endpoints.Count)"
    Write-Host "----------------------------------------"
    Write-Host "Total Requests    : $total"
    Write-Host "Successful (2xx)  : $success"
    Write-Host "Failed            : $failed"
    Write-Host "----------------------------------------"
    Write-Host "Avg Response Time : $avgDuration ms"
    Write-Host "Fastest Request   : $minDuration ms"
    Write-Host "Slowest Request   : $maxDuration ms"
    Write-Host "========================================"

    $endSecond = Get-Date
    $elapsed = ($endSecond - $startSecond).TotalMilliseconds

    # maintain exactly 1 second loop
    if ($elapsed -lt 1000) {
        Start-Sleep -Milliseconds (1000 - $elapsed)
    }
}
