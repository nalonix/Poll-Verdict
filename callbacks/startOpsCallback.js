
async function startOpsCallback(ctx){
    if(!runningFlag && ctx.chat.id === adminID){
        await setTimer(ctx);
        runningFlag = true;
        await ctx.reply("Timer set! ⌚");
      }
}

module.exports = startOpsCallback;