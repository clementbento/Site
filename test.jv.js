document.addEventListener("DOMContentLoaded", function () {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const currentUrl = window.location.href;

    let argent = parseInt(urlParams.get('argent'));
    let whiteSeedStock = parseInt(urlParams.get('whiteSeedStock'));
    let redSeedStock = parseInt(urlParams.get('redSeedStock'));
    let pinkSeedStock = parseInt(urlParams.get('pinkSeedStock'));
    let whiteTulipStock = parseInt(urlParams.get('whiteTulipStock'));
    let redRoseStock = parseInt(urlParams.get('redRoseStock'));
    let pinkRoseStock = parseInt(urlParams.get('pinkRoseStock'));

    const isFlowerShopPage = currentUrl.includes("flower-shop.html");

    // Elements communs
    const argentDisplay = document.getElementById("argentDisplay");
    const goBackBtn = document.getElementById("goBackBtn");

    // Elements spécifiques à la boutique de graines
    const whiteStockDisplay = document.getElementById("whiteStockDisplay");
    const redStockDisplay = document.getElementById("redStockDisplay");
    const pinkStockDisplay = document.getElementById("pinkStockDisplay");
    const buyWhiteSeedBtn = document.getElementById("buyWhiteSeedBtn");
    const buyRedSeedBtn = document.getElementById("buyRedSeedBtn");
    const buyPinkSeedBtn = document.getElementById("buyPinkSeedBtn");

    // Elements spécifiques à la boutique de fleurs
    const whiteTulipDisplay = document.getElementById("whiteTulipDisplay");
    const redRoseDisplay = document.getElementById("redRoseDisplay");
    const pinkRoseDisplay = document.getElementById("pinkRoseDisplay");
    const sellWhiteTulipBtn = document.getElementById("sellWhiteTulipBtn");
    const sellRedRoseBtn = document.getElementById("sellRedRoseBtn");
    const sellPinkRoseBtn = document.getElementById("sellPinkRoseBtn");

    updateDisplay();

    if (isFlowerShopPage) {
        buyWhiteSeedBtn.addEventListener("click", buyWhiteSeed);
        buyRedSeedBtn.addEventListener("click", buyRedSeed);
        buyPinkSeedBtn.addEventListener("click", buyPinkSeed);
    } else {
        sellWhiteTulipBtn.addEventListener("click", sellWhiteTulip);
        sellRedRoseBtn.addEventListener("click", sellRedRose);
        sellPinkRoseBtn.addEventListener("click", sellPinkRose);
    }

    goBackBtn.addEventListener("click", goBack);

    function updateDisplay() {
        argentDisplay.textContent = `Money: ${argent} €`;

        if (isFlowerShopPage) {
            whiteStockDisplay.textContent = `White Seed Stock: ${whiteSeedStock}`;
            redStockDisplay.textContent = `Red Seed Stock: ${redSeedStock}`;
            pinkStockDisplay.textContent = `Pink Seed Stock: ${pinkSeedStock}`;
        } else {
            whiteTulipDisplay.textContent = `White Tulip Stock: ${whiteTulipStock}`;
            redRoseDisplay.textContent = `Red Rose Stock: ${redRoseStock}`;
            pinkRoseDisplay.textContent = `Pink Rose Stock: ${pinkRoseStock}`;
        }
    }

    function buyWhiteSeed() {
        if (argent >= 5) {
            argent -= 5;
            whiteSeedStock++;
            updateDisplay();
            updateLocalStorage();
        } else {
            alert("Not enough money to buy white seed!");
        }
    }

    function buyRedSeed() {
        if (argent >= 7) {
            argent -= 7;
            redSeedStock++;
            updateDisplay();
            updateLocalStorage();
        } else {
            alert("Not enough money to buy red seed!");
        }
    }

    function buyPinkSeed() {
        if (argent >= 10) {
            argent -= 10;
            pinkSeedStock++;
            updateDisplay();
            updateLocalStorage();
        } else {
            alert("Not enough money to buy pink seed!");
        }
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

        if (isFlowerShopPage) {
            localStorage.setItem('whiteSeedStock', whiteSeedStock);
            localStorage.setItem('redSeedStock', redSeedStock);
            localStorage.setItem('pinkSeedStock', pinkSeedStock);
            if (typeof flowerFarm !== 'undefined' && typeof flowerFarm.updateSeedCounters === 'function') {
                flowerFarm.updateSeedCounters();
            }
        } else {
            localStorage.setItem('whiteTulipStock', whiteTulipStock);
            localStorage.setItem('redRoseStock', redRoseStock);
            localStorage.setItem('pinkRoseStock', pinkRoseStock);
            if (typeof flowerFarm !== 'undefined' && typeof flowerFarm.updateFlowerCounters === 'function') {
                flowerFarm.updateFlowerCounters();
            }
        }

        // Rediriger vers "flower-farm.html" avec les paramètres actuels
        window.location.href = "flower-farm.html" + currentUrl.substr(currentUrl.indexOf('?'));
    }

    function updateLocalStorage() {
        localStorage.setItem('argent', argent);

        if (isFlowerShopPage) {
            localStorage.setItem('whiteSeedStock', whiteSeedStock);
            localStorage.setItem('redSeedStock', redSeedStock);
            localStorage.setItem('pinkSeedStock', pinkSeedStock);
        } else {
            localStorage.setItem('whiteTulipStock', whiteTulipStock);
            localStorage.setItem('redRoseStock', redRoseStock);
            localStorage.setItem('pinkRoseStock', pinkRoseStock);
        }
    }
});
