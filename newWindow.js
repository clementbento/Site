document.addEventListener("DOMContentLoaded", function () {
  const db = initializeFirebase();

  // Récupérer les paramètres d'URL pour le jour et le mois
  const urlParams = new URLSearchParams(window.location.search);
  const day = urlParams.get('day');
  const month = urlParams.get('month');

  // Mettre à jour le titre de la fenêtre avec le jour et le mois
  document.getElementById('newWindowTitle').textContent = `Données du ${day} ${month}`;

  // Mettre à jour les attributs data-day et data-month
  document.getElementById('dayData').setAttribute('data-day', day);
  document.getElementById('monthData').setAttribute('data-month', month);

  // Mettre à jour la liste des valeurs associées au jour et au mois
  updateDatabaseValuesList(day, month);
  updateNotepad(day, month);

  const notePadInput = document.getElementById('notePadInput');
  notePadInput.addEventListener('input', function () {
    const notePadValue = notePadInput.value.trim();
    saveNotePadValue(day, month, notePadValue);
  });

  function saveNotePadValue(day, month, notePadValue) {
    const db = firebase.firestore();
    const docRef = db.collection('calendarData').doc(`${month}-${day}`);
  
    // Récupérer les données existantes
    docRef.get()
      .then((docSnapshot) => {
        if (docSnapshot.exists) {
          const existingData = docSnapshot.data().values || [];
          
          // Mettre à jour le document avec les valeurs existantes et la nouvelle valeur du bloc-note
          docRef.set({
            values: existingData,
            notePadValue: notePadValue
          })
            .then(function () {
              console.log("NotePad value successfully written!");
            })
            .catch(function (error) {
              console.error("Error writing NotePad value: ", error);
            });
        } else {
          // Si le document n'existe pas, créer un nouveau document avec la valeur du bloc-note
          docRef.set({
            notePadValue: notePadValue
          })
            .then(function () {
              console.log("NotePad value successfully written!");
            })
            .catch(function (error) {
              console.error("Error writing NotePad value: ", error);
            });
        }
      })
      .catch((error) => {
        console.error("Error getting document: ", error);
      });
  }

  function updateNotepad(day, month) {
    const db = firebase.firestore();
    const docRef = db.collection('calendarData').doc(`${month}-${day}`);
  
    docRef.get()
      .then((doc) => {
        if (doc.exists) {
          const notePadValue = doc.data().notePadValue || "";
          const notePadInput = document.getElementById('notePadInput');
          notePadInput.value = notePadValue;
        }
      })
      .catch((error) => {
        console.error("Error getting document: ", error);
      });
  }
  
});

function initializeFirebase() {
  if (!firebase.apps.length) {
    const firebaseConfig = {
      apiKey: "AIzaSyC8C45EXE-CmqjBxC6cYOo5c4EdKnXnl7E",
      authDomain: "calendrier-d3dc8.firebaseapp.com",
      projectId: "calendrier-d3dc8",
      storageBucket: "calendrier-d3dc8.appspot.com",
      messagingSenderId: "893693450908",
      appId: "1:893693450908:web:963c5d19b2732efae32b59",
      measurementId: "G-L7VTE6ZM5W"
    };

    firebase.initializeApp(firebaseConfig);
  }

  return firebase.firestore();
}

function updateDatabase() {
  const dataInput = document.getElementById('dataInput');
  const newValue = dataInput.value.trim();

  if (newValue !== "") {
    const day = document.getElementById('dayData').getAttribute('data-day');
    const month = document.getElementById('monthData').getAttribute('data-month');

    const db = firebase.firestore();
    const docRef = db.collection('calendarData').doc(`${month}-${day}`);

    // Ajouter une nouvelle valeur au document avec le format Jour-Mois
    docRef.set({
      values: firebase.firestore.FieldValue.arrayUnion({ value: newValue, checked: false })
    }, { merge: true })
    .then(() => {
      console.log("Document successfully written!");

      // Mettre à jour la liste des valeurs
      updateDatabaseValuesList(day, month);
    })
    .catch((error) => {
      console.error("Error writing document: ", error);
    });
  } else {
    alert("Veuillez entrer une valeur valide.");
  }
}

function updateDatabaseValuesList(day, month) {
  const db = firebase.firestore();
  const valuesList = document.getElementById('databaseValuesList');

  // Efface la liste actuelle
  valuesList.innerHTML = "";

  // Obtient le document correspondant au jour et au mois
  const docRef = db.collection('calendarData').doc(`${month}-${day}`);

  docRef.get()
    .then((doc) => {
      if (doc.exists) {
        const values = doc.data().values || [];

        // Ajoute les valeurs à la liste des valeurs globales
        values.forEach((item) => {
          const listItem = document.createElement('li');

          // Ajout d'une case à cocher à côté de chaque valeur
          const checkbox = document.createElement('input');
          checkbox.type = 'checkbox';
          checkbox.checked = item.checked;
          checkbox.addEventListener('change', function () {
            // Mettre à jour l'état "checked" dans la base de données
            updateCheckedState(day, month, item.value, checkbox.checked);
          });

          listItem.appendChild(checkbox);
          
          // Ajout de la valeur à côté de la case à cocher
          const valueSpan = document.createElement('span');
          valueSpan.textContent = item.value;
          listItem.appendChild(valueSpan);

          valuesList.appendChild(listItem);
        });
      }
    })
    .catch((error) => {
      console.error("Error getting document: ", error);
    });
}

function updateCheckedState(day, month, value, checked) {
  const db = firebase.firestore();
  const docRef = db.collection('calendarData').doc(`${month}-${day}`);

  docRef.get()
    .then((doc) => {
      if (doc.exists) {
        const values = doc.data().values || [];

        // Mettre à jour l'état "checked" pour la valeur spécifique
        const updatedValues = values.map((item) => {
          if (item.value === value) {
            return { value: item.value, checked: checked };
          } else {
            return item;
          }
        });

        // Mettre à jour le document avec les nouvelles valeurs
        docRef.update({
          values: updatedValues
        })
        .then(() => {
          console.log("Checked state updated for value: ", value);
        })
        .catch((error) => {
          console.error("Error updating document: ", error);
        });
      }
    })
    .catch((error) => {
      console.error("Error getting document: ", error);
    });

}
