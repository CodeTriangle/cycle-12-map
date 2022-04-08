const data = {}

window.onload = (event) => {
    data.mapElement = document.getElementById("map");
    data.descElement = document.getElementById("description");
    data.imgsElement = document.getElementById("images");
    data.locations = {};

    addLocations(locations);

    resizeCanvas();

    data.tileWidth = 120;
    data.tileHeight = 120;

    data.tileOriginX = data.mapWidth / 2 - data.tileWidth / 2;
    data.tileOriginY = data.mapHeight / 2 - data.tileWidth / 2;

    data.c = data.mapElement.getContext("2d");

    window.onresize = (e) => {
        resizeCanvas();
        drawCanvas();
    }

    document.body.onwheel = (e) => {
        const factor = e.deltaY < 0 ? 1.1 : 0.9;
        scaleCanvas(factor);
        drawCanvas();
    }

    data.mapElement.onmousedown = (e) => {
        data.mouseDown = true;
        data.mouseDownTime = (new Date()).getTime();

        data.mouseX = e.clientX;
        data.mouseY = e.clientY;
    }

    data.mapElement.onmousemove = (e) => {
        if (!data.mouseDown) return;

        data.tileOriginX += e.clientX - data.mouseX;
        data.tileOriginY += e.clientY - data.mouseY;

        data.mouseX = e.clientX;
        data.mouseY = e.clientY;
        drawCanvas();
    }

    data.mapElement.onmouseup = (e) => {
        mouseOut();
        const deltaTime = (new Date()).getTime() - data.mouseDownTime;

        if (deltaTime < 250) {
            mouseClick();
        }
    }

    data.mapElement.onmouseleave = (e) => {
        mouseOut();
    }
}

function mouseClick() {
    data.descElement.style.display = "block";
    if (data.descElement.children.length > 0) {
        data.descElement.children[0].remove();
    }
    const img = document.createElement("img");
    const coords = screenToMapCoords(data.mouseX, data.mouseY);
    img.setAttribute("src", "img/" + data.locations[coords].img + "-desc.png");

    data.descElement.appendChild(img);
}

function mouseOut() {
    data.mouseDown = false;
}

function scaleCanvas(factor) {
    let newWidth = data.tileWidth * factor;
    let newHeight = data.tileHeight * factor;
    if (newWidth > 300) newWidth = 300;
    if (newHeight > 300) newHeight = 300;
    if (newWidth < 40) newWidth = 40
    if (newHeight < 40) newHeight = 40;
    const deltaWidth = newWidth - data.tileWidth;
    const deltaHeight = newWidth - data.tileWidth;
    data.tileWidth = newWidth;
    data.tileHeight = newHeight;
    data.tileOriginX -= deltaWidth / 2;
    data.tileOriginY -= deltaHeight / 2;
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
            data.tileOriginX - loc.x * data.tileWidth,
            data.tileOriginY + loc.y * data.tileHeight,
            data.tileWidth,
            data.tileHeight
        );
    }
}

function screenToMapCoords(x, y) {
    return [
        Math.ceil((data.tileOriginX - x) / data.tileWidth),
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
