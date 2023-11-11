document.addEventListener("DOMContentLoaded", function () {
    const grid = document.getElementById("grid");
    const modal = document.getElementById("myModal");
    const colorSelect = document.getElementById("colorSelect");
    const confirmBtn = document.getElementById("confirmBtn");
    const countButton = document.getElementById("countButton");
    const whiteCounter = document.getElementById("whiteCounter");
    const redCounter = document.getElementById("redCounter");
    const pinkCounter = document.getElementById("pinkCounter");
    const whiteStockElement = document.getElementById("whiteStock");
    const redStockElement = document.getElementById("redStock");
    const pinkStockElement = document.getElementById("pinkStock");
    const resizeButton = document.getElementById("resizeButton");
    const argentElement = document.getElementById("argent");
    const incrementButtonW = document.getElementById("incrementButtonW");
    const incrementButtonR = document.getElementById("incrementButtonR");
    const incrementButtonP = document.getElementById("incrementButtonP");
    const sellButtonW = document.getElementById("SellW");
    const sellButtonR = document.getElementById("SellR");
    const sellButtonP = document.getElementById("SellP");

    let selectedSquare = null;
    let whiteTulipStock = 0;
    let redRoseStock = 0;
    let pinkRoseStock = 0;
    let whiteSeedStock = 10;
    let redSeedStock = 10;
    let pinkSeedStock = 10;
    let argent = 100;

    // Créez les boutons d'achat une seule fois
    createBuyButton(incrementButtonW, "White_Tulip.jpg");
    createBuyButton(incrementButtonR, "Red_Rose.jpg");
    createBuyButton(incrementButtonP, "Pink_Rose.jpg");

    // Créez les boutons de vente une seule fois
    createSellButton(sellButtonW, "White_Tulip.jpg");
    createSellButton(sellButtonR, "Red_Rose.jpg");
    createSellButton(sellButtonP, "Pink_Rose.jpg");

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

        if (selectedSquare.innerHTML !== "") {
            if (selectedSquare.innerHTML.includes("White_Tulip.jpg")) {
                whiteSeedStock--;
            } else if (selectedSquare.innerHTML.includes("Red_Rose.jpg")) {
                redSeedStock--;
            } else if (selectedSquare.innerHTML.includes("Pink_Rose.jpg")) {
                pinkSeedStock--;
            }
        }

        // Check if there is enough stock before decrementing
        if (selectedImage.includes("White_Tulip.jpg") && whiteSeedStock > 0) {
            whiteSeedStock--;
            selectedSquare.innerHTML = `<img src="${selectedImage}" alt="Selected Image">`;
        } else if (selectedImage.includes("Red_Rose.jpg") && redSeedStock > 0) {
            redSeedStock--;
            selectedSquare.innerHTML = `<img src="${selectedImage}" alt="Selected Image">`;
        } else if (selectedImage.includes("Pink_Rose.jpg") && pinkSeedStock > 0) {
            pinkSeedStock--;
            selectedSquare.innerHTML = `<img src="${selectedImage}" alt="Selected Image">`;
        }

        updateCounters2();
    });

    countButton.addEventListener("click", function () {
        updateCounters();
        resetImages();
    });

    resizeButton.addEventListener("click", function () {
        if (argent >= 10) {
            resizeGrid();
            argent -= 10;
            updateArgent();
        } else {
            alert("Pas assez d'argent pour agrandir la grille !");
        }
    });

    function createBuyButton(button, imageType) {
        button.addEventListener("click", function () {
            // Mettez à jour le stock et l'affichage
            if (imageType === "White_Tulip.jpg" && argent >= 10) {
                whiteSeedStock++;
                argent -= 10;
            } else if (imageType === "Red_Rose.jpg" && argent >= 10) {
                redSeedStock++;
                argent -= 10;
            } else if (imageType === "Pink_Rose.jpg" && argent >= 10) {
                pinkSeedStock++;
                argent -= 10;
            } else {
                alert("Pas assez d'argent pour acheter !");
            }

            updateCounters2();
            updateArgent();
        });
    }

    function createSellButton(button, imageType) {
        button.addEventListener("click", function () {
            // Vérifiez si le stock est supérieur à zéro avant de vendre
            if (whiteTulipStock > 0 && redRoseStock > 0 && pinkRoseStock > 0) {
                // Mettez à jour le stock et l'affichage
                if (imageType === "White_Tulip.jpg") {
                    whiteTulipStock--;
                    argent += 10;
                } else if (imageType === "Red_Rose.jpg") {
                    redRoseStock--;
                    argent += 10;
                } else if (imageType === "Pink_Rose.jpg") {
                    pinkRoseStock--;
                    argent += 10;
                } else {
                    alert("Pas assez d'argent pour acheter !");
                }

                updateCounters2();
                updateArgent();
            } else {
                alert("Pas de stock disponible pour la vente !");
            }
        });
    }

    function updateCounters() {
        const whiteButton = document.getElementById("SellW");
        const redButton = document.getElementById("SellR");
        const pinkButton = document.getElementById("SellP");

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
        });

        whiteCounter.innerHTML = `<img src="White_Tulip.jpg" alt="Image 1"> White Tulip : ${whiteTulipStock}   
            <button2 class="incrementButton" id="SellW">Sell</button2>`;
        redCounter.innerHTML = `<img src="Red_Rose.jpg" alt="Image 2"> Red Rose : ${redRoseStock}  
            <button2 class="incrementButton" id="SellR">Sell</button2>`;
        pinkCounter.innerHTML = `<img src="Pink_Rose.jpg" alt="Image 3"> Pink Rose : ${pinkRoseStock}
            <button2 class="incrementButton" id="SellP">Sell</button2>`;

        updateSellButton(whiteButton, "White_Tulip.jpg");
        updateSellButton(redButton, "Red_Rose.jpg");
        updateSellButton(pinkButton, "Pink_Rose.jpg");
    }

    function updateSellButton(button, imageType) {
        button.addEventListener("click", function () {
            // Vérifiez si le stock est supérieur à zéro avant de vendre
            if (whiteTulipStock > 0 && redRoseStock > 0 && pinkRoseStock > 0) {
                // Mettez à jour le stock et l'affichage
                if (imageType === "White_Tulip.jpg") {
                    whiteTulipStock--;
                    argent += 10;
                } else if (imageType === "Red_Rose.jpg") {
                    redRoseStock--;
                    argent += 10;
                } else if (imageType === "Pink_Rose.jpg") {
                    pinkRoseStock--;
                    argent += 10;
                } else {
                    alert("Pas assez d'argent pour acheter !");
                }

                updateCounters2();
                updateArgent();
            } else {
                alert("Pas de stock disponible pour la vente !");
            }
        });
    }

    function updateCounters2() {
        updateStockButton(whiteStockElement, whiteSeedStock, "incrementButtonW");
        updateStockButton(redStockElement, redSeedStock, "incrementButtonR");
        updateStockButton(pinkStockElement, pinkSeedStock, "incrementButtonP");
    }

    function updateStockButton(stockElement, stock, buttonId) {
        if (stockElement == whiteStockElement) {
            stockElement.innerHTML = `<img src="White_Tulip.jpg" alt="Image 1"> White seed : ${stock}
                <button3 class="incrementButtonW" id="${buttonId}">Buy</button3>`;
        } else if (stockElement == redStockElement) {
            stockElement.innerHTML = `<img src="Red_Rose.jpg" alt="Image 1"> Red seed : ${stock}
                <button3 class="incrementButtonR" id="${buttonId}">Buy</button3>`;
        } else if (stockElement == pinkStockElement) {
            stockElement.innerHTML = `<img src="Pink_Rose.jpg" alt="Image 1"> Pink seed : ${stock}
                <button3 class="incrementButtonP" id="${buttonId}">Buy</button3>`;
        }

        const buyButton = document.getElementById(buttonId);
        if (buyButton) {
            createBuyButton(buyButton, buttonId === "incrementButtonW" ? "White_Tulip.jpg" : (buttonId === "incrementButtonR" ? "Red_Rose.jpg" : "Pink_Rose.jpg"));
        }
    }

    function resetImages() {
        const squares = document.querySelectorAll(".grid-item");
        squares.forEach((square) => {
            const image = square.querySelector("img");
            if (image) {
                square.removeChild(image);
            }
        });
    }

    function updateArgent() {
        argentElement.innerHTML = `Money ${argent} €`;
    }

    function resizeGrid() {
        const currentRowCount = grid.children.length / 10; // Assuming 10 columns per row

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

    incrementButtonW.addEventListener("click", function () {
        updateCounters2();
    });

    incrementButtonR.addEventListener("click", function () {
        updateCounters2();
    });

    incrementButtonP.addEventListener("click", function () {
        updateCounters2();
    });

    sellButtonW.addEventListener("click", function () {
        updateSellButton(sellButtonW, "White_Tulip.jpg");
    });
    
    sellButtonR.addEventListener("click", function () {
        updateSellButton(sellButtonR, "Red_Rose.jpg");
    });
    
    sellButtonP.addEventListener("click", function () {
        updateSellButton(sellButtonP, "Pink_Rose.jpg");
    });
    

    function updateSellButton(button, imageType) {
        // Vérifiez si le stock est supérieur à zéro avant de vendre
        if (whiteTulipStock > 0 && redRoseStock > 0 && pinkRoseStock > 0) {
            // Mettez à jour le stock et l'affichage
            if (imageType === "White_Tulip.jpg") {
                whiteTulipStock--;
                argent += 10;
            } else if (imageType === "Red_Rose.jpg") {
                redRoseStock--;
                argent += 10;
            } else if (imageType === "Pink_Rose.jpg") {
                pinkRoseStock--;
                argent += 10;
            } else {
                alert("Pas assez d'argent pour acheter !");
            }

            updateCounters2();
            updateArgent();
        } else {
            alert("Pas de stock disponible pour la vente !");
        }
    }
});
