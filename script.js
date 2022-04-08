// this is a data structure to use to store lots of global values.
// unconventional? maybe but i like this solution a lot better than 1000000
// global variables.
const data = {}

// some constants
const TILE_SIZE = 120;
const MAX_TILE_SIZE = 360;
const MIN_TILE_SIZE = 40;
const ZOOM_IN_FACTOR = 1.1;
const ZOOM_OUT_FACTOR = 0.9;
const SHORT_CLICK_TIME = 250;

// start rendering only after the page is all loaded
window.onload = (event) => {
    // DOM elements for important parts of the page
    data.mapElement = document.getElementById("map");
    data.descElement = document.getElementById("description");
    data.imgsElement = document.getElementById("images");
    data.coordsElement = document.getElementById("coords");
    data.c = data.mapElement.getContext("2d");

    // this stores lots of data about different tiles
    // see locations.js for the structure of location objects
    data.locations = {};

    data.previousHoverCoords = [null, null];

    // this comes from locations.js
    addLocations(locations);

    // there's no way to tell a canvas to take up the whole screen
    resizeCanvas();

    // the default width and height of the tiles
    data.tileWidth = TILE_SIZE;
    data.tileHeight = TILE_SIZE;

    // where is 0, 0?
    // specifically, where is the corner of that tile?
    data.tileOriginX = data.mapWidth / 2 - data.tileWidth / 2;
    data.tileOriginY = data.mapHeight / 2 - data.tileWidth / 2;

    // update the coordinate display to the center of the screen
    updateCoordsDisplayCenter();

    // on resize we tell the canvas we resized
    window.onresize = (e) => {
        resizeCanvas();
        drawCanvas();
        drawHover(data.mouseX, data.mouseY, true);
    }

    // on scroll wheel we zoom in.
    document.body.onwheel = (e) => {
        const factor = e.deltaY < 0 ? ZOOM_IN_FACTOR : ZOOM_OUT_FACTOR;
        scaleCanvas(factor, [e.clientX, e.clientY]);
        drawCanvas();
        drawHover(e.clientX, e.clientY, true);
    }

    // here begin a whole bunch of mouse functions.
    // i'll comment on the unique parts.
    // otherwise just look at the individual handler functions.
    // -------------------

    data.mapElement.onmousedown = (e) => {
        handleMouseDown(e.clientX, e.clientY);
    }

    // so the touch functions perform several different purposes
    // if it's one touch it's a move
    // if it's two touches it's a scroll
    data.mapElement.addEventListener("touchstart", (e) => {
        e.preventDefault();

        switch (e.touches.length) {
            case 1:
                handleMouseDown(e.touches.item(0).clientX, e.touches.item(0).clientY);
                drawHover(e.touches.item(0).clientX, e.touches.item(0).clientY)
                break;
            case 2:
                mouseOut();
                const first = data.firstTouch = e.touches.item(0);
                const second = data.firstTouch = e.touches.item(1);
                // pinchDist stores the distance between the fingers
                // we can use this to calculate the scale factor
                data.pinchDist = Math.sqrt(
                    (second.clientX - first.clientX) ** 2 + (second.clientY - first.clientY) ** 2
                );
                break;
        }
    });

    data.mapElement.onmousemove = (e) => {
        // each time we move the mouse we need to change the displayed coordinates
        updateCoordsDisplayWithScreenCoords(e.clientX, e.clientY);
        drawHover(e.clientX, e.clientY);
        handleMouseMove(e.clientX, e.clientY);
    }

    // see above; this can mean either touch or scroll
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

                // average the x and y values to get the center point
                const cx = (first.clientX + second.clientX) / 2;
                const cy = (first.clientY + second.clientY) / 2;

                // and here is where we calculate the scale factor.
                // it's just the ratio between the two.
                scaleCanvas(newPinchDist / data.pinchDist, [cx, cy]);
                drawCanvas();
                drawHover(first.clientX, first.clientY, true);

                // i don't actually use these variables, lol
                // they might be useful in the future though
                data.firstTouch = first;
                data.secondTouch = second;
                data.pinchDist = newPinchDist;

                break;
        }
    });

    data.mapElement.onmouseup = (e) => {
        mouseOut();

        // this is how i handle "clicks"
        // if it was a short tap (<250 ms) then handle a click
        const deltaTime = (new Date()).getTime() - data.mouseDownTime;
        if (deltaTime < SHORT_CLICK_TIME) {
            mouseClick();
        }
    }

    data.mapElement.addEventListener("touchend", (e) => {
        e.preventDefault();

        if (e.touches.length == 0) {
            mouseOut();
            const deltaTime = (new Date()).getTime() - data.mouseDownTime;

            if (deltaTime < 250) {
                mouseClick();
            }
        }
    });

    data.mapElement.onmouseleave = (e) => {
        mouseOut();
    }
}

// highlight the tile where (data.mouseX, data.mouseY) is
function mouseClick() {
    previewTile(screenToMapCoords(data.mouseX, data.mouseY));
}

// show the preview
function previewTile() {
    let coords = arguments[0]
    if (arguments.length == 2) {
        coords = [arguments[0], arguments[1]];
    }

    // make it appear if it's hidden (it is by default)
    data.descElement.style.display = "block";
    if (data.descElement.children.length > 0) {
        data.descElement.children[0].remove();
    }

    if (data.locations.hasOwnProperty(coords)) {
        // everyone loves vanilla js dom modification
        const img = document.createElement("img");
        img.setAttribute("src", "img/" + data.locations[coords].img + "-desc.png");
        data.descElement.appendChild(img);
    }
}

