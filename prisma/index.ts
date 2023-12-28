const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()




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

  module.exports = {
    createUser,
    createUserWithInvite,
    authentication
  } 