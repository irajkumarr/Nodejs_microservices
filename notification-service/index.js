const amqp = require("amqplib");

async function start() {
  try {
    connection = await amqp.connect("amqp://rabbitmq");
    channel = await connection.createChannel();
    await channel.assertQueue("task_created");
    console.log("Notification Service is listening to messages");
    channel.consume("task_created", (msg) => {
      const taskData = JSON.parse(msg.content.toString());
      //have to be replaced with sms or email service
      console.log("Notification New Task:", taskData);
      channel.ack(msg);
    });
  } catch (error) {
    console.log("RabbitMq connection failed", error.message);
  }
}

start();
