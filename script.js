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

    let selectedSquare = null;
    let whiteCount = 0;
    let redCount = 0;
    let pinkCount = 0;
    let whiteStock = 10;
    let redStock = 10;
    let pinkStock = 10;

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
                whiteCount--;
            } else if (selectedSquare.innerHTML.includes("Red_Rose.jpg")) {
                redCount--;
            } else if (selectedSquare.innerHTML.includes("Pink_Rose.jpg")) {
                pinkCount--;
            }
        }

        // Check if there is enough stock before decrementing
        if (selectedImage.includes("White_Tulip.jpg") && whiteStock > 0) {
            whiteStock--;
            selectedSquare.innerHTML = `<img src="${selectedImage}" alt="Selected Image">`;
        } else if (selectedImage.includes("Red_Rose.jpg") && redStock > 0) {
            redStock--;
            selectedSquare.innerHTML = `<img src="${selectedImage}" alt="Selected Image">`;
        } else if (selectedImage.includes("Pink_Rose.jpg") && pinkStock > 0) {
            pinkStock--;
            selectedSquare.innerHTML = `<img src="${selectedImage}" alt="Selected Image">`;
        }

        updateCounters2();
    });

    countButton.addEventListener("click", function () {
        updateCounters();
        resetImages();
    });

    function updateCounters() {
        const squares = document.querySelectorAll(".grid-item");
        squares.forEach((square) => {
            const imageSrc = square.querySelector("img");

            if (imageSrc && imageSrc.src.includes("White_Tulip.jpg")) {
                whiteCount++;
            } else if (imageSrc && imageSrc.src.includes("Red_Rose.jpg")) {
                redCount++;
            } else if (imageSrc && imageSrc.src.includes("Pink_Rose.jpg")) {
                pinkCount++;
            }
        });

        whiteCounter.innerHTML = `<img src="White_Tulip.jpg" alt="Image 1"> White Tulip: ${whiteCount}`;
        redCounter.innerHTML = `<img src="Red_Rose.jpg" alt="Image 2"> Red Rose: ${redCount}`;
        pinkCounter.innerHTML = `<img src="Pink_Rose.jpg" alt="Image 3"> Pink Rose: ${pinkCount}`;
    }

    function updateCounters2() {
        whiteStockElement.innerHTML = `<img src="White_Tulip.jpg" alt="Image 1"> White Tulip: ${whiteStock}`;
        redStockElement.innerHTML = `<img src="Red_Rose.jpg" alt="Image 2"> Red Rose: ${redStock}`;
        pinkStockElement.innerHTML = `<img src="Pink_Rose.jpg" alt="Image 3"> Pink Rose: ${pinkStock}`;
    }

    function resetImages() {
        const squares = document.querySelectorAll(".grid-item");
        squares.forEach((square) => {
            square.innerHTML = "";
        });
    }
});
