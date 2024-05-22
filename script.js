document.addEventListener("DOMContentLoaded", () => {
    const counter = document.getElementById("counter");
    const increaseButton = document.getElementById("increase");
    const decreaseButton = document.getElementById("decrease");
    const validateButton = document.getElementById("validate");
    const historyModal = document.getElementById("history-modal");
    const closeModal = document.getElementById("close-modal");
    const historyList = document.getElementById("history-list");

    let count = 0;
    let history = JSON.parse(localStorage.getItem('insulinHistory')) || [];

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
        updateHistoryList();
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

    function updateHistoryList() {
        historyList.innerHTML = '';
        history.forEach((record, index) => {
            const listItem = document.createElement('li');
            listItem.className = 'history-item';

            const itemText = document.createElement('span');
            itemText.textContent = `${record.date} à ${record.time} - Dose: ${record.dose}`;
            
            const deleteButton = document.createElement('button');
            deleteButton.className = 'delete-button';
            deleteButton.textContent = '✖';
            deleteButton.addEventListener('click', () => {
                history.splice(index, 1);
                localStorage.setItem('insulinHistory', JSON.stringify(history));
                updateHistoryList();
            });

            listItem.appendChild(itemText);
            listItem.appendChild(deleteButton);
            historyList.appendChild(listItem);
        });
    }

    // Initial call to update the history list on page load
    updateHistoryList();
});
