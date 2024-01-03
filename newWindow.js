function updateDatabase() {
  const dataInput = document.getElementById('dataInput');
  const newValue = dataInput.value.trim(); // trim pour supprimer les espaces avant et après le texte

  // Assurez-vous que la valeur n'est pas vide
  if (newValue !== "") {
    // Mettez à jour la base de données avec la nouvelle valeur
    const urlParams = new URLSearchParams(window.location.search);
    const day = urlParams.get('day');
    const month = urlParams.get('month');
    
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

    // Get the reference to the specific document in Firestore
    const docRef = db.collection('calendarData').doc(`${month}-${day}`);

    // Update the document with the new value
    docRef.set({
      value: newValue
    })
    .then(function () {
      console.log("Document successfully written!");
      // Vous pouvez également mettre à jour l'affichage sur la page si nécessaire
      document.getElementById('valueData').textContent = `Value: ${newValue}`;
    })
    .catch(function (error) {
      console.error("Error writing document: ", error);
    });
  } else {
    alert("Veuillez entrer une valeur valide.");
  }
}
