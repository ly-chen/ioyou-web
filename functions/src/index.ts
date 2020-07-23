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

exports.createComment = functions.https.onCall(async (data, context) => {
    await admin.firestore().collection('comments').doc().set(data);
})

exports.createReport = functions.https.onCall(async (data, context) => {
    await admin.firestore().collection('reports').doc().set(data);
})

exports.chooseAwardCredits = functions.https.onCall(async (data, context) => {
    const post = await admin.firestore().collection('posts').doc(data.post).get()
    if (post.data().awarded == true) {
        console.log("error")
        return
    } else {
        await admin.firestore().collection('users').doc(data.author).update({ credits: admin.firestore.FieldValue.increment(Number(data.award)) })
        console.log('data.comment = ', data.comment)
        if (Number(data.award) < Number(data.bounty)) {
            await admin.firestore().collection('posts').doc(data.post).update({ bounty: admin.firestore.FieldValue.increment(0 - Number(data.award)) })
        } else if (Number(data.award) > Number(data.bounty)) {
            await admin.firestore().collection('posts').doc(data.post).update({ awarded: true, bounty: admin.firestore.FieldValue.increment(0 - Number(data.award)) })
            await admin.firestore().collection('users').doc(context.auth?.uid).update({ credits: admin.firestore.FieldValue.increment(Number(data.bounty) - Number(data.award)) })
        } else {
            await admin.firestore().collection('posts').doc(data.post).update({ awarded: true, bounty: admin.firestore.FieldValue.increment(0 - Number(data.award)) })
        }
        await admin.firestore().collection('comments').doc(data.comment).update({ selected: data.award })
    }
})

/*exports.awardCredits = functions.pubsub.schedule('every 5 minutes').onRun(async (context) => {
    let docList: any[] = []
    const now = new Date();
    const seconds = ((now.getTime()) * .001) >> 0;
    const lastDay = seconds - 86400
    console.log('lastDay = ', lastDay)
    const posts = await admin.firestore().collection('posts').where('timestamp.seconds', '<=', lastDay).where('awarded', '==', false).get();
    posts?.forEach((doc: any) => {
        docList = [...docList, { id: doc.id, bounty: doc.data().bounty }]
    })
    console.log('posts = ', posts)
    console.log('docList = ', docList)

    for (let j = 0; j < docList.length; j++) {
        console.log('docID = ', docList[j].id)
        let commentsList: any[] = []
        const comments = await admin.firestore().collection('comments').where('thread', '==', docList[j].id).orderBy('upvotes', 'desc').get()
        console.log('comments = ', comments);
        comments.forEach((doc: any) => {
            commentsList = [...commentsList, { id: doc.id, data: doc.data() }]
        })
        console.log('commentsList = ', commentsList)
        let highscore = -1
        if (commentsList !== null && commentsList !== []) {
            const highestComment = commentsList[0]
            console.log('highestComment = ', highestComment)
            if (highestComment !== undefined) {
                highscore = highestComment.data.upvotes
            }
            console.log('highscore = ', highscore)
            let highComments: any[] = []
            if (highscore > -1) {
                let i = 0;
                let currentComment = highestComment
                while (currentComment !== undefined && highscore == currentComment.data.upvotes && i < commentsList.length) {
                    highComments = [...highComments, currentComment]
                    i += 1;
                    currentComment = commentsList[i]
                }
            }

            console.log('comments = ', commentsList)
            console.log('highComments = ', highComments)
            for (let k = 0; k < highComments.length; k++) {
                console.log('author = ', highComments[k].data.author)
                console.log('bounty = ', docList[j].bounty)
                await admin.firestore().collection('users').doc(highComments[k].data.author).update({ credits: admin.firestore.FieldValue.increment(Math.floor(docList[j].bounty / highComments.length)) })
                console.log('docList[j].id = ', docList[j].id)
                await admin.firestore().collection('posts').doc(docList[j].id).update({ awarded: true })
            }
        }

    }
})*/