const flowerFarm = {
    updateSeedCounters: function () {
        whiteStockElement.innerHTML = `<img src="White_Tulip.jpg" alt="Image 1"> White seed : ${whiteSeedStock}`;
        redStockElement.innerHTML = `<img src="Red_Rose.jpg" alt="Image 2"> Red seed : ${redSeedStock}`;
        pinkStockElement.innerHTML = `<img src="Pink_Rose.jpg" alt="Image 3"> Pink seed : ${pinkSeedStock}`;
    },
    updateFlowerCounters: function() {
        whiteCounter.innerHTML = `<img src="White_Tulip.jpg" alt="Image 1"> White Tulip : ${whiteTulipStock}   `;
        redCounter.innerHTML = `<img src="Red_Rose.jpg" alt="Image 2"> Red Rose : ${redRoseStock}`;
        pinkCounter.innerHTML = `<img src="Pink_Rose.jpg" alt="Image 3"> Pink Rose : ${pinkRoseStock}`;
    }
    // ... le reste de votre code
};

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
    const sellFlower = document.getElementById("sellFlower");
    
    let selectedSquare = null;

    let whiteTulipStock = parseInt(localStorage.getItem('whiteTulipStock'));
    let redRoseStock = parseInt(localStorage.getItem('redRoseStock'));
    let pinkRoseStock = parseInt(localStorage.getItem('pinkRoseStock'));

    let argent = parseInt(localStorage.getItem('argent'));
    let whiteSeedStock = parseInt(localStorage.getItem('whiteSeedStock'));
    let redSeedStock = parseInt(localStorage.getItem('redSeedStock'));
    let pinkSeedStock = parseInt(localStorage.getItem('pinkSeedStock'));

    

    function updateCharacterInfo() {
        // Get the username and money from the query parameters
        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);
        const username = urlParams.get('username') || 'John Doe'; // Default to 'John Doe'

        // Update the DOM with the retrieved information
        document.getElementById('username').textContent = username;
        document.getElementById('character-money').textContent = argent;
    }

    // Call the function to update character info on page load
    window.onload = updateCharacterInfo;

    updateArgent();
    updateSeedCounters();
    updateFlowerCounters();

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
    function updateFlowerCounters() {
        whiteCounter.innerHTML = `<img src="White_Tulip.jpg" alt="Image 1"> White Tulip : ${whiteTulipStock}   `;
        redCounter.innerHTML = `<img src="Red_Rose.jpg" alt="Image 2"> Red Rose : ${redRoseStock}`;
        pinkCounter.innerHTML = `<img src="Pink_Rose.jpg" alt="Image 3"> Pink Rose : ${pinkRoseStock}`;
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
        argentElement.innerHTML = `Money :${argent} €`;
    }

    buySeed.addEventListener("click", function() {
        const usernameElement = document.getElementById('username');
        const username = usernameElement ? usernameElement.textContent : 'John Doe';
        window.location.href = `seedshop.html?username=${encodeURIComponent(username)}&argent=${argent}&whiteSeedStock=${whiteSeedStock}&redSeedStock=${redSeedStock}&pinkSeedStock=${pinkSeedStock}`;
    });
    

    sellFlower.addEventListener("click", function() {
        const usernameElement = document.getElementById('username');
        const username = usernameElement ? usernameElement.textContent : 'John Doe';
        window.location.href = `flowershop.html?username=${encodeURIComponent(username)}&argent=${argent}&whiteTulipStock=${whiteTulipStock}&redRoseStock=${redRoseStock}&pinkRoseStock=${pinkRoseStock}`;
    });
    

    
    
});
