async function generateReferalLink(ctx){
    await ctx.reply(`https://t.me/donidev_bot?start=ref${ctx.chat.id}`)
}

module.exports = generateReferalLink;