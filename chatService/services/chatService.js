import * as chatRepository from '../database/repositories/chatRepository.js';
import { publishMessage, createChannel } from '../utils/index.js';
import dotenv from 'dotenv'

dotenv.config()

export const createChat = async (currentUserId, userIds, chatType, name, description, visibility, scope) => {
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

        const roleId = await chatRepository.getRoleIdByName("member");
        let newChat;

        if (chatType === "direct") {
            newChat = await chatRepository.createDirectChat(currentUserId, userIds[0], roleId);
        } else if (chatType === "group") {
            newChat = await chatRepository.createGroupChat(currentUserId, userIds, name, description, roleId);
        } else {
            newChat = await chatRepository.createChannelChat(currentUserId, userIds, name, description, visibility, scope, roleId);
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

export const getChatMembers = async (chatId) => {
    if (!chatId) {
        return { error: "Missing chatId parameter" };
    }

    try {
        const chatMembers = await chatRepository.getChatMembersByChatId(chatId);
        const userIds = chatMembers.map(member => member.user_id);

        if (userIds.length === 0) {
            return { chatMembers };
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

            await channel.close();
        } catch (error) {
            console.error("Error fetching user details:", error);
        }

        const chatMembersWithUserDetails = chatMembers.map((member) => {
            const user = userDetails?.find((user) => user.id === member.user_id) || {};
            return {
                ...member.toJSON(),
                User: user,
            };
        });

        return { chatMembers: chatMembersWithUserDetails };

    } catch (error) {
        console.error("Error fetching chat members:", error);
        return { error: "Couldn't retrieve the members." };
    }
};


export const getCurrentUserChats = async (userId, type) => {
    if (!type || !userId) {
        return { error: "Missing required parameters" };
    }

    try {
        const chats = await chatRepository.getChatsByUserIdAndType(userId, type);

        const userIds = chats.map(chat => chat.user_id);
        const response = { chats };

        if (userIds.length === 0 || type !== 'direct') {
            return response;
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

            await channel.close();
        } catch (error) {
            console.error("Error fetching user details:", error);
        }
        console.log(userDetails);
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

export const addMembersToChat = async (chatId, userIds) => {
    try {
        const chat = await chatRepository.getChatById(chatId);
        if (!chat) return { status: 404, error: "Chat not found" };

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

            await channel.close();
        } catch (error) {
            console.error("Error fetching user details:", error);
            return { status: 500, error: "Failed to validate users" };
        }


        const fetchedUserIds = userDetails?.map(user => user.id) || [];
        if (fetchedUserIds.length !== userIds.length) {
            return { status: 404, error: "One or more users not found" };
        }

        const roleId = await chatRepository.getRoleIdByName("member");
        const membersToAdd = userIds.map(userId => ({
            chat_id: chatId,
            user_id: userId,
            role_id: roleId,
        }));

        const newMembers = await chatRepository.addMembersToChatInRepo(membersToAdd);
        return { newMembers, message: "Members added successfully" };

    } catch (error) {
        console.error("Error adding members:", error);
        return { status: 500, error: "An error occurred while adding members." };
    }
};


export const removeMembersFromChat = async (chatId, userIds) => {
    try {
        const chat = await chatRepository.getChatById(chatId);
        if (!chat) return { error: "Chat not found" };

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

            await channel.close();
        } catch (error) {
            console.error("Error fetching user details:", error);
            return { error: "Failed to validate users" };
        }

        const fetchedUserIds = userDetails?.map(user => user.id) || [];
        if (fetchedUserIds.length !== userIds.length) {
            return { error: "One or more users not found" };
        }


        const removedMembers = await chatRepository.removeMembersFromChatInRepo(chatId, userIds);
        return { removedMembers, message: "Users removed successfully from the chat" };

    } catch (error) {
        console.error("Error removing members:", error);
        return { error: "An error occurred while removing members." };
    }
};

export const getRolePermissions = async (chatId, roleId) => {
    try {
        const permissions = await chatRepository.getRolePermissionsFromRepo(chatId, roleId);
        if (!permissions.length) return { status: 404, error: "No permissions found for this role in the chat" };

        return { permissions };
    } catch (error) {
        console.error("Error fetching role permissions:", error);
        return { error: "An error occurred while fetching role permissions." };
    }
};


export const getAllRolePermissions = async (chatId) => {
    try {
        const rolePermissions = await chatRepository.getAllRolePermissionsFromRepo(chatId);
        console.log(rolePermissions);
        if (!rolePermissions.length) return { status: 404, error: "No role permissions found for this chat" };

        const flatResults = rolePermissions.map(item => ({
            role_name: item.Role.name,
            permission_name: item.Permission.name,
        }));

        return { rolePermissions: flatResults };
    } catch (error) {
        console.error("Error fetching role permissions:", error);
        return { error: "An error occurred while fetching permissions." };
    }
};


export const addRolePermissions = async (chatId, roles) => {
    try {
        const roleMappings = { admin: "admin", moderator: "moderator", member: "member" };

        for (const [role, newPermissions] of Object.entries(roles)) {
            const roleRecord = await chatRepository.getRoleByName(roleMappings[role]);
            if (!roleRecord) return { error: `Role ${role} not found.` };

            const roleId = roleRecord.id;

            const currentPermissions = await chatRepository.getPermissionsByChatAndRole(chatId, roleId);
            const currentPermissionNames = currentPermissions.map(perm => perm.name);

            const permissionsToAdd = newPermissions.filter(perm => !currentPermissionNames.includes(perm));
            const permissionsToRemove = newPermissions.filter(perm => currentPermissionNames.includes(perm));

            for (const permissionName of permissionsToAdd) {
                console.log(permissionName);
                const permissionRecord = await chatRepository.getPermissionByName(permissionName);
                if (permissionRecord) {
                    await chatRepository.addPermissionToRoleInChat(chatId, roleId, permissionRecord.id);
                }
            }

            for (const permissionName of permissionsToRemove) {
                const permissionRecord = await chatRepository.getPermissionByName(permissionName);
                if (permissionRecord) {
                    await chatRepository.removePermissionFromRoleInChat(chatId, roleId, permissionRecord.id);
                }
            }
        }

        return { message: "Roles and permissions updated successfully." };
    } catch (error) {
        console.error("Error updating roles and permissions:", error);
        return { error: "An error occurred while updating roles and permissions." };
    }
};


const generateUuid = () => {
    return (
        Math.random().toString(36).substring(2, 10) +
        Date.now().toString(36)
    );
};
