import * as messageRepository from "../database/repositories/messageRepository.js";
import * as readreceiptsRepository from "../database/repositories/readReceiptRepository.js";
import { publishMessage, createChannel } from "../utils/index.js";
import dotenv from 'dotenv'

dotenv.config()


export const addingMessage = async (chatId, sender_id, message, thread_id) => {
  try {
    const newMessage = await messageRepository.createMessage(chatId, sender_id, message, thread_id);
    const insertedMessage = await messageRepository.getMessageById(newMessage.id);
    return insertedMessage;
  } catch (error) {
    console.error("Error adding message:", error);
    throw new Error("An error occurred while adding the message.");
  }
};

export const getChatMessages = async (chatId) => {
  try {
    const messages = await messageRepository.getMessagesWithDetails(chatId);
    const userIds = messages.map(message => message.dataValues.sender_id);

    const channel = await createChannel();

    const responseQueue = await channel.assertQueue('message_response_queue', { durable: true });

    await channel.bindQueue(responseQueue.queue, process.env.EXCHANGE_NAME, 'user_details_fetched');

    const correlationId = generateUuid();

    let userDetails;
    channel.consume(
      responseQueue.queue,
      (msg) => {
        if (msg.properties.correlationId === correlationId) {
          userDetails = JSON.parse(msg.content.toString());
        }
      },
      { noAck: true }
    );

    channel.publish(
      process.env.EXCHANGE_NAME,
      'fetch_user_details',
      Buffer.from(JSON.stringify(userIds)),
      {
        replyTo: responseQueue.queue,
        correlationId,
      }
    );

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout waiting for user details'));
      }, 10000);

      const interval = setInterval(() => {
        if (userDetails) {
          clearTimeout(timeout);
          clearInterval(interval);
          resolve();
        }
      }, 100);
    });

    const messagesWithUserDetails = messages.map((message) => {
      const userDetail = userDetails.find(
        (user) => user.id === message.dataValues.sender_id
      );
      return {
        ...message.dataValues,
        user: userDetail || {},
      };
    });

    return messagesWithUserDetails;
  } catch (error) {
    console.error("Error fetching chat messages:", error);
    throw new Error("An error occurred while fetching chat messages.");
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

export const getUnseenMessagesCount = async (chatId, userId) => {
  try {
    const count = await readreceiptsRepository.countUnseenMessages(chatId, userId);
    return { unseenReadReceipts: count };
  } catch (error) {
    console.error("Error fetching unseen messages count:", error);
    throw new Error("An error occurred while fetching unseen messages count.");
  }
};

export const addReadReceipt = async (messageId, userIds, date) => {
  try {
    const receipts = userIds.map((userId) => ({ message_id: messageId, user_id: userId, seen_at: date }));
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

export const subscribeEvents = async (msg) => {
  try {
    if (msg && msg.content) {
      const messageContent = JSON.parse(msg.content.toString());
      const routingKey = msg.fields.routingKey;

      const { messageId } = messageContent;
      switch (routingKey) {
        case 'message_create':

          const { chatId, sender_id, message, thread_id } = messageContent;
          const addedMessage = await addingMessage(chatId, sender_id, message, thread_id);
          console.log("Message added successfully:", addedMessage);
          break;

        case 'message_update':
          const { threadId } = messageContent;
          const updatedReceipts = await messageRepository.updateMessageThreadId(messageId, threadId)
          console.log("Read receipts updated successfully:", updatedReceipts);
          break;

        case 'message_find':
          const foundMessage = await messageRepository.getMessageById(messageId);

          if (foundMessage) {
            await publishMessage('message_found', foundMessage.dataValues.id);
            console.log("Message found and forwarded to thread service:", foundMessage);
          } else {
            console.log("Message not found for ID:", messageId);
          }
          break;
        case 'user_details_fetched':
          console.log('fetched');
          console.log(messageContent);
          userDetails = messageContent;
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

