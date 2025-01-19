const Expo = require("expo-server-sdk").Expo;

const expo = new Expo();

async function sendPushNotification(token, title, body, data) {
  if (!Expo.isExpoPushToken(token)) {
    console.error(`Push token ${token} is not a valid Expo push token`);
    return;
  }

  let messages = [];

  messages.push({
    to: token,
    sound: "default",
    title: title,
    body: body,
    data: data || {},
  });

  let chunks = expo.chunkPushNotifications(messages);
  let tickets = [];

  for (let chunk of chunks) {
    try {
      let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      console.log(ticketChunk);
      tickets.push(...ticketChunk);
    } catch (error) {
      console.error(error);
    }
  }
}

module.exports = sendPushNotification;
