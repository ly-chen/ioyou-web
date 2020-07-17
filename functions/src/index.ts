import * as functions from 'firebase-functions';
const admin = require('firebase-admin');
admin.initializeApp();

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
// export const helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

exports.createPost = functions.https.onCall(async (data, context) => {
    await admin.firestore().collection('posts').doc().set(data);
})