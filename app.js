const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "todoApplication.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running At http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error:${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const hasPriorityAndStatus = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};
const hasPriority = (requestQuery) => {
  return requestQuery.priority !== undefined;
};
const hasStatus = (requestQuery) => {
  return requestQuery.status !== undefined;
};

//API 1
app.post("/todos/", async (req, res) => {
  const { id, todo, priority, status } = req.body;
  const addItemsInTodo = `
  INSERT INTO todo (id,todo,priority,status )
  VALUES(
      ${id},
      '${todo}',
      '${priority}',
      '${status}'
  )`;
  const result = await database.run(addItemsInTodo);
  res.send("Todo Successfully Added");
});
//API 2

app.get("/todos/:todoId", async (req, res) => {
  const { todoId } = req.params;
  const selectedTodo = `SELECT * FROM todo WHERE id=${todoId}`;
  const result = await database.get(selectedTodo);
  res.send(result);
});
//API 3

app.delete("/todos/:todoId", async (req, res) => {
  const { todoId } = req.params;
  const deleteTheTodoItem = `DELETE FROM todo WHERE id=${todoId}`;
  const response = await database.run(deleteTheTodoItem);
  res.send("Todo Deleted");
});

//API 4

app.put("/todos/:todoId", async (req, res) => {
  const { todoId } = req.params;
  let gettingUpdatedThings = "";
  const requestBody = req.body;
  switch (true) {
    case requestBody.status !== undefined:
      gettingUpdatedThings = "Status";
      break;
    case requestBody.priority !== undefined:
      gettingUpdatedThings = "Priority";
      break;
    case requestBody.todo !== undefined:
      gettingUpdatedThings = "Todo";
      break;
  }
  const previousDetails = `
  SELECT 
      * 
  FROM 
      todo 
  WHERE 
      id=${todoId}`;
  const previousTodo = await database.get(previousDetails);

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
  } = req.body;
  const updatedQuery = `
  UPDATE
   todo 
  SET 
   todo='${todo}',
   priority='${priority}',
   status='${status}'
  WHERE 
   id=${todoId}
  `;
  await database.run(updatedQuery);
  res.send(`${gettingUpdatedThings} Updated`);
});

//API 5

app.get("/todos/", async (req, res) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q = "", priority, status } = req.query;

  switch (true) {
    case hasPriorityAndStatus(req.query):
      getTodosQuery = `
        SELECT
           * 
        FROM 
           todo 
        WHERE 
           todo LIKE '%${search_q}%' 
           AND status='${status}' 
           AND priority='${priority}'

          `;
      break;
    case hasPriority(req.query):
      getTodosQuery = `
        SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND priority='${priority}'
        `;
      break;
    case hasStatus(req.query):
      getTodosQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND status = '${status}'`;
      break;
    default:
      getTodosQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%'`;
      break;
  }
  data = await database.all(getTodosQuery);
  res.send(data);
});

module.exports = app;
