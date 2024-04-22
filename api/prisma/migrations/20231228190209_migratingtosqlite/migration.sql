-- CreateTable
CREATE TABLE "User" (
    "tg_user_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT,
    "first_name" TEXT,
    "last_name" TEXT,
    "Date_Of_Birth" DATETIME,
    "phone_number" TEXT,
    "join_date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "inviter_id" INTEGER,
    CONSTRAINT "User_inviter_id_fkey" FOREIGN KEY ("inviter_id") REFERENCES "User" ("tg_user_id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Bank" (
    "bank_id" TEXT NOT NULL PRIMARY KEY,
    "total_cash_history" DECIMAL NOT NULL,
    "deposit" DECIMAL NOT NULL,
    "tg_user_id" INTEGER NOT NULL,
    CONSTRAINT "Bank_tg_user_id_fkey" FOREIGN KEY ("tg_user_id") REFERENCES "User" ("tg_user_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Payouts" (
    "payout" TEXT NOT NULL PRIMARY KEY,
    "time" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amount" DECIMAL NOT NULL,
    "bank_id" TEXT,
    CONSTRAINT "Payouts_bank_id_fkey" FOREIGN KEY ("bank_id") REFERENCES "Bank" ("bank_id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Stats" (
    "stat_id" TEXT NOT NULL PRIMARY KEY,
    "engagement_count" INTEGER NOT NULL,
    "referral_count" INTEGER NOT NULL,
    "credits" DECIMAL NOT NULL,
    "post_count" INTEGER NOT NULL,
    "tg_user_id" INTEGER NOT NULL,
    CONSTRAINT "Stats_tg_user_id_fkey" FOREIGN KEY ("tg_user_id") REFERENCES "User" ("tg_user_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Subscriptions" (
    "tag_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tag_name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "PollStatus" (
    "status_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "status_name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Poll" (
    "poll_id" TEXT NOT NULL PRIMARY KEY,
    "poll_title" TEXT,
    "hasContext" BOOLEAN NOT NULL,
    "context" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "posted_at" DATETIME,
    "author_id" INTEGER NOT NULL,
    "tag_id" INTEGER NOT NULL,
    "poll_data" TEXT NOT NULL,
    "status_id" INTEGER NOT NULL DEFAULT 1,
    "message_id" INTEGER,
    CONSTRAINT "Poll_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "User" ("tg_user_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Poll_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "Subscriptions" ("tag_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Poll_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "PollStatus" ("status_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Queue" (
    "queue_id" TEXT NOT NULL PRIMARY KEY,
    "poll_id" TEXT NOT NULL,
    CONSTRAINT "Queue_poll_id_fkey" FOREIGN KEY ("poll_id") REFERENCES "Poll" ("poll_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_SubscriptionsToUser" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_SubscriptionsToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "Subscriptions" ("tag_id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_SubscriptionsToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User" ("tg_user_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_number_key" ON "User"("phone_number");

-- CreateIndex
CREATE UNIQUE INDEX "Bank_tg_user_id_key" ON "Bank"("tg_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Stats_tg_user_id_key" ON "Stats"("tg_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Subscriptions_tag_name_key" ON "Subscriptions"("tag_name");

-- CreateIndex
CREATE UNIQUE INDEX "Queue_poll_id_key" ON "Queue"("poll_id");

-- CreateIndex
CREATE UNIQUE INDEX "_SubscriptionsToUser_AB_unique" ON "_SubscriptionsToUser"("A", "B");

-- CreateIndex
CREATE INDEX "_SubscriptionsToUser_B_index" ON "_SubscriptionsToUser"("B");
