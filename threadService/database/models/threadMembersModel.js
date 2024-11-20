import sequelize from "../../config/databaseConnection.js";
import { DataTypes } from "sequelize";

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
