import MessageModel from "../models/messageModel.js";
import ReadReceiptModel from "../models/readReceiptModel.js";
import MessageReactionModel from '../models/messageReactionModel.js'
export const createMessage = async (chatId, sender_id, message, thread_id) => {
  try {
    return await MessageModel.create({ chat_id: chatId, sender_id, message, thread_id });
  } catch (error) {
    console.error("Error creating message:", error);
    throw error;
  }
};

export const addForwardedMessage = async (chatId, sender_id, forwardedFromMessageId) => {
  try {
    const originalMessage = await getMessageById(forwardedFromMessageId);
    if (!originalMessage) {
      throw new Error("Original message not found.");
    }

    const newMessage = await MessageModel.create({
      chat_id: chatId,
      sender_id,
      message: originalMessage.message,
      isForwarded: true,
      forwardedFromMessageId,
    });

    return newMessage;
  } catch (error) {
    console.error("Error adding forwarded message:", error);
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


export const getMessagesByIds = async (messageIds) => {
  try {
    if (!Array.isArray(messageIds) || messageIds.length === 0) {
      return [];
    }

    const messages = await MessageModel.findAll({
      where: {
        id: messageIds,
      }
    });

    return messages;
  } catch (error) {
    console.error("Error fetching messages by IDs:", error);
    throw new Error("Unable to fetch messages by IDs.");
  }
};

export const getMessagesWithDetails = async (chatId) => {
  try {
    const messages = await MessageModel.findAll({
      where: { chat_id: chatId },
      include: [
        {
          model: MessageReactionModel,
          attributes: ['id', 'userId', 'reaction'],
        },
        {
          model: ReadReceiptModel,
          attributes: ['user_id', 'seen_at'], 
        },
      ],
      order: [["createdAt", "ASC"]],
    });

    return messages;
  } catch (error) {
    console.error("Error getting messages with details:", error);
    throw error;
  }
};

export const updateMessageThreadId = async (messageId, threadId, isThreadHead) => {
  console.log(isThreadHead);
  try {

    const [affectedRows] = await MessageModel.update(
      {
        thread_id: threadId,
        is_thread_head: isThreadHead
      },
      { where: { id: messageId } }
    );

    if (affectedRows === 0) {
      throw new Error(`Message with id ${messageId} not found or not updated.`);
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

export const updateMessagesForGroupConversion = async (oldChatId, newChatId) => {
  try {
    const [updatedCount] = await MessageModel.update(
      {
        chat_id: newChatId,     
        thread_id: null,         
        is_thread_head: false,   
      },
      {
        where: {
          chat_id: oldChatId, 
        },
      }
    );

    return updatedCount; 
  } catch (error) {
    console.error("Error updating messages for group conversion:", error);
    throw new Error("Failed to update messages for group conversion.");
  }
};

export const findReactionsByMessageId = async (messageId) => {
  try {
    const reactions = await MessageReactionModel.findAll({
      where: { messageId },
    });
    return reactions;
  } catch (error) {
    console.error("Error in findReactionsByMessageId repository:", error);
    throw new Error("Unable to fetch reactions from the database.");
  }
};

export const getReactionByMessageAndUser = async (messageId, userId) => {
  return await MessageReactionModel.findOne({
    where: {
      messageId: messageId,
      userId: userId,
    },
  });
};

export const addReactionToMessage = async (messageId, userId, reaction) => {
  return await MessageReactionModel.create({
    messageId,
    userId,
    reaction,
  });
};

export const updateReaction = async (reactionId, newReaction) => {
  const reaction = await MessageReactionModel.findByPk(reactionId);
  if (reaction) {
    reaction.reaction = newReaction;
    await reaction.save();
    return reaction;
  }
  throw new Error("Reaction not found for updating.");
};

export const removeReactionFromMessage = async (messageId, reactionId) => {
  try {

    const result = await MessageReactionModel.destroy({
      where: {
        id: reactionId,
        messageId: messageId,
      },
    });

    return result;
  } catch (error) {
    console.error("Error in removeReactionFromMessage repository:", error);
    throw new Error("Unable to remove reaction from the database.");
  }
};