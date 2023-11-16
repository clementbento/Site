// flowershop.js
document.addEventListener("DOMContentLoaded", function () {
    const argentDisplay = document.getElementById("argentDisplay");
    const whiteTulipDisplay = document.getElementById("whiteTulipDisplay");
    const redRoseDisplay = document.getElementById("redRoseDisplay");
    const pinkRoseDisplay = document.getElementById("pinkRoseDisplay");
    const sellWhiteTulipBtn = document.getElementById("sellWhiteTulipBtn");
    const sellRedRoseBtn = document.getElementById("sellRedRoseBtn");
    const sellPinkRoseBtn = document.getElementById("sellPinkRoseBtn");
    const goBackBtn = document.getElementById("goBackBtn");

    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);

    const currentUrl = window.location.href;

    let argent = parseInt(urlParams.get('argent'));
    let whiteTulipStock = parseInt(urlParams.get('whiteTulipStock'));
    let redRoseStock = parseInt(urlParams.get('redRoseStock'));
    let pinkRoseStock = parseInt(urlParams.get('pinkRoseStock'));

    updateDisplay();

    sellWhiteTulipBtn.addEventListener("click", sellWhiteTulip);
    sellRedRoseBtn.addEventListener("click", sellRedRose);
    sellPinkRoseBtn.addEventListener("click", sellPinkRose);
    goBackBtn.addEventListener("click", goBack);

    function updateDisplay() {
        argentDisplay.textContent = `Money: ${argent} €`;
        whiteTulipDisplay.textContent = `White Tulip Stock: ${whiteTulipStock}`;
        redRoseDisplay.textContent = `Red Rose Stock: ${redRoseStock}`;
        pinkRoseDisplay.textContent = `Pink Rose Stock: ${pinkRoseStock}`;
    }

    function sellWhiteTulip() {
        if (whiteTulipStock >= 1) {
            argent += 10;
            whiteTulipStock--;
            updateDisplay();
        } else {
            alert("Not enough flower to sell white tulip!");
        }
    }

    function sellRedRose() {
        if (redRoseStock >= 1) {
            argent += 14;
            redRoseStock--;
            updateDisplay();
        } else {
            alert("Not enough money to buy red seed!");
        }
    }

    function sellPinkRose() {
        if (pinkRoseStock >= 1) {
            argent += 20;
            pinkRoseStock--;
            updateDisplay();
        } else {
            alert("Not enough money to buy pink seed!");
        }
    }
    
    function goBack() {
        // Rediriger vers la page principale sans oublier de sauvegarder les valeurs dans le localStorage
        localStorage.setItem('argent', argent);
        localStorage.setItem('whiteTulipStock', whiteTulipStock);
        localStorage.setItem('redRoseStock', redRoseStock);
        localStorage.setItem('pinkRoseStock', pinkRoseStock);
        if (typeof flowerFarm !== 'undefined' && typeof flowerFarm.updateFlowerCounters === 'function') {
            flowerFarm.updateFlowerCounters(); ///////////////////////////
        }
        window.location.href = "flower-farm.html" + currentUrl.substr(currentUrl.indexOf('?'));
    }

    
});
