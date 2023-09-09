const {preparePost, updateUserPolls, getSubscriberIds} = require("../firebase/firebaseUtils");
const {channelID} = require("../botSettings");

async function setTimer(ctx){
    let toPost;
    setInterval(async ()=>{
        toPost = await preparePost();
        for(let post of toPost){
            // notify subscribers of post.tags

                //get tagName document
                // loop through subscribers array and ctx.api.sendMessage(subsciberId, notification message)
                //


            if(post.hasContext && post.context.type === "Text") {
                let contextMessage = await ctx.api.sendMessage(channelID, post.context.text);
            }else if(post.hasContext && post.context.type === "Image"){
                let contextPhoto = await ctx.api.sendPhoto(channelID, post.context.url, {caption: post.context.text});
            }

            let notification = "";
            for(let poll of post.poll_data){
                let poll_name;
                let pollMessage = await ctx.api.sendPoll(channelID,poll.quest,poll.options);
                await updateUserPolls(pollMessage.message_id, poll.quest, post.creator_id);
                //cut string if more than 22 chx
                if(poll.quest.length > 20)
                    poll_name = poll.quest.slice(0,20)+'...'
                else
                    poll_name = poll.quest
                notification += `<a href="https://t.me/pixel_verse/${pollMessage.message_id}">${poll_name}</a>\n`;
            }


            if(post.tag.length > 0){
                const subscriberIds = await getSubscriberIds(post.tag);
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
            }
            try {
                await ctx.api.sendMessage(post.creator_id, `You poll has been posted.\n${notification}`, {
                    parse_mode: "HTML"
                })
            } catch (e) {
                console.log(e);
            }

        }
    }, 1000*60); //6000*60*2
}

module.exports = setTimer