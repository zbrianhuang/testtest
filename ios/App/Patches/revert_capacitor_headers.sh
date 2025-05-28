#!/bin/bash
CAPACITOR_PATH="../../node_modules/@capacitor/ios/Capacitor/Capacitor"
echo "Reverting Capacitor headers to use quotes..."
sed -i.bak "s/#import <CAPPluginMethod.h>/#import \"CAPPluginMethod.h\"/" "$CAPACITOR_PATH/CAPBridgedPlugin.h" 2>/dev/null || true
echo "Headers reverted to use quotes"
