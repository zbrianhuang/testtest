#!/bin/bash
echo "Fixing Xcode project settings for sandbox issues..."
chmod +x Pods/Target\ Support\ Files/Pods-App/Pods-App-frameworks.sh
xattr -c Pods/Target\ Support\ Files/Pods-App/Pods-App-frameworks.sh
echo "Completed! Now in Xcode, please do the following:"
echo "1. Select the App target"
echo "2. Go to Build Phases tab"
echo "3. Find [CP] Embed Pods Frameworks script and replace the script with:"
echo "   \"${PWD}/App/Scripts/run_frameworks.sh\""
echo "4. Uncheck Based on dependency analysis"
echo "5. Go to Signing & Capabilities tab"
echo "6. Set Code Signing Entitlements to App/App.entitlements"
echo "7. Clean and build the project"
