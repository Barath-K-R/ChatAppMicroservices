import * as threadService from "../services/threadService.js";

const threadController = (app) => {

  app.post("/thread", (req, res) => threadService.createThread(req, res));

  app.post("/thread/message", (req, res) => threadService.addMessageToThread(req, res));
  
  app.post("/thread/:threadId", (req, res) => threadService.convertThreadToChat(req, res));


  
};

export default threadController;
