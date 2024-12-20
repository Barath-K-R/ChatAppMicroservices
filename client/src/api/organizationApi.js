import axios from "axios";

export const organizationApi = axios.create({ baseURL: "http://localhost:8000/organization" });

export const createOrganization=(orgData)=>organizationApi.post('/',orgData)