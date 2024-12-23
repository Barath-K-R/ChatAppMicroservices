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

    return { newThread: thread, message: "Thread and message created successfully" };
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

export const getThreadMembers = async (threadId) => {
    console.log(threadId);
    try {
        const threadMembers = await threadRepository.getThreadMembersByThreadId(threadId);
        console.log(threadMembers);
        if (threadMembers.length === 0) {
            return { message: "No members found for this thread." };
        }
        return threadMembers;
    } catch (error) {
        console.error("Error in getThreadMembers service:", error);
        throw error;
    }
};

export const addMembersToThread = async (threadId, userIds) => {
    try {
        const addedMembers = await threadRepository.addMembersToThread(threadId, userIds);

        return addedMembers;
    } catch (error) {
        console.error("Error in addMembersToThread service:", error);
        throw new Error("Failed to add members to thread.");
    }
};

export const getThreadsByUser = async (userId) => {
    try {
        const threads = await threadRepository.findThreadsByUserId(userId);
        return threads;
    } catch (error) {
        throw new Error("Error fetching threads for user: " + error.message);
    }
};

export const deleteThread = async (threadId) => {
    if (!threadId) {
        throw new Error("Thread ID is required.");
    }
    
    try {
        const thread = await threadRepository.getThreadById(threadId);
        if (!thread) {
            throw new Error("Thread not found.");
        }

        const deletionResult = await threadRepository.deleteThreadById(threadId);
    } catch (error) {
        console.error("Error in deleteThread service:", error);
        throw new Error("Failed to delete thread.");
    }
};

export const subscribeEvents = async (msg, event) => {
    const channel = await createChannel();

    try {
        const payload = JSON.parse(msg.content); 

        switch (event) {
            case "fetch_thread_members":
                {
                    const { threadId } = payload;
                    console.log("Fetching members for thread:", threadId);
                    const members = await getThreadMembers(threadId);

                    const { replyTo, correlationId } = msg.properties;
                    if (replyTo && correlationId) {
                        channel.sendToQueue(replyTo, Buffer.from(JSON.stringify(members)), {
                            correlationId,
                        });
                    }
                }
                break;

            case "delete_thread":
                {
                    const { threadId } = payload;
                    console.log("Deleting thread:", threadId);
                    await deleteThread(threadId);
                }
                break;

            default:
                console.warn("Unhandled event type:", event);
        }

        channel.ack(msg);
    } catch (error) {
        console.error(`Error processing event (${event}):`, error);
        channel.nack(msg, false, true); 
    }
};


const generateUuid = () => {
    return (
        Math.random().toString(36).substring(2, 10) +
        Date.now().toString(36)
    );
};

