window.onload = init;

const ANIMATION_SPEED = 10;
const GRID_WIDTH = 40;
const GRID_HEIGHT = 17;
const NUM_SQUARES = GRID_WIDTH * GRID_HEIGHT;
let gridContainer;
let gridSquares = [[]];
let pathSquares = [];
let controls;
let currentControlColor = "red";
let startSquare;
let endSquare;
let mouseDragging = false;

let isTimeout = false;

// Returns a Promise that resolves after "ms" Milliseconds
const timer = ms => new Promise(res => setTimeout(res, ms));

function init()
{
    gridContainer = document.getElementById("grid-container");
    controls = document.querySelectorAll(".control");
    controls.forEach((control) => control.addEventListener("click", controlClicked));
    document.body.addEventListener("mouseup", mouseUp);
    loadBoard();
}

function loadBoard()
{
    let yIndex = -1;
    for (let i = 0; i < NUM_SQUARES; i++)
    {
        if (i % GRID_WIDTH === 0)
        {
            yIndex++;
        }

        let gridSquare = document.createElement("div");
        gridSquare.classList.add("grid-square");
        gridSquare.addEventListener("click", squareClicked);
        gridSquare.addEventListener("mousedown", mouseDownSquare);
        gridSquare.addEventListener("mouseover", mouseOverSquare);
        gridSquare.addEventListener("mouseout", mouseOutSquare);
        if (gridSquares[i - GRID_WIDTH * yIndex] === undefined)
        {
            gridSquares[i - GRID_WIDTH * yIndex] = [];
        }
        gridSquares[i - GRID_WIDTH * yIndex][GRID_HEIGHT - 1 - yIndex] = gridSquare;
        gridContainer.appendChild(gridSquare);
    }
    console.log(gridSquares);
}

function controlClicked(event)
{
    let control = event.currentTarget;
    controls.forEach(currentControl => {
        if (currentControl === control)
        {
            switch (control.id)
            {
                case "block-button" :
                    currentControlColor = "red";
                    break;
                case "start-button" :
                    currentControlColor = "yellow";
                    break;
                case "end-button" :
                    currentControlColor = "green";
                    break;
            }
            currentControl.classList.add("selected");
        }
        else
        {
            currentControl.classList.remove("selected");
        }
    });
}

function squareClicked(event)
{
    if (isTimeout)
        return;

    if (pathSquares !== undefined)
    {
        pathSquares.forEach(square => square.classList.remove("path-square"));
        pathSquares = undefined;
    }

    let square = event.currentTarget;

    switch (currentControlColor)
    {
        case "red" :
            switchSquareState(square, "red");
            break;
        case "yellow" :
            switchSquareState(square, "yellow");
            break;
        case "green" :
            switchSquareState(square, "green");
            break;
    }

    if (startSquare !== undefined && endSquare !== undefined)
    {
        breadthFirstSearch();
    }
}

function switchSquareState(square, state)
{
    if (square.classList.contains("blocked-square"))
    {
        square.classList.remove("blocked-square");
    }
    else if (state === "red")
    {
        square.classList.add("blocked-square");
    }

    if (square.classList.contains("start-square"))
    {
        square.classList.remove("start-square");
        startSquare = undefined;
    }
    else if (state === "yellow")
    {
        if (startSquare !== undefined)
        {
            startSquare.classList.remove("start-square");
        }

        square.classList.add("start-square");
        startSquare = square;
    }

    if (square.classList.contains("end-square"))
    {
        square.classList.remove("end-square");
        endSquare = undefined;
    }
    else if (state === "green")
    {
        if (endSquare !== undefined)
        {
            endSquare.classList.remove("end-square");
        }

        square.classList.add("end-square");
        endSquare = square;
    }
}

function mouseDownSquare(event)
{
    event.preventDefault();
    if (isTimeout)
        return;
    mouseDragging = true;
}

function mouseUp()
{
    mouseDragging = false;
}


function mouseOutSquare(event)
{
    if (isTimeout)
        return;
    let square = event.currentTarget;
    square.style.backgroundColor = "";
}

function mouseOverSquare(event)
{
    if (isTimeout)
        return;
    let square = event.currentTarget;
    if (!square.classList.contains("blocked-square") && !square.classList.contains("start-square") && !square.classList.contains("end-square"))
    {
        square.style.backgroundColor = currentControlColor;
    }

    if (mouseDragging)
    {
        squareClicked(event);
    }
}

