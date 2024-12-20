import MessageModel from "./messageModel.js";
import ReadReceiptModel from "./readReceiptModel.js";
import MessageReactionModel from "./messageReactionModel.js";
MessageModel.hasMany(ReadReceiptModel, {
    foreignKey: "message_id",
  });
  
ReadReceiptModel.belongsTo(MessageModel, {
  foreignKey: "message_id",
});

MessageModel.hasMany(MessageReactionModel, {
  foreignKey: "messageId", 
});

MessageReactionModel.belongsTo(MessageModel, {
  foreignKey: "messageId",
});


