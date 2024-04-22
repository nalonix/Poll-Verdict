const {adminID, channelID} = require("../../botSettings");
// const {getDocs, collection, updateDoc, doc: docFunc} = require("firebase/firestore");
// const {db} = require("../../firebase/firebase");


// const user_ref = collection(db, 'user');


async function treeShaking(ctx){
    if(ctx.chat.id === adminID){
        try {
            const querySnapshot = await getDocs(user_ref);
            // console.log(querySnapshot)
            // noinspection ES6MissingAwait
            querySnapshot.forEach(async (doc)=>{
                // get current counts
                const referrerId = doc.id;
                const invitedUsers = doc.data().invitedUsers;
                const referralCount = doc.data().referralCount;
                let new_referral_count = referralCount;
                let new_invited_users = invitedUsers;
                const docRef = docFunc(db, "user", referrerId);

                if(Array.isArray(invitedUsers)){
                    for(const userId of invitedUsers){
                        //check is user still member of channel
                            const chat = await ctx.api.getChatMember(channelID,userId);
                                if ( chat.status !== "left") {
                                    // still member of channel
                                    console.log("Still channel member 🟩")
                                } else {
                                    // no longer member of channel - deduct points
                                    console.log("no longer member 🔴");
                                    new_referral_count = referralCount - 0.2;
                                    if(new_referral_count < 0)
                                        new_referral_count = 0
                                    // remove invited users element
                                    new_invited_users = invitedUsers.filter(item => item !== userId);
                                }
                    }
                    //docRef
                    await updateDoc(docFunc(db, "user", referrerId), { referralCount:  new_referral_count, invitedUsers: new_invited_users });
                }else {
                    await ctx.reply(`Invited users is not an array: ${doc.id}`)
                }
            })

        } catch (error) {
            console.error('Error processing documents:', error);
        }
        // TODO: what if the user re invites a member multiple times times? before tree shake calling?
    }

}










module.exports = treeShaking;