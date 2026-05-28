#!/bin/bash

SUBJECT="CrescCampo Pipeline — ${BUILD_STATUS}"

MESSAGE="CrescCampo Pipeline
Status: ${BUILD_STATUS}
Build: ${BUILD_NAME}
Tempo: $(date '+%d/%m/%Y %H:%M:%S')"

echo "Enviando e-mail para ${EMAIL_DESTINATARIO}..."

curl --url "smtps://smtp.gmail.com:465" \
  --ssl-reqd \
  --mail-from "${EMAIL_REMETENTE}" \
  --mail-rcpt "${EMAIL_DESTINATARIO}" \
  --user "${EMAIL_REMETENTE}:${EMAIL_APP_PASSWORD}" \
  -T <(echo -e "From: CrescCampo Pipeline <${EMAIL_REMETENTE}>\nTo: ${EMAIL_DESTINATARIO}\nSubject: ${SUBJECT}\n\n${MESSAGE}")

echo "E-mail enviado!"