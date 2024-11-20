import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";

import sequelize from './config/databaseConnection.js'
import UserController from "./controllers/userController.js";
import { SubscribeMessage } from "./utils/index.js";

import userModel from './datasbase/models/userModel.js'
import RefreshTokenModel from "./datasbase/models/refreshTokenModel.js";

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

        SubscribeMessage();
        app.listen(process.env.PORT, () => {
            console.log(`Server running successfully on port ${process.env.PORT || 8000}`);
        });

    } catch (error) {
        console.error("Unable to connect to the database or sync models:", error);
        process.exit(1);
    }
})();

UserController(app)






