// models/RefreshTokenModel.js
import { DataTypes } from "sequelize";
import sequelize from "../../config/databaseConnection.js";
import UserModel from "./userModel.js";

const RefreshTokenModel = sequelize.define("RefreshToken", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    refresh_token: {
        type: DataTypes.STRING(255),  
        allowNull: false,
        unique: true,
    },
    created_at: {
        type: DataTypes.DATE, 
        defaultValue: DataTypes.NOW,
    },
}, {
    tableName: "refresh_tokens",
    timestamps: false, 
});

RefreshTokenModel.belongsTo(UserModel, {
    foreignKey: "user_id",
    onDelete: "CASCADE",
});

export default RefreshTokenModel;

