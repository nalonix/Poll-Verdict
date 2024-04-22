// const {preparePost, updateUserPolls, getSubscriberIds} = require("../firebase/firebaseUtils");

const {preparePost, getSubscriberIds, publishPoll, deQueuePoll} = require('../prisma/index')
const {channelID} = require("../../botSettings");

async function setTimer(ctx){
    let toPost;
    const nums = ["1️⃣", "2️⃣","3️⃣","4️⃣","5️⃣","6️⃣","7️⃣","8️⃣"];
    setInterval(async ()=>{
        toPost = await preparePost();
        console.log("👉👉👉",toPost)
        for(let post of toPost){
            // TODO: json.parse(post) everything up here 

            // notify subscribers of post.tags
                //get tagName document
                // loop through subscribers array and ctx.api.sendMessage(subsciberId, notification message)

            if(post.poll.hasContext && JSON.parse(post.poll.context).type === "Text") {
                let contextMessage = await ctx.api.sendMessage(channelID, JSON.parse(post.poll.context).text);
            }else if(post.poll.hasContext && JSON.parse(post.poll.context).type === "Image"){
                let contextPhoto = await ctx.api.sendPhoto(channelID, JSON.parse(post.poll.context).url, {caption: JSON.parse(post.poll.context).text});
            }

            let notification = "";
            // TODO: this index below here gotta go
            let index = 0 
            for(let poll of JSON.parse(post.poll.poll_data)){
                let poll_name;
                let pollMessage = await ctx.api.sendPoll(channelID,`${nums[index]} ${poll.quest}`,poll.options);
                //await updateUserPolls(pollMessage.message_id, poll.quest, post.creator_id);
                //cut string if more than 22 chx
                // publish poll
                await publishPoll(post.poll_id, pollMessage.message_id)
                // remove from queue
                await deQueuePoll(post.poll_id)
                if(poll.quest.length > 20)
                    poll_name = poll.quest.slice(0,20)+'...'
                else
                    poll_name = poll.quest
                // TODO: update notification link
                notification += `<a href="https://t.me/${channelID.slice(1)}/${pollMessage.message_id}">${poll_name}</a>\n`;
                // TODO: this index below here gotta go
                index += 1;
            }


//            if(post.poll.tag.length > 0){
                 // notify subs
                const subscriberIds = await getSubscriberIds(post.poll.tag_id);
                for(let subscriber of subscriberIds){
                    if (subscriber !== `${post.creator_id}`) {
                        try {
                            await ctx.api.sendMessage(subscriber, `${post.tag} tagged post has been made.\n${notification}`, {
                                parse_mode: "HTML"
                            })
                        } catch (e) {
                            console.log(e);
                        }
                    }
                }
            //}
            try {
                await ctx.api.sendMessage(post.poll.author_id, `Your poll has been posted.\n${notification}`, {
                    parse_mode: "HTML"
                })
            } catch (e) {
                console.log(e);
            }

        }
        // TODO: update notification time
    }, 1000*60); //6000*60*2
}

module.exports = setTimer