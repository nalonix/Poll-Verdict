//firebase
// const {app, db} = require('./firebase.js')

//firebase functions 
// const {collection,query, doc ,getDoc, getDocs,addDoc, setDoc, updateDoc, deleteDoc, orderBy, limit} = require("firebase/firestore");
const {channelID} = require("../../botSettings");

// const test_all_polls_ref = collection(db, 'test_all_polls');
// const test_queue_ref = collection(db, 'test_queue');
// const user_ref = collection(db, 'user');

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

  // updateUserPolls

async function preparePost() {
    try {
        const to_post = [];
        // Query the collection, order by the created_at field in ascending order, and limit to 3 documents
        const q = query(test_queue_ref, orderBy("created_at"), limit(3));
        const querySnapshot = await getDocs(q);

        // Loop through the documents and push data to the array
        querySnapshot.forEach(  (aDoc) => {
            to_post.push(aDoc.data());
            //delete from test_queue ⚠
            const documentRef =  doc(test_queue_ref, `${aDoc.id}`);
            //delete from test_queue
             deleteDoc(documentRef)
        });
        return to_post;
    } catch (error) {
        console.error("Error retrieving documents:", error);
        // Rethrow the error to handle it further if needed
        throw error;
    }
}



// queue -- 
// poll archive -- when 
// created polls -- created poll goes here & forwarded to admin 
//  

// user creates poll 
//  -- forward to admin 
//  -- store in polls 
// admin verfies poll
//  -- it's ID will be added to queue 
//  -- 
// admin denies poll
//  -- it will be added to poll archive

// what if you have a single polls table
// a queue table: which will be list of ids from polls table
// poll archive: list of ids from polls table + more ids
// 



// -- 


  async function updateUserPolls(message_id, poll_name, creator_id){
    //search user's document by id
      // update the polls field
      const documentRef = doc(user_ref, `${creator_id}`);
        // Get the current document data
      const documentSnapshot = await getDoc(documentRef);
      if (documentSnapshot.exists()) {
          const my_polls = documentSnapshot.data().my_polls;
          const post_count = documentSnapshot.data().postCount;

          //cut string if more than 22 chx
          if(poll_name.length > 25)
            poll_name = poll_name.slice(0,25)+'...'
          // Add a new element to the my_polls array
          let new_poll = [...my_polls, {quest: poll_name,message_id}];
          let new_post_count = post_count + 1;
          try {
              // Update the document with the new my_polls array
              await updateDoc(doc(db, "user", `${creator_id}`), { my_polls: new_poll, postCount: new_post_count });
              console.log('Document successfully updated with new poll.');
          } catch (error) {
              console.error('Error updating document:', error);
          }
      }

  }

  async function updateReferalCount(refererId, invitedId, membershipStatus){
      const documentRef = doc(user_ref, `${refererId}`);
      // Get the current document data
      const documentSnapshot = await getDoc(documentRef);

      if (documentSnapshot.exists()) {
          const invited_users = documentSnapshot.data().invitedUsers;
          const referral_count = documentSnapshot.data().referralCount;

          // Add a new element to the my_polls array
          let new_invited_users;
          invited_users.includes(invitedId) ? new_invited_users = invited_users : new_invited_users = [...invited_users, invitedId];

          let new_referral_count;
          let referral_increment = 0;
          if(membershipStatus === "new member"){
              referral_increment = 1;
          }
          // no reward for veteran invite
          invited_users.includes(invitedId) ? new_referral_count = referral_count: new_referral_count = referral_count + referral_increment;

          try {
              // Update the document with the new may_polls array
              await updateDoc(doc(db, "user", `${refererId}`), { invitedUsers: new_invited_users, referralCount: new_referral_count });
              console.log('Document successfully updated for new invitation.');
              return {status:"success"}
          } catch (error) {
              console.error('Error updating document:', error);
              return {status:"fail"};
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
              return {status: "veteran member", user_name};
          } else {
              try {
                  await setDoc(documentRef,
                      {
                          first_name: user_data.first_name,
                          username: user_data.username,
                          my_polls: [],
                          subscriptions: [],
                          invitedUsers: [],
                          referralCount: 0,
                          engagementCount: 0,
                          postCount: 0,
                          credits: 2
                      }
                  );
                  console.log('Document successfully written with the specific ID.');
                  return {status: "new member", user_name};
              } catch (error) {
                  console.error('Error writing document:', error);
              }
          }
      } catch (error) {
          console.error("Error getting document:", error);
      }

      return {status: "veteran member",user_name};
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
        return [];
    }

}

