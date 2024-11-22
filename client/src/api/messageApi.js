import axios from 'axios'

const messageApi = axios.create({ baseURL: "http://localhost:8000/messages" });

export const addMessage = (message) => messageApi.post("/", message);
export const getMessages = (id) => messageApi.get(`/${id}`);
export const unseenMessageCount = (chatId, userId) =>
    messageApi.get(`/chats/${chatId}/unseen?userId=${userId}`);
export const deleteMessages=(chatId)=>messageApi.delete(`/chats/${chatId}`);

export const addReadReciept = (reciept, messageId) =>
    messageApi.post(`/read-receipts/${messageId}`, reciept);
  export const updateReadReciepts = (readReceipt) =>
    messageApi.put("/read-reciepts", readReceipt);