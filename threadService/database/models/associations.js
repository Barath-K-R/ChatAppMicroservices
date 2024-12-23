import ThreadMembersModel from "./threadMembersModel.js";
import ThreadModel from "./threadModel.js";

export const setUpAssoaciations = () => {
    ThreadModel.hasMany(ThreadMembersModel, {
        foreignKey: 'thread_id',
        onDelete: 'CASCADE',
    });

    ThreadMembersModel.belongsTo(ThreadModel, {
        foreignKey: 'thread_id',
        onDelete: 'CASCADE',
    });
}