// shop.js
document.addEventListener("DOMContentLoaded", function () {
    const argentDisplay = document.getElementById("argentDisplay");
    const whiteStockDisplay = document.getElementById("whiteStockDisplay");
    const redStockDisplay = document.getElementById("redStockDisplay");
    const pinkStockDisplay = document.getElementById("pinkStockDisplay");
    const buyWhiteSeedBtn = document.getElementById("buyWhiteSeedBtn");
    const buyRedSeedBtn = document.getElementById("buyRedSeedBtn");
    const buyPinkSeedBtn = document.getElementById("buyPinkSeedBtn");
    const goBackBtn = document.getElementById("goBackBtn");

    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);

    let argent = parseInt(urlParams.get('argent')) ;
    let whiteSeedStock = parseInt(urlParams.get('whiteSeedStock'));
    let redSeedStock = parseInt(urlParams.get('redSeedStock')) ;
    let pinkSeedStock = parseInt(urlParams.get('pinkSeedStock')) ;


    // Récupérer l'URL actuelle
    const currentUrl = window.location.href;




    updateDisplay();

    buyWhiteSeedBtn.addEventListener("click", buyWhiteSeed);
    buyRedSeedBtn.addEventListener("click", buyRedSeed);
    buyPinkSeedBtn.addEventListener("click", buyPinkSeed);
    goBackBtn.addEventListener("click", goBack);

    function updateDisplay() {
        argentDisplay.textContent = `Money: ${argent} €`;
        whiteStockDisplay.textContent = `White Seed Stock: ${whiteSeedStock}`;
        redStockDisplay.textContent = `Red Seed Stock: ${redSeedStock}`;
        pinkStockDisplay.textContent = `Pink Seed Stock: ${pinkSeedStock}`;
    }

    function buyWhiteSeed() {
        if (argent >= 5) {
            argent -= 5;
            whiteSeedStock++;
            updateDisplay();
        } else {
            alert("Not enough money to buy white seed!");
        }
    }

    function buyRedSeed() {
        if (argent >= 7) {
            argent -= 7;
            redSeedStock++;
            updateDisplay();
        } else {
            alert("Not enough money to buy red seed!");
        }
    }

    function buyPinkSeed() {
        if (argent >= 10) {
            argent -= 10;
            pinkSeedStock++;
            updateDisplay();
        } else {
            alert("Not enough money to buy pink seed!");
        }
    }

    function goBack() {
        // Rediriger vers la page principale sans oublier de sauvegarder les valeurs dans le localStorage
        localStorage.setItem('argent', argent);
        localStorage.setItem('whiteSeedStock', whiteSeedStock);
        localStorage.setItem('redSeedStock', redSeedStock);
        localStorage.setItem('pinkSeedStock', pinkSeedStock);
        if (typeof flowerFarm !== 'undefined' && typeof flowerFarm.updateSeedCounters === 'function') {
            flowerFarm.updateSeedCounters();
        }

        // Rediriger vers "flower-farm.html" avec les paramètres actuels
        window.location.href = "flower-farm.html" + currentUrl.substr(currentUrl.indexOf('?'));
    }
});
