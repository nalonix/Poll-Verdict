

const { fetchUserStats } = require("../prisma/index.ts")

async function myAccountCallback(ctx){
    if(ctx.callbackQuery)
        ctx.deleteMessage();
    const creditsData = await fetchUserStats(ctx.chat.id.toString());
    if(creditsData.status === "success"){
        const { user_stats: { post_count, referral_count, invited_users}} = creditsData;

        await ctx.reply( `Settings - ${ctx.chat.first_name} \n
         👥  Invited Users: ${invited_users} 
         ⁉  Total Posted: ${post_count}
         💳  Credits: ${parseFloat(((referral_count*1)+(post_count*0.3)).toFixed(1))}
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