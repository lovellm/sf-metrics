# This script will build the UI and copy it to the Server.
# This enables running the server on its own with behavior 
# as it will be when deployed.

# Helper Function To Exit Script if Previous Step Failed
exitWithMessageOnError () {
  if [ ! $? -eq 0 ]; then
    echo "An error has occurred."
    echo $1
    exit 1
  fi
}
# Start the Build
# CD up to ui folder
cd ../ui/metrics
echo Running New Build
npm run build
exitWithMessageOnError "Build Failed"
# Cleanup
cd ../..
# Copy Files
echo Copying UI Files to Server
cp -r ./ui/metrics/dist/* ./server/public
exitWithMessageOnError "Copy Failed"
echo Server Has Updated UI
