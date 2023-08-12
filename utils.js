//firebase
const {app, db} = require('./firebase.js')

//firebase functions 
const {collection,query, doc ,getDoc, getDocs,addDoc, setDoc, updateDoc, deleteDoc, orderBy, limit} = require("firebase/firestore");

const test_all_polls_ref = collection(db, 'test_all_polls');
const test_queue_ref = collection(db, 'test_queue');
const user_ref = collection(db, 'user');

async function storePoll(aPoll){   
    try {
        let docRef = await addDoc(test_all_polls_ref,aPoll);
        return await docRef.id;
      } catch (error) {
        // Handle the error
        console.error('Error:', error);
      }
  }

  async function verifyPoll(docId){   
    //get full poll data with document ID

    try {
        const documentRef = await doc(db, "test_all_polls", docId);
        const documentSnapshot = await getDoc(documentRef);
        if (documentSnapshot.exists()) {
          //grab from all polls
          const documentData = documentSnapshot.data();
          console.log("Document data:", documentData);
          //write to test_queue
          await addDoc(test_queue_ref,documentData);
          //delete from all polls
          await deleteDoc(documentRef)
          return {status: "success", creator_id: documentSnapshot.data().creator_id}
        } else {
          console.log("Document not found");
            return {status: "fail", creator_id: ""}
        }
      } catch (error) {
        console.error("Error getting document:", error);
        return {status: "fail", creator_id: ""}
      }
  }

  async function denyPoll(docId){
    try {
      const documentRef = await doc(db, "test_all_polls", docId);
      const documentSnapshot = await getDoc(documentRef);
      if (documentSnapshot.exists()) {
        //delete from all polls
        await deleteDoc(documentRef)
        return {status: "success", creator_id: documentSnapshot.data().creator_id}
      } else {
        console.log("Document not found");
        return {status: "fail", creator_id: ""}
      }
    } catch (error) {
      console.error("Error getting document:", error);
      return {status: "fail", creator_id: ""}
    }
  }

  async function preparePost() {
      try {
        let to_post = [];
        // Query the collection, order by the created_at field in ascending order, and limit to 10 documents
        const q = query(test_queue_ref, orderBy("created_at", "asc"), limit(2));
        const querySnapshot = await getDocs(q);
        // Iterate over the documents and log their data
        querySnapshot.forEach(async (aDoc) => {
          // add to the array the returns the fetched values
          to_post.push(aDoc.data());
          //delete from test_queue ⚠
           const documentRef = await doc(db, "test_queue", aDoc.id);
            //delete from test_queue
           await deleteDoc(documentRef)
        });
        return to_post;
      } catch (error) {
        console.error("Error retrieving documents:", error);
      }
  }

  async function updateUserPolls(message_id, poll_name, creator_id){
    //search user's document by id
      // update the polls field
      const documentRef = doc(user_ref, `${creator_id}`);
        // Get the current document data
      const documentSnapshot = await getDoc(documentRef);
      if (documentSnapshot.exists()) {
          const my_polls = documentSnapshot.data().my_polls;

          //cut string if more than 22 chx
          if(poll_name.length > 25)
            poll_name = poll_name.slice(0,25)+'...'
          // Add a new element to the my_polls array
          let new_poll = [...my_polls, {quest: poll_name,message_id}];
          try {
              // Update the document with the new my_polls array
              await updateDoc(doc(db, "user", `${creator_id}`), { my_polls: new_poll });
              console.log('Document successfully updated with new poll.');
          } catch (error) {
              console.error('Error updating document:', error);
          }
      }

  }

  async  function userAuth(user_data){
    let user_name = user_data.first_name;
      try {
          const documentRef = await doc(db, "user", `${user_data.id}`);
          const documentSnapshot = await getDoc(documentRef);
          if (documentSnapshot.exists()) {
              const documentData = documentSnapshot.data();
              user_name = documentData.first_name;
              return user_name;
          } else {
              try {
                  await setDoc(documentRef, {first_name: user_data.first_name, username: user_data.username, my_polls: []});
                  console.log('Document successfully written with the specific ID.');
              } catch (error) {
                  console.error('Error writing document:', error);
              }
          }
      } catch (error) {
          console.error("Error getting document:", error);
      }


      return user_name;
  }
async function getUserPolls(userId){
    try {
        const documentRef = await doc(db, "user", `${userId}`);
        const documentSnapshot = await getDoc(documentRef);
        if (documentSnapshot.exists()) {
            //delete from all polls
            return documentSnapshot.data().my_polls;
        } else {
            console.log("Document not found");
            return [];
        }
    } catch (error) {
        console.error("Error getting document:", error);
    }

}

module.exports ={storePoll,verifyPoll,denyPoll,preparePost,userAuth,updateUserPolls, getUserPolls}








