import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";

import sequelize from './config/databaseConnection.js'
import { messageController } from "./controllers/messageController.js";
import { SubscribeMessage } from "./utils/index.js";

import MessageModel from "./database/models/messageModel.js";
import ReadReceiptModel from "./database/models/readReceiptModel.js";
import './database/models/association.js'

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

(async () => {
    try {

        await sequelize.authenticate();
        console.log("Database connection established successfully.");

        await sequelize.sync({ alter: true });
        console.log("All models were synchronized successfully.");
        
        await SubscribeMessage();

        app.listen(process.env.PORT, () => {
            console.log(`Server running successfully on port ${process.env.PORT || 5000}`);
        });

    } catch (error) {
        console.error("Unable to connect to the database or sync models:", error);
        process.exit(1);
    }
})();

messageController(app)


