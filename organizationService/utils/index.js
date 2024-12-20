import amqplib from 'amqplib';
import { subscribeEvents } from '../services/organizationService.js';

let channel;
let connection;

const createChannel = async () => {
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

    await channel.assertExchange(process.env.EXCHANGE_NAME, 'direct', { durable: true });

    await channel.assertQueue("fetch_organization_queue", {
      durable: true,
    });
    await channel.bindQueue("fetch_organization_queue", process.env.EXCHANGE_NAME, "fetch_organization");

    return channel;

  } catch (error) {
    console.error('Error creating RabbitMQ channel:', error);
    throw error;
  }
};

const publishMessage = async (routingKey, message) => {
  const channel = await createChannel()
  try {
    await channel.publish(
      process.env.EXCHANGE_NAME,
      routingKey,
      Buffer.from(JSON.stringify(message)),
      { persistent: true }
    );

  } catch (error) {
    console.error('Error publishing message:', error);
    throw error;
  }
};

export const SubscribeMessage = async () => {

  channel.consume(
    'fetch_organization_queue',
    (msg) => {
      if (msg && msg.content) {
        subscribeEvents(msg, 'fetch_organization');
        channel.ack(msg);
      }
    },
    { noAck: false }
  );
}
export { createChannel, publishMessage };
