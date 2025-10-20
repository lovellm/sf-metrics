# This script will build the UI and copy it to the Server.
# This enables running the server on its own with behavior 
# as it will be when deployed.

function Exit-WithMessageOnError {
    param([string]$Message)
    if (!$?) {
        Write-Host "An error has occurred."
        Write-Host $Message
        exit 1
    }
}

# Start the Build
Set-Location ../ui/metrics
Write-Host "Running New Build"
npm run build
Exit-WithMessageOnError "Build Failed"

# Cleanup
Set-Location ../..

# Copy Files
Write-Host "Copying UI Files to Server"
Copy-Item -Path ./ui/metrics/dist/* -Destination ./server/public -Recurse -Force
Exit-WithMessageOnError "Copy Failed"

Write-Host "Server Has Updated UI"