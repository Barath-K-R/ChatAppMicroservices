import sequelize from '../../config/databaseConnection.js';
import { Op, Sequelize } from 'sequelize';

import PermissionModel from '../models/permissionModel.js';
import ChatPermissionModel from '../models/chatPermissionsModel.js';
import ChatModel from "../models/ChatModel.js";
import ChatMembersModel from '../models/chatMembersModel.js';
import RoleModel from "../models/roleModel.js";

export const getChatMembersByChatId = async (chatId) => {
    try {
        const chatMembers = await ChatMembersModel.findAll({
            where: { chat_id: chatId },
            include: [
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