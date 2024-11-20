import MessageModel from "../models/messageModel.js";
import ReadReceiptModel from "../models/readReceiptModel.js";

export const createMessage = async (chatId, sender_id, message, thread_id) => {
  try {
    return await MessageModel.create({ chat_id: chatId, sender_id, message, thread_id });
  } catch (error) {
    console.error("Error creating message:", error);
    throw error;
  }
};

export const getMessageById = async (messageId) => {
  try {
    return await MessageModel.findOne({
      where: { id: messageId },
      attributes: ["id", "chat_id", "thread_id", "sender_id", "message"]
    });
  } catch (error) {
    console.error("Error getting message by ID:", error);
    throw error;
  }
};

export const getMessagesWithDetails = async (chatId) => {
  try {
    const messages = await MessageModel.findAll({
      where: { chat_id: chatId },
      attributes: [
        "id", "chat_id", "sender_id", "thread_id", "message", "is_thread_head", "createdAt"
      ],
      order: [["createdAt", "ASC"]],
    });

    return messages;
  } catch (error) {
    console.error("Error getting messages with details:", error);
    throw error;
  }
};

export const updateMessageThreadId = async (messageId, threadId) => {
  try {

    const [affectedRows] = await MessageModel.update(
      { thread_id: threadId },
      { where: { id: messageId } }
    );

    if (affectedRows === 0) {
      throw new Error("Message not found or thread_id was not updated.");
    }

    const updatedMessage = await MessageModel.findByPk(messageId);
    return updatedMessage;

  } catch (error) {
    console.error("Error while updating message's thread_id:", error);
    throw new Error("An error occurred while updating the message.");
  }
};

export const deleteMessages = async (chatId) => {
  try {
    return await MessageModel.destroy({ where: { chat_id: chatId } });
  } catch (error) {
    console.error("Error deleting messages:", error);
    throw error;
  }
};
