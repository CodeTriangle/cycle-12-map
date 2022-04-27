#!/bin/sh

NAME="$1"
DEGREES="${2-90}"
IMGDIR="docs/img"
NORMALIMG="$IMGDIR/$NAME.webp"
THUMBIMG="$IMGDIR/$NAME-thumb.webp"

convert "$NORMALIMG" -rotate "$DEGREES" "$NORMALIMG"
convert "$THUMBIMG" -rotate "$DEGREES" "$THUMBIMG"
