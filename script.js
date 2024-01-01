// Fonction pour obtenir le nombre de jours dans un mois
function daysInMonth(month, year) {
    return new Date(year, month + 1, 0).getDate();
  }
  
  // Obtenez le premier jour de janvier 2024 (0 pour dimanche, 1 pour lundi, etc.)
  var firstDay = (new Date(2024, 0, 1).getDay() + 6) % 7; // Ajout de 6 et modulo 7 pour ajuster le jour de la semaine

  
  // Obtenez le nombre total de jours dans janvier 2024
  var totalDays = daysInMonth(0, 2024);
  
  // Sélectionnez la balise tbody pour y ajouter les jours
  var tbody = document.getElementById('calendar-body');
  
  // Variable pour compter les jours
  var dayCount = 1;
  
  // Boucle pour créer les lignes du calendrier
  for (var i = 0; i < 6; i++) {
    // Créez une nouvelle ligne dans le tableau
    var row = tbody.insertRow();
  
    // Boucle pour créer les cellules de la ligne
    for (var j = 0; j < 7; j++) {
      // Créez une nouvelle cellule dans la ligne
      var cell = row.insertCell();
  
      // Ajoutez le jour dans la cellule s'il est dans le mois, sinon laissez la cellule vide
      if (i === 0 && j < firstDay) {
        // Laissez la cellule vide pour les jours avant le premier jour du mois
        cell.innerHTML = '';
      } else if (dayCount <= totalDays) {
        // Ajoutez le jour dans la cellule
        cell.innerHTML = dayCount;
        dayCount++;
      } else {
        // Laissez la cellule vide pour les jours après le dernier jour du mois
        cell.innerHTML = '';
      }
    }
  }
  