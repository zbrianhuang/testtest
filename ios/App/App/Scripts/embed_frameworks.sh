#!/bin/sh
set -e
echo "Manually copying frameworks to app bundle..."
APP_PATH="${TARGET_BUILD_DIR}/${FRAMEWORKS_FOLDER_PATH}"
mkdir -p "$APP_PATH"
find "${BUILT_PRODUCTS_DIR}" -name "*.framework" -type d | while read -r FRAMEWORK; do
  echo "Copying $FRAMEWORK to $APP_PATH"
  cp -R "$FRAMEWORK" "$APP_PATH"
done
echo "Frameworks copied successfully"
