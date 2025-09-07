const express = require("express");
const mongoose = require("mongoose");
const app = express();
const port = 3001;
const amqp = require("amqplib");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Server Started");
});

mongoose
  .connect("mongodb://mongo:27017/tasks")
  .then(() => {
    console.log("Mongodb connected..");
  })
  .catch((error) => {
    console.log("Mongo db error", error);
  });

const taskSchema = new mongoose.Schema({
  title: String,
  description: String,
  userId: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});
const Task = mongoose.model("Task", taskSchema);

//rabitmq
let channel, connection;

async function connectRabbitMQ(retries = 5, delay = 3000) {
  while (retries) {
    try {
      connection = await amqp.connect("amqp://rabbitmq");
      channel = await connection.createChannel();
      await channel.assertQueue("task_created");
      console.log("Connected to RabbitMq");
      return;
    } catch (error) {
      console.log("RabbitMq connection failed", error.message);
      retries--;
      console.log("Retrying again:", retries);
      await new Promise((res) => setTimeout(res, delay));
    }
  }
}

//create new tasks
app.post("/tasks", async (req, res) => {
  const { title, description, userId } = req.body;
  try {
    const newTask = new Task({ title, description, userId });
    await newTask.save();
    const message = {
      taskId: newTask._id,
      userId,
      title,
    };
    if (!channel) {
      return res.status(503).json({ error: "RabbitMq not connected" });
    }
    channel.sendToQueue("task_created", Buffer.from(JSON.stringify(message)));
    res.status(201).json(newTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

//get tasks
app.get("/tasks", async (req, res) => {
  try {
    const tasks = await Task.find({});
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.listen(port, () => {
  console.log(`Task Service Listening at port ${port}`);
  connectRabbitMQ();
});
