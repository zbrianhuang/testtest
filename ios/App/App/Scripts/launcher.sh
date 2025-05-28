#!/bin/bash
export PATH="/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"
SOURCE_SCRIPT="${PODS_ROOT}/Target Support Files/Pods-App/Pods-App-frameworks.sh"
TEMP_SCRIPT="/tmp/frameworks_script_$$.sh"
cp "$SOURCE_SCRIPT" "$TEMP_SCRIPT"
chmod +x "$TEMP_SCRIPT"
"$TEMP_SCRIPT"
rm -f "$TEMP_SCRIPT"
