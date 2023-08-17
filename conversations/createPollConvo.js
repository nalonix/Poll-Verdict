const moment = require("moment/moment");
const {Keyboard} = require("grammy");
const {storePoll} = require("../utils");
const sendToAdmin = require("../utilityFunctions/sendToAdmin")
async function createPoll(conversation, ctx){
    let pollTemplate ={
        creator_id: ctx.chat.id,
        created_at: moment().format('YYYY-MM-DD HH:mm'),
        scenario: "",
        poll_data:[
        ],
    };

    // keyboard to select - with and without scenario
    let keyboard = new Keyboard()
        .text("With Scenario").row()
        .text("No Scenario").row().placeholder("Pick one: ").oneTime().resized();

    await ctx.reply("Pick preference: ",{reply_markup: keyboard});
    let type = await conversation.waitFor(":text");

    while(type.msg.text !== "With Scenario" && type.msg.text !== "No Scenario"){
        await ctx.reply("Only choose from the given options.\nPick preference: ",{reply_markup: keyboard});
        type = await conversation.waitFor(":text");
    }
    //Accept scenario if wanted
    if(type.msg.text === "With Scenario"){
        await ctx.reply(`Send the Scenario: 710 characters max `, {
            reply_markup: { remove_keyboard: true },
        });
        let scenario = await conversation.waitFor(":text");
        let scenarioLength = scenario.msg.text.trim().length;

        while (scenarioLength > 710) {
            scenarioLength = scenario.msg.text.trim().length;
            await ctx.reply(`710 characters max - Current ${scenarioLength} `);
            scenario = await conversation.waitFor(":text");
            scenarioLength = scenario.msg.text.trim().length;
        }
        // if all goes well save scenario
        pollTemplate.scenario = scenario.msg.text;
    }

    let k = 0;
    do{
        let temporaryPoll = {
            quest: "",
            options: []
        }

        await ctx.reply(`▶️ Poll number: ${k+1}`);
        //Accepting quest
        await ctx.reply("Send the question: 255 Characters max", {
            reply_markup: { remove_keyboard: true },
        });
        let quest = await conversation.waitFor(":text");
        let questLength = quest.msg.text.trim().length;
        while (quest.msg.text.trim().length > 255) {
            questLength = quest.msg.text.trim().length;
            await ctx.reply(`710 characters max - Current ${questLength} `);
            quest = await conversation.waitFor(":text");
            questLength = quest.msg.text.trim().length;
        }
        // if all goes well save quest
        temporaryPoll.quest = quest.msg.text;
        for (let i = 0; i < 7; i++) {
            await ctx.reply(`Send option ${i+1} - Max 7 \n or /done if you are done`);
            let anOption = await conversation.waitFor(":text");
            while(anOption.msg.text.trim().length > 100){
                await ctx.reply(`Send option ${i+1} - 100 characters max \n or /done if you are done`);
                anOption = await conversation.waitFor(":text");
            }
            if(anOption.msg.text === "/done") {
                if(temporaryPoll.options.length >= 2) {
                    //send to user
                    let options = "";
                    temporaryPoll.options.forEach((ele, i)=> options+=`<b>${i+1}.</b> `+ele+`\n`);
                    await ctx.reply(`<em>${temporaryPoll.quest}</em>\n${options}`,{
                        reply_markup: {
                            keyboard: [
                                [{text:"Continue"}],
                                [{text:"Skip"}]
                            ],
                            resize_keyboard:true,
                        },
                        parse_mode:"HTML"
                    })
                    let verification = await conversation.waitFor(":text");
                    while(verification.msg.text !== "Continue" && verification.msg.text !== "Skip"){
                        await ctx.reply("Only pick from the given options.", {
                            reply_markup: {
                                keyboard: [
                                    [{text:"Continue"}],
                                    [{text:"Skip"}]
                                ],
                                resize_keyboard:true
                            }
                        })
                        verification = await conversation.waitFor(":text");
                    }
                    if(verification.msg.text === "Continue"){
                        pollTemplate.poll_data.push(temporaryPoll);
                    }else{
                        await ctx.reply("Current poll dropped.");
                        k--;
                    }
                    break;
                }
                else {
                    await ctx.reply("At least 2 options required");
                    i--;
                }
            }
            else {
                temporaryPoll.options.push(anOption.msg.text);
            }
        }
        await ctx.reply(`Add a poll number ${k+2}?`,{reply_markup:{
                keyboard:[
                    [{text:"Add a poll"}],
                    [{text:"Finish"}]
                ],
                resize_keyboard: true
            }});

        let resumeOrEnd = await conversation.waitFor(":text");
        while(resumeOrEnd.msg.text !== "Add a poll" && resumeOrEnd.msg.text !== "Finish"){
            await ctx.reply("Only pick from given options");
            resumeOrEnd = await conversation.waitFor(":text");
        }
        if (resumeOrEnd.msg.text === "Add a poll" && k+1 < 5) {
            k++;
        }else if(resumeOrEnd.msg.text === "Finish"){
            break;
        }
    }while(k<5)

    //send to user
    if(pollTemplate.poll_data.length>0){
        let polls = "";
        pollTemplate.poll_data.forEach((ele)=>{
            let aPoll = "";
            aPoll+=`<em>${ele.quest}</em>\n`;
            ele.options.forEach((ele, i)=> aPoll+=`<b>${i+1}.</b> `+ele+`\n`);
            polls+=`\n${aPoll}`;
        })

        await ctx.reply(`${pollTemplate.scenario}\n${polls}`,{reply_markup: {
                keyboard: [
                    [{text:"Continue"}],
                    [{text:"Cancel"}]
                ],
                resize_keyboard:true
            } , parse_mode:"HTML"});

        let verification = await conversation.waitFor(":text");
        while(verification.msg.text !== "Continue" && verification.msg.text !== "Cancel"){
            await ctx.reply("Only pick from the given options.", {
                reply_markup: {
                    keyboard: [
                        [{text:"Continue"}],
                        [{text:"Cancel"}]
                    ],
                    resize_keyboard:true
                }
            })
            verification = await conversation.waitFor(":text");
        }
        let loadingMessage = await ctx.reply("Loading...",{reply_markup:{remove_keyboard:true}})
        if(verification.msg.text === "Continue"){
            const docId = await storePoll(pollTemplate);
            await sendToAdmin(pollTemplate,docId,ctx);
            try {
                await ctx.api.deleteMessage(ctx.chat.id, loadingMessage.message_id);
            } catch (e) {
                console.log(e);
            }
            await ctx.reply("Sent to admin for validation.");
        }else{
            try {
                await ctx.api.deleteMessage(ctx.chat.id, loadingMessage.message_id);
            } catch (e) {
                console.log(e);
            }
            await ctx.reply("Poll creation canceled.")
            await ctx.conversation.exit();
        }
    }else{
        await ctx.reply("No poll created.",{ reply_markup:{ remove_keyboard: true}})
    }

}

module.exports = createPoll