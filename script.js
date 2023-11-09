document.addEventListener("DOMContentLoaded", function() {
    const grid = document.getElementById("grid");
    
    for (let i = 0; i < 100; i++) {
        const square = document.createElement("div");
        square.className = "grid-item";
        square.addEventListener("click", toggleColor);
        grid.appendChild(square);
    }
    
    function toggleColor() {
        this.style.backgroundColor = this.style.backgroundColor === "black" ? "white" : "black";
    }
});
