/*
  Warnings:

  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Bank" (
    "bank_id" TEXT NOT NULL PRIMARY KEY,
    "total_cash_history" DECIMAL NOT NULL,
    "deposit" DECIMAL NOT NULL,
    "tg_user_id" TEXT NOT NULL,
    CONSTRAINT "Bank_tg_user_id_fkey" FOREIGN KEY ("tg_user_id") REFERENCES "User" ("tg_user_id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Bank" ("bank_id", "deposit", "tg_user_id", "total_cash_history") SELECT "bank_id", "deposit", "tg_user_id", "total_cash_history" FROM "Bank";
DROP TABLE "Bank";
ALTER TABLE "new_Bank" RENAME TO "Bank";
CREATE UNIQUE INDEX "Bank_tg_user_id_key" ON "Bank"("tg_user_id");
CREATE TABLE "new_Stats" (
    "stat_id" TEXT NOT NULL PRIMARY KEY,
    "engagement_count" INTEGER NOT NULL,
    "referral_count" INTEGER NOT NULL,
    "credits" DECIMAL NOT NULL,
    "post_count" INTEGER NOT NULL,
    "tg_user_id" TEXT NOT NULL,
    CONSTRAINT "Stats_tg_user_id_fkey" FOREIGN KEY ("tg_user_id") REFERENCES "User" ("tg_user_id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Stats" ("credits", "engagement_count", "post_count", "referral_count", "stat_id", "tg_user_id") SELECT "credits", "engagement_count", "post_count", "referral_count", "stat_id", "tg_user_id" FROM "Stats";
DROP TABLE "Stats";
ALTER TABLE "new_Stats" RENAME TO "Stats";
CREATE UNIQUE INDEX "Stats_tg_user_id_key" ON "Stats"("tg_user_id");
CREATE TABLE "new_Poll" (
    "poll_id" TEXT NOT NULL PRIMARY KEY,
    "poll_title" TEXT,
    "hasContext" BOOLEAN NOT NULL,
    "context" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "posted_at" DATETIME,
    "author_id" TEXT NOT NULL,
    "tag_id" INTEGER NOT NULL,
    "poll_data" TEXT NOT NULL,
    "status_id" INTEGER NOT NULL DEFAULT 1,
    "message_id" INTEGER,
    CONSTRAINT "Poll_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "User" ("tg_user_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Poll_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "Subscriptions" ("tag_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Poll_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "PollStatus" ("status_id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Poll" ("author_id", "context", "created_at", "hasContext", "message_id", "poll_data", "poll_id", "poll_title", "posted_at", "status_id", "tag_id") SELECT "author_id", "context", "created_at", "hasContext", "message_id", "poll_data", "poll_id", "poll_title", "posted_at", "status_id", "tag_id" FROM "Poll";
DROP TABLE "Poll";
ALTER TABLE "new_Poll" RENAME TO "Poll";
CREATE TABLE "new_User" (
    "tg_user_id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT,
    "first_name" TEXT,
    "last_name" TEXT,
    "Date_Of_Birth" DATETIME,
    "phone_number" TEXT,
    "join_date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "inviter_id" TEXT,
    CONSTRAINT "User_inviter_id_fkey" FOREIGN KEY ("inviter_id") REFERENCES "User" ("tg_user_id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_User" ("Date_Of_Birth", "first_name", "inviter_id", "join_date", "last_name", "phone_number", "tg_user_id", "username") SELECT "Date_Of_Birth", "first_name", "inviter_id", "join_date", "last_name", "phone_number", "tg_user_id", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "User_phone_number_key" ON "User"("phone_number");
CREATE TABLE "new__SubscriptionsToUser" (
    "A" INTEGER NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_SubscriptionsToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "Subscriptions" ("tag_id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_SubscriptionsToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User" ("tg_user_id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new__SubscriptionsToUser" ("A", "B") SELECT "A", "B" FROM "_SubscriptionsToUser";
DROP TABLE "_SubscriptionsToUser";
ALTER TABLE "new__SubscriptionsToUser" RENAME TO "_SubscriptionsToUser";
CREATE UNIQUE INDEX "_SubscriptionsToUser_AB_unique" ON "_SubscriptionsToUser"("A", "B");
CREATE INDEX "_SubscriptionsToUser_B_index" ON "_SubscriptionsToUser"("B");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
