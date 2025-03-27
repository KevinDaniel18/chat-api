"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = sendPushNotification;
const expo_server_sdk_1 = require("expo-server-sdk");
const expo = new expo_server_sdk_1.Expo();
function sendPushNotification(token_1, title_1, body_1) {
    return __awaiter(this, arguments, void 0, function* (token, title, body, data = {}) {
        if (!expo_server_sdk_1.Expo.isExpoPushToken(token)) {
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
                let ticketChunk = yield expo.sendPushNotificationsAsync(chunk);
                console.log(ticketChunk);
                tickets.push(...ticketChunk);
            }
            catch (error) {
                console.error(error);
            }
        }
    });
}
