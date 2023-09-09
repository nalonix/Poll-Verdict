const {adminID} = require("../botSettings");
const {verifyPoll, denyPoll, manageSub} = require("../firebase/firebaseUtils");
const buildSubscriptionsKeyboard = require("../keyboards/subscriptionsKeyboard");

async function genericCallback(ctx){
    let scenarioId = 0;
    const str = ctx.callbackQuery.data;
    const arr = str.split(",");
    if(scenarioId !== 0){
        await bot.api.deleteMessage(adminID, scenarioId);
        scenarioId = 0;
    }
    if(arr[0].trim() === 'adminverify'){
        let {status, creator_id} = await verifyPoll(arr[1].trim());
        await ctx.deleteMessage();
        if(status === "success"){
            await ctx.api.sendMessage(creator_id, "Poll Accepted");
        }
    }else if(arr[0].trim()=== 'admindeny'){
        let { status, creator_id } = await denyPoll(arr[1].trim())
        await ctx.deleteMessage();
        if(status === "success"){
            await ctx.api.sendMessage(creator_id, "Poll Denied");
        }
    }else if(arr[0].trim() === 'managesub'){
        let messageId = ctx.update.callback_query.message.message_id;
        const response = await manageSub(ctx.chat.id, arr[1]);
        console.log(response)
        const subscriptionsKeyboard = await buildSubscriptionsKeyboard(ctx);
        if(response.status === "success"){
            await ctx.api.editMessageReplyMarkup(ctx.chat.id, messageId, {
                reply_markup: { inline_keyboard: subscriptionsKeyboard }
            });
        }
        await ctx.answerCallbackQuery({text: response.message});
    }
    //⭐
    await ctx.answerCallbackQuery(); // remove loading animation
}

module.exports = genericCallback;