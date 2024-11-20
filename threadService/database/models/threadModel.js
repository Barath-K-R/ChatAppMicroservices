import sequelize from "../../config/databaseConnection.js";
import { DataTypes } from "sequelize";

const ThreadModel = sequelize.define('Thread', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    chat_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    head: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
}, {
    timestamps: true
});

export default ThreadModel;
