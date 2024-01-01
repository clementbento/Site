document.addEventListener("DOMContentLoaded", function() {
  // Crée un tableau avec le nom de chaque mois
  const mois = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

  // Récupère l'élément qui contient les cellules du calendrier
  const calendarContainer = document.querySelector('.calendar-container');

  // Parcours chaque mois
  mois.forEach(function(m, index) {
      // Crée un div pour le mois avec un ID unique
      const monthDiv = document.createElement('div');
      monthDiv.className = 'calendar-cell';
      monthDiv.id = 'CalendarCell' + m;

      // Ajoute le div du mois au container
      calendarContainer.appendChild(monthDiv);

      // Crée une table pour le calendrier
      const table = document.createElement('table');

      // Crée une ligne pour le nom du mois
      const monthNameRow = document.createElement('tr');
      const monthNameCell = document.createElement('th');
      monthNameCell.colSpan = 7; // Fusionne sur toutes les colonnes
      monthNameCell.textContent = m;

      // Ajoute un gestionnaire d'événements de clic sur le nom du mois
      monthNameCell.addEventListener('click', function () {
        // Ouvre une nouvelle fenêtre avec le calendrier du mois sélectionné
        const newWindow = window.open('', '_blank', 'width=600,height=400');
  
        // Ajoute le contenu HTML au nouvel onglet
        newWindow.document.write('<html><head><title>Calendrier - ' + m + '</title><link rel="stylesheet" type="text/css" href="style.css"></head><body><h2>' + m + '</h2>' +
          '<table><tr><th>Dim</th><th>Lun</th><th>Mar</th><th>Mer</th><th>Jeu</th><th>Ven</th><th>Sam</th></tr>');
  
        // Récupère le premier jour du mois et le nombre de jours dans le mois
        const firstDay = new Date(2024, index, 1).getDay();
        const daysInMonth = new Date(2024, index + 1, 0).getDate();
  
        // Crée les cellules pour chaque jour du mois
        let dayCounter = 1;
        for (let i = 0; i < 5; i++) {
          const row = newWindow.document.createElement('tr');
          for (let j = 0; j < 7; j++) {
            const cell = newWindow.document.createElement('td');
            const dayOfMonth = i * 7 + j - firstDay + 1;
  
            if (i === 0 && dayOfMonth <= 0) {
              // Les jours du mois précédent
              cell.textContent = '';
            } else if (dayCounter <= daysInMonth) {
              // Les jours du mois en cours
              cell.textContent = dayCounter;
              dayCounter++;
            } else {
              // Les jours du mois suivant
              cell.textContent = '';
            }
            row.appendChild(cell);
          }
          newWindow.document.querySelector('table').appendChild(row);
        }
  
        // Ferme la balise body et html
        newWindow.document.write('</table></body></html>');
      });

      monthNameRow.appendChild(monthNameCell);
      table.appendChild(monthNameRow);

      // Crée une ligne pour les jours de la semaine
      const dayRow = document.createElement('tr');
      ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].forEach(function(jour) {
          const dayCell = document.createElement('th');
          dayCell.textContent = jour;
          dayRow.appendChild(dayCell);
      });
      table.appendChild(dayRow);

      // Récupère le premier jour du mois et le nombre de jours dans le mois
      const firstDay = new Date(2024, index, 1).getDay();
      const daysInMonth = new Date(2024, index + 1, 0).getDate();

      // Crée les cellules pour chaque jour du mois
      let dayCounter = 1;
      for (let i = 0; i < 5; i++) {
          const row = document.createElement('tr');
          for (let j = 0; j < 7; j++) {
              const cell = document.createElement('td');
              const dayOfMonth = i * 7 + j - firstDay + 1;

              if (i === 0 && dayOfMonth <= 0) {
                  // Les jours du mois précédent
                  cell.textContent = '';
              } else if (dayCounter <= daysInMonth) {
                  // Les jours du mois en cours
                  cell.textContent = dayCounter;
                  dayCounter++;
              } else {
                  // Les jours du mois suivant
                  cell.textContent = '';
              }
              row.appendChild(cell);
          }
          table.appendChild(row);
      }

      // Ajoute la table au div du mois
      monthDiv.appendChild(table);
  });
});
