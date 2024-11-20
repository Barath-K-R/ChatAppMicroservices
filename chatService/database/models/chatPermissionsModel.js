import { DataTypes } from "sequelize";
import sequelize from "../../config/databaseConnection.js";
import PermissionModel from "./permissionModel.js";
import ChatModel from "./ChatModel.js";
import RoleModel  from "./roleModel.js";

const ChatPermissionModel = sequelize.define(
  "ChatPermission",
  {
    chat_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: ChatModel,
        key: "id",
      },
      onDelete: "CASCADE",
    },
    role_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: RoleModel,
        key: "id",
      },
      onDelete: "CASCADE",
    },
    permission_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: PermissionModel,
        key: "id",
      },
      onDelete: "CASCADE",
    },
  },
  {
    tableName: "chat_permissions",
    timestamps: false,
    primaryKey: false,
    indexes: [
      {
        unique: true,
        fields: ["chat_id", "role_id", "permission_id"],
      },
    ],
  }
);





export default ChatPermissionModel;