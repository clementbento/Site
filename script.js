document.addEventListener("DOMContentLoaded", function () {
    // Replace these values with your Firebase project configuration
    const firebaseConfig = {
      apiKey: "AIzaSyC8C45EXE-CmqjBxC6cYOo5c4EdKnXnl7E",
      authDomain: "calendrier-d3dc8.firebaseapp.com",
      projectId: "calendrier-d3dc8",
      storageBucket: "calendrier-d3dc8.appspot.com",
      messagingSenderId: "893693450908",
      appId: "1:893693450908:web:963c5d19b2732efae32b59",
      measurementId: "G-L7VTE6ZM5W"
    };
  
    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
  
    // Get a reference to the Firestore database
    const db = firebase.firestore();
  
    const mois = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
    const calendarContainer = document.querySelector('.calendar-container');
  
    function openNewWindow(day, month) {
      // Open a new window with a separate HTML page
      const newWindow = window.open(`newWindow.html?day=${day}&month=${month}`, '_blank');
    }
  
    mois.forEach(function (m, index) {
      const monthDiv = document.createElement('div');
      monthDiv.className = 'calendar-cell';
      monthDiv.id = 'CalendarCell' + m;
      calendarContainer.appendChild(monthDiv);
  
      const table = document.createElement('table');
      const monthNameRow = document.createElement('tr');
      const monthNameCell = document.createElement('th');
      monthNameCell.colSpan = 7;
      monthNameCell.textContent = m;
  
      monthNameRow.appendChild(monthNameCell);
      table.appendChild(monthNameRow);
  
      const dayRow = document.createElement('tr');
      ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].forEach(function (jour) {
        const dayCell = document.createElement('th');
        dayCell.textContent = jour;
        dayRow.appendChild(dayCell);
      });
      table.appendChild(dayRow);
  
      const firstDay = new Date(2024, index, 1).getDay();
      const daysInMonth = new Date(2024, index + 1, 0).getDate();
  
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
  
            // Add click event listener to each day cell
            cell.addEventListener('click', function () {
              // Open a new window and pass day and month data
              openNewWindow(dayOfMonth, m);
            });
  
            dayCounter++;
          } else {
            cell.textContent = '';
          }
          row.appendChild(cell);
        }
        table.appendChild(row);
      }
  
      monthDiv.appendChild(table);
    });
  });
  