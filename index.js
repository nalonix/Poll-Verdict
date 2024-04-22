const { Bot, session} = require("grammy");
const {
    conversations,
    createConversation,
  } = require("@grammyjs/conversations");

//utils
const { fetchUserPolls } = require("./prisma/index.ts")

const myPollsPagination = require("./UI Controls/myPollsPagination.js")
// Create an instance of the `Bot` class and pass your bot token to it.
const bot = new Bot("6650564096:AAEmHT8ikxObpR8AzgJ-joez3JLzB0AxV1Y"); // <-- put your bot token between the ""


// 🟦🟦🟦🟦 Prisma
const {
  authentication, 
  createUser, 
  createUserWithInvite,
  createPollRecord
} = require('./prisma/index.ts')


const setTimer = require("./utilityFunctions/setTimer.js")

//Settings
const {adminID, channelID} = require("./botSettings");

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
const startOpsCallback = require("./callbacks/startOpsCallback")


//commands
const aboutCommand = require("./commands/aboutCommand")
const faqCommand = require("./commands/faqCommand")
const rulesCommand = require("./commands/rulesCommand")

const treeShakingCommand = require("./commands/admin/treeshakingCommand")
const calcCreditCommand = require("./commands/admin/calcCreditCommand")
const topEarnersCommand = require("./commands/admin/topEarnersCommand")
const updateUsersCommand = require("./commands/admin/updateUserDataCommand")


// Error handler
bot.catch((err, ctx) => {
  console.error('Error occurred:', err);
});



const createPoll = require("./conversations/createPollConvo")
bot.use(createConversation(createPoll));
// middleware to check if member of channel
const checkMembership = require("./middlewares/checkMembership")
bot.use(checkMembership);
//Keyboards ⌨️
const buildSubscriptionsKeyboard = require("./keyboards/subscriptionsKeyboard")

// Handle the /start command.
bot.command("start", async(ctx) => {
  // TODO: divide to different function
  await ctx.replyWithChatAction("typing");
  if(!ctx.match){
    try{
      let authResponse = await authentication(ctx.chat.id.toString());
      if(authResponse.status === "member")
        await ctx.reply(`Welcome back ${authResponse.user_name}`)
      else if(authResponse.status === "not member"){
        let new_user = await createUser(ctx.chat.username, ctx.chat.id.toString(), ctx.chat.first_name, ctx.chat.last_name)
        await ctx.reply(`Hello ${new_user.first_name}, welcome to Poll Verdict`)}
    }catch(e){
      console.error(e)
      await ctx.reply("Error authenticating user: Try again /start")      
    }
  } else {
    const argument = ctx.match;
    if(argument.toLowerCase().startsWith("ref")){
      try {
        const authResponse = await authentication(ctx.chat.id.toString())
        const refererId = parseInt(argument.slice(3))/4;
      if(authResponse.status === "not member" && refererId.toString() !== ctx.chat.id.toString()){
          const new_user = await createUserWithInvite(ctx.chat.username, ctx.chat.id.toString(), ctx.chat.first_name, ctx.chat.last_name, refererId.toString())
          new_user.status === "success" && await ctx.api.sendMessage(refererId, `User <b>${ctx.chat.first_name}</b> joined through referral link!`,{parse_mode:"HTML"});
          await ctx.reply(`Hello ${ctx.chat.first_name}, Welcome to <b>Poll Verdict</b> Bot!`,{
            parse_mode:"HTML",
            reply_markup: {
              inline_keyboard: [ 
                [{text:"Create Poll", callback_data:"createpoll"}], 
                [{text:"My account", callback_data: "account"} ]
              ]
            }
          });
      }else if(authResponse.status === "member" && refererId.toString() !== ctx.chat.id.toString() ){
          await ctx.api.sendMessage(refererId, `User <b>${ctx.chat.first_name}</b> was already registered!`,{parse_mode:"HTML"});
          await ctx.reply(`Hello ${ctx.chat.first_name}, Welcome to back to <b>Poll Verdict</b> Bot!`,
            {
              parse_mode:"HTML",
              reply_markup: 
                {
                  inline_keyboard: 
                    [ 
                      [{text:"Create Poll", callback_data:"createpoll"}], 
                    [{text:"My account", callback_data: "account"} ]
                  ]
                }
            });
      }else{
          await ctx.reply("Welcome back! 🎉")
      }
      } catch (error) {
        console.log(error);
        await ctx.reply("An error has occured")
      }
    }
  }
});

bot.command("startoperation", async (ctx) => {
  if(!runningFlag && ctx.chat.id === adminID){
    await setTimer(ctx);
    runningFlag = true;
    await ctx.reply("Timer set! ⌚");
  }else{
    await ctx.reply("No auth or Already running!")
  }
})
bot.command("menu",async (ctx)=> menuCallback(ctx))

bot.callbackQuery("menu",async (ctx)=>{
  try{
    await ctx.deleteMessage();
  }catch (e) {
    console.log(e);
  }finally{
    await menuCallback(ctx);
  }
})

bot.callbackQuery("createpoll",async ctx=>{
  try{
    await ctx.deleteMessage();
  }catch (e) {
    console.log(e);
  }finally{
    await ctx.conversation.enter("createPoll");
  }
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

  // new callback for this?
  let all_my_polls = await fetchUserPolls(ctx.chat.id.toString());
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
    console .log(e)
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

bot.command("faq", faqCommand)

bot.command("rules", rulesCommand)

bot.command("contact", async (ctx)=>{
  try{
    await ctx.reply("Contact: @doninx");
  }catch (e) {
    throw new Error(e);
  }
})


// admin commands
bot.command("treeshake", treeShakingCommand)
bot.command("calccredit", calcCreditCommand)
bot.command("topearners", topEarnersCommand)
bot.command("updateusers", updateUsersCommand)







bot.command("sendmepoll", async  ctx=>{
  await ctx.api.sendPoll(ctx.chat.id, "who",["i", "am", "impressed"]);
});


bot.on('poll_answer', async (ctx) => {
  console.log("🪸🪸🪸🪸",ctx) 

  // if (ctx.pollAnswer.option_ids.indexOf(correctAnswerId) > -1 )  {
  //     await bot.api.sendMessage(ctx.pollAnswer.user.id, "You're a genius!");
  // }
  // else {
  //     await bot.api.sendMessage(ctx.pollAnswer.user.id, "Almost correct!");
  // }
});

bot.command("test", async (ctx)=>{
  const milko = await ctx.api.getChatAdministrators(channelID);
  console.log(milko)
})




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