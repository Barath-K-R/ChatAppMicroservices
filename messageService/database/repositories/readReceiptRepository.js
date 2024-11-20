// repositories/readReceiptRepository.js
import ReadReceiptModel from "../models/readReceiptModel.js";
import MessageModel from "../models/messageModel.js";
import { Op } from "sequelize";

export const bulkCreateReceipts = async (receipts) => {
    return await ReadReceiptModel.bulkCreate(receipts);
};

export const updateReceipts = async (messageIds, userId, date) => {
    return await ReadReceiptModel.update(
        { seen_at: date },
        { where: { message_id: { [Op.in]: messageIds }, user_id: userId } }
    );
};

export const countUnseenMessages = async (chatId, userId) => {
    return await ReadReceiptModel.count({
        where: { user_id: userId, seen_at: null },
        include: [{ model: MessageModel, where: { chat_id: chatId }, required: false }]
    });
};
