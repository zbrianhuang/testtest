#!/bin/sh
export PATH="/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"
SCRIPT_PATH="${PODS_ROOT}/Target Support Files/Pods-App/Pods-App-frameworks.sh"
chmod +x "$SCRIPT_PATH"
xattr -c "$SCRIPT_PATH"
"$SCRIPT_PATH"
