#!/bin/sh

if [ "$#" -lt 3 ]; then
    echo "usage: $0 [IMAGE] [DESCRIPTION] [NEWNAME]" >&2
    exit 1
fi

NORMAL="$1"
DESC="$2"
IMG="$3"

BASE_LOC="docs/img"
EXT="webp"
NORMAL_LOC="$BASE_LOC/$IMG.$EXT"
THUMB_LOC="$BASE_LOC/$IMG-thumb.$EXT"
DESC_LOC="$BASE_LOC/$IMG-desc.$EXT"

TMP_BASE_LOC="/tmp/addloc-$(date +'%s')"
TMP_NORMAL_LOC="$TMP_BASE_LOC.$EXT"
TMP_DESC_LOC="$TMP_BASE_LOC-desc.$EXT"

if echo "$NORMAL" | grep -q '^http'; then
    curl "$NORMAL" --silent --output "$TMP_NORMAL_LOC" 
    NORMAL="$TMP_NORMAL_LOC"
fi

if echo "$DESC" | grep -q '^http'; then
    curl "$DESC" --silent --output "$TMP_DESC_LOC"
    DESC="$TMP_DESC_LOC"
fi

convert "$NORMAL" "$NORMAL_LOC"
convert -scale 360x360 "$NORMAL" "$THUMB_LOC"
convert "$DESC" "$DESC_LOC"

cat <<EOF
    {
        x: 0,
        y: 0,
        img: "$IMG",
    },
EOF
