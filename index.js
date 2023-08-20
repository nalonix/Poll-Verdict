const { Bot, session} = require("grammy");
const {
    conversations,
    createConversation,
  } = require("@grammyjs/conversations");


const setTimer = require("./utilityFunctions/setTimer")
//utils
const { userAuth,verifyPoll, denyPoll, getUserPolls, getSubscriptions, manageSub} = require('./firebase/firebaseUtils.js')
//
const myPollsPagination = require("./UI Controls/myPollsPagination.js")
// Create an instance of the `Bot` class and pass your bot token to it.
const bot = new Bot(""); // <-- put your bot token between the ""

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

// callbacks
const myAccountCallback  = require("./callbacks/myAccountCallback");
const menuCallback = require("./callbacks/menuCallback");
const genericCallback = require("./callbacks/genericCallback")


// Error handler
bot.catch((err, ctx) => {
  console.error('Error occurred:', err); 
});



const createPoll = require("./conversations/createPollConvo")
bot.use(createConversation(createPoll));
// middleware to check if member of channel
const checkMembership = require("./middlewares/checkMembership")
const {getSubscriberIds} = require("./firebase/firebaseUtils");
bot.use(checkMembership);






//Keyboards ⌨️
const buildSubscriptionsKeyboard = require("./keyboards/subscriptionsKeyboard")

// Handle the /start command.
bot.command("start", async(ctx) => {
  await ctx.replyWithChatAction("typing")
  if(!runningFlag && ctx.chat.id === adminID){
    await setTimer(ctx);
    runningFlag = true;
    await ctx.reply("Timer set! ⌚");
  }
  await userAuth(ctx.chat);
  await ctx.reply(`Hello ${ctx.chat.first_name}, Welcome to <b>What To Do</b> Bot!`,{parse_mode:"HTML",reply_markup: {inline_keyboard: [ [{text:"Create Poll", callback_data:"createpoll"}], [{text:"My account", callback_data: "account"} ]]}});
})

bot.command("menu",async (ctx)=> menuCallback(ctx))

bot.callbackQuery("menu",async (ctx)=>{
  await ctx.deleteMessage();
  await menuCallback(ctx);
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
  await myAccountCallback(ctx);
})
bot.callbackQuery("account",async ctx=>{
  await myAccountCallback(ctx);
})


bot.callbackQuery('mypolls',async ctx=>{
  await ctx.deleteMessage();
  let all_my_polls = await getUserPolls(ctx.chat.id);
  ctx.session.myPolls = all_my_polls;
  ctx.session.currentPage =0;
  await myPollsPagination(ctx);
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

bot.callbackQuery("mysubscriptions", async (ctx)=>{
  await ctx.deleteMessage();
  const subscriptionsKeyboard = await buildSubscriptionsKeyboard(ctx);
  await ctx.reply(`${ctx.chat.first_name} subscriptions: `,{
    reply_markup:{
      inline_keyboard:subscriptionsKeyboard
    }
  });

})

//verification
bot.on("callback_query:data", async (ctx) => {
      await genericCallback(ctx);
});

// Handle other messages.
bot.on("message", (ctx) => ctx.reply("Got another message!"));

// Start the bot.
bot.start();