
import { DataTypes } from "sequelize";
import sequelize from "../../config/databaseConnection.js";
import ChatModel from "./ChatModel.js";
import RoleModel from "./roleModel.js";

const ChatMembersModel = sequelize.define(
  "ChatMember",
  {
    chat_id: {
      type: DataTypes.INTEGER,
      references: {
        model: ChatModel,
        key: "id",
      },
      onDelete: "CASCADE",
    },
    user_id: {
      type: DataTypes.INTEGER,
    },
    role_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: RoleModel,
        key: "id",
      },
    },
    joined_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "chat_members",
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ["chat_id", "user_id"],
      },
    ],
  }
);

export default ChatMembersModel;