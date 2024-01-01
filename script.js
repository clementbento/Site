document.addEventListener("DOMContentLoaded", function() {
  // Crée un tableau avec le nom de chaque mois
  const mois = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

  // Récupère l'élément qui contient les cellules du calendrier
  const calendarContainer = document.querySelector('.calendar-container');

  // Parcours chaque mois
  mois.forEach(function(m) {
      // Crée un div pour le mois avec un ID unique
      const monthDiv = document.createElement('div');
      monthDiv.className = 'calendar-cell';
      monthDiv.id = 'CalendarCell' + m;

      // Ajoute le div du mois au container
      calendarContainer.appendChild(monthDiv);
  });

  // Parcours à nouveau chaque mois pour remplir le calendrier
  mois.forEach(function(m) {
      // Récupère l'élément avec l'ID correspondant au mois
      const monthDiv = document.getElementById('CalendarCell' + m);

      // Crée une table pour le calendrier
      const table = document.createElement('table');

      // Crée une ligne pour les jours de la semaine
      const dayRow = document.createElement('tr');
      ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].forEach(function(jour) {
          const dayCell = document.createElement('th');
          dayCell.textContent = jour;
          dayRow.appendChild(dayCell);
      });
      table.appendChild(dayRow);

      // Récupère le premier jour du mois et le nombre de jours dans le mois
      const firstDay = new Date(2024, mois.indexOf(m), 1).getDay();
      const daysInMonth = new Date(2024, mois.indexOf(m) + 1, 0).getDate();

      // Crée les cellules pour chaque jour du mois
      let dayCounter = 1;
      for (let i = 0; i < 6; i++) {
          const row = document.createElement('tr');
          for (let j = 0; j < 7; j++) {
              const cell = document.createElement('td');
              if (i === 0 && j < firstDay) {
                  // Les jours du mois précédent
                  cell.textContent = '';
              } else if (dayCounter <= daysInMonth) {
                  // Les jours du mois en cours
                  cell.textContent = dayCounter;
                  dayCounter++;
              }
              row.appendChild(cell);
          }
          table.appendChild(row);
      }

      // Ajoute la table au div du mois
      monthDiv.appendChild(table);
  });
});
