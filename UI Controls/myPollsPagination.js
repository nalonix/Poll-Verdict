const { channelID } = require("../botSettings");

async function myPollsPagination(ctx) {
    await ctx.replyWithChatAction("typing");
    const { currentPage,  myPolls} = ctx.session;
    let itemsPerPage = 7
    const startIdx = currentPage * itemsPerPage;
    const endIdx = startIdx + itemsPerPage;
    const itemsToShow = myPolls.slice(startIdx, endIdx);

    let myPollsKeyboard = itemsToShow.map(ele=>{
        return [{text:ele.poll_title, url: `https://t.me/${channelID.substring(1)}/${ele.message_id}`}]
    })
    let navigationKeyboard = [];
    if (currentPage > 0) {
        // Add a "Return" button to fetch the previous page
        navigationKeyboard.push({text: "◀️", callback_data: "return"});
    }
    if (endIdx < myPolls.length) {
        // Add a "Next" button to fetch the next page
        navigationKeyboard.push({text:"️▶️", callback_data: "next"});
    }

    myPollsKeyboard.push(navigationKeyboard);
    myPollsKeyboard.push([{text:"Main Menu", callback_data:"menu"}])
    await ctx.reply("Your polls", {reply_markup: { inline_keyboard: myPollsKeyboard, resize_keyboard: false }})

    // Send the items to the user
    // for(let item of itemsToShow){
    //     //displaying replies
    //         await ctx.reply(item.quest, {
    //             reply_markup:{
    //                 inline_keyboard: [
    //                     [
    //                         {text:`${item.message_id}`, callback_data:`besufikad`},
    //                     ]
    //                 ]
    //             },
    //         });
    //
    // }

    // Check if there are more items to show
    // if (endIdx < myPolls.length) {
    //     // Add a "Next" button to fetch the next page
    //     await ctx.reply('Click "Next" to see more items', {
    //         reply_markup: {
    //             inline_keyboard: [
    //                 [{ text: "Next", callback_data: "next" }]
    //             ]
    //         }
    //     });
    // }
}


module.exports = myPollsPagination;


