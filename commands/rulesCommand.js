async function rulesCommand(ctx){
        try{
            await ctx.reply(`<b>Community Guidelines</b>
Every post needs to free from hateful content or ignite similar feeling.
Every post will be validated if it's appropriate to be exposed to the public before being posted. 
Common sense and rationale will guide the filtering process. 
<b>Earning</b>
For every user referred you will get 1 credit score. If that user leaves the channel you will
lose 0.3 credit scores. 
Posting on the channel will earn you 0.3 credit scores. 
The top 5% credit owners will be get a percentage cut from Ad Revenue.`, {parse_mode: 'HTML'})
        }catch (e) {
            throw new Error(e);
        }

}

module.exports = rulesCommand;