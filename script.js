document.addEventListener("DOMContentLoaded", function () {
  // Remplacez ces valeurs par celles de votre projet Firebase
  const mois = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
  const calendarContainer = document.querySelector('.calendar-container');
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
            openCustomWindow(dayOfMonth, m); // Call the function to open the window
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

  // Function to open a custom window
  function openCustomWindow(day, month) {
    const newWindow = window.open('', '_blank', 'width=600,height=400');

    newWindow.document.write(`
        <html lang="fr">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${day} ${month}</title>
          <style>
            body {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: flex-start;
              height: 100vh;
              margin: 0;
              background-color: #AEDFF7; 
            }

            h2 {
              margin-top: 3px;
              font-size: 18px;
            }

            h3 {
              font-size: 16px;
              margin-bottom: 5px;
            }

            #calendarTitle {
              text-align: center;
              font-size: 20px;
            }

            .calendar-cell {
              width: 100%;
              border: 1px solid #ccc;
              overflow: hidden;
              margin-bottom: 3px;
              background-color: #E0E0E0;
              color: #333333; 
            }

            table {
              width: 100%;
              height: 100%;
              border-collapse: collapse;
            }

            th, td {
              text-align: center;
              border: 1px solid #ccc;
              padding: 2px;
              font-size: 12px;
            }

            th[colspan="7"] {
              background-color: #FFD3E0; 
              color: #333333;
              padding: 3px;
              font-size: 14px;
            }

            ul {
              list-style: none;
              padding: 0;
              margin: 0;
            }

            li {
              margin-bottom: 5px;
            }

            textarea {
              width: 100%;
              height: 200px;
              resize: none;
            }

            li.completed {
              text-decoration: line-through;
            }

            input[type="checkbox"] {
              margin-right: 5px;
            }
          </style>
        </head>
        <body>
          <h2>${day} ${month}</h2>
          <div style="display: flex;">
            <div style="flex: 1;">
              <h3>Task List</h3>
              <ul id="taskList"></ul>
              <div>
                <input type="text" id="newTaskInput" placeholder="Enter a new task">
                <button onclick="addTask()">Add Task</button>
              </div>
            </div>
            <div style="flex: 1;">
              <h3>Notepad</h3>
              <textarea id="notepad"></textarea>
            </div>
          </div>
          <script src="script2.js"></script>
        </body>
      </html>
    `);
    setDoc(doc(db, 'tasks', `${day}-${month}`), {
      tasks: tasks
    })
    .then(() => {
      console.log('Tasks successfully saved to Firestore.');
    })
    .catch((error) => {
      console.error('Error saving tasks to Firestore:', error);
    });
    
  }
});