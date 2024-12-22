// models/Chat.js
import { DataTypes } from "sequelize";
import sequelize from "../../config/databaseConnection.js";

const ChatModel = sequelize.define(
  "Chat",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    chat_type: {
      type: DataTypes.ENUM("channel", "group", "direct"),
      allowNull: false,
      defaultValue: "direct",
    },
    name: {
      type: DataTypes.STRING(70),
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    visibility: {
      type: DataTypes.ENUM("open", "closed"),
      allowNull: false,
      defaultValue: "open",
    },
    scope: {
      type: DataTypes.ENUM("personal", "organization"),
      allowNull: false,
      defaultValue: "organization",
    },
    organization_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      onUpdate: DataTypes.NOW,
    },
  },
  {
    tableName: "chats",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);



export default ChatModel;
