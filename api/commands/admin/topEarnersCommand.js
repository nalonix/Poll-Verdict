// const {query, orderBy, limit, getDocs, doc, deleteDoc, collection} = require("firebase/firestore");
// const {db} = require("../../firebase/firebase");
const {adminID} = require("../../botSettings");


// const user_ref = collection(db, 'user');

async function topEarnersCommand(ctx){
    if(ctx.chat.id === adminID){
        try {
            const top_earners = [];
            // Query the collection, order by the created_at field in ascending order, and limit to 7 documents
            const q = query(user_ref, orderBy("credits", "desc"), limit(7));
            const querySnapshot = await getDocs(q);

            // Loop through the documents and push data to the array
            querySnapshot.forEach((aDoc) => {
                top_earners.push({
                    userId: aDoc.id,
                    credits: aDoc.data().credits,
                    username: aDoc.data().username
                });
            });

            let earners = "Top earners:\n\n";
            for(let i of top_earners){
                earners = earners + "ID: " + `${i.userId}` + "\n" + `@${i.username}` + "\n" + `${i.credits}` + "\n\n";
            }
            try {
                await ctx.api.sendMessage(adminID, earners);
            } catch (e) {
                console.log(e);
            }
        } catch (error) {
            console.error("Error retrieving documents:", error);
            // Rethrow the error to handle it further if needed
            throw error;
        }
    }
}

module.exports = topEarnersCommand;








  