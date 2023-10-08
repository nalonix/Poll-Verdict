const {adminID} = require("../../botSettings");

async function treeShaking(ctx){
    //TODO: implement a logic to deduct points for users who left the channel
    // this function will run on tree shake command call
    if(ctx.chat.id === adminID){

        console.log("Shakky shakky 🌲")
        // go through every document in the users collection
            // for each document loop through the invitedUsers array
                // for each element of the array check if they are still a memeber of the channel
                    // if they are
                        // -- do nothing
                    // else
                        // deduct 0.2 from invited users
    }

}

module.exports = treeShaking;