async function breadthFirstSearch()
{
    let startPos;
    let currentPos;
    let endPos;

    for (let x = 0; x < GRID_WIDTH; x++)
    {
        for (let y = 0; y < GRID_HEIGHT; y++)
        {
            if (gridSquares[x][y] === startSquare)
            {
                startPos = { x, y };
                currentPos = startPos;
            }
            if (gridSquares[x][y] === endSquare)
            {
                endPos = { x, y };
            }
            if (startPos !== undefined && endPos !== undefined)
            {
                break;
            }
        }
    }

    if (startPos === undefined || endPos === undefined)
    {
        alert("Can't find start position or end position!");
    }
    else
    {
        isTimeout = true;
        let solved = false;
        let frontier = [startPos];
        let cameFrom = new Map();
        cameFrom.set(startPos, undefined);
        let startIndex = 0;
        while (!solved)
        {
            let length = frontier.length;
            let newNeighborsCount = 0;
            for (let i = startIndex; i < length; i++)
            {
                if (solved)
                {
                    break;
                }

                let neighbors = getNeighborSquares(frontier[i]);
                (await neighbors).forEach(neighbor => {
                    if (solved)
                    {
                      return;
                    }

                    if (neighbor.x === endPos.x && neighbor.y === endPos.y)
                    {
                        cameFrom.set(endPos, frontier[i]);
                        frontier.push(neighbor);
                        newNeighborsCount++;
                        solved = true;
                    }
                    if (!frontier.some(pos => pos.x === neighbor.x && pos.y ===  neighbor.y))
                    {
                        newNeighborsCount++;
                        cameFrom.set(neighbor, frontier[i]);
                        frontier.push(neighbor);
                    }
                });
            }

            if (newNeighborsCount === 0)
            {
                alert("Impossible to find path.");
                break;
            }

            for (let i = startIndex; i < frontier.length; i++)
            {
                if (i > 0 && !solved)
                {
                    gridSquares[frontier[i].x][frontier[i].y].style.backgroundColor = "pink";
                }
                if (solved && i > 0 && i !== frontier.length - 1)
                {
                    gridSquares[frontier[i].x][frontier[i].y].backgroundColor = "pink";
                }
            }
            await timer(ANIMATION_SPEED);
            startIndex = length;

            if (solved)
            {
                pathSquares = [];
                let currentPos = endPos;
                while (currentPos.x !== startPos.x || currentPos.y !== startPos.y)
                {
                    pathSquares.push(gridSquares[currentPos.x][currentPos.y]);
                    currentPos = cameFrom.get(currentPos);
                }
                pathSquares.push(gridSquares[currentPos.x][currentPos.y]);

                for (let i = 1; i < pathSquares.length - 1; i++)
                {
                    pathSquares[pathSquares.length - 1 - i].style.backgroundColor = "";
                    pathSquares[pathSquares.length - 1 - i].classList.add("path-square");
                    await timer(50);
                }

                gridSquares.forEach(row => row.forEach(square => square.style.backgroundColor = ""));
            }
        }
        if (!solved)
        {
            gridSquares.forEach(row => row.forEach(square => square.style.backgroundColor = ""));
        }
        isTimeout = false;
    }
}

async function getNeighborSquares(position)
{
    let neighborSquares = [];
    if (position.x < GRID_WIDTH - 1)
    {
        if (!gridSquares[position.x + 1][position.y].classList.contains("blocked-square"))
        {
            neighborSquares.push({ x : position.x + 1, y : position.y });
        }
    }
    if (position.y < GRID_HEIGHT - 1)
    {
        if (!gridSquares[position.x][position.y + 1].classList.contains("blocked-square"))
        {
            neighborSquares.push({ x : position.x, y : position.y + 1 });
        }
    }
    if (position.x > 0)
    {
        if (!gridSquares[position.x - 1][position.y].classList.contains("blocked-square"))
        {
            neighborSquares.push({ x : position.x - 1, y : position.y });
        }
    }
    if (position.y > 0)
    {
        if (!gridSquares[position.x][position.y - 1].classList.contains("blocked-square"))
        {
            neighborSquares.push({ x : position.x, y : position.y - 1 });
        }
    }

    return neighborSquares;
}


