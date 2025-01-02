import sequelize from '../../config/databaseConnection.js';
import { Op, Sequelize } from 'sequelize';

import PermissionModel from '../models/permissionModel.js';
import ChatPermissionModel from '../models/chatPermissionsModel.js';
import ChatModel from "../models/ChatModel.js";
import ChatMembersModel from '../models/chatMembersModel.js';
import RoleModel from "../models/roleModel.js";


export const getAllRoles = async () => {
    try {
        const roles = await RoleModel.findAll({
            attributes: ["id", "name"],
        });
        return roles;
    } catch (error) {
        console.error("Error fetching roles from database:", error);
        throw new Error("Failed to fetch roles");
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

export const getRoleByName = async (name) => {
    try {
        return await RoleModel.findOne({ where: { name } });
    } catch (error) {
        console.error("Error fetching role by name:", error);
        throw error;
    }
};

export const updateRole = async (chatId, userId, role) => {
   
    try {
        const roleRecord = await RoleModel.findOne({ where: { name: role } });

        if (!roleRecord) {
            throw new Error('Role not found.');
        }

        const member = await ChatMembersModel.findOne({ where: { chat_id: chatId, user_id: userId } });

        if (!member) {
            throw new Error('User is not a member of this chat.');
        }

        member.role_id = roleRecord.id;
        await member.save();

        return { message: 'User role updated successfully.', member };
    } catch (error) {
        throw new Error('Error updating role: ' + error.message);
    }
};