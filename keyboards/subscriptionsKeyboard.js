
const { fetchUserSubscriptions} = require("../prisma/index.ts");
const {TAGS} = require("../constants/CONSTANTS.js")


async function buildSubscriptionsKeyboard(ctx){
    let subscriptions =  await fetchUserSubscriptions(ctx.chat.id.toString());

    const rows = [];

    const addRow = (rowTags) => {
        return rowTags.map((ele) => ({
            text: subscriptions.includes(ele) ? `${ele} ✅` : ele,
            callback_data: `managesub,${ele}`
        }));
    };

    rows.push(addRow(TAGS.slice(0, 2)));
    rows.push(addRow(TAGS.slice(2, 4)));
    rows.push(addRow(TAGS.slice(4, 6)));
    rows.push(addRow(TAGS.slice(6, 8)));
    rows.push([{ text: subscriptions.includes("Other") ? `Other ✅` : "Other", callback_data: "managesub,Other" }]);
    rows.push([{text:"Main Menu", callback_data:"menu"}]);
    return rows;
}

module.exports = buildSubscriptionsKeyboard;