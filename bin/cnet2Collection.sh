#!/usr/bin/env bash

BACKEND=mongo
PROXY_URL="https://excel2json.herokuapp.com"

URLS=(
  https://upcp.funcionpublica.gob.mx/descargas/Contratos2018.zip
  https://upcp.funcionpublica.gob.mx/descargas/Contratos2017.zip
  https://upcp.funcionpublica.gob.mx/descargas/Contratos2016.zip
  https://upcp.funcionpublica.gob.mx/descargas/Contratos2015.zip
)

size=${#URLS[@]}
index=$(($RANDOM % $size))
url=${URLS[$index]}

printf "streaming ${PROXY_URL}/${url} to ${BACKEND}\n"
stream2db --backend ${BACKEND} \
  --id hash \
  --type compranet \
  ${PROXY_URL}/${url}