async function getSubscriberIds(tag){
    try {
        const documentRef = await doc(db, "subscriptionData", tag);
        const documentSnapshot = await getDoc(documentRef);
        if (documentSnapshot.exists()) {
            //delete from all polls
            return documentSnapshot.data().ids;
        } else {
            console.log("Document not found");
            return [];
        }
    } catch (error) {
        console.error("Error getting document:", error);
        return [];
    }
}

async function getSubscriptions(userId){
    try {
        const documentRef = await doc(db, "user", `${userId}`);
        const documentSnapshot = await getDoc(documentRef);
        if (documentSnapshot.exists()) {
            //delete from all polls
            return documentSnapshot.data().subscriptions;
        } else {
            console.log("Document not found");
            return [];
        }
    } catch (error) {
        console.error("Error getting document:", error);
        return [];
    }
}



async function getCreditsData(userId){
    let credits_data = {};
    try {
        const documentRef = await doc(db, "user", `${userId}`);
        const documentSnapshot = await getDoc(documentRef);
        if (documentSnapshot.exists()) {
            //delete from all polls
            credits_data.postCount = documentSnapshot.data().postCount;
            credits_data.referralCount = documentSnapshot.data().referralCount;
            credits_data.invitedUsers = documentSnapshot.data().invitedUsers.length;

            return {status:"success", credits_data};
        } else {
            console.log("Document not found");
            return {status:"fail", credits_data};
        }
    } catch (error) {
        console.error("Error getting document:", error);
        return {status:"fail", credits_data};
    }
}

async function manageSub(userId, tag){

    let userSubs = await getSubscriptions(userId);
    if(userSubs.includes(tag)){
        //un subscribe
        // delete from ids array of tag document
    /// 😁😁😁😁😁😁😁😁😁😁😁😁😁😁😁😁😁😁😁😁😁😁
        // Fetch the Firestore document with the array field
        const tagRef = doc(db, 'subscriptionData', tag);
        const docSnap = await getDoc(tagRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            let ids = data.ids;
            // Add a new element to the answers array
            ids.splice(ids.indexOf(userId),1);
            try {
                let new_ids = [...ids];
                await updateDoc(tagRef, { ids: new_ids });
                // update user sub
                const userRef = doc(db, 'user', `${userId}`);
                try {
                    const new_subs = userSubs.filter(sub => sub !== tag);
                    await updateDoc(userRef, { subscriptions: new_subs});
                    return {status: "success", message: `unsubscribed from ${tag}`}
                } catch (error) {
                    console.error('Error updating document:', error);
                    // TODO: revert above update❤️
                    return {status: "fail", message: "Error updating document"}
                }

            } catch (error) {
                console.error('Error updating document:', error);
            }
        }
    }else{
        if(userSubs.length >= 3){
            return { status: "fail", message: "only 3 subs allowed max"}
        }else{
            // subscribe
            // -- update my subs array
            // Fetch the Firestore document with the array field
            const tagRef = doc(db, 'subscriptionData', tag);
            const docSnap = await getDoc(tagRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                const ids = data.ids;
                // Add a new element to the ids array
                try {
                    let new_ids = [...ids, userId];
                    await updateDoc(tagRef, { ids: new_ids });
                    const userRef = doc(db, 'user', `${userId}`);
                    try {
                        let new_subs = [...userSubs, tag];
                        await updateDoc(userRef, { subscriptions: new_subs});
                        return {status: "success", message: "subscription added"};
                    } catch (error) {
                        console.error('Error updating document:', error);
                        // TODO: remove from the tags ids array ❤️ *revert update
                        return {status: "fail", message: "Error updating document"}
                    }
            }catch (e){
                    console.error("Document not found", e)
                    return {status:"fail", message: "Document not found"}
                }
            }else{
                console.error("Tag document not found");
                return {status: "fail", message: "error locating tag data"}
            }
        }

    }
}



module.exports ={storePoll,verifyPoll,denyPoll,preparePost,userAuth,updateUserPolls, updateReferalCount, getUserPolls, getSubscriberIds, getSubscriptions, getCreditsData,manageSub}








