# PowerShell script to start both backend and frontend
Write-Host "🚀 Starting Greeting Message Development Environment" -ForegroundColor Green

# Function to start backend
function Start-Backend {
    Write-Host "📦 Starting Backend Server..." -ForegroundColor Yellow
    Set-Location "backend"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"
    Set-Location ".."
}

# Function to start frontend
function Start-Frontend {
    Write-Host "🎨 Starting Frontend Server..." -ForegroundColor Yellow
    Set-Location "frontend"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"
    Set-Location ".."
}

# Function to create test data
function Create-TestData {
    Write-Host "🧪 Creating Test Data..." -ForegroundColor Yellow
    node test-orders-integration.js
}

# Start backend
Start-Backend

# Wait a bit for backend to start
Start-Sleep -Seconds 3

# Create test data
Create-TestData

# Wait a bit for test data to be created
Start-Sleep -Seconds 2

# Start frontend
Start-Frontend

Write-Host "✅ Development environment started!" -ForegroundColor Green
Write-Host "Backend: http://localhost:5000" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Admin Panel: http://localhost:3000/admin" -ForegroundColor Cyan
Write-Host ""
Write-Host "Admin Credentials:" -ForegroundColor Yellow
Write-Host "Username: admin" -ForegroundColor White
Write-Host "Password: admin123" -ForegroundColor White
