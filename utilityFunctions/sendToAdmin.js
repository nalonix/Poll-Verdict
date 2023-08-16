const {InlineKeyboard} = require("grammy");
const {adminID} = require("../botSettings");

async function sendToAdmin(pollTemplate,docId,ctx) {
    let adminVerifyKeyboard = new InlineKeyboard()
        .text("Verify",`adminverify,${docId}`)
        .text("Cancel",`admindeny,${docId}`);
    //send to user
    let polls = "";

    pollTemplate.poll_data.forEach((ele, i)=>{
        let aPoll = "";
        aPoll+=`<em>${ele.quest}</em>\n`;
        ele.options.forEach((ele, i)=> aPoll+=`<b>${i+1}.</b> `+ele+`\n`);
        polls+=`\n${aPoll}`;
    })
    await ctx.api.sendMessage(adminID,`${pollTemplate.scenario}\n${polls}`,{reply_markup: adminVerifyKeyboard, parse_mode:"HTML"});
}

module.exports = sendToAdmin