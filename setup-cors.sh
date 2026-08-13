#!/bin/bash
# 📝 Configurar CORS en Firebase Storage
# Esto permite que tu app Angular en localhost pueda subir archivos

# 1. Descargar la herramienta gcloud (si no la tienes)
# https://cloud.google.com/sdk/docs/install

# 2. Autenticarte con Google Cloud
# gcloud auth login

# 3. Selecciona tu proyecto
# gcloud config set project control-transportes

# 4. Crea un archivo cors.json con esta configuración:
cat > cors.json << 'EOF'
[
  {
    "origin": ["http://localhost:4200", "http://localhost:*"],
    "method": ["GET", "HEAD", "DELETE", "PUT", "POST", "OPTIONS"],
    "responseHeader": ["Content-Type"],
    "maxAgeSeconds": 3600
  }
]
EOF

# 5. Aplica la configuración a Firebase Storage
gsutil cors set cors.json gs://control-transportes.appspot.com

echo "✅ CORS configurado en Firebase Storage"
