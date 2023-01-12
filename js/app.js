window.onload = init;

const ANIMATION_SPEED = 20;
const GRID_WIDTH = 40;
const GRID_HEIGHT = 17;
const NUM_SQUARES = GRID_WIDTH * GRID_HEIGHT;
let gridContainer;
let gridSquares = [[]];
let controls;
let currentControlColor = "red";
let startSquare;
let endSquare;

let isTimeout = false;

// Returns a Promise that resolves after "ms" Milliseconds
const timer = ms => new Promise(res => setTimeout(res, ms));

function init()
{
    gridContainer = document.getElementById("grid-container");
    controls = document.querySelectorAll(".control");
    controls.forEach((control) => control.addEventListener("click", controlClicked))
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
    let square = event.currentTarget;
    switch (currentControlColor)
    {
        case "red" :
            if (square.classList.contains("blocked-square"))
            {
                square.classList.remove("blocked-square");
                mouseOutSquare(event);
            }
            else
            {
                square.classList.add("blocked-square");
            }
            break;
        case "yellow" :
            square.classList.add("start-square");
            if (startSquare !== undefined)
            {
                startSquare.classList.remove("start-square");
            }
            startSquare = square;
            break;
        case "green" :
            square.classList.add("end-square");
            if (endSquare !== undefined)
            {
                endSquare.classList.remove("end-square");
            }
            endSquare = square;
            break;
    }

    if (startSquare !== undefined && endSquare !== undefined)
    {
        breadthFirstSearch();
    }
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
}

async function breadthFirstSearch()
{
    gridSquares.forEach(row => {
        row.forEach(square => {
            square.classList.remove("path-square");
            square.style.backgroundColor = "";
        });
    });
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
        let solved = false;
        let frontier = [startPos];
        let cameFrom = [];
        let index = 0;
        while (!solved)
        {
            let length = frontier.length;
            for (let i = 0; i < length; i++)
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
                        cameFrom.push(frontier[i]);
                        frontier.push(neighbor);
                        solved = true;
                        console.log(cameFrom);
                        console.log(frontier);
                    }
                    if (!frontier.some(pos => pos.x === neighbor.x && pos.y ===  neighbor.y))
                    {
                        cameFrom.push(frontier[i]);
                        frontier.push(neighbor);
                    }
                });
            }
            for (let i = 0; i < frontier.length; i++)
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
            await timer(200);

            if (solved)
            {
                let path = [];
                let index = cameFrom.length - 1;
                while (index !== 0)
                {
                    let lastPos = cameFrom[index];
                    path.push(lastPos);
                    let foundIndex = frontier.findIndex(pos => pos.x === lastPos.x && pos.y === lastPos.y);
                    if (foundIndex !== -1)
                    {
                        index = foundIndex;
                    }
                }

                for (let i = 0; i < path.length; i++)
                {
                    let pos = path[path.length - 1 - i];
                    gridSquares[pos.x][pos.y].style.backgroundColor = "";
                    gridSquares[pos.x][pos.y].classList.add("path-square");
                    await timer(ANIMATION_SPEED);
                }

                gridSquares.forEach(row => row.forEach(square => square.style.backgroundColor = ""));
            }
        }
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


