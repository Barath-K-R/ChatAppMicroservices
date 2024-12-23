import dotenv from 'dotenv'
import amqplib from 'amqplib';
import { subscribeEvents } from '../services/messageService.js';

dotenv.config()


let channel = null;
let connection;

export const createChannel = async () => {
  if (channel) return channel;

  try {
    if (!connection) {
      connection = await amqplib.connect(process.env.MSG_QUEUE_URL);

      connection.on("close", () => {
        console.error("RabbitMQ connection closed. Reconnecting...");
        connection = null;
        channel = null;
        setTimeout(createChannel, 5000);
      });

      connection.on("error", (err) => {
        console.error("RabbitMQ connection error:", err);
        connection = null;
        channel = null;
      });
    }
    channel = await connection.createChannel();

    await channel.assertExchange(process.env.EXCHANGE_NAME, "direct", { durable: true });

    await channel.assertQueue('message_find_queue', { durable: true });
    await channel.assertQueue('message_update_queue', { durable: true });
    await channel.assertQueue('message_create_queue', { durable: true });
    await channel.assertQueue('message_convert_queue', { durable: true });
    
    await channel.bindQueue('message_find_queue', process.env.EXCHANGE_NAME, 'message_find');
    await channel.bindQueue('message_update_queue', process.env.EXCHANGE_NAME, 'message_update');
    await channel.bindQueue('message_create_queue', process.env.EXCHANGE_NAME, 'message_create');
    await channel.bindQueue('message_convert_queue', process.env.EXCHANGE_NAME, 'message_convert');


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
    console.log("Message sent successfully" + routingKey);
  } catch (error) {
    console.error('Error publishing message:', error);
    throw error;
  }
};

export const SubscribeMessage = async () => {
  const channel = await createChannel();

  const queues = [
    { queue: 'message_create_queue', event: 'message_create' },
    { queue: 'message_update_queue', event: 'message_update' },
    { queue: 'message_find_queue', event: 'message_find' },
    { queue: 'message_convert_queue', event: 'message_convert' },
  ];

  queues.forEach(({ queue, event }) => {
    channel.consume(
      queue,
      (msg) => {
        if (msg && msg.content) {
          subscribeEvents(msg, event);
          channel.ack(msg);
        }
      },
      { noAck: false }
    );
  });
};

