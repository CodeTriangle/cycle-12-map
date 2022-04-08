const data = {}

window.onload = (event) => {
    data.mapElement = document.getElementById("map");
    data.descElement = document.getElementById("description");
    data.imgsElement = document.getElementById("images");
    data.coordsElement = document.getElementById("coords");
    data.locations = {};

    addLocations(locations);

    resizeCanvas();

    data.tileWidth = 120;
    data.tileHeight = 120;

    data.tileOriginX = data.mapWidth / 2 - data.tileWidth / 2;
    data.tileOriginY = data.mapHeight / 2 - data.tileWidth / 2;

    data.c = data.mapElement.getContext("2d");

    updateCoordsDisplayCenter();

    window.onresize = (e) => {
        resizeCanvas();
        drawCanvas();
    }

    document.body.onwheel = (e) => {
        const factor = e.deltaY < 0 ? 1.1 : 0.9;
        scaleCanvas(factor, [e.clientX, e.clientY]);
        drawCanvas();
    }

    data.mapElement.onmousedown = (e) => {
        handleMouseDown(e.clientX, e.clientY);
    }

    data.mapElement.addEventListener("touchstart", (e) => {
        e.preventDefault();

        switch (e.touches.length) {
            case 1: 
                handleMouseDown(e.touches.item(0).clientX, e.touches.item(0).clientY);
                break;
            case 2:
                mouseOut();
                const first = data.firstTouch = e.touches.item(0);
                const second = data.firstTouch = e.touches.item(1);
                data.pinchDist = Math.sqrt(
                    (second.clientX - first.clientX) ** 2 + (second.clientY - first.clientY) ** 2 
                );
                break;
        }
    });

    data.mapElement.onmousemove = (e) => {
        updateCoordsDisplayWithScreenCoords(e.clientX, e.clientY);
        handleMouseMove(e.clientX, e.clientY);
    }

    data.mapElement.addEventListener("touchmove", (e) => {
        e.preventDefault();

        switch (e.touches.length) {
            case 1:
                const touch = e.touches.item(0);
                updateCoordsDisplayWithScreenCoords(touch.clientX, touch.clientY);
                handleMouseMove(touch.clientX, touch.clientY);
                break;
            case 2:
                const first = e.touches.item(0);
                const second = e.touches.item(1);

                const newPinchDist = Math.sqrt(
                    (second.clientX - first.clientX) ** 2 + (second.clientY - first.clientY) ** 2 
                );

                const cx = (first.clientX + second.clientX) / 2;
                const cy = (first.clientY + second.clientY) / 2;

                scaleCanvas(newPinchDist / data.pinchDist, [cx, cy]);
                drawCanvas();

                data.firstTouch = first;
                data.secondTouch = second;
                data.pinchDist = newPinchDist;

                break;
        }
    });

    data.mapElement.onmouseup = (e) => {
        mouseOut();
        const deltaTime = (new Date()).getTime() - data.mouseDownTime;

        if (deltaTime < 250) {
            mouseClick();
        }
    }

    data.mapElement.addEventListener("touchend", (e) => {
        e.preventDefault();

        switch (e.touches.length) {
            case 0:
                mouseOut();
                const deltaTime = (new Date()).getTime() - data.mouseDownTime;

                if (deltaTime < 250) {
                    mouseClick();
                }
                break;
        }
    });
    data.mapElement.onmouseleave = (e) => {
        mouseOut();
    }
}

function mouseClick() {
    previewTile(screenToMapCoords(data.mouseX, data.mouseY));
}

function previewTile() {
    let coords = arguments[0]
    if (arguments.length == 2) {
        coords = [arguments[0], arguments[1]];
    }

    data.descElement.style.display = "block";
    if (data.descElement.children.length > 0) {
        data.descElement.children[0].remove();
    }

    if (data.locations.hasOwnProperty(coords)) {
        const img = document.createElement("img");
        img.setAttribute("src", "img/" + data.locations[coords].img + "-desc.png");
        data.descElement.appendChild(img);
    }
}

function handleMouseDown(x, y) {
    data.mouseDown = true;
    data.mouseDownTime = (new Date()).getTime();

    data.mouseX = x;
    data.mouseY = y;
}

function handleMouseMove(x, y) {
    if (!data.mouseDown) return;

    data.tileOriginX += x - data.mouseX;
    data.tileOriginY += y - data.mouseY;

    data.mouseX = x;
    data.mouseY = y;

    drawCanvas();
}

function mouseOut() {
    data.mouseDown = false;
}

function scaleCanvas(factor, center) {
    let newWidth = data.tileWidth * factor;
    let newHeight = data.tileHeight * factor;
    const [cx, cy] = center;
    if (newWidth > 300) newWidth = 300;
    if (newHeight > 300) newHeight = 300;
    if (newWidth < 40) newWidth = 40
    if (newHeight < 40) newHeight = 40;
    // const deltaWidth = newWidth - data.tileWidth;
    // const deltaHeight = newWidth - data.tileWidth;

    if (data.tileWidth != newWidth) {
        const newFactorX = newWidth / data.tileWidth;
        data.tileWidth = newWidth;
        const otocx = cx - data.tileOriginX;
        data.tileOriginX = cx - otocx * newFactorX;
    }

    if (data.tileHeight != newHeight) {
        const newFactorY = newHeight / data.tileHeight;
        data.tileHeight = newHeight;
        const otocy = cy - data.tileOriginY;
        data.tileOriginY = cy - otocy * newFactorY;
    }
}

function resizeCanvas() {
    const newWidth = data.mapElement.width = window.innerWidth;
    const newHeight =  data.mapElement.height = window.innerHeight;
    if (typeof data.mapWidth !== 'undefined') {
        const deltaWidth = newWidth - data.mapWidth;
        const deltaHeight = newHeight - data.mapHeight;
        data.tileOriginX += deltaWidth / 2;
        data.tileOriginY += deltaHeight / 2;
    }
    data.mapWidth = newWidth;
    data.mapHeight = newHeight;
}

function drawCanvas() {
    data.c.fillStyle = "#333";
    data.c.fillRect(0, 0, data.mapWidth, data.mapHeight);

    for (const loc of Object.values(data.locations)) {
        data.c.drawImage(
            loc.element,
            data.tileOriginX + loc.x * data.tileWidth,
            data.tileOriginY - loc.y * data.tileHeight,
            data.tileWidth,
            data.tileHeight
        );
    }
}

function updateCoordsDisplay(x, y) {
    data.coordsElement.innerText = `(${x}, ${y})`;
}

function updateCoordsDisplayWithScreenCoords(sx, sy) {
    let [x, y] = screenToMapCoords(sx, sy);
    updateCoordsDisplay(x, y);
}

function updateCoordsDisplayCenter() {
    updateCoordsDisplayWithScreenCoords(data.mapWidth / 2, data.mapHeight / 2);
}

function screenToMapCoords(x, y) {
    return [
        Math.floor((x - data.tileOriginX) / data.tileWidth),
        Math.ceil((data.tileOriginY - y) / data.tileHeight)
    ];
}

function addLocations(locs) {
    for (const loc of locs) {
        data.locations[[loc.x, loc.y]] = loc;

        const tile = document.createElement("img");
        tile.setAttribute("src", "img/" + loc.img + ".png");
        tile.onload = (e) => {
            drawCanvas();
        }
        loc.element = tile;

        data.imgsElement.appendChild(tile);
    }
}
