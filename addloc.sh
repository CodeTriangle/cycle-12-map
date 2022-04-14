#!/bin/sh

if [ "$#" -lt 3 ]; then
    echo "usage: $0 [IMAGE] [DESCRIPTION] [NEWNAME]" >&2
    exit 1
fi

convert "$1" "docs/img/$3.jpg"
convert -scale 360x360 "$1" "docs/img/$3-thumb.jpg"
convert "$2" "docs/img/$3-desc.jpg"

echo <<EOF
    {
        x: 0,
        y: 0,
        img: "$3",
    },
EOF
