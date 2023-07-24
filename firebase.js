// Import the functions you need from the SDKs you need
const { initializeApp } = require("firebase/app");
const { getFirestore } = require("firebase/firestore");
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDxVeklUDfjilB6lc1bFK-grbditzmpGMY",
  authDomain: "whattodo-f8de2.firebaseapp.com",
  projectId: "whattodo-f8de2",
  storageBucket: "whattodo-f8de2.appspot.com",
  messagingSenderId: "997582299931",
  appId: "1:997582299931:web:034f27c6caf2fa5f88e9be",
  measurementId: "G-7BYGSQMSCX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

//initialize firestore
const db = getFirestore(app);

module.exports = {app, db};