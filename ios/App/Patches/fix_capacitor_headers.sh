#!/bin/bash
CAPACITOR_PATH="../../node_modules/@capacitor/ios/Capacitor/Capacitor"
echo "Fixing Capacitor headers..."
cp "$CAPACITOR_PATH/CAPBridgedPlugin.h" "$CAPACITOR_PATH/CAPBridgedPlugin.h.original" 2>/dev/null || true
sed -i.bak "s/#import \"CAPPluginMethod.h\"/#import <CAPPluginMethod.h>/" "$CAPACITOR_PATH/CAPBridgedPlugin.h"
echo "Fixed import statements in Capacitor headers"
