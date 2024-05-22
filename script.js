document.addEventListener("DOMContentLoaded", () => {
    const counter = document.getElementById("counter");
    const increaseButton = document.getElementById("increase");
    const decreaseButton = document.getElementById("decrease");
    const validateButton = document.getElementById("validate");
    const historyButton = document.getElementById("history");
    const historyModal = document.getElementById("history-modal");
    const closeModal = document.getElementById("close-modal");
    const historyList = document.getElementById("history-list");

    let count = 0;
    let history = [];

    increaseButton.addEventListener("click", () => {
        count++;
        counter.textContent = count;
    });

    decreaseButton.addEventListener("click", () => {
        count--;
        counter.textContent = count;
    });

    validateButton.addEventListener("click", () => {
        const now = new Date();
        const record = {
            date: now.toLocaleDateString(),
            time: now.toLocaleTimeString(),
            dose: count
        };
        history.push(record);
        localStorage.setItem('insulinHistory', JSON.stringify(history));
        alert("Dose enregistrée !");
    });

    historyButton.addEventListener("click", () => {
        historyList.innerHTML = '';
        history = JSON.parse(localStorage.getItem('insulinHistory')) || [];
        history.forEach(record => {
            const listItem = document.createElement('li');
            listItem.textContent = `${record.date} à ${record.time} - Dose: ${record.dose}`;
            historyList.appendChild(listItem);
        });
        historyModal.style.display = "block";
    });

    closeModal.addEventListener("click", () => {
        historyModal.style.display = "none";
    });

    window.addEventListener("click", (event) => {
        if (event.target == historyModal) {
            historyModal.style.display = "none";
        }
    });
});
