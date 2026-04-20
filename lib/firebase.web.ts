import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";

// Web-specific Firebase Config
const firebaseConfig = {
  projectId: "tracklyapp-okb-01",
  appId: "1:549984629639:web:2d8f7fce0a0017b7419922",
  databaseURL: "https://tracklyapp-okb-01-default-rtdb.firebaseio.com",
  storageBucket: "tracklyapp-okb-01.firebasestorage.app",
  apiKey: "AIzaSyB9isCPC-tJ-oONprItBweHBQYR4I96TD4",
  authDomain: "tracklyapp-okb-01.firebaseapp.com",
  messagingSenderId: "549984629639",
  projectNumber: "549984629639",
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export const auth = firebase.auth();
export const db = firebase.firestore();

export default {
  auth,
  db,
};
