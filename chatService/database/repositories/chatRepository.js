// repositories/chatRepository.js
import sequelize from '../../config/databaseConnection.js';
import { Op, Sequelize } from 'sequelize';

import PermissionModel from '../models/permissionModel.js';
import ChatPermissionModel from '../models/chatPermissionsModel.js';
import ChatModel from "../models/ChatModel.js";
import ChatMembersModel from '../models/chatMembersModel.js';
import RoleModel from "../models/roleModel.js";


export const isDirectChatExists = async (currentUserId, userIds) => {
    try {
        const combinedUserIds = [...userIds, currentUserId];
        const chats = await sequelize.query(
            `SELECT cm.chat_id
             FROM chat_members cm
             JOIN chats c ON c.id = cm.chat_id
             WHERE c.chat_type = 'direct' AND cm.user_id IN (:combinedUserIds)
             GROUP BY cm.chat_id
             HAVING COUNT(cm.user_id) = 2`,
            {
                replacements: { combinedUserIds },
                type: sequelize.QueryTypes.SELECT
            }
        );
        console.log(chats);
        return chats.length > 0 ? chats : null;
    } catch (error) {
        console.error("Error checking if direct chat exists:", error);
        throw error;
    }
};

export const isGroupOrChannelExists = async (chatName) => {
    try {
        const chat = await ChatModel.findOne({
            attributes: ['id'],
            where: { name: chatName },
        });
        return chat ? chat : null;
    } catch (error) {
        console.error("Error checking if group or channel exists:", error);
        throw error;
    }
};

export const getRoleIdByName = async (roleName) => {
    try {
        const role = await RoleModel.findOne({
            where: { name: roleName },
            attributes: ['id'],
        });
        return role ? role.id : null;
    } catch (error) {
        console.error("Error getting role ID by name:", error);
        throw error;
    }
};

export const createDirectChat = async (currentUserId, otherUserId, roleId) => {
    try {
        const newChat = await ChatModel.create({
            chat_type: "direct",
        });

        await ChatMembersModel.bulkCreate([
            { chat_id: newChat.id, user_id: currentUserId, role_id: roleId },
            { chat_id: newChat.id, user_id: otherUserId, role_id: roleId },
        ]);

        const newChatWithMembers = await ChatModel.findOne({
            where: { id: newChat.id },
            // include: [
            //     {
            //         model: UserModel,
            //         attributes: ["id", "username"],
            //         through: { attributes: [] },
            //     },
            // ],
        });

        return newChatWithMembers;
    } catch (error) {
        console.error("Error creating direct chat:", error);
        throw error;
    }
};

export const createGroupChat = async (currentUserId, userIds, name, description, roleId) => {
    try {
        const newGroup = await ChatModel.create({
            chat_type: "group",
            name,
            description,
        });

        const groupMembers = userIds.map((user) => ({
            chat_id: newGroup.id,
            user_id: user,
            role_id: roleId,
        }));
        groupMembers.push({ chat_id: newGroup.id, user_id: currentUserId, role_id: roleId });

        await ChatMembersModel.bulkCreate(groupMembers);

        const newGroupWithMembers = await ChatModel.findOne({
            where: { id: newGroup.id },
            attributes: ["id", "name"],
        });

        return newGroupWithMembers;
    } catch (error) {
        console.error("Error creating group chat:", error);
        throw error;
    }
};

export const createChannelChat = async (currentUserId, userIds, name, description, visibility, scope, roleId) => {
    try {
        const newChannel = await ChatModel.create({
            chat_type: "channel",
            name,
            description,
            visibility,
            scope,
        });

        const channelMembers = userIds.map((user) => ({
            chat_id: newChannel.id,
            user_id: user,
            role_id: roleId,
        }));
        channelMembers.push({ chat_id: newChannel.id, user_id: currentUserId, role_id: roleId });

        await ChatMembersModel.bulkCreate(channelMembers);

        const newChannelWithMembers = await ChatModel.findOne({
            where: { id: newChannel.id },
            attributes: ["id", "name"],
        });

        return newChannelWithMembers;
    } catch (error) {
        console.error("Error creating channel chat:", error);
        throw error;
    }
};

export const getChatById = async (chatId) => {
    try {
        return await ChatModel.findByPk(chatId);
    } catch (error) {
        console.error("Error fetching chat by ID:", error);
        throw error;
    }
};

export const deleteChatById = async (chatId) => {
    try {
        const chat = await ChatModel.findByPk(chatId);

        if (chat) {
            await chat.destroy();
        }
    } catch (error) {
        console.error("Error deleting chat by ID:", error);
        throw error;
    }
};

