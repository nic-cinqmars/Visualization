window.onload = init;

const NUM_SQUARES = 300;
let gridContainer;

function init()
{
    gridContainer = document.getElementById("grid-container");
    loadBoard();
}

function loadBoard()
{
    for (let i = 0; i < NUM_SQUARES; i++)
    {
        let gridSquare = document.createElement("div");
        gridSquare.classList.add("grid-square");
        gridContainer.appendChild(gridSquare);
    }
}
