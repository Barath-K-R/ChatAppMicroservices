import { DataTypes } from "sequelize";
import sequelize from "../../config/databaseConnection.js";

const PermissionModel = sequelize.define(
  "Permission",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(70),
      allowNull: false,
    },
  },
  {
    tableName: "permissions",
    timestamps: false,
  }
);




export default PermissionModel;
