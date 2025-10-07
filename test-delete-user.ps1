# Test admin login
$loginBody = @{
    username = "admin"
    password = "admin123"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/admin/login" -Method POST -Body $loginBody -ContentType "application/json"
Write-Host "Login response: $($loginResponse | ConvertTo-Json -Depth 3)"

if ($loginResponse.success) {
    $token = $loginResponse.data.token
    Write-Host "Admin token: $token"
    
    # Get users list
    $headers = @{
        "Authorization" = "Bearer $token"
    }
    
    $usersResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/admin/users" -Method GET -Headers $headers
    Write-Host "Users response: $($usersResponse | ConvertTo-Json -Depth 3)"
    
    if ($usersResponse.success -and $usersResponse.data.users.Count -gt 0) {
        $firstUser = $usersResponse.data.users[0]
        Write-Host "Attempting to delete user: $($firstUser._id)"
        
        # Try to delete the first user
        $deleteResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/admin/users/$($firstUser._id)" -Method DELETE -Headers $headers
        Write-Host "Delete response: $($deleteResponse | ConvertTo-Json -Depth 3)"
    } else {
        Write-Host "No users found to delete"
    }
} else {
    Write-Host "Login failed: $($loginResponse.message)"
}
