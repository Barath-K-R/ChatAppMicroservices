import axios from 'axios'

const messageApi = axios.create({ baseURL: "http://localhost:8000/messages" });

export const addMessage = (message) => messageApi.post("/", message);
export const getMessages = (id) => messageApi.get(`/${id}`);
export const unseenMessageCount = (chatId, userId) =>
  messageApi.get(`/${chatId}/unseen?userId=${userId}`);
export const deleteMessages = (chatId) => messageApi.delete(`/${chatId}`);

export const createReadReciept = (userIds, messageId) =>
  messageApi.post(`/read-receipts/${messageId}`, userIds);
export const updateReadReciepts = (readReceipt) =>
  messageApi.put("/read-reciepts", readReceipt);
export const updateReactions = (messageId, reaction, userId) => messageApi.post(`/${messageId}/reactions`, { userId, reaction })