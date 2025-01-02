import * as roleRepository from '../database/repositories/rolerepository.js'

export const updateUserRole = async (chatId, userId, role) => {
    try {
        const updatedRole = await roleRepository.updateRole(chatId, userId, role);
        return updatedRole;
    } catch (error) {
        throw new Error('Error updating user role: ' + error.message);
    }
};

export const getAllRoles = async () => {
    try {
        const roles = await roleRepository.getAllRoles();

        return roles.reduce((acc, role) => {
            acc[role.name] = role.id;
            return acc;
        }, {});
    } catch (error) {
        console.error("Error in role service:", error);
        throw new Error("Failed to retrieve roles");
    }
};

const generateUuid = () => {
    return (
        Math.random().toString(36).substring(2, 10) +
        Date.now().toString(36)
    );
};