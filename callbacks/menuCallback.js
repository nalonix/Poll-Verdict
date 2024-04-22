
async function menuCallback(ctx){
    await ctx.reply(`Here's the menu, what would you like to do?`,{parse_mode:"HTML",reply_markup: {
        inline_keyboard: [
            [{text:"Create Poll", callback_data:"createpoll"}], [{text:"My account", callback_data: "account"} ]
        ]
    }});
}

module.exports = menuCallback;