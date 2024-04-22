// const {query, orderBy, limit, getDocs, doc: docFunc, deleteDoc, collection, updateDoc} = require("firebase/firestore");
// const {db} = require("../../firebase/firebase");
const {adminID} = require("../../botSettings");


// const user_ref = collection(db, 'user');

async function updateUserData(ctx){
    if(ctx.chat.id === adminID){
        try {
            const querySnapshot = await getDocs(user_ref);

            const errors = []; // Store errors to handle them later

            for (const doc of querySnapshot.docs) {
                const userId = doc.id;

                try {
                    const chatData = await ctx.api.getChat(userId);
                    if (chatData.username && chatData.username.length > 0) {
                        const newUsername = chatData.username;
                        await updateDoc(doc.ref, { username: newUsername });
                    }
                } catch (e) {
                    // Handle the error and store it in the 'errors' array
                    errors.push(`Error processing user ${userId}: ${e.message}`);
                }
            }

            if (errors.length > 0) {
                // Handle and log the errors
                for (const error of errors) {
                    console.error(error);
                }
            }

            // Send a completion message to the admin
            await ctx.api.sendMessage(adminID, "User data updating complete");
        } catch (error) {
            console.error('Error processing documents:', error);
        }

    }
}

module.exports = updateUserData;