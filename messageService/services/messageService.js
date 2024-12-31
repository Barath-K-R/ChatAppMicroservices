import * as messageRepository from "../database/repositories/messageRepository.js";
import * as readreceiptsRepository from "../database/repositories/readReceiptRepository.js";
import { publishMessage, createChannel } from "../utils/index.js";
import crypto from 'crypto'
import dotenv from 'dotenv'

dotenv.config()


export const addingMessage = async (chatId, sender_id, message, thread_id = null, forwardedFromMessageId = null) => {
  try {
    if (forwardedFromMessageId) {
      return await messageRepository.addForwardedMessage(chatId, sender_id, forwardedFromMessageId);
    } else {
      return await messageRepository.createMessage(chatId, sender_id, message, thread_id);
    }
  } catch (error) {
    console.error("Error adding message:", error);
    throw new Error("Failed to add message.");
  }
};

export const getChatMessages = async (chatId) => {
  try {

    const messages = await messageRepository.getMessagesWithDetails(chatId);
    if (messages.length === 0)
      return [];


    const messageUserIds = messages.map((message) => message.dataValues.sender_id);
    const reactionUserIds = messages.flatMap((message) =>
      message.MessageReactions.map((reaction) => reaction.userId)
    );

    const forwardedMessageIds = messages
      .filter((message) => message.dataValues.forwardedFromMessageId)
      .map((message) => message.dataValues.forwardedFromMessageId);

    const allUserIds = [...new Set([...messageUserIds, ...reactionUserIds])];

    const forwardedMessages = await messageRepository.getMessagesByIds(forwardedMessageIds);
    const forwardedMessageUserIds = forwardedMessages.map(
      (forwardedMessage) => forwardedMessage.sender_id
    );

    const combinedUserIds = [...new Set([...allUserIds, ...forwardedMessageUserIds])];

    const channel = await createChannel();
    const responseQueue = await channel.assertQueue('', { exclusive: true });
    const correlationId = crypto.randomUUID();

    const responsePromise = new Promise((resolve, reject) => {
      channel.consume(
        responseQueue.queue,
        (msg) => {
          if (msg.properties.correlationId === correlationId) {
            const data = JSON.parse(msg.content.toString());
            resolve(data);
            channel.ack(msg);
          }
        },
        { noAck: false }
      );

      setTimeout(() => reject(new Error('Timeout waiting for user details')), 10000);
    });


    channel.publish(
      process.env.EXCHANGE_NAME,
      'fetch_user_details',
      Buffer.from(JSON.stringify(combinedUserIds)),
      {
        replyTo: responseQueue.queue,
        correlationId,
      }
    );


    const userDetails = await responsePromise;

    const messagesWithUserDetails = messages.map((message) => {
      const messageUserDetail = userDetails.find((user) => user.id === message.dataValues.sender_id);
      const forwardedMessage = forwardedMessages.find(
        (fm) => fm.id === message.dataValues.forwardedFromMessageId
      );

      const forwardedUserDetail = forwardedMessage
        ? userDetails.find((user) => user.id === forwardedMessage.sender_id)
        : {};

      const messageWithUser = {
        ...message.dataValues,
        User: messageUserDetail || {},
        forwardedMessage: forwardedMessage
          ? {
            ...forwardedMessage.dataValues,
            user: forwardedUserDetail || {},
          }
          : null,
        MessageReactions: message.MessageReactions.map((reaction) => {
          const cleanedReaction = {
            id: reaction.id,
            reaction: reaction.reaction,
            userId: reaction.userId,
            user: userDetails.find((user) => user.id === reaction.userId) || {},
          };
          return cleanedReaction;
        }),
      };

      return messageWithUser;
    });

    return messagesWithUserDetails;
  } catch (error) {
    console.error('Error fetching chat messages with reactions:', error);
    throw new Error('Unable to fetch chat messages with reactions.');
  }
};

export const updateMessagesForGroup = async (oldChatId, newChatId) => {
  console.log('UPDATING MESSAGES');
  console.log(oldChatId+' '+newChatId);
  try {
    const updatedCount = await messageRepository.updateMessagesForGroupConversion(oldChatId, newChatId);

    if (updatedCount === 0) {
      console.warn("No messages were updated during the conversion.");
    }

    return {
      message: `Successfully updated ${updatedCount} messages for group conversion.`,
      updatedMessages: updatedCount,
    };
  } catch (error) {
    console.error("Error updating messages for group conversion:", error);
    throw new Error("Failed to update messages for group conversion.");
  }
};

export const deleteChatMessages = async (chatId) => {
  try {
    const result = await messageRepository.deleteMessages(chatId);
    return result
      ? { message: "All messages deleted successfully." }
      : { message: "No messages found for this chat." };
  } catch (error) {
    console.error("Error deleting messages:", error);
    throw new Error("Failed to delete messages.");
  }
};


