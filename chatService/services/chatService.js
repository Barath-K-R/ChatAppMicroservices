
import * as chatRepository from '../database/repositories/chatRepository.js';
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
            await chatRepository.addPermissionsToChat(newChat.chat_id)
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
    console.log('entered into service');
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
            Buffer.from(JSON.stringify({threadId})),
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

        console.log(threadMembers);
        if (threadMembers) {
            const userIds = threadMembers.map(member => member.user_id).filter(id => id !== currentUserId);

            console.log(userIds);
            const newGroup = await chatRepository.createGroupChat(
                currentUserId,
                userIds,
                name,
                description,
                organization_id,
            );

            return newGroup;
        }

    } catch (error) {
        console.error("Error converting thread to group:", error);
        throw new Error("Failed to convert thread to group.");
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
            return chatMembers;
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
                const timeout = setTimeout(() => reject(new Error("Timeout waiting for user details")), 2000);
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

        const chatMembersWithUserDetails = chatMembers.map((member) => {
            const user = userDetails?.find((user) => user.id === member.user_id) || {};
            return {
                ...member.toJSON(),
                User: user,
            };
        });

        return chatMembersWithUserDetails;

    } catch (error) {
        console.error("Error fetching chat members:", error);
        return { error: "Couldn't retrieve the members." };
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

        } catch (error) {
            console.error("Error fetching user details:", error);
            return { status: 500, error: "Failed to validate users" };
        }

        console.log(chat.chat_type);

        const fetchedUserIds = userDetails?.map(user => user.id) || [];
        if (fetchedUserIds.length !== userIds.length) {
            return { status: 404, error: "One or more users not found" };
        }

        let roleId = null;
        if (chat.chat_type === 'channel')
            roleId = await chatRepository.getRoleIdByName("member");
        const membersToAdd = userIds.map(userId => ({
            chat_id: chatId,
            user_id: userId,
            role_id: roleId,
        }));

        const newMembers = await chatRepository.addMembersToChatInRepo(membersToAdd);

        const roles = await chatRepository.getAllRoles();
        const newMembersWithDetails = newMembers.map(member => {
            const userDetail = userDetails.find(user => user.id === member.user_id) || {};
            const roleDetail = roles.find(role => role.id === member.role_id) || {};

            return {
                ...member.toJSON(),
                User: userDetail || null,
                Role: roleDetail || null,
            };
        });
        return { newMembersWithDetails, message: "Members added successfully" };

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

export const getAllRoles = async () => {
    try {
        const roles = await chatRepository.getAllRoles();

        return roles.reduce((acc, role) => {
            acc[role.name] = role.id;
            return acc;
        }, {});
    } catch (error) {
        console.error("Error in role service:", error);
        throw new Error("Failed to retrieve roles");
    }
};

export const getRolePermissions = async (chatId, roleId) => {
    try {
        const permissions = await chatRepository.getRolePermissionsFromRepo(chatId, roleId);
        if (!permissions.length) return { status: 404, error: "No permissions found for this role in the chat" };

        return permissions;
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

        return flatResults;
    } catch (error) {
        console.error("Error fetching role permissions:", error);
        return { error: "An error occurred while fetching permissions." };
    }
};

export const updateUserRole = async (chatId, userId, role) => {
    try {
        const updatedRole = await chatRepository.updateRole(chatId, userId, role);
        return updatedRole;
    } catch (error) {
        throw new Error('Error updating user role: ' + error.message);
    }
};


export const updateRolePermissions = async (chatId, permissions) => {
    console.log(permissions);
    try {
        const roleMappings = { admin: "admin", moderator: "moderator", member: "member" };

        const allPermissions = await chatRepository.getAllPermissions();
        const permissionMap = allPermissions.reduce((acc, perm) => {
            acc[perm.name] = perm.id;
            return acc;
        }, {});

        for (const [role, newPermissions] of Object.entries(permissions)) {
            const roleRecord = await chatRepository.getRoleByName(roleMappings[role]);
            if (!roleRecord) return { error: `Role ${role} not found.` };

            const roleId = roleRecord.id;

            const currentPermissions = await chatRepository.getPermissionsByChatAndRole(chatId, roleId);
            const currentPermissionNames = currentPermissions.map(perm => perm.name);

            const permissionsToAdd = newPermissions.filter(perm => !currentPermissionNames.includes(perm));
            const permissionsToRemove = newPermissions.filter(perm => currentPermissionNames.includes(perm));
            console.log(permissionsToAdd);
            console.log(permissionsToRemove);
            for (const permissionName of permissionsToAdd) {
                const permissionId = permissionMap[permissionName];
                if (permissionId) {
                    await chatRepository.addPermissionToRoleInChat(chatId, roleId, permissionId);
                }
            }

            for (const permissionName of permissionsToRemove) {
                const permissionId = permissionMap[permissionName];
                if (permissionId) {
                    await chatRepository.removePermissionFromRoleInChat(chatId, roleId, permissionId);
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
