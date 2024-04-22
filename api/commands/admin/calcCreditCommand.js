const {adminID} = require("../../botSettings");
// const {getDocs, collection, updateDoc, doc: docFunc} = require("firebase/firestore");
// const {db} = require("../../firebase/firebase");
// const user_ref = collection(db, 'user');

async function calcCreditCommand(ctx){

    if(ctx.chat.id === adminID){
        try {
            const querySnapshot = await getDocs(user_ref);
            // console.log(querySnapshot)
            // noinspection ES6MissingAwait
            querySnapshot.forEach(async (doc)=>{
                const userId = doc.id;
                const referralCount = doc.data().referralCount;
                const postedCount = doc.data().my_polls.length;
                const new_credits = parseFloat(((referralCount*1)+(postedCount*0.3)).toFixed(1));

                try {
                    await updateDoc(docFunc(db, "user", userId), {credits: new_credits});
                } catch (e) {
                    console.log(e);
                }
                
            })

            await ctx.api.sendMessage(adminID, "Calcing credit complete.")

        } catch (error) {
            console.error('Error processing documents:', error);
        }

    }
}

module.exports = calcCreditCommand;










