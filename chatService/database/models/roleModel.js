import { DataTypes } from "sequelize";
import sequelize from "../../config/databaseConnection.js";

const RoleModel = sequelize.define(
  "Role",
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
    tableName: "roles",
    timestamps: false,
  }
);


export default RoleModel;
