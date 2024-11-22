import amqplib from 'amqplib';

let channel;

const createChannel = async () => {
  if (channel) return channel;
  try {
    const connection = await amqplib.connect(process.env.MSG_QUEUE_URL);
    channel = await connection.createChannel();

    await channel.assertExchange(process.env.EXCHANGE_NAME, 'direct', { durable: true });

    connection.on('close', () => {
      console.error('RabbitMQ connection closed.');
      channel = null;
    });

    connection.on('error', (err) => {
      console.error('RabbitMQ connection error:', err);
      channel = null;
    });

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

export { createChannel, publishMessage };
