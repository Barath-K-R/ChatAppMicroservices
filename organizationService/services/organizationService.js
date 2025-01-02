import * as organizationRepository from "../datasbase/repositories/organizationRepository.js";
import { publishMessage, createChannel } from "../utils/index.js";

export const createOrganization = async (orgName, userId) => {
  if (!orgName || !userId) {
    throw new Error("Invalid input");
  }

  try {
    const newOrganization = await organizationRepository.createOrganization({ orgName, admin: userId });
    console.log(newOrganization);
    console.log();
    const message = {
      userId: userId,
      organizationId: newOrganization.id,
    };

    await publishMessage('update_user_organization', message);

    return newOrganization;
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

export const subscribeEvents = async (msg, eventType) => {
  try {
    if (msg && msg.content) {
      const messageContent = JSON.parse(msg.content.toString());

      switch (eventType) {
        case 'fetch_organization':
          console.log('recieved mesage');
          const { orgName } = messageContent;
          const { replyTo, correlationId } = msg.properties;

          if (!orgName) {
            console.log("Organization name is missing in the message content.");
            return;
          }

          try {
            const organization = await organizationRepository.findOrganizationByName(orgName);
            const channel = await createChannel();

            if (replyTo && correlationId) {
              if (organization) {
                channel.sendToQueue(
                  replyTo,
                  Buffer.from(JSON.stringify(organization)),
                  { correlationId }
                );
                console.log(`Sent organization details for ${orgName} to ${replyTo}`);
              } else {
                channel.sendToQueue(
                  replyTo,
                  Buffer.from(JSON.stringify({ error: "Organization not found" })),
                  { correlationId }
                );
                console.log(`Organization ${orgName} not found.`);
              }
            } else {
              console.log("ReplyTo queue or correlationId is missing.");
            }
          } catch (error) {
            console.error("Error fetching organization details:", error);
            const channel = await createChannel();

            if (replyTo && correlationId) {
              channel.sendToQueue(
                replyTo,
                Buffer.from(JSON.stringify({ error: "Error fetching organization details" })),
                { correlationId }
              );
            }
          }
          break;

        default:
          console.log(`Unhandled routing key: ${routingKey}`);
      }
    }
  } catch (error) {
    console.error("Error handling event:", error);
  }
};

export const getOrganizationByName = async (orgName) => {
  try {
    const organization = await organizationRepository.findOrganizationByName(orgName);
    return organization;
  } catch (error) {
    console.error("Error fetching organization by name:", error);
    throw new Error("Unable to fetch organization by name");
  }
};

