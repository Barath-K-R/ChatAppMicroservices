
import * as chatRepository from '../database/repositories/chatRepository.js';
import * as chatPermissionRepository from '../database/repositories/chatPermissionRepository.js'
import { publishMessage, createChannel } from '../utils/index.js';
import dotenv from 'dotenv'
dotenv.config()

export const createChat = async (currentUserId, userIds, chatType, name, description, visibility, scope, organization_id) => {
    try {
        let chatExists;

        if (chatType === 'direct') {
            chatExists = await chatRepository.isDirectChatExists(currentUserId, userIds);
        } else {
            chatExists = await chatRepository.isGroupOrChannelExists(name);
        }

        if (chatExists) {
            return { message: "Chat already exists", chatExists };
        }

        let newChat;

        if (chatType === "direct") {
            newChat = await chatRepository.createDirectChat(currentUserId, userIds[0], organization_id);
        } else if (chatType === "group") {
            newChat = await chatRepository.createGroupChat(currentUserId, userIds, name, description, organization_id);
        } else {
            newChat = await chatRepository.createChannelChat(currentUserId, userIds, name, description, visibility, scope, organization_id);
            await chatPermissionRepository.addPermissionsToChat(newChat.chat_id)
        }


        return { newChat, message: "New chat created and users added successfully" };
    } catch (error) {
        console.error("Error creating chat:", error);
        return { error: "An error occurred while processing your request." };
    }
};

export const deleteChat = async (chatId) => {
    try {
        const chat = await chatRepository.getChatById(chatId);
        if (!chat) return { message: "Chat not found" };

        await chatRepository.deleteChatById(chatId);
        return { message: "Chat and related data deleted successfully" };
    } catch (error) {
        console.error("Error deleting chat:", error);
        return { error: "Failed to delete chat" };
    }
};

export const convertThreadToGroup = async (threadId, name, description, currentUserId, organization_id) => {

    try {
        const channel = await createChannel();
        const responseQueue = await channel.assertQueue("", { exclusive: true });
        const correlationId = generateUuid();

        let threadMembers;

        channel.consume(
            responseQueue.queue,
            (msg) => {
                if (msg.properties.correlationId === correlationId) {
                    threadMembers = JSON.parse(msg.content.toString());
                }
            },
            { noAck: true }
        );

        // Publish the request to fetch thread members
        channel.publish(
            process.env.EXCHANGE_NAME,
            "fetch_thread_members",
            Buffer.from(JSON.stringify({ threadId })),
            {
                replyTo: responseQueue.queue,
                correlationId,
            }
        );

        // Wait for the thread members response
        await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error("Timeout waiting for thread members")), 2000);
            const interval = setInterval(() => {
                if (threadMembers) {
                    clearTimeout(timeout);
                    clearInterval(interval);
                    resolve();
                }
            }, 100);
        });

   
        if (threadMembers) {
            const userIds = threadMembers.map(member => member.user_id).filter(id => id !== currentUserId);

         
            const newGroup = await chatRepository.createGroupChat(
                currentUserId,
                userIds,
                name,
                description,
                organization_id,
            );

            await publishMessage("delete_thread", { threadId });
            await publishMessage("message_convert", { oldChatId: threadMembers[0].Thread.chat_id, newChatId: newGroup.chat_id });
            return newGroup;
        }

    } catch (error) {
        console.error("Error converting thread to group:", error);
        throw new Error("Failed to convert thread to group.");
    }
};

export const getUserChatsByChatType = async (userId, type) => {
    if (!type || !userId) {
        return [];
    }

    try {
        const chats = await chatRepository.getChatsByUserIdAndType(userId, type);

        const userIds = chats.map(chat => chat.user_id);

        if (userIds.length === 0 || type !== 'direct') {
            return chats;
        }

        let userDetails;
        try {
            const channel = await createChannel();
            const responseQueue = await channel.assertQueue("", { exclusive: true });
            const correlationId = generateUuid();

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
                "fetch_user_details",
                Buffer.from(JSON.stringify(userIds)),
                {
                    replyTo: responseQueue.queue,
                    correlationId,
                }
            );

            await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => reject(new Error("Timeout waiting for user details")), 10000);
                const interval = setInterval(() => {
                    if (userDetails) {
                        clearTimeout(timeout);
                        clearInterval(interval);
                        resolve();
                    }
                }, 100);
            });
        } catch (error) {
            console.error("Error fetching user details:", error);
        }

        const chatWithUserDetails = chats.map((chat) => {
            const user = userDetails?.find((user) => user.id === chat.user_id) || {};
            return {
                ...chat.toJSON(),
                User: user,
            };
        });

        return chatWithUserDetails;

    } catch (error) {
        console.error("Error fetching user chats:", error);
        return { error: "Internal Server Error" };
    }
};

export const getAllChatsWithUserDetails = async (userId) => {
    try {

        const allChats = await chatRepository.getAllChatsByUserId(userId);

        const directChats = allChats.filter(chat => chat.Chat.chat_type === 'direct');
        const groupAndChannelChats = allChats.filter(chat => chat.Chat.chat_type !== 'direct');

        if (directChats.length > 0) {

            const userIds = directChats.map(chat => chat.user_id);

            let userDetails;

            const channel = await createChannel();
            const responseQueue = await channel.assertQueue("", { exclusive: true });
            const correlationId = crypto.randomUUID();

            const responsePromise = new Promise((resolve, reject) => {

                channel.consume(
                    responseQueue.queue,
                    (msg) => {
                        if (msg.properties.correlationId === correlationId) {
                            userDetails = JSON.parse(msg.content.toString());
                            resolve();
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
                { replyTo: responseQueue.queue, correlationId }
            );

            await responsePromise;

            const enrichedDirectChats = directChats.map((chat) => {
                const user = userDetails.find(user => user.id === chat.user_id);
                return {
                    ...chat.toJSON(),
                    user: user || {},
                };
            });

            const allChatsWithUserDetails = [...enrichedDirectChats, ...groupAndChannelChats];

            return allChatsWithUserDetails;
        } else {
            return groupAndChannelChats;
        }
    } catch (error) {
        console.error('Error fetching all chats with user details:', error);
        throw new Error('Unable to fetch chats');
    }
};


const generateUuid = () => {
    return (
        Math.random().toString(36).substring(2, 10) +
        Date.now().toString(36)
    );
};
