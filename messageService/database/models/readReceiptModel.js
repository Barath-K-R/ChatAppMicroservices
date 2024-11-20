import { DataTypes } from "sequelize";
import sequelize from "../../config/databaseConnection.js";

const ReadReceiptModel = sequelize.define(
  "ReadReceipts",
  {
    message_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "messages",
        key: "id",
      },
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    seen_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
);




export default ReadReceiptModel;
