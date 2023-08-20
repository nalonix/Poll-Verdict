const {getSubscriptions} = require("../firebase/firebaseUtils");

async function buildSubscriptionsKeyboard(ctx){
    let subscriptions = await getSubscriptions(ctx.chat.id);
    let tags = [
        "Career", "DecideForMe", "Explicit", "Hypothetical",
        "Life", "Relationships", "WouldYouRather", "YourOpinion", "Other"
    ];

    const rows = [];

    const addRow = (rowTags) => {
        return rowTags.map((ele) => ({
            text: subscriptions.includes(ele) ? `${ele} ✅` : ele,
            callback_data: `managesub,${ele}`
        }));
    };

    rows.push(addRow(tags.slice(0, 2)));
    rows.push(addRow(tags.slice(2, 4)));
    rows.push(addRow(tags.slice(4, 6)));
    rows.push(addRow(tags.slice(6, 8)));
    rows.push([{ text: subscriptions.includes("Other") ? `Other ✅` : "Other", callback_data: "managesub,Other" }]);
    rows.push([{text:"Main Menu", callback_data:"menu"}]);
    return rows;
}

module.exports = buildSubscriptionsKeyboard;