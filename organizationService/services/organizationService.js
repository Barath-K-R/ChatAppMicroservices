import * as organizationRepository from "../datasbase/repositories/organizationRepository.js";
import { publishMessage } from "../utils/index.js";

export const createOrganization = async (name, userId) => {
    if (!name || !userId) {
        throw new Error("Invalid input");
    }

    try {
        const newOrganization = await organizationRepository.createOrganization({ name, admin: userId });

        const message = {
            userId: userId,
            organizationId: newOrganization.id,
        };

        await publishMessage('update_user_organization', message);

        return { message: "Organization created and user updated successfully", organization: newOrganization };
    } catch (error) {
        console.error("Error creating organization:", error);
        throw new Error("An error occurred while creating the organization.");
    }
};

export const joinOrganization = async (orgName, userId) => {
    if (!orgName || !userId) {
        throw new Error("Invalid input");
    }

    try {
        const organization = await organizationRepository.findOrganizationByName(orgName);

        if (!organization) {
            throw new Error("Organization not found");
        }

        const message = {
            type: 'joinOrganization',
            userId: userId,
            organizationId: organization.id,
        };

        await publishMessage('joinOrganization', message);

        return { message: "User has joined the organization successfully", organization };
    } catch (error) {
        console.error("Error joining organization:", error);
        throw new Error("An error occurred while joining the organization.");
    }
};
