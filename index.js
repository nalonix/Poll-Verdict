const { Bot, session} = require("grammy");
const {
    conversations,
    createConversation,
  } = require("@grammyjs/conversations");


const setTimer = require("./utilityFunctions/setTimer")
//utils
const { userAuth,verifyPoll, denyPoll, getUserPolls, getSubscriptions, manageSub, updateReferalCount} = require('./firebase/firebaseUtils.js')
//
const myPollsPagination = require("./UI Controls/myPollsPagination.js")
// Create an instance of the `Bot` class and pass your bot token to it.
const bot = new Bot("6539896023:AAHFtPcxBgu8Gi2MADeI51HXqNeetvVh6p0"); // <-- put your bot token between the ""

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
const generateReferalLink = require("./callbacks/getReferalLinkCallback")
const genericCallback = require("./callbacks/genericCallback")


//commands
const aboutCommand = require("./commands/aboutCommand")
const faqCommand = require("./commands/faqCommand")
const rulesCommand = require("./commands/rulesCommand")
const treeshakingCommand = require("./commands/admin/treeshakingCommand")


// Error handler
bot.catch((err, ctx) => {
  // console.error('Error occurred:', err);

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
  // TODO: divide to different function
  await ctx.replyWithChatAction("typing");
  //console.log(ctx?.match)
  if(!ctx.match){
    //normal condition
    if(!runningFlag && ctx.chat.id === adminID){
      await setTimer(ctx);
      runningFlag = true;
      await ctx.reply("Timer set! ⌚");
    }
    await userAuth(ctx.chat);
    await ctx.reply(`Hello ${ctx.chat.first_name}, Welcome to <b>What To Do</b> Bot!`,{parse_mode:"HTML",reply_markup: {inline_keyboard: [ [{text:"Create Poll", callback_data:"createpoll"}], [{text:"My account", callback_data: "account"} ]]}});
  }else{
    const argument = ctx.match;
    if(argument.toLowerCase().startsWith("ref")){
      const authResponse = await userAuth(ctx.chat);
      const refererId = parseInt(argument.slice(3))/4;
      if(authResponse.status === "new member" && refererId.toString() !== ctx.chat.id.toString()){
        try{
          const updateResponse = await updateReferalCount(refererId, ctx.chat.id, "new member");
          updateResponse.status === "success" && await ctx.api.sendMessage(refererId, `User <b>${ctx.chat.first_name}</b> joined through referral link!`,{parse_mode:"HTML"});
          await ctx.reply(`Hello ${ctx.chat.first_name}, Welcome to <b>What To Do</b> Bot!`,{parse_mode:"HTML",reply_markup: {inline_keyboard: [ [{text:"Create Poll", callback_data:"createpoll"}], [{text:"My account", callback_data: "account"} ]]}});
        }catch (e) {
          console.log(e);
          await ctx.reply("Referer not found!")
        }
      }else if(authResponse.status === "veteran member" && refererId.toString() !== ctx.chat.id.toString() ){
        try{
          const updateResponse = await updateReferalCount(refererId, ctx.chat.id, "veteran member");
          updateResponse.status === "success" && await ctx.api.sendMessage(refererId, `User <b>${ctx.chat.first_name}</b> joined through referral link!`,{parse_mode:"HTML"});
          await ctx.reply(`Hello ${ctx.chat.first_name}, Welcome to <b>What To Do</b> Bot!`,{parse_mode:"HTML",reply_markup: {inline_keyboard: [ [{text:"Create Poll", callback_data:"createpoll"}], [{text:"My account", callback_data: "account"} ]]}});
        }catch (e) {
          console.log(e);
          await ctx.reply("Referer not found!")
        }
      }else{
        await ctx.reply("Welcome back! 🎉")
      }

    }
  }
})

bot.command("menu",async (ctx)=> menuCallback(ctx))

bot.callbackQuery("menu",async (ctx)=>{
  try{
    await ctx.deleteMessage();
  }catch (e) {
    console.log(e);
  }
  await menuCallback(ctx);
})

bot.callbackQuery("createpoll",async ctx=>{
  try{
    await ctx.deleteMessage();
  }catch (e) {
    console.log(e);
  }
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
  try{
    await ctx.deleteMessage();
  }catch (e) {
    console.log(e)
  }
  let all_my_polls = await getUserPolls(ctx.chat.id);
  ctx.session.myPolls = all_my_polls;
  ctx.session.currentPage =0;
  await myPollsPagination(ctx);
});

bot.callbackQuery("getreferrallink",async (ctx)=>{
   await generateReferalLink(ctx);
});

bot.callbackQuery("mysubscriptions", async (ctx)=>{
  try{
    await ctx.deleteMessage();
  }catch (e) {
    console.log(e)
  }
  const subscriptionsKeyboard = await buildSubscriptionsKeyboard(ctx);
  await ctx.reply(`${ctx.chat.first_name} subscriptions: `,{
    reply_markup:{
      inline_keyboard:subscriptionsKeyboard
    }
  });

});

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


bot.command("about",aboutCommand)

bot.command("FAQ", faqCommand)

bot.command("rules", rulesCommand)

bot.command("contact", async (ctx)=>{
  try{
    await ctx.reply("Contact: @donidev");
  }catch (e) {
    throw new Error(e);
  }
})

bot.command("treeshake", treeshakingCommand)
//verification
bot.on("callback_query:data", async (ctx) => {
      await genericCallback(ctx);
});


bot.on("message", async (ctx) => {
  try{
    await ctx.reply("Unknown message!");
  }catch (e) {
    throw new Error(e);
  }
  // Check if the message is a reply to your poll message
  if (ctx.message.reply_to_message && ctx.message.reply_to_message.poll) {
    // const pollId = ctx.message.reply_to_message.poll.id;
    // const userId = ctx.from.id;
    console.log("⛔⛔⛔🤒");

    // Store the user ID and poll ID to track who replied to which poll
    // You can use a database or an in-memory data structure for this purpose
    // For example: pollReplies[pollId].push(userId);
  }

});



// Start the bot.
bot.start();