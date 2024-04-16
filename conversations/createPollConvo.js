const moment = require("moment/moment");
const {Keyboard} = require("grammy");
// const {storePoll} = require("../firebase/firebaseUtils");
// import the create poll function 
const {createPollRecord} = require("../prisma/index.ts");
const sendToAdmin = require("../utilityFunctions/sendToAdmin")

async function createPoll(conversation, ctx){
    let pollTemplate ={
        creator_id: ctx.chat.id.toString(),
        tagId: 9,
        created_at: moment().format('YYYY-MM-DD HH:mm'),
        hasContext: false,
        context: {
            type: "",
            text:"",
            url:""
        },
        poll_data:[
        ],
    };

    // keyboard to select - with and without scenario
    let keyboard = new Keyboard()
        .text("Add Context").row()
        .text("No Context").row()
        .text("Cancel").row()
        .placeholder("Pick one: ").oneTime().resized();

    await ctx.reply("Pick preference: ",{reply_markup: keyboard});
    let type = await conversation.waitFor(":text");

    

    while(type.msg.text !== "Add Context" && type.msg.text !== "No Context" && type.msg.text !== "Cancel"){
        await ctx.reply("Only choose from the given options.\nPick preference: ",{reply_markup: keyboard});
        type = await conversation.waitFor(":text");
    }
    if(type.msg.text === "Cancel"){
        await ctx.reply("Poll creation canceled. /menu")
        return;
    } else if(type.msg.text === "Add Context") {
        pollTemplate.hasContext = true;

        let keyboard = new Keyboard()
            .text("Image").row()
            .text("Text").row()
            .text("Cancel").row().placeholder("Choose the format: ").oneTime().resized();

        await ctx.reply("What will the format be: ", {reply_markup: keyboard})
        let contextType = await conversation.waitFor(":text");
        while(contextType.msg.text !== "Image" && contextType.msg.text !== "Text" && contextType.msg.text !== "Cancel"){
            await ctx.reply("Only choose from the given options.\nPick preference: ",{reply_markup: keyboard});
            contextType = await conversation.waitFor(":text");
        }

        if(contextType.msg.text === "Cancel"){
            await ctx.reply("Poll creation canceled. /menu")
            return;
        }
        else if(contextType.msg.text === "Image"){
            pollTemplate.context.type = "Image";
            await ctx.reply(`Send the image: `, {
                reply_markup: { remove_keyboard: true },
            });
            const { message } = await conversation.wait();
            if (!message?.photo) {
                await ctx.reply("That is not a photo! I'm out!");
                return;
            }
            pollTemplate.context.url = message.photo[0].file_id;
            message?.caption && (pollTemplate.context.text = message.caption);
        }else if(contextType.msg.text === "Text"){
            pollTemplate.context.type = "Text";
            await ctx.reply(`Write the context: 705 characters max `, {
                reply_markup: { remove_keyboard: true },
                reply_markup: { remove_keyboard: true },
            });
            let context = await conversation.waitFor(":text");
            let contextLength = context.msg.text.trim().length;

            while (contextLength > 705) {
                contextLength = context.msg.text.trim().length;
                await ctx.reply(`705 characters max - Current ${contextLength} `);
                context = await conversation.waitFor(":text");
                contextLength = context.msg.text.trim().length;
            }
            // if all goes well save scenario
            pollTemplate.context.text = context.msg.text;
        }
    }else if(type.msg.text === "No Context"){
        pollTemplate.hasContext = false;
    }

    let k = 0;
    do{
        let temporaryPoll = {
            quest: "",
            options: []
        }

        await ctx.reply(`▶️ Poll number: ${k+1}`);
        //Accepting quest
        await ctx.reply("Write the question: 255 Characters max", {
            reply_markup: { remove_keyboard: true },
        });
        let quest = await conversation.waitFor(":text");
        let questLength = quest.msg.text.trim().length;
        while (quest.msg.text.trim().length > 255) {
            questLength = quest.msg.text.trim().length;
            await ctx.reply(`705 characters max - Current ${questLength} `);
            quest = await conversation.waitFor(":text");
            questLength = quest.msg.text.trim().length;
        }
        // if all goes well save quest
        temporaryPoll.quest = quest.msg.text;
        let i = 1;
        for (i = 1; i <= 7; i++) {
            await ctx.reply(`Send option ${i} - Max 7 \n or /done if you are done \n/cancel to abort`);
            let anOption = await conversation.waitFor(":text");
            while(anOption.msg.text.trim().length > 100){
                await ctx.reply(`Send option ${i} - 100 characters max \n or /done if you are done`);
                anOption = await conversation.waitFor(":text");
            }
            if(anOption.msg.text === "/cancel"){
                await ctx.reply("Poll creation canceled! /menu");
                return;
            } else if(anOption.msg.text === "/done") {
                if(temporaryPoll.options.length >= 2) {
                    //send to user
                    let options = "";
                    temporaryPoll.options.forEach((ele, i)=> options+=`<b>${i}.</b> `+ele+`\n`);
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

        if(i === 8){
            //send to user
            let options = "";
            temporaryPoll.options.forEach((ele, i)=> options+=`<b>${i}.</b> `+ele+`\n`);
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

        await ctx.reply(`Add a poll number ${k+2}?`,{reply_markup:{
                keyboard:[
                    [{text:"Add a poll"}],
                    [{text:"Finish"}]
                ],
                resize_keyboard: true
            }});

        let resumeOrEnd = await conversation.waitFor(":text");
        while(resumeOrEnd.msg.text !== "Add a poll" && resumeOrEnd.msg.text !== "Finish"){
            await ctx.reply("Only pick from given options", {reply_markup:{
                    keyboard:[
                        [{text:"Add a poll"}],
                        [{text:"Finish"}]
                    ],
                    resize_keyboard: true
                }});
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
        // TODO: generate keyboard from array of valid tags
        await ctx.reply("Tag your poll: ",{
            reply_markup: {
                keyboard: [
                    [{text:"WhatToDo"}, {text:"WouldYouRather"}],
                    [{text:"Life"},{text:"Relationships"}],
                    [{text:"Hypothetical"},{text:"Explicit"}],
                    [{text:"Career"},{text:"Code"}],
                    [{text:"Other"}]
                ],
                resize_keyboard: true
            }
        });

        let tag;
        const validTags = ["WhatToDo", "Life", "WouldYouRather" ,"Relationships", "Hypothetical", "Explicit", "Career", "Code","Other"];
        do {
            tag = await conversation.waitFor(":text");
            if (validTags.includes(tag.msg.text)) {
                pollTemplate.tagId = validTags.indexOf(tag.msg.text)+1;
            } else {
                await ctx.reply("Invalid tag. Please choose from the available options.");
            }
        } while (!validTags.includes(tag.msg.text));

        


        /*

        // let polls = "";
        // pollTemplate.poll_data.forEach((ele)=>{
        //     let aPoll = "";
        //     aPoll+=`<em>${ele.quest}</em>\n`;
        //     ele.options.forEach((ele, i)=> aPoll+=`<b>${i+1}.</b> `+ele+`\n`);
        //     polls+=`\n${aPoll}`;
        // })
        //
        // if(pollTemplate.hasContext && pollTemplate.context.type === "Text"){
        //     await ctx.reply(`${pollTemplate.context.text}\n${polls}`,{reply_markup: {
        //             keyboard: [
        //                 [{text:"Continue"}],
        //                 [{text:"Cancel"}]
        //             ],
        //             resize_keyboard:true
        //         } , parse_mode:"HTML"});
        // }else if(pollTemplate.hasContext && pollTemplate.context.type === "Image"){
        //     let photoForVerification = await ctx.replyWithPhoto(pollTemplate.context.url, { caption: pollTemplate.context.text});
        //     await ctx.reply(`${polls}`,{reply_markup: {
        //             keyboard: [
        //                 [{text:"Continue"}],
        //                 [{text:"Cancel"}]
        //             ],
        //             resize_keyboard:true
        //         } , parse_mode:"HTML"});
        // }
        //
        // let verification = await conversation.waitFor(":text");
        // while(verification.msg.text !== "Continue" && verification.msg.text !== "Cancel"){
        //     await ctx.reply("Only pick from the given options.", {
        //         reply_markup: {
        //             keyboard: [
        //                 [{text:"Continue"}],
        //                 [{text:"Cancel"}]
        //             ],
        //             resize_keyboard:true
        //         }
        //     })
        //     verification = await conversation.waitFor(":text");
        // }

*/

        let loadingMessage = await ctx.reply("Loading...",{reply_markup:{remove_keyboard:true}})
        //if(verification.msg.text === "Continue"){
            // make changes here ⚠️
            // TODO: generate poll titile from content
            // const docId = await storePoll(pollTemplate);
            const newPoll = await createPollRecord(
                "poll title", 
                pollTemplate.hasContext, 
                pollTemplate.context, 
                pollTemplate.creator_id, 
                pollTemplate.tagId, 
                pollTemplate.poll_data 
            );
            await sendToAdmin(pollTemplate,newPoll.poll_id,ctx);
            try {
                await ctx.api.deleteMessage(ctx.chat.id, loadingMessage.message_id);
            } catch (e) {
                console.log(e);
            }
            await ctx.reply("Sent to admin for validation.");
        //}else{
          //  try {
            //    await ctx.api.deleteMessage(ctx.chat.id, loadingMessage.message_id);
            //} catch (e) {
            //    console.log(e);
           // }
           // await ctx.reply("Poll creation canceled.")
           // await ctx.conversation.exit();
        //}

    }else{
        await ctx.reply("No poll created.",{ reply_markup:{ remove_keyboard: true}})
    }
}
module.exports = createPoll