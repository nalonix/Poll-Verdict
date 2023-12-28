async function aboutCommand(ctx){
    try{
        await ctx.reply("Use this bot to post polls on Poll Verdict Channel. You can create single and chanied polls with or " +
            "without leading scenario." +
            "If you want to create polls that will be exposed to a large audience this is your place. " +
            "You can also forward the polls to different groups and users to get all the count." +
            "Finally you will be able to see the final count from a link in your account manager." +
            "\n Posting polls and inviting users using your referral link will help you gain credits to earn cash from" +
            "Ad R____"+ "Polls will be posted every 10 hours and will wait in que until it's their turn");
    }catch (e) {
        throw new Error(e);
    }
}


module.exports = aboutCommand;