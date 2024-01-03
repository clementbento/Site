function addTaskToList(task) {
      const taskList = document.getElementById('taskList');
      const taskItem = document.createElement('li');

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';

      const taskText = document.createElement('span');
      taskText.textContent = task;

      taskItem.appendChild(checkbox);
      taskItem.appendChild(taskText);
      taskList.appendChild(taskItem);

      checkbox.addEventListener('change', function() {
        if (checkbox.checked) {
          taskItem.classList.add('completed');
        } else {
          taskItem.classList.remove('completed');
        }
        saveData();
      });

      saveData();
    }

    function addTask() {
      const newTaskInput = document.getElementById('newTaskInput');
      const newTask = newTaskInput.value.trim();

      if (newTask !== '') {
        addTaskToList(newTask);
        newTaskInput.value = '';
      }
    }

    function saveData() {
      try {
        const taskList = document.getElementById('taskList');
        const tasks = Array.from(taskList.children).map(taskItem => ({
          task: taskItem.lastElementChild.textContent,
          completed: taskItem.classList.contains('completed')
        }));
        
        console.log('Saving tasks to localStorage:', tasks);
        
        localStorage.setItem('taskData_' + day + month, JSON.stringify(tasks));
    
        // Enregistrez les données dans Firestore
        db.collection('tasks').doc('${day}-${month}').set({
          tasks: tasks
        });
    
        console.log('Tasks successfully saved to Firestore.');
    
      } catch (error) {
        console.error('Error saving tasks:', error);
      }
    }
    

    function loadData() {
      const taskList = document.getElementById('taskList');
      const savedTasks = localStorage.getItem('taskData_' + day + month);
      if (savedTasks) {
        const tasks = JSON.parse(savedTasks);
        tasks.forEach(task => {
          addTaskToList(task.task);
          const lastTaskItem = taskList.lastElementChild;
          if (task.completed) {
            lastTaskItem.classList.add('completed');
            lastTaskItem.firstElementChild.checked = true;
          }
        });
      }
    }

    window.onload = loadData;