import axios from 'axios'

const threadApi = axios.create({ baseURL: "http://localhost:8000/threads" });


export const createThread = (message) => threadApi.post("/", message);
export const addMessageToThread = (message) =>
    threadApi.post("/message", message);
export const addMembersToThread=(threadId,userIds)=>threadApi.post(`/${threadId}/members`,userIds);

export const getThreadMembers=(threadId)=>threadApi.get(`/${threadId}/members`);