document.addEventListener("DOMContentLoaded", function() {
    const mois = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

    const urlParams = new URLSearchParams(window.location.search);
    const selectedMonth = urlParams.get('mois');

    if (selectedMonth && mois.includes(selectedMonth)) {
        const title = document.createElement('h2');
        title.textContent = selectedMonth;
        document.body.appendChild(title);

        const table = document.createElement('table');
        const dayRow = document.createElement('tr');

        ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].forEach(function(jour) {
            const dayCell = document.createElement('th');
            dayCell.textContent = jour;
            dayRow.appendChild(dayCell);
        });
        table.appendChild(dayRow);

        const firstDay = new Date(2024, mois.indexOf(selectedMonth), 1).getDay();
        const daysInMonth = new Date(2024, mois.indexOf(selectedMonth) + 1, 0).getDate();

        let dayCounter = 1;
        for (let i = 0; i < 5; i++) {
            const row = document.createElement('tr');
            for (let j = 0; j < 7; j++) {
                const cell = document.createElement('td');
                const dayOfMonth = i * 7 + j - firstDay + 1;

                if (i === 0 && dayOfMonth <= 0) {
                    cell.textContent = '';
                } else if (dayCounter <= daysInMonth) {
                    cell.textContent = dayCounter;

                    // Ajoute un gestionnaire d'événements de clic à la cellule
                    cell.addEventListener('click', function() {
                        // Construit l'URL de la nouvelle page avec le mois et le jour sélectionnés
                        const url = 'calendrier_jour.html?mois=' + selectedMonth + '&jour=' + dayOfMonth;
                        
                        // Redirige vers la nouvelle page
                        window.location.href = url;
                    });

                    dayCounter++;
                } else {
                    cell.textContent = '';
                }
                row.appendChild(cell);
            }
            table.appendChild(row);
        }

        document.body.appendChild(table);
    } else {
        window.location.href = 'erreur.html'; // Remplacez 'erreur.html' par le chemin de votre page d'erreur
    }
});
