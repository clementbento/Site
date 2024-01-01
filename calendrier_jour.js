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
    } else {
        window.location.href = 'erreur.html'; // Remplacez 'erreur.html' par le chemin de votre page d'erreur
    }
});

// Fonction pour ajouter une tâche
function addTask() {
    const taskInput = document.getElementById('taskInput');
    const tasks = taskInput.value.trim();

    // Sauvegarde des tâches dans le stockage local
    const urlParams = new URLSearchParams(window.location.search);
    const selectedMonth = urlParams.get('mois');
    const selectedDay = urlParams.get('jour');
    localStorage.setItem(`tasks_${selectedMonth}_${selectedDay}`, tasks);
    alert('Tâche ajoutée avec succès!');
}

// Fonction pour sauvegarder les notes
document.getElementById('noteInput').addEventListener('input', function() {
    const noteInput = document.getElementById('noteInput');
    const notes = noteInput.value.trim();

    // Sauvegarde des notes dans le stockage local
    const urlParams = new URLSearchParams(window.location.search);
    const selectedMonth = urlParams.get('mois');
    const selectedDay = urlParams.get('jour');
    localStorage.setItem(`notes_${selectedMonth}_${selectedDay}`, notes);
});
