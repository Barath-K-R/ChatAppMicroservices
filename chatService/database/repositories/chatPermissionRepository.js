import sequelize from '../../config/databaseConnection.js';
import { Op, Sequelize } from 'sequelize';

import PermissionModel from '../models/permissionModel.js';
import ChatPermissionModel from '../models/chatPermissionsModel.js';
import ChatModel from "../models/ChatModel.js";
import ChatMembersModel from '../models/chatMembersModel.js';
import RoleModel from "../models/roleModel.js";

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

export const getAllPermissions = async () => {
    try {
        return await PermissionModel.findAll();
    } catch (error) {
        console.error("Error fetching all permissions:", error);
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

export const addPermissionsToChat = async (chatId) => {
   
    try {
        const roles = await RoleModel.findAll({
            where: {
                name: ['admin', 'moderator', 'member'],
            },
        });

        const adminRoleId = roles.find(role => role.name === 'admin').id;
        const memberRoleId = roles.find(role => role.name === 'member').id;

        const permissions = await PermissionModel.findAll();

        const adminPermissions = permissions.map(permission => ({
            chat_id: chatId,
            role_id: adminRoleId,
            permission_id: permission.id
        }));

        const memberPermissions = [
            {
                chat_id: chatId,
                role_id: memberRoleId,
                permission_id: permissions.find(permission => permission.name === "send message").id
            }
        ];

        await ChatPermissionModel.bulkCreate(adminPermissions);

        await ChatPermissionModel.bulkCreate(memberPermissions);

     
    } catch (error) {
        console.error("Error adding permissions to chat:", error);
        throw new Error("Failed to add permissions to chat.");
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