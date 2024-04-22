async function faqCommand(ctx){
        try{
            await ctx.reply(`<b>1. How do we earn?</b>\nYou earn based on your credit score. Users who are the top 5% with their credit score will get a percentage cut from Ad Revenue.
<b>2. Do the earners change?</b>\nYes, the earners will constantly change to the users who has invited and posted the most. 
<b>3. Can you lose credits?</b>\nYes, when a user you have invited leaves the channel you will lose 0.3 credit scores.
<b>4. How often do we earn?</b>\nYou will get a percentage cut from the total earning of the channel twice a year. 
For any inquires contact @doninx
`, {parse_mode: 'HTML'})
        }catch (e) {
            throw new Error(e);
        }
}

module.exports = faqCommand;