export const getChatsByUserIdAndType = async (userId, type) => {
    try {
        let chats;

        if (type === "direct") {
            chats = await ChatMembersModel.findAll({
                attributes: ["chat_id", "user_id"],
                where: {
                    chat_id: {
                        [Op.in]: sequelize.literal(`(
                            SELECT chat_id 
                            FROM chat_members 
                            WHERE user_id = ${userId}
                        )`),
                    },
                    user_id: {
                        [Op.ne]: userId,
                    },
                },
                include: [
                    {
                        model: ChatModel,
                        where: {
                            chat_type: type,
                        },
                        attributes: ["id", "name", "chat_type"],
                    },
                ],
            });
        } else {
            chats = await ChatMembersModel.findAll({
                attributes: ["chat_id"],
                include: [
                    {
                        model: ChatModel,
                        attributes: [
                            "name",
                            "description",
                            "visibility",
                            "scope",
                            "chat_type",
                        ],
                        where: { chat_type: type },
                    },
                ],
                where: {
                    user_id: userId,
                },
            });
        }
        console.log(chats);
        return chats;
    } catch (error) {
        console.error("Error fetching chats by user ID and type:", error);
        throw error;
    }
};

export const getChatMembersByChatId = async (chatId) => {
    try {
        const chatMembers = await ChatMembersModel.findAll({
            where: { chat_id: chatId },
            include: [
                // {
                //     model: UserModel,
                //     attributes: ["id", "username"],
                // },
                {
                    model: RoleModel,
                    attributes: ["name"],
                },
            ],
            attributes: ["user_id", "role_id", "joined_at"],
        });

        return chatMembers;
    } catch (error) {
        console.error("Error fetching chat members by chat ID:", error);
        throw error;
    }
};

export const addMembersToChatInRepo = async (members) => {
    try {
        return await ChatMembersModel.bulkCreate(members);
    } catch (error) {
        console.error("Error adding members to chat:", error);
        throw error;
    }
};



export const removeMembersFromChatInRepo = async (chatId, userIds) => {
    try {
        return await ChatMembersModel.destroy({
            where: {
                chat_id: chatId,
                user_id: {
                    [Op.in]: userIds,
                },
            },
        });
    } catch (error) {
        console.error("Error removing members from chat:", error);
        throw error;
    }
};

export const getRolePermissionsFromRepo = async (chatId, roleId) => {
    try {
        return await ChatPermissionModel.findAll({
            where: {
                chat_id: chatId,
                role_id: roleId,
            },
            include: [
                {
                    model: PermissionModel,
                    attributes: ["name"],
                },
            ],
            attributes: ["chat_id", "role_id"],
        });
    } catch (error) {
        console.error("Error getting role permissions from repo:", error);
        throw error;
    }
};

export const getAllRolePermissionsFromRepo = async (chatId) => {
    try {
        return await ChatPermissionModel.findAll({
            where: {
                chat_id: chatId,
            },
            include: [
                {
                    model: PermissionModel,
                    attributes: ["name"],
                },
                {
                    model: RoleModel,
                    attributes: ["name"],
                },
            ],
            attributes: ["role_id"],
        });
    } catch (error) {
        console.error("Error getting all role permissions from repo:", error);
        throw error;
    }
};

export const getRoleByName = async (name) => {
    try {
        return await RoleModel.findOne({ where: { name } });
    } catch (error) {
        console.error("Error fetching role by name:", error);
        throw error;
    }
};

export const getPermissionsByChatAndRole = async (chatId, roleId) => {
    try {
        const permissions = await ChatPermissionModel.findAll({
            where: { chat_id: chatId, role_id: roleId },
            include: [{ model: PermissionModel, attributes: ["name"] }],
        });
        return permissions.map(permission => permission.Permission);
    } catch (error) {
        console.error("Error fetching permissions by chat and role:", error);
        throw error;
    }
};

export const getPermissionByName = async (name) => {
    try {
        return await PermissionModel.findOne({ where: { name } });
    } catch (error) {
        console.error("Error fetching permission by name:", error);
        throw error;
    }
};

export const addPermissionToRoleInChat = async (chatId, roleId, permissionId) => {
    try {
        return await ChatPermissionModel.findOrCreate({
            where: { chat_id: chatId, role_id: roleId, permission_id: permissionId },
        });
    } catch (error) {
        console.error("Error adding permission to role in chat:", error);
        throw error;
    }
};

export const removePermissionFromRoleInChat = async (chatId, roleId, permissionId) => {
    try {
        return await ChatPermissionModel.destroy({
            where: { chat_id: chatId, role_id: roleId, permission_id: permissionId },
        });
    } catch (error) {
        console.error("Error removing permission from role in chat:", error);
        throw error;
    }
};

export const findChatMember = async (chatId, userId) => {
    try {
        return await ChatMembersModel.findOne({
            where: { chat_id: chatId, user_id: userId },
        });
    } catch (error) {
        console.error("Error finding chat member:", error);
        throw error;
    }
};

export const removeChatMember = async (chatId, userId) => {
    try {
        return await ChatMembersModel.destroy({
            where: { chat_id: chatId, user_id: userId },
        });
    } catch (error) {
        console.error("Error removing chat member:", error);
        throw error;
    }
};