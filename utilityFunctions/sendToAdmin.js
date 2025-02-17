const {InlineKeyboard} = require("grammy");
const {adminID} = require("../botSettings");

async function sendToAdmin(pollTemplate,pollId,ctx) {
    let adminVerifyKeyboard = new InlineKeyboard()
        .text("Verify",`adminverify,${pollId}`)
        .text("Cancel",`admindeny,${pollId}`);

    //send to user
    // pollTemplate.poll_data.forEach((ele, i)=>{
    //     let aPoll = "";
    //     aPoll+=`<em>${ele.quest}</em>\n`;
    //     ele.options.forEach((ele, i)=> aPoll+=`<b>${i+1}.</b> `+ele+`\n`);
    //     polls+=`\n${aPoll}`;
    // })
    // await ctx.api.sendMessage(adminID,`${pollTemplate.context.text}\n${polls}`,{reply_markup: adminVerifyKeyboard, parse_mode:"HTML"});

    let polls = "";
    pollTemplate.poll_data.forEach((ele)=>{
        let aPoll = "";
        aPoll+=`<em>${ele.quest}</em>\n`;
        ele.options.forEach((ele, i)=> aPoll+=`<b>${i+1}.</b> `+ele+`\n`);
        polls+=`\n${aPoll}`;
    })

    if(pollTemplate.hasContext && pollTemplate.context.type === "Text"){
        await ctx.api.sendMessage(adminID,`${pollTemplate.context.text}\n${polls}`,{reply_markup: adminVerifyKeyboard, parse_mode:"HTML"});
    }else if(pollTemplate.hasContext && pollTemplate.context.type === "Image"){
        let photoForVerification = await ctx.api.sendPhoto(adminID, pollTemplate.context.url, { caption: pollTemplate.context.text})
        await ctx.api.sendMessage(adminID,`${polls}`,{reply_markup: adminVerifyKeyboard, parse_mode:"HTML"});
    }else if(!pollTemplate.hasContext){
        await ctx.api.sendMessage(adminID, `${polls}`, {reply_markup: adminVerifyKeyboard, parse_mode:"HTML"});
    }

}

module.exports = sendToAdmin;