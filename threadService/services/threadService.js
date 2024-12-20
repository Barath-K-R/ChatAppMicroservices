import * as threadRepository from '../database/repositories/threadRepository.js';
import { publishMessage, createChannel } from '../utils/index.js';

export const createThread = async (chatId, sender_id, head, userIds, message) => {
    if (!chatId) {
        throw new Error("chatId is required.");
    }

    let messageExists = true;

    if (head) {
        const channel = await createChannel();
        const responseQueue = await channel.assertQueue("", { exclusive: true });
        const correlationId = generateUuid();

        channel.consume(
            responseQueue.queue,
            (msg) => {
                if (msg.properties.correlationId === correlationId) {
                    messageExists = JSON.parse(msg.content.toString());
                }
            },
            { noAck: true }
        );

        // Publish the message find request
        channel.publish(
            process.env.EXCHANGE_NAME,
            "message_find",
            Buffer.from(JSON.stringify({ messageId: head })),
            {
                replyTo: responseQueue.queue,
                correlationId,
            }
        );

        // Wait for the response or timeout
        await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error("Timeout waiting for message find response")), 10000);
            const interval = setInterval(() => {
                if (messageExists !== true) {
                    clearTimeout(timeout);
                    clearInterval(interval);
                    resolve();
                }
            }, 100);
        });

        if (!messageExists) {
            throw new Error("Head message not found.");
        }
    }

    const thread = await threadRepository.createThread(chatId, head);

    const messageUpdate = {
        messageId: head,
        threadId: thread.id,
        isThreadHead: true
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

const generateUuid = () => {
    return (
        Math.random().toString(36).substring(2, 10) +
        Date.now().toString(36)
    );
};

