const express = require("express");
const mongoose = require("mongoose");
const app = express();
const port = 3001;

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

//create new tasks
app.post("/tasks", async (req, res) => {
  const { title, description, userId } = req.body;
  try {
    const newTask = new Task({ title, description, userId });
    await newTask.save();
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
});
