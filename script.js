document.addEventListener("DOMContentLoaded", function () {
    const grid = document.getElementById("grid");
    const modal = document.getElementById("myModal");
    const colorSelect = document.getElementById("colorSelect");
    const confirmBtn = document.getElementById("confirmBtn");
    const harvest = document.getElementById("Harvest");
    const whiteCounter = document.getElementById("whiteCounter");
    const redCounter = document.getElementById("redCounter");
    const pinkCounter = document.getElementById("pinkCounter");
    const whiteStockElement = document.getElementById("whiteStock");
    const redStockElement = document.getElementById("redStock");
    const pinkStockElement = document.getElementById("pinkStock");
    const resizeButton = document.getElementById("resizeButton");
    const argentElement = document.getElementById("argent");
    const buySeed = document.getElementById("buySeed");

    let selectedSquare = null;
    let whiteTulipStock = 0;
    let redRoseStock = 0;
    let pinkRoseStock = 0;
    let whiteSeedStock = 10;
    let redSeedStock = 10;
    let pinkSeedStock = 10;
    let argent = 100;

    for (let i = 0; i < 100; i++) {
        const square = document.createElement("div");
        square.className = "grid-item";
        grid.appendChild(square);

        square.addEventListener("click", function () {
            selectedSquare = square;
            modal.style.display = "flex";
        });
    }

    confirmBtn.addEventListener("click", function () {
        const selectedImage = colorSelect.value;
        modal.style.display = "none";

        if (selectedImage.includes("White_Tulip.jpg") && whiteSeedStock > 0) {
            whiteSeedStock--;
            selectedSquare.innerHTML = `<img src="${selectedImage}" alt="Selected Image">`;
        } 
        else if (selectedImage.includes("Red_Rose.jpg") && redSeedStock > 0) {
            redSeedStock--;
            selectedSquare.innerHTML = `<img src="${selectedImage}" alt="Selected Image">`;
        } 
        else if (selectedImage.includes("Pink_Rose.jpg") && pinkSeedStock > 0) {
            pinkSeedStock--;
            selectedSquare.innerHTML = `<img src="${selectedImage}" alt="Selected Image">`;
        }
        updateSeedCounters();
        updateBuySeedModalDisplay()
    });

    function updateSeedCounters() {
        whiteStockElement.innerHTML = `<img src="White_Tulip.jpg" alt="Image 1"> White seed : ${whiteSeedStock}`;
        redStockElement.innerHTML = `<img src="Red_Rose.jpg" alt="Image 2"> Red seed : ${redSeedStock}`;
        pinkStockElement.innerHTML = `<img src="Pink_Rose.jpg" alt="Image 3"> Pink seed : ${pinkSeedStock}`;
    }

    harvest.addEventListener("click", function(){
        comptageFleurs();
        resetImages();
    });

    function resetImages() {
        const squares = document.querySelectorAll(".grid-item");
        squares.forEach((square) => {
            const image = square.querySelector("img");
            if (image) {
                square.removeChild(image);
            }
        });
    }

    function comptageFleurs() {
        const squares = document.querySelectorAll(".grid-item");
        squares.forEach((square) => {
            const imageSrc = square.querySelector("img");

            if (imageSrc && imageSrc.src.includes("White_Tulip.jpg")) {
                whiteTulipStock++;
            } else if (imageSrc && imageSrc.src.includes("Red_Rose.jpg")) {
                redRoseStock++;
            } else if (imageSrc && imageSrc.src.includes("Pink_Rose.jpg")) {
                pinkRoseStock++;
            }

            whiteCounter.innerHTML = `<img src="White_Tulip.jpg" alt="Image 1"> White Tulip : ${whiteTulipStock}   `;
            redCounter.innerHTML = `<img src="Red_Rose.jpg" alt="Image 2"> Red Rose : ${redRoseStock}`;
            pinkCounter.innerHTML = `<img src="Pink_Rose.jpg" alt="Image 3"> Pink Rose : ${pinkRoseStock}`;
        });
    }

    function resizeGrid() {
        // Add a new row
        const newRow = document.createElement("div");
        newRow.className = "grid-row";
        grid.appendChild(newRow);

        // Add new squares to the new row (one for each column)
        for (let i = 0; i < 1; i++) {
            const square = document.createElement("div");
            square.className = "grid-item";
            newRow.appendChild(square);

            square.addEventListener("click", function () {
                selectedSquare = square;
                modal.style.display = "flex";
            });
        }
    }

    resizeButton.addEventListener("click", function () {
        if (argent >= 100) {
            resizeGrid();
            argent -= 100;
            updateArgent();
        } else {
            alert("Pas assez d'argent pour agrandir la grille !");
        }
    });

    function updateArgent() {
        argentElement.innerHTML = `Money ${argent} €`;
    }

    buySeed.addEventListener("click", function() {
        openBuySeedModal();
    });

    function openBuySeedModal() {
        const buySeedModal = document.getElementById("buySeedModal");
        const whiteStockDisplay = document.getElementById("whiteStockDisplay");
        const redStockDisplay = document.getElementById("redStockDisplay");
        const pinkStockDisplay = document.getElementById("pinkStockDisplay");
        const buyWhiteSeedBtn = document.getElementById("buyWhiteSeedBtn");
        const buyRedSeedBtn = document.getElementById("buyRedSeedBtn");
        const buyPinkSeedBtn = document.getElementById("buyPinkSeedBtn");
        const closeBuySeedModalBtn = document.getElementById("closeBuySeedModalBtn");

        whiteStockDisplay.textContent = `White Seed Stock: ${whiteSeedStock}`;
        redStockDisplay.textContent = `Red Seed Stock: ${redSeedStock}`;
        pinkStockDisplay.textContent = `Pink Seed Stock: ${pinkSeedStock}`;

        buyWhiteSeedBtn.addEventListener("click", buyWhiteSeed);
        buyRedSeedBtn.addEventListener("click", buyRedSeed);
        buyPinkSeedBtn.addEventListener("click", buyPinkSeed);

        closeBuySeedModalBtn.addEventListener("click", closeBuySeedModal);

        buySeedModal.style.display = "block";
    }

    function closeBuySeedModal() {
        const buySeedModal = document.getElementById("buySeedModal");
        buySeedModal.style.display = "none";
    }

    function buyWhiteSeed() {
        if (argent >= 5) { // Coût d'une graine blanche
            whiteSeedStock++;
            argent -= 5;
            updateArgent();
            updateSeedCounters();
            updateBuySeedModalDisplay();
        }
    }

    function buyRedSeed() {
        if (argent >= 7) { // Coût d'une graine rouge
            redSeedStock++;
            argent -= 7;
            updateArgent();
            updateSeedCounters();
            updateBuySeedModalDisplay();
        }
    }

    function buyPinkSeed() {
        if (argent >= 10) { // Coût d'une graine rose
            pinkSeedStock++;
            argent -= 10;
            updateArgent();
            updateSeedCounters();
            updateBuySeedModalDisplay();
        }
    }
    function updateBuySeedModalDisplay() {
        const whiteStockDisplay = document.getElementById("whiteStockDisplay");
        const redStockDisplay = document.getElementById("redStockDisplay");
        const pinkStockDisplay = document.getElementById("pinkStockDisplay");
    
        whiteStockDisplay.textContent = `White Seed Stock: ${whiteSeedStock}`;
        redStockDisplay.textContent = `Red Seed Stock: ${redSeedStock}`;
        pinkStockDisplay.textContent = `Pink Seed Stock: ${pinkSeedStock}`;
    }



    const sellFlower = document.getElementById("sellFlower");
    const sellFlowerModalBtn = document.getElementById("sellFlowerModalBtn");

    sellFlower.addEventListener("click", function () {
        openSellFlowerModal();
    });

    function openSellFlowerModal() {
        const sellFlowerModal = document.getElementById("sellFlowerModal");
        const whiteFlowerStockDisplay = document.getElementById("whiteFlowerStockDisplay");
        const redFlowerStockDisplay = document.getElementById("redFlowerStockDisplay");
        const pinkFlowerStockDisplay = document.getElementById("pinkFlowerStockDisplay");
        const sellWhiteFlowerBtn = document.getElementById("sellWhiteFlowerBtn");
        const sellRedFlowerBtn = document.getElementById("sellRedFlowerBtn");
        const sellPinkFlowerBtn = document.getElementById("sellPinkFlowerBtn");
        const closeSellFlowerModalBtn = document.getElementById("closeSellFlowerModalBtn");

        whiteFlowerStockDisplay.textContent = `White Flower Stock: ${whiteTulipStock}`;
        redFlowerStockDisplay.textContent = `Red Flower Stock: ${redRoseStock}`;
        pinkFlowerStockDisplay.textContent = `Pink Flower Stock: ${pinkRoseStock}`;

        sellWhiteFlowerBtn.addEventListener("click", sellWhiteFlower);
        sellRedFlowerBtn.addEventListener("click", sellRedFlower);
        sellPinkFlowerBtn.addEventListener("click", sellPinkFlower);

        closeSellFlowerModalBtn.addEventListener("click", closeSellFlowerModal);

        sellFlowerModal.style.display = "block";
    }

    function closeSellFlowerModal() {
        const sellFlowerModal = document.getElementById("sellFlowerModal");
        sellFlowerModal.style.display = "none";
    }

    function sellWhiteFlower() {
        if (whiteTulipStock > 0) {
            whiteTulipStock--;
            argent += 5; // Prix de vente de la fleur blanche
            updateArgent();
            updateFlowerCounters();
            updateSellFlowerModalDisplay();
        }
    }

    function sellRedFlower() {
        if (redRoseStock > 0) {
            redRoseStock--;
            argent += 7; // Prix de vente de la fleur rouge
            updateArgent();
            updateFlowerCounters();
            updateSellFlowerModalDisplay();
        }
    }

    function sellPinkFlower() {
        if (pinkRoseStock > 0) {
            pinkRoseStock--;
            argent += 10; // Prix de vente de la fleur rose
            updateArgent();
            updateFlowerCounters();
            updateSellFlowerModalDisplay();
        }
    }

    function updateSellFlowerModalDisplay() {
        const whiteFlowerStockDisplay = document.getElementById("whiteFlowerStockDisplay");
        const redFlowerStockDisplay = document.getElementById("redFlowerStockDisplay");
        const pinkFlowerStockDisplay = document.getElementById("pinkFlowerStockDisplay");

        whiteFlowerStockDisplay.textContent = `White Flower Stock: ${whiteTulipStock}`;
        redFlowerStockDisplay.textContent = `Red Flower Stock: ${redRoseStock}`;
        pinkFlowerStockDisplay.textContent = `Pink Flower Stock: ${pinkRoseStock}`;
    }
});
