const setTimer = require("../utilityFunctions/setTimer")
const {adminID} = require("../botSettings")


async function startOpsCallback(ctx, runningFlag){
    if(!runningFlag && ctx.chat.id === adminID){
        await setTimer(ctx);
        runningFlag = true;
        await ctx.reply("Timer set! ⌚");
      }else{
        await ctx.reply("No auth or Already running!")
      }
}

module.exports = startOpsCallback;