async function myAccountCallback(ctx){
    if(ctx.callbackQuery)
        ctx.deleteMessage();
    await ctx.api.sendMessage(ctx.chat.id, `Settings - ${ctx.chat.first_name}`,{
        reply_markup: {
            inline_keyboard: [
                [
                    {text:"My Polls", callback_data:"mypolls"},
                    {text:"Subscriptions", callback_data:"mysubscriptions"},
                ],
                [
                    {text:"Referral Link", callback_data:"getreferrallink"},
                ]
            ],

        }
    });
}

module.exports = myAccountCallback;