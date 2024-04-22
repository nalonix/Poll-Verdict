// the middleware in middleware directory
const {channelID} =  require("../../botSettings");

async function checkMembership(ctx,next){
    const chat = await ctx.api.getChatMember(channelID,ctx.chat.id);
    if (ctx.message?.text.startsWith('/start')) {
        // Do nothing and skip this middleware for /start command
        next();
    }else{
        if ( chat.status !== "left") {
            next();
        } else {
            await ctx.reply(`Please join our channel first ${channelID}`);
        }
    }
}

module.exports = checkMembership