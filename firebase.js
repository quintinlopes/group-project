var fireBase = fireBase || firebase;
var hasInit = false;
var config = {
  apiKey: "AIzaSyCVsBeZmG4FU_8aU-Af9qOKJSg8mcpKtjk",
  authDomain: "firebox-sandbox-e86bb.firebaseapp.com",
  databaseURL: "https://firebox-sandbox-e86bb.firebaseio.com",
  projectId: "firebox-sandbox-e86bb",
  storageBucket: "firebox-sandbox-e86bb.appspot.com",
  messagingSenderId: "325571520210"
};
if(!hasInit){
    firebase.initializeApp(config);
    hasInit = true;
}