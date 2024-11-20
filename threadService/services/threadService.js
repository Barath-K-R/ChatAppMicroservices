
import * as threadRepository from '../database/repositories/threadRepository.js'
import { publishMessage, createChannel } from '../utils/index.js';

export const createThread = async (req, res) => {
    const { chatId, sender_id, head, userIds, message } = req.body;

    if (!chatId) {
        return res.status(400).json({ error: "chatId is required." });
    }

    try {
        let messageExists = true;

        if (head) {
            const channel = await createChannel();
            const requestMessage = { messageId: head };
            await publishMessage('message_find', requestMessage);


            const response = await new Promise((resolve, reject) => {
                channel.consume('thread_queue', (msg) => {
                    if (msg && msg.content) {

                        const parsedMessage = JSON.parse(msg.content.toString());

                        console.log('Received message:', parsedMessage);


                        resolve(parsedMessage);
                    }
                }, { noAck: true });
            });

            messageExists = response;
        }

        if (head && !messageExists) {
            return res.status(404).json({ error: "Head message not found." });
        }
        console.log('create thread');
        const thread = await threadRepository.createThread(chatId, head);

        const messageUpdate = {
            messageId: head,
            threadId: thread.id,
        };
        await publishMessage('message_update', messageUpdate);

        if (userIds && userIds.length) {
            await threadRepository.addMembersToThread(thread.id, userIds);
        }

        await publishMessage('message_create', { chatId, sender_id, message, thread_id: thread.id });

        return res.status(201).json('thread and message created successfully');

    } catch (error) {
        console.error("Error creating thread:", error);
        return res.status(500).json({ error: "Failed to create thread." });
    }
};

export const addMessageToThread = async (req, res) => {
    const { thread_id, sender_id, message, chatId } = req.body;

    if (!thread_id || !sender_id || !message || !chatId) {
        return res.status(400).json({ error: "Some fields are missing." });
    }

    try {
        const currentMembers = await threadRepository.getThreadMembersByThreadId(thread_id);
        const memberIds = currentMembers.map((member) => member.user_id);

        if (!memberIds.includes(sender_id)) {
            await threadRepository.addMembersToThread(thread_id, [sender_id]);
        }

        await publishMessage('message_create', { chatId, sender_id, message, thread_id });
        return res.status(201).json({ message: 'Thread message created successfully' });
    } catch (error) {
        console.error("Error adding message to thread:", error);
        return res.status(500).json({ error: "Failed to add message to thread." });
    }
};

export const convertThreadToChat = async (req, res) => {
    const { threadId } = req.params;
    const { name, description, currentUserId } = req.body;
    console.log(threadId);
    try {
        const threadMembers = await threadRepository.getThreadMembersByThreadId(threadId);
        const userIds = threadMembers.map(member => member.user_id);

        if (!userIds || userIds.length === 0) {
            throw new Error("No members found in the thread.");
        }

        if (!userIds.includes(currentUserId)) {
            userIds.push(currentUserId);
        }

        const newChatData = {
            currentUserId,
            userIds,
            chatType: "group",
            name,
            description,
        };

        const response = await axios.post('http://localhost:5000/chat', newChatData); // Ensure correct URL

        const newChat = response.data.newChat;

        await MessageModel.update(
            { thread_id: null, chat_id: newChat.id },
            { where: { thread_id: threadId } }
        );

        await threadRepository.deleteThread(threadId);

        return res.send({
            newChat,
            message: "Thread has been successfully converted to a chat",
        });
    } catch (error) {
        console.error("Error during thread to chat conversion:", error);
        return res.status(500).send({ error: "An error occurred while converting the thread to a chat." });
    }
};

export const subscribeEvents = async (msg) => {
    try {
        if (msg && msg.content) {
            const messageContent = JSON.parse(msg.content.toString());
            const routingKey = msg.fields.routingKey;

            const { messageId } = messageContent;
            switch (routingKey) {
                case 'message_found':

                    break;
                default:
                    console.log(`Unhandled routing key: ${routingKey}`);
            }
        }
    } catch (error) {
        console.error("Error handling event:", error);
    }
};