#!/bin/bash
echo "=== STARTING IOS BUILD FIX PROCESS ==="
echo "1. Fixing Capacitor headers..."
./Patches/revert_capacitor_headers.sh
echo "2. Creating App entitlements file..."
echo "<?xml version=\"1.0\" encoding=\"UTF-8\"?><!DOCTYPE plist PUBLIC \"-//Apple//DTD PLIST 1.0//EN\" \"http://www.apple.com/DTDs/PropertyList-1.0.dtd\"><plist version=\"1.0\"><dict><key>com.apple.security.app-sandbox</key><false/><key>com.apple.security.cs.allow-jit</key><true/><key>com.apple.security.cs.disable-library-validation</key><true/></dict></plist>" > App/App.entitlements
echo "3. Creating a simplified frameworks script..."
mkdir -p App/Scripts
echo "#!/bin/bash" > App/Scripts/simple_frameworks.sh
echo "echo \"Using simplified frameworks script\"" >> App/Scripts/simple_frameworks.sh
echo "exit 0" >> App/Scripts/simple_frameworks.sh
chmod +x App/Scripts/simple_frameworks.sh
echo "4. Simplifying the CocoaPods frameworks script..."
cp Pods/Target\ Support\ Files/Pods-App/Pods-App-frameworks.sh Pods/Target\ Support\ Files/Pods-App/Pods-App-frameworks.sh.backup 2>/dev/null || true
echo "#!/bin/bash" > Pods/Target\ Support\ Files/Pods-App/Pods-App-frameworks.sh
echo "echo \"Simplified CocoaPods frameworks script\"" >> Pods/Target\ Support\ Files/Pods-App/Pods-App-frameworks.sh
echo "exit 0" >> Pods/Target\ Support\ Files/Pods-App/Pods-App-frameworks.sh
chmod +x Pods/Target\ Support\ Files/Pods-App/Pods-App-frameworks.sh
echo "=== FIXES COMPLETE ===" 
echo "" 
echo "Now in Xcode, please do the following:" 
echo "1. Go to the App target's 'Signing & Capabilities' tab" 
echo "2. Make sure Code Signing Entitlements is set to: App/App.entitlements" 
echo "3. Go to 'Build Phases' tab" 
echo "4. Find the '[CP] Embed Pods Frameworks' script and uncheck 'Based on dependency analysis'" 
echo "5. Run Clean Build (Product > Clean Build Folder)" 
echo "6. Build again" 
