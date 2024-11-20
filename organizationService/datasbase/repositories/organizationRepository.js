import OrganizationModel from "../models/organizationModel.js";

export const createOrganization = async ({ name, admin }) => {
    try {
        return await OrganizationModel.create({ name, admin });
    } catch (error) {
        console.error("Error creating organization:", error);
        throw error;
    }
};

export const findOrganizationByName = async (name) => {
    try {
        return await OrganizationModel.findOne({ where: { name } });
    } catch (error) {
        console.error("Error finding organization by name:", error);
        throw error;
    }
};
