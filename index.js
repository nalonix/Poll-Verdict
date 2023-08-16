const { Bot, session} = require("grammy");
const {
    conversations,
    createConversation,
  } = require("@grammyjs/conversations");


const setTimer = require("./utilityFunctions/setTimer")
//utils
const { verifyPoll, denyPoll, getUserPolls} = require('./utils.js')
//
const myPollsPagination = require("./myPollsPagination.js")
// Create an instance of the `Bot` class and pass your bot token to it.
const bot = new Bot("6539896023:AAG-0vOFSeJxmCU526JZOvxrSK_TFR7tdYo"); // <-- put your bot token between the ""

//Settings
const {adminID} = require("./botSettings");

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



const createPoll = require("./conversations/createPollConvo")
bot.use(createConversation(createPoll));
// middleware to check if member of channel
const checkMembership = require("./middlewares/checkMembership")
bot.use(checkMembership);

// You can now register listeners on your bot object `bot`.
// grammY will call the listeners when users send messages to your bot.



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
    await setTimer(ctx);
    await ctx.reply("Timer set! ⌚");
  }
  await ctx.reply(`Hello ${ctx.chat.first_name}, Welcome to <b>What To Do</b> Bot!`,{parse_mode:"HTML",reply_markup: {inline_keyboard: [ [{text:"Create Poll", callback_data:"createpoll"}], [{text:"My account", callback_data: "account"} ]]}});
})

bot.command("menu",async (ctx)=>{
  await ctx.reply(`Here's the menu, what would you like to do?`,{parse_mode:"HTML",reply_markup: {inline_keyboard: [ [{text:"Create Poll", callback_data:"createpoll"}], [{text:"My account", callback_data: "account"} ]]}});
})

bot.callbackQuery("menu",async (ctx)=>{
  await ctx.deleteMessage();
  await ctx.reply(`Here's the menu, what would you like to do?`,{parse_mode:"HTML",reply_markup: {inline_keyboard: [ [{text:"Create Poll", callback_data:"createpoll"}], [{text:"My account", callback_data: "account"} ]]}});
})


bot.callbackQuery("createpoll",async ctx=>{
  await ctx.deleteMessage();
  await ctx.conversation.enter("createPoll");
});
// handle poll
bot.command("createpoll", async (ctx) => {
  await ctx.conversation.enter("createPoll");
});



bot.command("account",async (ctx)=>{
  await myaccountResponse(ctx);
})
bot.callbackQuery("account",async ctx=>{
  await myaccountResponse(ctx);
})
// bot.command("cancel", async (ctx) => {
//   await ctx.conversation.exit();
//   await ctx.replyWithChatAction("typing");
//   bot.api.sendMessage(ctx.chat.id, "Operation canceled", {reply_markup: { remove_keyboard: true },})
// });




bot.callbackQuery('mypolls',async ctx=>{
  await ctx.deleteMessage();
  let all_my_polls = await getUserPolls(ctx.chat.id);
  ctx.session.myPolls = all_my_polls;
  ctx.session.currentPage =0;
  // keyboard to select - proceed or cancel
  // let myPollsKeyboard = all_my_polls.map(ele=>{
  //   return [{text:ele.quest, url: `https://t.me/pixel_verse/${ele.message_id}`}]
  // });
  //myPollsKeyboard.push([{text: "◀️", callback_data: "back"},{text:"️▶️", callback_data: "forward"}]);
  await myPollsPagination(ctx);
  //await ctx.api.sendMessage(ctx.chat.id,`${ctx.chat.first_name} polls: `,{reply_markup: { inline_keyboard: myPollsKeyboard, resize_keyboard: false }})
})

// Handle the "Next" button callback
bot.callbackQuery('next', async (ctx) => {
  try{
    await ctx.deleteMessage()
  }catch (e) {
    console.log(e)
  }
  // Increment the current page number
  ctx.session.currentPage += 1;
  // Display the next page
  await myPollsPagination(ctx);
});


bot.callbackQuery('return', async (ctx) => {
  try{
    await ctx.deleteMessage()
  }catch (e) {
    console.log(e)
  }
  // Increment the current page number
  ctx.session.currentPage -= 1;
  // Display the next page
  await myPollsPagination(ctx);
});

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