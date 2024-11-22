import axios from 'axios'

const threadApi = axios.create({ baseURL: "http://localhost:8000/threads" });


export const createThread = (message) => threadApi.post("/", message);
export const addMessageToThread = (message) =>
    threadApi.post("/message", message);