import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import sequelize from './config/databaseConnection.js';

import ChatModel from "./database/models/ChatModel.js";
import ChatMembersModel from './database/models/chatMembersModel.js';
import RoleModel from "./database/models/roleModel.js";
import PermissionModel from "./database/models/permissionModel.js";
import ChatPermissionModel from "./database/models/chatPermissionsModel.js";

import chatController from './controllers/chatController.js';
import chatMemberController from './controllers/chatMemberController.js';
import chatPermissionController from './controllers/chatPermissionController.js';
import roleController from './controllers/roleController.js';

import { setupAssociations } from "./database/models/association.js";



dotenv.config();

const app = express();


app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

(async () => {
    try {
        await sequelize.authenticate();
        console.log("Database connection established successfully.");

        await sequelize.sync({ alter: false });
        console.log("All models were synchronized successfully.");

        setupAssociations();

        roleController(app);
        chatController(app);
        chatMemberController(app);
        chatPermissionController(app);
        

        const PORT = process.env.PORT || 7000;
        app.listen(PORT, () => {
            console.log(`Server running successfully on port ${PORT}`);
        });

    } catch (error) {
        console.error("Unable to connect to the database or sync models:", error);
        process.exit(1);
    }
})();
