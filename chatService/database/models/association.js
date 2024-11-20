import ChatModel from './ChatModel.js';
import ChatMembersModel from './chatMembersModel.js';
import ChatPermissionModel from './chatPermissionsModel.js';
import PermissionModel from './permissionModel.js';
import RoleModel from './roleModel.js';

export const setupAssociations = () => {
  // Chat Model Associations
  ChatModel.hasMany(ChatMembersModel, {
    foreignKey: "chat_id",
  });

  ChatModel.hasMany(ChatPermissionModel, {
    foreignKey: "chat_id",
    onDelete: "CASCADE",
  });

  // ChatMembersModel Associations
  ChatMembersModel.belongsTo(ChatModel, {
    foreignKey: "chat_id",
  });

  ChatMembersModel.belongsTo(RoleModel, {
    foreignKey: "role_id",
  });

  // ChatPermissionModel Associations
  ChatPermissionModel.belongsTo(ChatModel, {
    foreignKey: "chat_id",
    onDelete: "CASCADE",
  });

  ChatPermissionModel.belongsTo(RoleModel, {
    foreignKey: "role_id",
    onDelete: "CASCADE",
  });

  ChatPermissionModel.belongsTo(PermissionModel, {
    foreignKey: "permission_id",
    onDelete: "CASCADE",
  });

  // Permission Model Associations
  PermissionModel.hasMany(ChatPermissionModel, {
    foreignKey: "permission_id",
  });

  // Role Model Associations
  RoleModel.hasMany(ChatMembersModel, {
    foreignKey: "role_id",
  });

  RoleModel.hasMany(ChatPermissionModel, {
    foreignKey: "role_id",
  });
};
