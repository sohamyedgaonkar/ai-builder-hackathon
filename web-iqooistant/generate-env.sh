#!/bin/sh
cat <<EOF > /usr/share/nginx/html/env-config.js
window.__RUNTIME_CONFIG__ = {
  VITE_OPENROUTER_API_KEY: "${VITE_OPENROUTER_API_KEY:-}",
  VITE_VERTEX_AI_KEY: "${VITE_VERTEX_AI_KEY:-}"
};
EOF
