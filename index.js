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
let aPoll = {
    scenario: "",
    quest: " ",
    options: [],
    creator_id: "",
    created_at: ""
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
  aPoll = {
    type: "single",
    scenario: "",
    quest: " ",
    options: [],
    creator_id: "",
    created_at: moment().format('YYYY-MM-DD HH:mm')
  };
  // store creator id
  aPoll.creator_id = ctx.chat.id;

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
      await ctx.reply(`Send the Scenario: 710 chracters max `, {
        reply_markup: { remove_keyboard: true },
      });
      let scenario = await conversation.waitFor(":text");
      let scenarioLength = scenario.msg.text.trim().length;

      while (scenarioLength > 710) {
        scenarioLength = scenario.msg.text.trim().length;
        await ctx.reply(`710 charcters max - Current ${scenarioLength} `);
        scenario = await conversation.waitFor(":text");
        scenarioLength = scenario.msg.text.trim().length;
      }
      // if all goes well save scenario
      aPoll.scenario = scenario.msg.text;
  }
  //Accepting quest
  await ctx.reply("Send the question: 255 Characters max", {
    reply_markup: { remove_keyboard: true },
  });
  let quest = await conversation.waitFor(":text");
  let questLength = quest.msg.text.trim().length;
  while (quest.msg.text.trim().length > 255) {
    questLength = quest.msg.text.trim().length;
    await ctx.reply(`710 charcters max - Current ${questLength} `);
    quest = await conversation.waitFor(":text");
    questLength = quest.msg.text.trim().length;
  }
  // if all goes well save quest
  aPoll.quest = quest.msg.text;

  for (let i = 0; i < 7; i++) {
    await ctx.reply(`Send option ${i+1} - Max 7 \n or /done if you are done`);
    const anOption = await conversation.waitFor(":text");
    if(anOption.msg.text === "/done")
        break; 
    else
      aPoll.options.push(anOption.msg.text);
  }

  //send to user
  let options = "";
  aPoll.options.forEach((ele, i)=> options+=`${i+1}. `+ele+`\n`);


  let scenarioId = 0;
  if(aPoll.scenario.length > 0) {
    scenarioId = await ctx.reply(`${aPoll.scenario}`);
    scenarioId = scenarioId.message_id;
  }
  await ctx.reply(`${aPoll.quest} \n${options}`,{
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
    const docId = await storePoll(aPoll);
    await sendToAdmin(docId);
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


async function chainedpoll(conversation, ctx){

}
bot.use(createConversation(chainedpoll));
async function sendToAdmin(docId){
  let adminVerifyKeyboard = new InlineKeyboard()
  .text("Verify",`adminverify,${docId}`)
  .text("Cancel",`admindeny,${docId}`);
  //send to user
  let options = "";
  aPoll.options.forEach((ele, i)=> options+=`<b>${i+1}.</b> `+ele+`\n`);
  await bot.api.sendMessage(adminID,`${aPoll.scenario}\n\n<em>${aPoll.quest}</em> \n${options}`,{reply_markup: adminVerifyKeyboard, parse_mode:"HTML"});
}
// You can now register listeners on your bot object `bot`.
// grammY will call the listeners when users send messages to your bot.

async function setTimmer(){
  let toPost;
  runningFlag = true;
  setInterval(async ()=>{
    toPost = await preparePost();

    for(let post of toPost){
      if(post.scenario.length > 0) {
        await bot.api.sendMessage(channelID, post.scenario)
      }
      let poll = await bot.api.sendPoll(channelID,post.quest,post.options);
      await updateUserPolls(poll.message_id, post.quest, post.creator_id);
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
    await setTimmer();
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
  await ctx.conversation.enter("chainedpoll")
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
    return [{text:ele.quest, url: `https://t.me/whatoodo/${ele.message_id}`}]
  });

  //myPollsKeyboard.push([{text: "◀️", callback_data: "back"},{text:"️▶️", callback_data: "forward"}]);
  bot.api.sendMessage(ctx.chat.id,`${ctx.chat.first_name} polls: `,{reply_markup: { inline_keyboard: myPollsKeyboard, resize_keyboard: false }})

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