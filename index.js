const { Bot, Context, session, Keyboard,InlineKeyboard  } = require("grammy");
const {
    conversations,
    createConversation,
  } = require("@grammyjs/conversations");

const moment = require('moment');

//utils
const {storePoll, verifyPoll, denyPoll, preparePost, userAuth, updateUserPolls,getUserPolls} = require('./utils.js')
// Create an instance of the `Bot` class and pass your bot token to it.
const bot = new Bot("6344884543:AAEXjrKwfx8suRqlNa7u9h2TVpukxLI21tw"); // <-- put your bot token between the ""

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
    scenario: "",
    quest: " ",
    options: [],
    creator_id: "",
    created_at: moment().format('YYYY-MM-DD HH:mm')
  };

  // keyboard to select - with and without scenario
  let keyboard = new Keyboard()
  .text("With Scenario").row()
  .text("No Scenario").row().placeholder("Pick one: ").oneTime().resized();

  await ctx.reply("Pick preference: ",{reply_markup: keyboard});
  const type = await conversation.waitFor(":text");
  aPoll.creator_id = ctx.chat.id;

  //Acccpeint scenatio if wanted
  if(type.msg.text == "With Scenario"){
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
  }else if(type.msg.text != "No Scenario"){
    ctx.reply(`Invalid Input! One pick from the button. \n Operatoin terminated!`)  
    return;
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
    await ctx.reply(`Send me option ${i+1} - Max 7 \n or /done if u're done`);
    const anOption = await conversation.waitFor(":text");
    if(anOption.msg.text == "/done")
        break; 
    else
      aPoll.options.push(anOption.msg.text);
  }

  //send to user
  let options = "";
  aPoll.options.forEach((ele, i)=> options+=`${i+1}. `+ele+`\n`);

  // keyboard to select - proceed or cancel
  let userVerifyKeyboard = new InlineKeyboard()
  .text("Continue","Continue_userverify")
  .text("Cancel","Cancel_userverify");

  if(aPoll.scenario.length > 0) {
    scenarioId = await ctx.reply(`${aPoll.scenario} \n`);
    scenarioId = scenarioId.message_id;
  }
  ctx.reply(`${aPoll.quest} \n${options}`,{reply_markup: userVerifyKeyboard})
}

async function sendToAdmin(docId){

  if(aPoll.scenario.length > 0) {
    scenarioId = await bot.api.sendMessage(604247733, `${aPoll.scenario} \n`);
    scenarioId = scenarioId.message_id;
  }

  let adminVerifyKeyboard = new InlineKeyboard()
  .text("Verify",`adminverify,${docId}`).row()
  .text("Cancel",`admindeny,${docId}`);
  //send to user
  let options = "";
  aPoll.options.forEach((ele, i)=> options+=`${i+1}. `+ele+`\n`);

    await bot.api.sendMessage(604247733,`${aPoll.quest} \n${options}`,{reply_markup: adminVerifyKeyboard});
}

bot.use(createConversation(singlePoll));



// You can now register listeners on your bot object `bot`.
// grammY will call the listeners when users send messages to your bot.

async function setTimmer(){
  let toPost;
  runningFlag = true;
  setInterval(async ()=>{
    toPost = await preparePost();
    toPost.forEach(async (ele,i)=>{
      if(ele.scenario.length > 0) {
        await bot.api.sendMessage("@whatoodo", ele.scenario)
      }
      let poll = await bot.api.sendPoll("@whatoodo",ele.quest,ele.options);
      await updateUserPolls(poll.message_id, ele.quest, ele.creator_id);
    })
  }, 6000*60*2);
}

async function createPollResponse(ctx){
  if(ctx.callbackQuery)
    ctx.deleteMessage();
  ctx.reply("Creating a poll: 🟢");
  try {
    let keyboard = new Keyboard()
        .text("single poll").row()
        .text("multiple polls").row().placeholder("Pick one: ").oneTime().resized();
    await ctx.reply("Pick from options: ",{reply_markup: keyboard});
  } catch (error) {
    console.log(error)
  }
}
async function myaccountResponse(ctx){
  if(ctx.callbackQuery)
    ctx.deleteMessage();
  bot.api.sendMessage(ctx.chat.id, "User info",{
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
  ctx.replyWithChatAction("typing")
  if(!runningFlag && ctx.chat.id == 604247733){
    setTimmer();
    ctx.reply("Timer set! ⌚");
  }
  let user_name = await userAuth(ctx.message.from);
  await ctx.reply(`Welcome! ${user_name}. 👍`,{reply_markup: {inline_keyboard: [ [{text:"Create Poll", callback_data:"createpoll"}], [{text:"My account", callback_data: "account"} ]]}});
});
bot.callbackQuery("createpoll",async ctx=>{
  await createPollResponse(ctx);
})
// handle poll
bot.command("createpoll", async (ctx) => {
  await createPollResponse(ctx);
});
bot.hears('single poll', async (ctx)=>{
  await ctx.reply(`Single poll selected`, {
    reply_markup: { remove_keyboard: true },
  });
  // delete previous keyoard
  // await ctx.deleteMessage();
  await ctx.conversation.enter("singlePoll");
});

bot.hears('multiple poll', async (ctx)=>{
  //delete previous keyoard
  await ctx.answerCallbackQuery({text:"Feature coming soon ⌛"})
});

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



bot.callbackQuery('Continue_userverify', async (ctx)=>{
  // if(scenarioId !== 0){
  //   await bot.api.deleteMessage(604247733, scenarioId);
  //   scenarioId = 0;
  // }
  ctx.deleteMessage();
  const docId = await storePoll(aPoll);
  sendToAdmin(docId);
  await ctx.answerCallbackQuery({text:"Sent for verfication"})
});

bot.callbackQuery('Cancel_userverify', async (ctx)=>{
  // if(scenarioId !== 0){
  //   await bot.api.deleteMessage(604247733, scenarioId);
  //   scenarioId = 0;
  // }
  ctx.deleteMessage();
  await ctx.conversation.exit();
  await ctx.answerCallbackQuery({text:"Operation canceled"});
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
    await bot.api.deleteMessage(604247733, scenarioId);
    scenarioId = 0;
  }
  if(arr[0].trim() === 'adminverify'){
    await verifyPoll(arr[1].trim())
    await ctx.deleteMessage();
  }else if(arr[0].trim()=== 'admindeny'){
    await denyPoll(arr[1].trim())
    await ctx.deleteMessage();
  }
  //⭐
  await ctx.answerCallbackQuery({text:""}); // remove loading animation
});

// Handle other messages.
bot.on("message", (ctx) => ctx.reply("Got another message!"));
// handle 
//bot.on("message", (ctx) => ctx.reply("Got another message!"));

// Now that you specified how to handle messages, you can start your bot.
// This will connect to the Telegram servers and wait for messages.
// Start the bot.
bot.start();