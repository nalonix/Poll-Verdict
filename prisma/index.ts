const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// types 

type pollDataType = [
  {
    quest: string,
    options: string[],
  }
]
type contextType = {
  type: string,
  text: string,
  url: string
}


async function createUser(username: string,tg_user_id: string, firstName:string, lastName:string) {
    try {
      const newUser = await prisma.user.create({
        data: {
          username,
          tg_user_id,
          first_name: firstName,
          last_name: lastName,
          // join_date will be automatically set by the database default value
          // my_polls and subscriptions will initially be left empty
          // Initialize stats_id and bank_id with default values
          stats: { create: { engagement_count: 0, referral_count: 0, credits: 0, post_count: 0 } },
          bank: { create: { total_cash_history: 0, deposit: 0 } },
          // invited_by and my_invites will initially be empty
        },
      });
      return newUser;
    } catch (error) {
      console.error('Error creating user:', error);
    }
  }

  async function authentication(tg_user_id: string) {
    try {
      // Check if the user exists in the database
      const existingUser = await prisma.user.findUnique({
        where: {
          tg_user_id: tg_user_id,
        },
      });
  
      if (existingUser) {
        // decide on the return name?
        return { status: "member", user_name: existingUser.first_name };
      } else {
        return { status: "not member", user_name: "" };
      }
    } catch (error) {
      console.error('Error:', error);
      throw error;  
    }
  }
  
  async function createUserWithInvite(
    username: string,
    tg_user_id: string,
    first_name: string,
    last_name: string,
    inviterId: string
  ) {
    try {
      const newUser = await prisma.user.create({
        data: {
          username,
          tg_user_id,
          first_name,
          last_name,
          stats: { create: { engagement_count: 0, referral_count: 0, credits: 0, post_count: 0 } },
          bank: { create: { total_cash_history: 0, deposit: 0 } },
          invited_by: { connect: { tg_user_id: inviterId } } // Set the inviter ID
        },
      });

      try {
        await prisma.user.update({
          where: {
            tg_user_id: inviterId,
          },
          data: {
            stats: {
              update: {
                referral_count: {
                  increment: 1,
                },
              },
            },
          },
        });
      } catch (error) {
        console.log('Error updating referral count');
        throw error;
      }
      return {status:"success",newUser};
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }


// poll related

async function createPollRecord(poll_title: string, hasContext: boolean, context: contextType | null, authorId: string, tagId: number, pollData: pollDataType) {
  try {
    const newPoll = await prisma.poll.create({
      data: {
        poll_title,
        hasContext,
        context: Object.is(context, null) ? null : JSON.stringify(context),
        poll_data: JSON.stringify(pollData),
        author: { connect: { tg_user_id: authorId } },
        tag: { connect: { tag_id: tagId } },
      },
    });
    return newPoll;
  } catch (error) {
    console.error('Error creating poll:', error);
    throw error;
  }
}


async function fetchPoll(pollId: string){
  try {
    const fetchedPoll = await prisma.poll.findUnique({
      where: {
        poll_id: pollId,
      },
          select: {
            poll_id: true,
            hasContext: true,
            context: true,
            tag: {
              select:{
                tag_id: true,
                tag_name: true
              }
            },
            author_id: true,
            poll_data: true,
          },
    })
    return fetchedPoll;
  } catch (error) {
    console.error('Error fetching poll: Fetch Poll');
    throw error;
  }
}

async function queuePoll(pollId: string) {
  try {
    const queuedPoll = await prisma.queue.create({
      data: {
          poll: { connect: { poll_id: pollId } }
      },
    });
    // accept poll
    try {
      await prisma.poll.update({
        where:{
          poll_id: pollId
        },
        data:{
          status: {connect: {status_id: 4}}
          // cant locate creator id 
        },
      });
      const poll = await fetchPoll(pollId);
      return {creator_id: parseInt(poll.author_id), status: 'success'};
    } catch (error) {
      console.error('Error making update: AcceptPollUpdate');
      throw error;
    }
  } catch (error) {
    console.error('Error creating poll:', error);
    throw error;
  }
}

async function denyPoll(pollId: string) {
  try {
    const deniedPoll = await prisma.poll.update({
      where:{
        poll_id: pollId
      },
      data: {
        status: {connect: {status_id: 3}}
      },
    });
    const poll = await fetchPoll(pollId);
    return {creator_id: parseInt(poll.author_id), status: 'success'};
  } catch (error) {
    console.error('Error creating poll:', error);
    throw error;
  }
}



// user related 

async function fetchUserStats(tgUserId: string){
  try {
    const userStats = await prisma.user.findUnique({
      where:{
        tg_user_id: tgUserId
      },
      select:{
        stats:{
          select:{
            referral_count: true,
            post_count: true,
          }
        },
        my_invites: true
      }
    });
    // { stats: { referral_count: 0, post_count: 0 }}
    let filteredUserStats = {
      referral_count: userStats?.stats?.referral_count,
      post_count: userStats?.stats?.post_count,
      invited_users: userStats?.my_invites.length
    }
    return {status:"success", user_stats:filteredUserStats}
  } catch (error) {
    console.log('Error fetching invites: Fetch User Stats')
   throw error
  }
}


async function fetchUserPolls(tg_user_id: string){
  try {
     const fetchedPolls = await prisma.poll.findMany({
      //  take: 5,
       where:{
          author_id: tg_user_id,
          status_id: 2
       },
      select: {
        poll_title: true,
        posted_at: true,
        message_id: true,
      },
     });
     return fetchedPolls;
  } catch (error) {
     console.log('Error fetching polls: Fetch User Polls')
     throw error
  } 
 }

 
async function fetchUserSubscriptions(tgUserId: string){

  try {
       const userSubscriptions = await prisma.user.findUnique({
         where:{
            tg_user_id: tgUserId
         },
         select:{
          subscriptions:{
            select:{
                tag_name: true
            }
          }
         }
       });
      let subsList = userSubscriptions?.subscriptions.map((ele: any)=> ele.tag_name);
      return subsList;
    } catch (error) {
       console.log('Error fetching subscriptions: Fetch User Subscriptions')
       throw error
    } 
  }

  async function manageSubscription(tgUserId: string, tagId: number) {
    try {
      const user = await prisma.user.findUnique({
        where: { tg_user_id: tgUserId },
        include: { subscriptions: true }, // Include subscriptions of the user
      });
  
      if (!user) {
        throw new Error('User not found!');
      }
  
      const tag = await prisma.subscriptions.findUnique({
        where: { tag_id: tagId },
      });
  
      if (!tag) {
        throw new Error('Tag not found!');
      }
  
      // Check if the user already has this subscription
      const isSubscribed = user.subscriptions.some(
        (subscription: any) => subscription.tag_id === tagId
      );
  
      if (isSubscribed) {    
      const updatedUser = await prisma.user.update({
        where: { tg_user_id: tgUserId },
        data: {
          subscriptions: {
            disconnect: { tag_id: tagId },
          },
        },
        include: { subscriptions: true },
      });
      return { updatedUser, status: 'success', message: 'Subscription removed'}
      }
      if (user.subscriptions.length >= 3) {
        return {status: 'fail', message: 'Subscription limit exceeded'};
      }
  
      // Add the subscription to the user's subscriptions list
      const updatedUser = await prisma.user.update({
        where: { tg_user_id: tgUserId },
        data: {
          subscriptions: {
            connect: { tag_id: tagId },
          },
        },
        include: { subscriptions: true }, // Include updated subscriptions
      });
      return {updatedUser, status: 'success', message: 'Subscription added'};
    } catch (error: any) {
        console.log('Error while manipulating subscription manageSubscription')
        throw error
    }
  }

  module.exports = {
    createUser,
    createUserWithInvite,
    authentication,

    createPollRecord,
    fetchPoll,
    queuePoll,
    denyPoll,

    fetchUserStats,
    fetchUserPolls,
    fetchUserSubscriptions,
    manageSubscription
  } 