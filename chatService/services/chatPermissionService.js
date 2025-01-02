import * as chatPermissionRepository from '../database/repositories/chatPermissionRepository.js'
import * as roleRepository from '../database/repositories/roleRepository.js'

export const getRolePermissions = async (chatId, roleId) => {
    try {
        const permissions = await chatPermissionRepository.getRolePermissionsFromRepo(chatId, roleId);
        if (!permissions.length) return { status: 404, error: "No permissions found for this role in the chat" };

        return permissions;
    } catch (error) {
        console.error("Error fetching role permissions:", error);
        return { error: "An error occurred while fetching role permissions." };
    }
};


export const getAllRolePermissions = async (chatId) => {
    try {
        const rolePermissions = await chatPermissionRepository.getAllRolePermissionsFromRepo(chatId);
        
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


export const updateRolePermissions = async (chatId, permissions) => {
 
    try {
        const roleMappings = { admin: "admin", moderator: "moderator", member: "member" };

        const allPermissions = await chatPermissionRepository.getAllPermissions();
        const permissionMap = allPermissions.reduce((acc, perm) => {
            acc[perm.name] = perm.id;
            return acc;
        }, {});

        for (const [role, newPermissions] of Object.entries(permissions)) {
            const roleRecord = await roleRepository.getRoleByName(roleMappings[role]);
            if (!roleRecord) return { error: `Role ${role} not found.` };

            const roleId = roleRecord.id;

            const currentPermissions = await chatPermissionRepository.getPermissionsByChatAndRole(chatId, roleId);
            const currentPermissionNames = currentPermissions.map(perm => perm.name);

            const permissionsToAdd = newPermissions.filter(perm => !currentPermissionNames.includes(perm));
            const permissionsToRemove = newPermissions.filter(perm => currentPermissionNames.includes(perm));
            
            for (const permissionName of permissionsToAdd) {
                const permissionId = permissionMap[permissionName];
                if (permissionId) {
                    await chatPermissionRepository.addPermissionToRoleInChat(chatId, roleId, permissionId);
                }
            }

            for (const permissionName of permissionsToRemove) {
                const permissionId = permissionMap[permissionName];
                if (permissionId) {
                    await chatPermissionRepository.removePermissionFromRoleInChat(chatId, roleId, permissionId);
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