async function shitPathfinding()
{
    gridSquares.forEach(row => row.forEach(square => square.classList.remove("path-square")));
    let startPos;
    let currentPos;
    let endPos;

    for (let x = 0; x < GRID_WIDTH; x++)
    {
        for (let y = 0; y < GRID_HEIGHT; y++)
        {
            if (gridSquares[x][y] === startSquare)
            {
                startPos = { x, y };
                currentPos = startPos;
            }
            if (gridSquares[x][y] === endSquare)
            {
                endPos = { x, y };
            }
            if (startPos !== undefined && endPos !== undefined)
            {
                break;
            }
        }
    }

    if (startPos === undefined || endPos === undefined)
    {
        alert("Error");
    }
    else
    {
        let solved = false;
        isTimeout = true;
        while (!solved) {
            let distanceSqr = Math.pow(endPos.x - currentPos.x, 2) + Math.pow(endPos.y - currentPos.y, 2);
            if (distanceSqr === 2 || distanceSqr === 1) {
                solved = true;
                break;
            }

            let bestDistance = 100000;
            let testPos;
            let testDistanceSqr;
            let newPos;

            if (currentPos.x > 0) {
                // X - 1, Y
                testPos = {x: currentPos.x - 1, y: currentPos.y};
                if (!gridSquares[testPos.x][testPos.y].classList.contains("blocked-square") && !gridSquares[testPos.x][testPos.y].classList.contains("path-square")) {
                    testDistanceSqr = Math.pow(endPos.x - testPos.x, 2) + Math.pow(endPos.y - testPos.y, 2);
                    if (testDistanceSqr < bestDistance) {
                        bestDistance = testDistanceSqr;
                        newPos = testPos;
                    }
                }
            }
            if (currentPos.x < GRID_WIDTH - 1) {
                // X + 1, Y
                testPos = {x: currentPos.x + 1, y: currentPos.y};
                if (!gridSquares[testPos.x][testPos.y].classList.contains("blocked-square") && !gridSquares[testPos.x][testPos.y].classList.contains("path-square")) {
                    testDistanceSqr = Math.pow(endPos.x - testPos.x, 2) + Math.pow(endPos.y - testPos.y, 2);
                    if (testDistanceSqr < bestDistance) {
                        bestDistance = testDistanceSqr;
                        newPos = testPos;
                    }
                }
            }
            if (currentPos.y > 0) {
                // X, Y - 1
                testPos = {x: currentPos.x, y: currentPos.y - 1};
                if (!gridSquares[testPos.x][testPos.y].classList.contains("blocked-square") && !gridSquares[testPos.x][testPos.y].classList.contains("path-square")) {
                    testDistanceSqr = Math.pow(endPos.x - testPos.x, 2) + Math.pow(endPos.y - testPos.y, 2);
                    if (testDistanceSqr < bestDistance) {
                        bestDistance = testDistanceSqr;
                        newPos = testPos;
                    }
                }
            }
            if (currentPos.y < GRID_HEIGHT - 1) {
                // X, Y + 1
                testPos = {x: currentPos.x, y: currentPos.y + 1};
                if (!gridSquares[testPos.x][testPos.y].classList.contains("blocked-square") && !gridSquares[testPos.x][testPos.y].classList.contains("path-square")) {
                    testDistanceSqr = Math.pow(endPos.x - testPos.x, 2) + Math.pow(endPos.y - testPos.y, 2);
                    if (testDistanceSqr < bestDistance) {
                        bestDistance = testDistanceSqr;
                        newPos = testPos;
                    }
                }
            }

            if (currentPos.x < GRID_WIDTH - 1 && currentPos.y < GRID_HEIGHT - 1) {
                // X + 1, Y + 1
                testPos = {x: currentPos.x + 1, y: currentPos.y + 1};
                if (!gridSquares[testPos.x][testPos.y].classList.contains("blocked-square") && !gridSquares[testPos.x][testPos.y].classList.contains("path-square")) {
                    testDistanceSqr = Math.pow(endPos.x - testPos.x, 2) + Math.pow(endPos.y - testPos.y, 2);
                    if (testDistanceSqr < bestDistance) {
                        bestDistance = testDistanceSqr;
                        newPos = testPos;
                    }
                }
            }
            if (currentPos.x > 0 && currentPos.y < GRID_HEIGHT - 1) {
                // X - 1, Y + 1
                testPos = {x: currentPos.x - 1, y: currentPos.y + 1};
                if (!gridSquares[testPos.x][testPos.y].classList.contains("blocked-square") && !gridSquares[testPos.x][testPos.y].classList.contains("path-square")) {
                    testDistanceSqr = Math.pow(endPos.x - testPos.x, 2) + Math.pow(endPos.y - testPos.y, 2);
                    if (testDistanceSqr < bestDistance) {
                        bestDistance = testDistanceSqr;
                        newPos = testPos;
                    }
                }
            }
            if (currentPos.x < GRID_WIDTH - 1 && currentPos.y > 0) {
                // X + 1, Y - 1
                testPos = {x: currentPos.x + 1, y: currentPos.y - 1};
                if (!gridSquares[testPos.x][testPos.y].classList.contains("blocked-square") && !gridSquares[testPos.x][testPos.y].classList.contains("path-square")) {
                    testDistanceSqr = Math.pow(endPos.x - testPos.x, 2) + Math.pow(endPos.y - testPos.y, 2);
                    if (testDistanceSqr < bestDistance) {
                        bestDistance = testDistanceSqr;
                        newPos = testPos;
                    }
                }
            }
            if (currentPos.x > 0 && currentPos.y > 0) {
                // X - 1, Y - 1
                testPos = {x: currentPos.x - 1, y: currentPos.y - 1};
                if (!gridSquares[testPos.x][testPos.y].classList.contains("blocked-square") && !gridSquares[testPos.x][testPos.y].classList.contains("path-square")) {
                    testDistanceSqr = Math.pow(endPos.x - testPos.x, 2) + Math.pow(endPos.y - testPos.y, 2);
                    if (testDistanceSqr < bestDistance) {
                        bestDistance = testDistanceSqr;
                        newPos = testPos;
                    }
                }
            }

            if (newPos !== undefined) {
                console.log(newPos);
                console.log(currentPos);
                currentPos = newPos;
                gridSquares[currentPos.x][currentPos.y].classList.add("path-square");
                await timer(ANIMATION_SPEED);
            } else {
                alert("Unsolvable");
                break;
            }
        }
        isTimeout = false;
    }
}


