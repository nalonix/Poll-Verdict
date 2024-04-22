const { channelID } = require("../botSettings");

async function generateReferalLink(ctx){
    try{
        await ctx.deleteMessage();
    }catch (e) {
        throw new Error(e);
    }
    await ctx.reply(`
    Join my link to join WhatToDo Channel answer fun and interesting polls
    https://t.me/${channelID.substring(1)}?start=ref${ctx.chat.id*4}`,)
    await ctx.reply('Forward the above post to friends and groups.', {
        reply_markup: {
            inline_keyboard:[
                [{text:"Main Menu", callback_data:"menu"}]
            ]
        }
    })
}

module.exports = generateReferalLink;