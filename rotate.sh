#!/bin/sh

NAME="$1"
DEGREES="${2-90}"
IMGDIR="docs/img"
NORMALIMG="$IMGDIR/$NAME.png"
THUMBIMG="$IMGDIR/$NAME-thumb.png"

convert "$NORMALIMG" -rotate "$DEGREES" "$NORMALIMG"
convert "$THUMBIMG" -rotate "$DEGREES" "$THUMBIMG"
