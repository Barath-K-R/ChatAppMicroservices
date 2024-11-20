import amqplib from 'amqplib';
import dotenv from 'dotenv';
import { subscribeEvents } from '../services/threadService.js';

dotenv.config();


let channel=null;

export const createChannel = async () => {
    if (channel) {
        return channel; 
    }

    try {
        const connection = await amqplib.connect(process.env.MSG_QUEUE_URL);
        channel = await connection.createChannel();
        
       
        await channel.assertExchange(process.env.EXCHANGE_NAME, "direct", { durable: true });
        await channel.assertQueue('thread_queue', { exclusive: true }); 
        await channel.bindQueue('thread_queue', process.env.EXCHANGE_NAME, 'message_found');
        
        return channel;
    } catch (err) {
        console.error("Error creating channel:", err);
        throw err;
    }
};


export const publishMessage = async (routingKey, message) => {
    const channel = await createChannel();
    try {
        if (!channel) {
            console.error('Channel is not created.');
            throw new Error('Channel is not created.');
        }

        await channel.publish(
            process.env.EXCHANGE_NAME,
            routingKey,
            Buffer.from(JSON.stringify(message)),
            { persistent: true }
        );
        console.log("Message sent successfully "+routingKey);
    } catch (error) {
        console.error('Error publishing message:', error);
        throw error;
    }
};

export const SubscribeMessage = async () => {
    const channel = await createChannel();  

   
    channel.consume(
        'thread_queue',
        (msg) => {
            if (msg && msg.content) {
                subscribeEvents(msg);  
                channel.ack(msg);  
            }
        },
        { noAck: false }
    );
};

