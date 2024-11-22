import * as threadRepository from '../database/repositories/threadRepository.js';
import { publishMessage, createChannel } from '../utils/index.js';

export const createThread = async (chatId, sender_id, head, userIds, message) => {
    if (!chatId) {
        throw new Error("chatId is required.");
    }

    let messageExists = true;

    if (head) {
        const channel = await createChannel();
        const requestMessage = { messageId: head };
        await publishMessage("message_find", requestMessage);

        const response = await new Promise((resolve, reject) => {
            channel.consume(
                "thread_queue",
                (msg) => {
                    if (msg && msg.content) {
                        const parsedMessage = JSON.parse(msg.content.toString());
                        resolve(parsedMessage);
                    }
                },
                { noAck: true }
            );
        });

        messageExists = response;
    }

    if (head && !messageExists) {
        throw new Error("Head message not found.");
    }

    const thread = await threadRepository.createThread(chatId, head);

    const messageUpdate = {
        messageId: head,
        threadId: thread.id,
    };
    await publishMessage("message_update", messageUpdate);

    if (userIds && userIds.length) {
        await threadRepository.addMembersToThread(thread.id, userIds);
    }

    await publishMessage("message_create", { chatId, sender_id, message, thread_id: thread.id });

    return { message: "Thread and message created successfully" };
};


export const addMessageToThread = async (thread_id, sender_id, message, chatId) => {
    if (!thread_id || !sender_id || !message || !chatId) {
        throw new Error("Some fields are missing.");
    }

    const currentMembers = await threadRepository.getThreadMembersByThreadId(thread_id);
    const memberIds = currentMembers.map((member) => member.user_id);

    if (!memberIds.includes(sender_id)) {
        await threadRepository.addMembersToThread(thread_id, [sender_id]);
    }

    await publishMessage("message_create", { chatId, sender_id, message, thread_id });

    return { message: "Thread message created successfully" };
};

export const convertThreadToChat = async (threadId, name, description, currentUserId) => {
    const threadMembers = await threadRepository.getThreadMembersByThreadId(threadId);
    const userIds = threadMembers.map((member) => member.user_id);

    if (!userIds || userIds.length === 0) {
        throw new Error("No members found in the thread.");
    }

    if (!userIds.includes(currentUserId)) {
        userIds.push(currentUserId);
    }

    const newChatData = {
        currentUserId,
        userIds,
        chatType: "group",
        name,
        description,
    };

    const response = await axios.post("http://localhost:5000/chat", newChatData); // Ensure correct URL

    const newChat = response.data.newChat;

    await threadRepository.deleteThread(threadId);

    return {
        newChat,
        message: "Thread has been successfully converted to a chat",
    };
};


export const subscribeEvents = async (msg) => {
    try {
        if (msg && msg.content) {
            const messageContent = JSON.parse(msg.content.toString());
            const routingKey = msg.fields.routingKey;

            const { messageId } = messageContent;
            switch (routingKey) {
                case 'message_found':

                    break;
                default:
                    console.log(`Unhandled routing key: ${routingKey}`);
            }
        }
    } catch (error) {
        console.error("Error handling event:", error);
    }
};