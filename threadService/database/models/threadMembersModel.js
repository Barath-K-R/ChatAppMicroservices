import sequelize from "../../config/databaseConnection.js";
import { DataTypes } from "sequelize";
import ThreadModel from "./threadModel.js";

const ThreadMembersModel = sequelize.define(
  "ThreadMembers",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    thread_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: ThreadModel, 
        key: "id", 
      },
      onDelete: "CASCADE",
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    added_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "thread_members",
    timestamps: true,
  }
);

export default ThreadMembersModel;
