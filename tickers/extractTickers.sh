#!/bin/bash

INPUT=$1
if [ "$INPUT" == "" ]; then
  echo "usage: $0 <csv-file>"
  exit 1
fi

OUTPUT=""
OUTPUT_FILE="$(echo "$1" | sed s/\.csv//)-tickers.txt"

while read -r line
do
  # Reduce "AEGR","Aegerion Pharmaceuticals, Inc.","27.46","$780.85M"...
  # To      AEGR
  TICKER=$(echo "$line" | sed s/,.*$// | sed s/[[:space:]]//g | sed s/\"//g)

  SEPARATOR=","
  if [ "$OUTPUT" == "" ]; then
    SEPARATOR=""
  fi

  # discard column name
  if [ "${TICKER}" != "Symbol" ]; then
    OUTPUT="${OUTPUT}${SEPARATOR}${TICKER}"
  fi
done < "$INPUT"

echo "$OUTPUT" > $OUTPUT_FILE
