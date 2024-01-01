document.addEventListener("DOMContentLoaded", function() {
    const urlParams = new URLSearchParams(window.location.search);
    const selectedMonth = urlParams.get('mois');
    const selectedDay = urlParams.get('jour');

    if (selectedMonth && selectedDay) {
        const title = document.getElementById('dateTitle');
        title.textContent = selectedMonth + ' - Jour ' + selectedDay;

        // Récupération des tâches depuis le stockage local
        const savedTasks = localStorage.getItem(`tasks_${selectedMonth}_${selectedDay}`);
        if (savedTasks) {
            document.getElementById('taskInput').value = savedTasks;
        }

        // Récupération des notes depuis le stockage local
        const savedNotes = localStorage.getItem(`notes_${selectedMonth}_${selectedDay}`);
        if (savedNotes) {
            document.getElementById('noteInput').value = savedNotes;
        }

        // Affichage des tâches ajoutées précédemment
        const taskList = document.getElementById('taskList');
        const savedTaskList = localStorage.getItem(`taskList_${selectedMonth}_${selectedDay}`);
        if (savedTaskList) {
            taskList.innerHTML = savedTaskList;

            // Ajout de gestionnaires d'événements pour les cases à cocher
            const checkboxes = taskList.querySelectorAll('.taskCheckbox');
            checkboxes.forEach(function(checkbox) {
                checkbox.addEventListener('change', function() {
                    toggleTaskCompletion(this);
                });
            });
        }
    } else {
        window.location.href = 'erreur.html'; // Remplacez 'erreur.html' par le chemin de votre page d'erreur
    }
    
});
function goBack() {
    window.history.back();
}
// Fonction pour ajouter une tâche
function addTask() {
    const taskInput = document.getElementById('taskInput');
    const tasks = taskInput.value.trim();

    if (tasks !== '') {
        // Ajout de la tâche à la liste sous la zone d'écriture
        const taskList = document.getElementById('taskList');
        const newTaskItem = document.createElement('div');
        newTaskItem.classList.add('taskItem');

        // Ajout de la case à cocher
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.classList.add('taskCheckbox');
        newTaskItem.appendChild(checkbox);

        // Ajout du texte de la tâche
        const taskText = document.createElement('span');
        taskText.textContent = tasks;
        newTaskItem.appendChild(taskText);

        taskList.appendChild(newTaskItem);

        // Ajout de gestionnaire d'événements pour la nouvelle case à cocher
        checkbox.addEventListener('change', function() {
            toggleTaskCompletion(this);
        });

        // Effacement de la zone d'écriture
        taskInput.value = '';

        // Sauvegarde des tâches dans le stockage local
        const urlParams = new URLSearchParams(window.location.search);
        const selectedMonth = urlParams.get('mois');
        const selectedDay = urlParams.get('jour');
        localStorage.setItem(`tasks_${selectedMonth}_${selectedDay}`, tasks);

        // Sauvegarde de la liste des tâches
        const taskListHTML = taskList.innerHTML;
        localStorage.setItem(`taskList_${selectedMonth}_${selectedDay}`, taskListHTML);
    }
    
}

// Fonction pour effacer toutes les tâches
function clearTasks() {
    const taskList = document.getElementById('taskList');
    taskList.innerHTML = '';

    // Effacement des tâches dans le stockage local
    const urlParams = new URLSearchParams(window.location.search);
    const selectedMonth = urlParams.get('mois');
    const selectedDay = urlParams.get('jour');
    localStorage.removeItem(`tasks_${selectedMonth}_${selectedDay}`);
    localStorage.removeItem(`taskList_${selectedMonth}_${selectedDay}`);
}

// Fonction pour barrer/débarrer le texte d'une tâche
function toggleTaskCompletion(checkbox) {
    const taskText = checkbox.nextElementSibling; // Sélectionne l'élément suivant dans le DOM (le texte de la tâche)
    if (checkbox.checked) {
        taskText.style.textDecoration = 'line-through'; // Barre le texte si la case est cochée
    } else {
        taskText.style.textDecoration = 'none'; // Débarre le texte si la case est décochée
    }
}

