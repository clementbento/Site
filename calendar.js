document.addEventListener("DOMContentLoaded", function() {
    // Récupérer l'élément du calendrier
    var calendarContainer = document.getElementById("calendar");

    // Créer un nouvel objet de date pour l'année 2024
    var startDate = new Date("2024-01-01");
    var endDate = new Date("2024-12-31");

    // Créer le contenu HTML du calendrier
    var calendarHTML = '<table>';
    calendarHTML += '<thead><tr><th>Lun</th><th>Mar</th><th>Mer</th><th>Jeu</th><th>Ven</th><th>Sam</th><th>Dim</th></tr></thead>';
    calendarHTML += '<tbody>';

    // Boucle pour chaque mois
    while (startDate <= endDate) {
        calendarHTML += '<tr>';

        // Boucle pour chaque jour de la semaine
        for (var i = 0; i < 7; i++) {
            // Si le jour appartient toujours au mois en cours
            if (startDate.getMonth() === (i + startDate.getDay()) % 7) {
                calendarHTML += '<td>' + startDate.getDate() + '</td>';
                startDate.setDate(startDate.getDate() + 1);
            } else {
                calendarHTML += '<td></td>';
            }
        }

        calendarHTML += '</tr>';
    }

    calendarHTML += '</tbody>';
    calendarHTML += '</table>';

    // Ajouter le calendrier à l'élément du calendrier
    calendarContainer.innerHTML = calendarHTML;
});