export const getReactions = async (messageId) => {
  try {
    const reactions = await messageRepository.findReactionsByMessageId(messageId);
    if (!reactions || reactions.length === 0) {
      return [];
    }

    const userIds = reactions.map((reaction) => reaction.userId);

    const channel = await createChannel();

    const responseQueue = await channel.assertQueue('', { exclusive: true });
    const correlationId = crypto.randomUUID();

    const responsePromise = new Promise((resolve, reject) => {
      channel.consume(
        responseQueue.queue,
        (msg) => {
          if (msg.properties.correlationId === correlationId) {
            const data = JSON.parse(msg.content.toString());
            resolve(data);
            channel.ack(msg);
          }
        },
        { noAck: false }
      );

      setTimeout(() => reject(new Error('Timeout waiting for user details')), 10000);
    });
    channel.publish(
      process.env.EXCHANGE_NAME,
      'fetch_user_details',
      Buffer.from(JSON.stringify(userIds)),
      {
        replyTo: responseQueue.queue,
        correlationId,
      }
    );

    const userDetails = await responsePromise;

    const reactionsWithUserDetails = reactions.map((reaction) => {
      const userDetail = userDetails.find(user => user.id === reaction.userId);
      return {
        id: reaction.id,
        messageId: reaction.messageId,
        userId: reaction.userId,
        reaction: reaction.reaction,
        createdAt: reaction.createdAt,
        updatedAt: reaction.updatedAt,
        user: userDetail ? { id: userDetail.id, username: userDetail.username } : {}
      };
    });

    return reactionsWithUserDetails;
  } catch (error) {
    console.error('Error fetching reactions with user details:', error);
    throw new Error('Unable to fetch reactions.');
  }
};

export const addReaction = async (messageId, userId, reaction) => {
  try {
    if (!messageId || !userId || !reaction) {
      throw new Error("Missing required fields: messageId, userId, or reaction.");
    }
    const existingReaction = await messageRepository.getReactionByMessageAndUser(messageId, userId);

    if (existingReaction) {
      const updatedReaction = await messageRepository.updateReaction(existingReaction.id, reaction);
      return updatedReaction;
    } else {
      const newReaction = await messageRepository.addReactionToMessage(messageId, userId, reaction);
      return newReaction;
    }
  } catch (error) {
    console.error("Error in addReaction service:", error);
    throw new Error("Unable to add or update reaction.");
  }
};

export const removeReaction = async (messageId, reactionId) => {
  try {
    if (!messageId || !reactionId) {
      throw new Error("Missing required fields: messageId or reactionId.");
    }

    const result = await messageRepository.removeReactionFromMessage(messageId, reactionId);

    if (!result) {
      throw new Error("Reaction not found or already removed.");
    }

    return result;
  } catch (error) {
    console.error("Error in removeReaction service:", error);
    throw new Error("Unable to remove reaction.");
  }
};

export const getUnseenMessagesCount = async (chatId, userId) => {
  try {
    const count = await readreceiptsRepository.countUnseenMessages(chatId, userId);
    return { unseenReadReceipts: count };
  } catch (error) {
    console.error("Error fetching unseen messages count:", error);
    throw new Error("An error occurred while fetching unseen messages count.");
  }
};

export const createReadReceipt = async (messageId, userIds) => {
  try {
    const receipts = userIds.map((userId) => ({ message_id: messageId, user_id: userId }));
    console.log(receipts);
    const newReceipts = await readreceiptsRepository.bulkCreateReceipts(receipts);
    return newReceipts;
  } catch (error) {
    console.error("Error adding read receipts:", error);
    throw new Error("An error occurred while adding read receipts.");
  }
};

export const updateReadReceipts = async (messageIds, userId, date) => {
  try {
    const result = await readreceiptsRepository.updateReceipts(messageIds, userId, date);
    return result;
  } catch (error) {
    console.error("Failed to update read receipts:", error);
    throw new Error("Failed to update read receipts");
  }
};

export const subscribeEvents = async (msg, eventType) => {
  console.log(eventType);
  try {
    if (msg && msg.content) {
      const messageContent = JSON.parse(msg.content.toString());

      const { messageId } = messageContent;
      switch (eventType) {
        case 'message_create':

          const { chatId, sender_id, message, thread_id } = messageContent;
          const addedMessage = await addingMessage(chatId, sender_id, message, thread_id);
          console.log("Message added successfully:", addedMessage);
          break;

        case 'message_update':
          const { threadId, isThreadHead } = messageContent;
          const updatedReceipts = await messageRepository.updateMessageThreadId(messageId, threadId, isThreadHead)
          console.log("Read receipts updated successfully:", updatedReceipts);
          break;

        case 'message_find':
          const foundMessage = await messageRepository.getMessageById(messageId);

          const correlationId = msg.properties.correlationId;
          const replyTo = msg.properties.replyTo;
          if (foundMessage && replyTo) {
            const channel = await createChannel();
            channel.sendToQueue(
              replyTo,
              Buffer.from(JSON.stringify(foundMessage.dataValues)),
              { correlationId }
            );
            console.log("Message found and sent to thread service:", foundMessage);
          } else if (!foundMessage && replyTo) {

            const channel = await createChannel();
            channel.sendToQueue(
              replyTo,
              Buffer.from(JSON.stringify({ error: "Message not found" })),
              { correlationId }
            );
            console.log("Message not found for ID:", messageId);
          }
          break;
        case 'user_details_fetched':
          console.log('fetched');
          console.log(messageContent);
          userDetails = messageContent;
          break;
        case 'message_convert':
          console.log(messageContent);
          const { oldChatId, newChatId } = messageContent;
          const conversionResult = await updateMessagesForGroup(oldChatId, newChatId);
          break;
        default:
          console.log(`Unhandled routing key: ${routingKey}`);
      }
    }
  } catch (error) {
    console.error("Error handling event:", error);
  }
};

const generateUuid = () => {
  return (
    Math.random().toString(36).substring(2, 10) +
    Date.now().toString(36)
  );
};

