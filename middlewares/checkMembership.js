// the middleware in middleware directory
const {channelID} =  require("../botSettings");

async function checkMembership(ctx,next){
    const chat = await ctx.api.getChatMember(channelID,ctx.chat.id)
    if ( chat.status !== "left") {
        next();
    } else {
        await ctx.reply(`Please join our channel first ${channelID}`);
    }
}

module.exports = checkMembership