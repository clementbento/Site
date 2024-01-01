function daysInMonth(month, year) {
  return new Date(year, month + 1, 0).getDate();
}

function generateCalendarGrid(year) {
  var calendarGrid = document.getElementById('calendar-grid');
  calendarGrid.innerHTML = ''; // Clear the existing calendar content

  var months = [
    "Janvier", "Février", "Mars", "Avril",
    "Mai", "Juin", "Juillet", "Août",
    "Septembre", "Octobre", "Novembre", "Décembre"
  ];

  for (var i = 0; i < 3; i++) {
    var rowDiv = document.createElement('div');
    rowDiv.classList.add('calendar-row');

    for (var j = 0; j < 4; j++) {
      var monthIndex = i * 4 + j;
      var monthContainer = document.createElement('div');
      monthContainer.classList.add('month-container');

      var monthHeader = document.createElement('div');
      monthHeader.classList.add('month-header');
      monthHeader.textContent = months[monthIndex] + ' ' + year;

      var calendarTable = document.createElement('table');
      calendarTable.classList.add('calendar-table');

      var daysRow = calendarTable.insertRow();

      for (var day = 0; day < 7; day++) {
        var daysCell = daysRow.insertCell();
        daysCell.textContent = ['L', 'M', 'M', 'J', 'V', 'S', 'D'][day];
      }

      var dayCount = 1;

      for (var k = 0; k < 6; k++) {
        var newRow = calendarTable.insertRow();

        for (var l = 0; l < 7; l++) {
          var newCell = newRow.insertCell();

          var totalDays = daysInMonth(monthIndex, year);
          var firstDay = new Date(year, monthIndex, 1).getDay();

          if (k === 0 && l < firstDay) {
            newCell.innerHTML = '';
          } else if (dayCount <= totalDays) {
            newCell.innerHTML = dayCount;
            dayCount++;
          } else {
            newCell.innerHTML = '';
          }
        }
      }

      monthContainer.appendChild(monthHeader);
      monthContainer.appendChild(calendarTable);
      rowDiv.appendChild(monthContainer);
    }

    calendarGrid.appendChild(rowDiv);
  }
}

// Initial display for the current year
var currentYear = new Date().getFullYear();
generateCalendarGrid(currentYear);
