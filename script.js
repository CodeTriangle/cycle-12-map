const data = {}

window.onload = (event) => {
    data.mapElement = document.getElementById("map");
    data.descElement = document.getElementById("description");
    data.imgsElement = document.getElementById("images");

    data.tile = document.createElement("img");
    data.tile.setAttribute("src", "img.png");
    data.tile.onload = (e) => {
        drawCanvas();
    }
    data.imgsElement.appendChild(data.tile);

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

    data.mapElement.onmouseup = mouseOut;
    data.mapElement.onmouseleave = mouseOut;
}

function mouseOut() {
    data.mouseDown = false;
    const deltaTime = (new Date()).getTime() - data.mouseDownTime;

    if (deltaTime < 250) {
        console.log(screenToMapCoords(data.mouseX, data.mouseY));
    }
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
    data.tileWidth = newWidth
    data.tileHeight = newHeight
    data.tileOriginX -= deltaWidth / 2
    data.tileOriginY -= deltaHeight / 2
}

function resizeCanvas() {
    const newWidth = data.mapElement.width = window.innerWidth;
    const newHeight =  data.mapElement.height = window.innerHeight;
    if (typeof data.mapWidth !== 'undefined') {
        const deltaWidth = newWidth - data.mapWidth;
        const deltaHeight = newHeight - data.mapHeight;
        data.tileOriginX += deltaWidth / 2
        data.tileOriginY += deltaHeight / 2
    }
    data.mapWidth = newWidth;
    data.mapHeight = newHeight;
}

function drawCanvas() {
    data.c.fillStyle = "#333";
    data.c.fillRect(0, 0, data.mapWidth, data.mapHeight);

    data.c.drawImage(data.tile, data.tileOriginX, data.tileOriginY, data.tileWidth, data.tileHeight);
}

function screenToMapCoords(x, y) {
    return [
        Math.ceil((data.tileOriginX - x) / data.tileWidth),
        Math.ceil((data.tileOriginY - y) / data.tileHeight)
    ];
}
