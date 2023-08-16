const {preparePost, updateUserPolls} = require("../utils");
const {channelID} = require("../botSettings");

async function setTimer(ctx){
    let toPost;
    runningFlag = true;
    setInterval(async ()=>{
        toPost = await preparePost();
        for(let post of toPost){
            if(post.scenario.length > 0) {
                let scenarioMessage = await ctx.api.sendMessage(channelID, post.scenario)
            }

            for(let poll of post.poll_data){
                console.log(post)
                let pollMessage = await ctx.api.sendPoll(channelID,poll.quest,poll.options);
                if(post.poll_data.indexOf(poll)){
                    await updateUserPolls(pollMessage.message_id, poll.quest, post.creator_id);
                }
            }
        }
    }, 1000*60); //6000*60*2
}

module.exports = setTimer