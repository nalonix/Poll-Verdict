const {adminID} = require("../botSettings");
const {verifyPoll, manageSub} = require("../firebase/firebaseUtils");
const {manageSubscription} = require("");
const {queuePoll, denyPoll} = require("../prisma/index.ts")
const buildSubscriptionsKeyboard = require("../keyboards/subscriptionsKeyboard");

const {TAGS } = require("../constants/CONSTANTS");

async function genericCallback(ctx){
    let scenarioId = 0;
    const str = ctx.callbackQuery.data;
    const arr = str.split(",");
    if(scenarioId !== 0){
        try {
            await ctx.api.deleteMessage(adminID, scenarioId);
        } catch (e) {
            throw new Error("Error deleting message: "+e)
        }
        scenarioId = 0;
    }
    if(arr[0].trim() === 'adminverify'){
        // TODO: change function
        // can't locate creator_id
        let {status, creator_id} = await queuePoll(arr[1].trim());

        await ctx.deleteMessage();
        if(status === "success"){
            try {
                await ctx.api.sendMessage(creator_id, "Poll Accepted");
            } catch (error) {
                throw new Error("Error trying to send message" + error)
            }
        }
    }else if(arr[0].trim()=== 'admindeny'){
        // TODO: change function
        let { status, creator_id } = await denyPoll(arr[1].trim())
        try {
            await ctx.deleteMessage();
        } catch (e) {
            throw new Error("Error deleting message: "+e)
        }
        if(status === "success"){
            await ctx.api.sendMessage(creator_id, "Poll Denied");
        }
    }else if(arr[0].trim() === 'managesub'){
        let messageId = ctx.update.callback_query.message.message_id;
        let response;
        console.log(TAGS.indexOf(arr[1]));
        try {
            response = await manageSubscription(ctx.chat.id.toString(), 1);
        } catch (error) {
            console.log(error);
            return;
        }
        const subscriptionsKeyboard = await buildSubscriptionsKeyboard(ctx);
        if(response.status === "success"){
            try {
                await ctx.api.editMessageReplyMarkup(ctx.chat.id, messageId, {
                    reply_markup: {inline_keyboard: subscriptionsKeyboard}
                });
            } catch (e) {
                throw new Error("Error updating message: "+e)
            }
        }
        try {
            await ctx.answerCallbackQuery({text: response.message});
        } catch (e) {
            throw new Error(e);
        }
    }
    //⭐
    try {
        await ctx.answerCallbackQuery();
    } catch (e) {
        throw new Error(e)
    } // remove loading animation
}

module.exports = genericCallback;