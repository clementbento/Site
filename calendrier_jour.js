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
        }
    } else {
        window.location.href = 'erreur.html'; // Remplacez 'erreur.html' par le chemin de votre page d'erreur
    }
});

// Fonction pour ajouter une tâche
function addTask() {
    const taskInput = document.getElementById('taskInput');
    const tasks = taskInput.value.trim();

    if (tasks !== '') {
        // Ajout de la tâche à la liste sous la zone d'écriture
        const taskList = document.getElementById('taskList');
        const newTaskItem = document.createElement('div');
        newTaskItem.textContent = tasks;
        taskList.appendChild(newTaskItem);

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
