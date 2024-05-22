document.addEventListener("DOMContentLoaded", () => {
    const counter = document.getElementById("counter");
    const increaseButton = document.getElementById("increase");
    const decreaseButton = document.getElementById("decrease");

    let count = 0;

    increaseButton.addEventListener("click", () => {
        count++;
        counter.textContent = count;
    });

    decreaseButton.addEventListener("click", () => {
        count--;
        counter.textContent = count;
    });
});
