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

export const createDirectChat = async (currentUserId, otherUserId,organization_id) => {
    try {

        const memberRoleId = await getRoleIdByName('member');

        const newChat = await ChatModel.create({
            chat_type: "direct",
            organization_id
        });

        await ChatMembersModel.bulkCreate([
            { chat_id: newChat.id, user_id: currentUserId, role_id: memberRoleId },
            { chat_id: newChat.id, user_id: otherUserId, role_id: memberRoleId },
        ]);

        const newChatWithMembers = await ChatMembersModel.findOne({
            where: { chat_id: newChat.id },
            include: [
              {
                model: ChatModel,
              },
            ],
            attributes: ["chat_id"],
          });

        return newChatWithMembers;
    } catch (error) {
        console.error("Error creating direct chat:", error);
        throw error;
    }
};

export const createGroupChat = async (currentUserId, userIds, name, description,organization_id) => {
    try {
        const newGroup = await ChatModel.create({
            chat_type: "group",
            name,
            description,
            organization_id
        });
        const groupMembers = userIds.map((user) => ({
            chat_id: newGroup.id,
            user_id: user,
            role_id: null,
        }));
        groupMembers.push({ chat_id: newGroup.id, user_id: currentUserId, role_id: null });
        await ChatMembersModel.bulkCreate(groupMembers);

        const newGroupWithMembers = await ChatMembersModel.findOne({
            where: { chat_id: newGroup.id },
            include: [
              {
                model: ChatModel,
              },
            ],
            attributes: ["chat_id"], 
          });

        return newGroupWithMembers;
    } catch (error) {
        console.error("Error creating group chat:", error);
        throw error;
    }
};

export const createChannelChat = async (currentUserId, userIds, name, description, visibility, scope,organization_id) => {
    try {
        const adminRoleId = await getRoleIdByName('admin');
        const memberRoleId = await getRoleIdByName('member');

        const newChannel = await ChatModel.create({
            chat_type: "channel",
            name,
            description,
            visibility,
            scope,
            organization_id
        });

        const channelMembers = userIds.map((user) => ({
            chat_id: newChannel.id,
            user_id: user,
            role_id: memberRoleId,
        }));
        channelMembers.push({ chat_id: newChannel.id, user_id: currentUserId, role_id: adminRoleId });

        await ChatMembersModel.bulkCreate(channelMembers);

        const newChannelWithMembers = await ChatMembersModel.findOne({
            where: { chat_id: newChannel.id },
            include: [
              {
                model: ChatModel,
              },
            ],
            attributes: ["chat_id"], 
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
        return chats;
    } catch (error) {
        console.error("Error fetching chats by user ID and type:", error);
        throw error;
    }
};

export const getAllChatsByUserId = async (userId) => {
    try {
        const directChats = await ChatMembersModel.findAll({
            attributes: ['chat_id', 'user_id'],
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
                        chat_type: 'direct',
                    },
                    attributes: ["id", "name", "chat_type"],
                },
            ],
        });
        const groupAndChannelChats = await ChatMembersModel.findAll({
            attributes: ['chat_id'],
            include: [
                {
                    model: ChatModel,
                    attributes: ['id', 'name', 'description', 'visibility', 'scope', 'chat_type'],
                },
            ],
            where: {
                user_id: userId,
            },
        });

        const allChats = [...directChats, ...groupAndChannelChats];

        return allChats;
    } catch (error) {
        console.error('Error fetching all chats by user ID:', error);
        throw new Error('Unable to fetch chats');
    }
};
