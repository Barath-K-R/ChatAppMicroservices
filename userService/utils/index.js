import amqplib from 'amqplib';
import { subscribeEvents } from '../services/userService.js';

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

    await channel.assertQueue('user_details_queue', { durable: true });
    await channel.bindQueue('user_details_queue', process.env.EXCHANGE_NAME, 'fetch_user_details');

    await channel.assertQueue('update_userorg_queue', { durable: true });
    await channel.bindQueue('update_userorg_queue', process.env.EXCHANGE_NAME, 'update_user_organization');

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
    console.log("Message sent successfully " + routingKey);
  } catch (error) {
    console.error('Error publishing message:', error);
    throw error;
  }
};

export const SubscribeMessage = async () => {
  const channel = await createChannel();

  const queues = [
    { queueName: 'user_details_queue', eventHandler: subscribeEvents },
    { queueName: 'update_userorg_queue', eventHandler: subscribeEvents },
  ];

  queues.forEach(({ queueName, eventHandler }) => {
    channel.consume(
      queueName,
      (msg) => {
        if (msg && msg.content) {
          eventHandler(msg);
          channel.ack(msg);
        }
      },
      { noAck: false }
    );
    console.log(`Subscribed to queue: ${queueName}`);
  });
};


