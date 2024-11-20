import MessageModel from "./messageModel.js";
import ReadReceiptModel from "./readReceiptModel.js";

MessageModel.hasMany(ReadReceiptModel, {
    foreignKey: "message_id",
  });
  
  ReadReceiptModel.belongsTo(MessageModel, {
    foreignKey: "message_id",
  });