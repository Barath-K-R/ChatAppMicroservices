import sequelize from "../../config/databaseConnection.js";
import { DataTypes } from "sequelize";

const MessageModel = sequelize.define(
  "Message",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    chat_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    thread_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    sender_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    is_thread_head: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    forwardedFromMessageId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "Messages",
        key: "id",
      },
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
    },
    isForwarded: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    tableName: "messages",
    timestamps: true,
  }
);

export default MessageModel;
