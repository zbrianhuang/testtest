#!/bin/bash
echo "Attempting to disable sandbox for builds..."
cat > App/App.entitlements << "ENTITLEMENTS"
