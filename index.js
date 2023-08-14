const { Bot, Context, session, Keyboard,InlineKeyboard  } = require("grammy");
const {
    conversations,
    createConversation,
  } = require("@grammyjs/conversations");

const moment = require('moment');

//utils
const {storePoll, verifyPoll, denyPoll, preparePost, userAuth, updateUserPolls,getUserPolls} = require('./utils.js')
// Create an instance of the `Bot` class and pass your bot token to it.
const bot = new Bot("6539896023:AAG-0vOFSeJxmCU526JZOvxrSK_TFR7tdYo"); // <-- put your bot token between the ""

//Settings
const {adminID, channelID, botID} = require("./botSettings");
let pollTemplate = {
    type:"",
    creator_id: "",
    created_at: "",
    scenario: "",
    poll_data:[
      {
        quest: " ",
        options: []
      }
    ],
  };

let scenarioId = 0;
let runningFlag = false;

// Install the session plugin.
bot.use(session({
  initial() {
    // return empty object for now
    return {};
  },
}));

// Install the conversations plugin.
bot.use(conversations());

// Error handler
bot.catch((err, ctx) => {
  console.error('Error occurred:', err); 
});

async function singlePoll(conversation, ctx) {
  pollTemplate ={
    type:"single",
    creator_id: ctx.chat.id,
    created_at: moment().format('YYYY-MM-DD HH:mm'),
    scenario: "",
    poll_data:[
    {
      quest: " ",
      options: []
    }
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
  pollTemplate.poll_data[0].quest = quest.msg.text;

  for (let i = 0; i < 7; i++) {
    await ctx.reply(`Send option ${i+1} - Max 7 \n or /done if you are done`);
    let anOption = await conversation.waitFor(":text");
    while(anOption.msg.text.trim().length > 100){
      await ctx.reply(`Send option ${i+1} - 100 characters max \n or /done if you are done`);
      anOption = await conversation.waitFor(":text");
    }
    if(anOption.msg.text === "/done") {
      if(pollTemplate.poll_data[0].options.length >= 2)
        break;
      else {
        await ctx.reply("At least 2 options required");
        i--;
      }
    }
    else {
      pollTemplate.poll_data[0].options.push(anOption.msg.text);
    }
  }

  //send to user
  let options = "";
  pollTemplate.poll_data[0].options.forEach((ele, i)=> options+=`${i+1}. `+ele+`\n`);

  if(pollTemplate.scenario.length > 0) {
    await ctx.reply(`${pollTemplate.scenario}`);
  }
  await ctx.reply(`${pollTemplate.poll_data[0].quest} \n${options}`,{
    reply_markup: {
    keyboard: [
        [{text:"Continue"}],
        [{text:"Cancel"}]
    ],
    resize_keyboard:true
    }
  })
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
    await sendToAdmin(docId,ctx);
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
}
bot.use(createConversation(singlePoll));


async function chainedPoll(conversation, ctx){
    pollTemplate ={
      type:"chained",
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
            while(verification.msg.text !== "Continue" && verification.msg.text !== "Cancel"){
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
    //
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
      await sendToAdmin(docId,ctx);
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
}
bot.use(createConversation(chainedPoll));
async function sendToAdmin(docId,ctx){
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
// You can now register listeners on your bot object `bot`.
// grammY will call the listeners when users send messages to your bot.

async function setTimmer(ctx){
  let toPost;
  runningFlag = true;
  setInterval(async ()=>{
    toPost = await preparePost();
    for(let post of toPost){
       if(post.scenario.length > 0) {
         let scenarioMessage = await ctx.api.sendMessage(channelID, post.scenario)
       }

      for(let poll of post.poll_data){
        console.log(post)
           let pollMessage = await ctx.api.sendPoll(channelID,poll.quest,poll.options);
           if(post.poll_data.indexOf(poll) === 0 && post.type === "chained"){
             await updateUserPolls(pollMessage.message_id, poll.quest, post.creator_id);
           }else if(post.type === "single"){
             await updateUserPolls(pollMessage.message_id, poll.quest, post.creator_id);
           }
      }
    }
  }, 1000*60); //6000*60*2
}

// async function createPollResponse(ctx){
//   if(ctx.callbackQuery)
//     ctx.deleteMessage();
//   await ctx.reply("Creating a poll: 🟢");
//   try {
//     let keyboard = new Keyboard()
//         .text("single poll").row()
//         .text("multiple polls").row().placeholder("Pick one: ").oneTime().resized();
//     await ctx.reply("Pick from options: ",{reply_markup: keyboard});
//   } catch (error) {
//     console.log(error)
//   }
// }
async function myaccountResponse(ctx){
  if(ctx.callbackQuery)
    ctx.deleteMessage();
  await ctx.api.sendMessage(ctx.chat.id, "User info",{
    reply_markup: {
      inline_keyboard: [
        [
          {text:"My Polls", callback_data:"mypolls"}
        ]
      ]
    }
  });
}

// Handle the /start command.
bot.command("start", async(ctx) => {
  await ctx.replyWithChatAction("typing")
  if(!runningFlag && ctx.chat.id === adminID){
    await setTimmer(ctx);
    await ctx.reply("Timer set! ⌚");
  }
  await ctx.reply(`Hello ${ctx.chat.first_name}, Welcome to <b>What To Do</b> Bot!`,{parse_mode:"HTML",reply_markup: {inline_keyboard: [ [{text:"Create Poll", callback_data:"createpoll"}], [{text:"My account", callback_data: "account"} ]]}});
})

bot.command("menu",async (ctx)=>{
  await ctx.reply(`Here's the menu, what would you like to do?`,{parse_mode:"HTML",reply_markup: {inline_keyboard: [ [{text:"Create Poll", callback_data:"createpoll"}], [{text:"My account", callback_data: "account"} ]]}});
})



bot.callbackQuery("createpoll",async ctx=>{
  await ctx.deleteMessage();
  await ctx.reply("Pick type: ", {reply_markup: {inline_keyboard: [
        [{text:"Single poll", callback_data:"createsinglepoll"},
          {text:"Chained polls", callback_data:"createchainedpolls"}]
      ]}});
  //await createPollResponse(ctx);
})
// handle poll
bot.command("createpoll", async (ctx) => {
  await ctx.reply("Pick type: ", {reply_markup: {inline_keyboard: [
        [{text:"Single poll", callback_data:"createsinglepoll"},
        {text:"Chained polls", callback_data:"createchainedpolls"}]
      ]}});
});
bot.callbackQuery("createsinglepoll", async ctx=>{
  //await createPollResponse(ctx);
  await ctx.deleteMessage();
  await ctx.conversation.enter("singlePoll");
})

bot.callbackQuery("createchainedpolls", async ctx=>{
  //await createPollResponse(ctx);
  await ctx.deleteMessage();
  await ctx.conversation.enter("chainedPoll")
})
// bot.hears('single poll', async (ctx)=>{
//   await ctx.reply(`Single poll selected`, {
//     reply_markup: { remove_keyboard: true },
//   });
//   // delete previous keyoard
//   // await ctx.deleteMessage();
//   await ctx.conversation.enter("singlePoll");
// });
//
// bot.hears('multiple poll', async (ctx)=>{
//   //delete previous keyoard
//   await ctx.answerCallbackQuery({text:"Feature coming soon ⌛"})
// });

bot.command("account",async (ctx)=>{
  await myaccountResponse(ctx)
})
bot.callbackQuery("account",async ctx=>{
  await myaccountResponse(ctx);
})
bot.command("cancel", async (ctx) => {
  await ctx.conversation.exit();
  await ctx.replyWithChatAction("typing");
  bot.api.sendMessage(ctx.chat.id, "Operation canceled", {reply_markup: { remove_keyboard: true },})
});




bot.callbackQuery('mypolls',async ctx=>{
  ctx.deleteMessage();
  let all_my_polls = await getUserPolls(ctx.chat.id);

  // keyboard to select - proceed or cancel
  let myPollsKeyboard = all_my_polls.map(ele=>{
    return [{text:ele.quest, url: `https://t.me/pixel_verse/${ele.message_id}`}]
  });

  //myPollsKeyboard.push([{text: "◀️", callback_data: "back"},{text:"️▶️", callback_data: "forward"}]);
  await ctx.api.sendMessage(ctx.chat.id,`${ctx.chat.first_name} polls: `,{reply_markup: { inline_keyboard: myPollsKeyboard, resize_keyboard: false }})

})


//verification
bot.on("callback_query:data", async (ctx) => {
  const str = ctx.callbackQuery.data;
  const arr = str.split(",");
  if(scenarioId !== 0){
    await bot.api.deleteMessage(adminID, scenarioId);
    scenarioId = 0;
  }
  if(arr[0].trim() === 'adminverify'){
    let {status, creator_id} = await verifyPoll(arr[1].trim());
    await ctx.deleteMessage();
    if(status === "success"){
      await ctx.api.sendMessage(creator_id, "Poll Accepted");
    }
  }else if(arr[0].trim()=== 'admindeny'){
    let { status, creator_id } = await denyPoll(arr[1].trim())
    await ctx.deleteMessage();
    if(status === "success"){
      await ctx.api.sendMessage(creator_id, "Poll Denied");
    }
  }
  //⭐
  await ctx.answerCallbackQuery(); // remove loading animation
});

// Handle other messages.
bot.on("message", (ctx) => ctx.reply("Got another message!"));
// handle 
//bot.on("message", (ctx) => ctx.reply("Got another message!"));

// Now that you specified how to handle messages, you can start your bot.
// This will connect to the Telegram servers and wait for messages.
// Start the bot.
bot.start();