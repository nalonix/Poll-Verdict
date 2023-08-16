async function myPollsPagination(ctx) {
    await ctx.replyWithChatAction("typing");
    const { currentPage,  myPolls} = ctx.session;
    let itemsPerPage = 5
    const startIdx = currentPage * itemsPerPage;
    const endIdx = startIdx + itemsPerPage;
    const itemsToShow = myPolls.slice(startIdx, endIdx);

    // Send the items to the user
    for(let item of itemsToShow){
        //displaying replies
            await ctx.reply(item.quest, {
                reply_markup:{
                    inline_keyboard: [
                        [
                            {text:`${item.message_id}`, callback_data:`besufikad`},
                        ]
                    ]
                },
            });

    }

    // Check if there are more items to show
    if (endIdx < myPolls.length) {
        // Add a "Next" button to fetch the next page
        await ctx.reply('Click "Next" to see more items', {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "Next", callback_data: "next" }]
                ]
            }
        });
    }
}


module.exports = myPollsPagination;


