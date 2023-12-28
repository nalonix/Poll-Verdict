


const {getCreditsData} = require("../firebase/firebaseUtils");
async function myAccountCallback(ctx){
    if(ctx.callbackQuery)
        ctx.deleteMessage();

    const creditsData = await getCreditsData(ctx.chat.id);
    if(creditsData.status === "success"){

        const { credits_data: { postCount, referralCount, invitedUsers}} = creditsData;
        console.log(creditsData)

        await ctx.reply( `Settings - ${ctx.chat.first_name} \n
         👥  Invited Users: ${invitedUsers} 
         ⁉  Total Posted: ${postCount}
         💳  Credits: ${parseFloat(((referralCount*1)+(postCount*0.3)).toFixed(1))}
         `,{
            reply_markup: {
                inline_keyboard: [
                    [
                        {text:"My Polls", callback_data:"mypolls"},
                        {text:"Subscriptions", callback_data:"mysubscriptions"},
                    ],
                    [
                        {text:"Referral Link", callback_data:"getreferrallink"},
                    ],
                    [
                        {text:"Back", callback_data:"menu"},
                    ]
                ],

            }
        })
    }else{
        await ctx.reply(`Settings - ${ctx.chat.first_name}`,{
            reply_markup: {
                inline_keyboard: [
                    [
                        {text:"My Polls", callback_data:"mypolls"},
                        {text:"Subscriptions", callback_data:"mysubscriptions"},
                    ],
                    [
                        {text:"Referral Link", callback_data:"getreferrallink"},
                    ],
                    [
                        {text:"Back", callback_data:"menu"},
                    ]
                ],
            }
        });
    }


}

module.exports = myAccountCallback;