// see function name. sets some data values.
function handleMouseDown(x, y) {
    data.mouseDown = true;
    data.mouseDownTime = (new Date()).getTime();

    data.mouseX = x;
    data.mouseY = y;
}

// the function to handle moving around the map.
// basically just shifts the origin and sets some data values
function handleMouseMove(x, y) {
    if (!data.mouseDown) return;

    data.tileOriginX += x - data.mouseX;
    data.tileOriginY += y - data.mouseY;

    data.mouseX = x;
    data.mouseY = y;

    drawCanvas();
    drawHover(data.mouseX, data.mouseY, true);
}

// when the mouse leaves the screen or stops being held.
function mouseOut() {
    data.mouseDown = false;
}

// okay lol this one's funky
// scale the canvas.
// easier said than done.
function scaleCanvas(factor, center) {
    // first we need to calculate what the new tile widths will be.
    let newWidth = data.tileWidth * factor;
    let newHeight = data.tileHeight * factor;

    // get these as variables
    // my code has a weird mix of passing in x and y separately vs as a list
    // i should do something about that
    const [cx, cy] = center;

    // if the new width would exceed the max tile size, don't
    if (newWidth > MAX_TILE_SIZE) newWidth = MAX_TILE_SIZE;
    if (newHeight > MAX_TILE_SIZE) newHeight = MAX_TILE_SIZE;
    if (newWidth < MIN_TILE_SIZE) newWidth = MIN_TILE_SIZE
    if (newHeight < MIN_TILE_SIZE) newHeight = MIN_TILE_SIZE;

    if (data.tileWidth != newWidth) {
        // if we actually didn't zoom by `factor` because of hitting the max or
        // min size, we need a new factor.
        // without this, the ends of zooms get jumpy.
        const newFactorX = newWidth / data.tileWidth;

        data.tileWidth = newWidth;

        // Origin TO CX
        // basically the x distance between origin and cx.
        const otocx = cx - data.tileOriginX;

        // so this line is really interesting.
        // the idea is that we want to scale the _distance_ between cx and the
        // origin by the factor.
        // it took a lot of tries to get this right, so just trust me.
        data.tileOriginX = cx - otocx * newFactorX;
    }

    // see comments on the above if-statement for explanations
    if (data.tileHeight != newHeight) {
        const newFactorY = newHeight / data.tileHeight;
        data.tileHeight = newHeight;
        const otocy = cy - data.tileOriginY;
        data.tileOriginY = cy - otocy * newFactorY;
    }
}

// resize the canvas to the screen size
function resizeCanvas() {
    // you have to set the `width` and `height` html attributes to resize a canvas.
    const newWidth = data.mapElement.width = window.innerWidth;
    const newHeight = data.mapElement.height = window.innerHeight;

    // fires only if the map been drawn before
    if (typeof data.mapWidth !== 'undefined') {
        const deltaWidth = newWidth - data.mapWidth;
        const deltaHeight = newHeight - data.mapHeight;
        data.tileOriginX += deltaWidth / 2;
        data.tileOriginY += deltaHeight / 2;
    }

    data.mapWidth = newWidth;
    data.mapHeight = newHeight;
}

// draw on the canvas
function drawCanvas() {
    // fill background
    data.c.fillStyle = "#333";
    data.c.fillRect(0, 0, data.mapWidth, data.mapHeight);

    // for each location, draw it at the right place
    // notably, y had to be inverted because canvas' y counts from the top
    // corner and i wanted normal quandrants.
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

// update coordinate display in the top left corner
// Draws a border around the active image
function drawHover(x, y, hold = false) {
    let loc = screenToMapCoords(x, y)
    let prev = data.previousHoverCoords

    if (hold)
        loc = prev;

    // Square should remain stationary (held) in certain circumstances
    if (hold || !(prev[0] == loc[0] && prev[1] == loc[1])) {
        drawCanvas();
        data.c.beginPath();
        data.c.lineWidth = "3";
        data.c.rect(
            data.tileOriginX + loc[0] * data.tileWidth,
            data.tileOriginY - loc[1] * data.tileHeight,
            data.tileWidth,
            data.tileHeight
        );
        data.c.stroke()
        data.previousHoverCoords = loc
    }
}

function updateCoordsDisplay(x, y) {
    data.coordsElement.innerText = `(${x}, ${y})`;
}

// use screen coordinates to update the coord display
function updateCoordsDisplayWithScreenCoords(sx, sy) {
    let [x, y] = screenToMapCoords(sx, sy);
    updateCoordsDisplay(x, y);
}

// update the coords display to the center of the screen
function updateCoordsDisplayCenter() {
    updateCoordsDisplayWithScreenCoords(data.mapWidth / 2, data.mapHeight / 2);
}

// translate screen coordinates (in pixels) to the tile at that location.
// notice y has been inverted again.
function screenToMapCoords(x, y) {
    return [
        Math.floor((x - data.tileOriginX) / data.tileWidth),
        Math.ceil((data.tileOriginY - y) / data.tileHeight)
    ];
}

// add all the locations in the list
// right now it just turns it into an association instead of a list for better
// indexing and adds one generated property. more properties may be generated
// in the future.
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
