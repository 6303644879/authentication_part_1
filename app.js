const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "goodreads.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

// Get Books API
app.get("/books/", async (request, response) => {
  const getBooksQuery = `
    SELECT *
    FROM book
    ORDER BY book_id;
  `;
  const booksArray = await db.all(getBooksQuery);
  response.send(booksArray);
});

// Create User API
app.post("/register", async (req, res) => {
  const { username, name, password, gender, location } = req.body;
  if (password.length < 5) {
    res.status(400);
    res.send("Password is too short");
    return;
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const userQuery = `SELECT * FROM user WHERE username='${username}';`;
  const dbResponse = await db.get(userQuery);
  if (dbResponse === undefined) {
    // Create user in user table
    const createUserQuery = `
      INSERT INTO user (username, name, password, gender, location)
      VALUES ('${username}', '${name}', '${hashedPassword}', '${gender}', '${location}');
    `;
    await db.run(createUserQuery);
    res.status(200);
    res.send("User created successfully");
  } else {
    res.status(400);
    res.send("User already exists");
  }
});

app.post("/login/", async (req, res) => {
  const { username, password } = req.body;
  const userQuery = `SELECT * FROM user WHERE username='${username}';`;
  const dbResponse = await db.get(userQuery);
  if (dbResponse === undefined) {
    // Invalid UserName
    res.status(400);
    res.send("Invalid user");
  } else {
    isPasswordMatched = await bcrypt.compare(password, dbResponse.password);
    if (isPasswordMatched === true) {
      res.status(200);
      res.send("Login success!");
    } else {
      res.status(400);
      res.send("Invalid password");
    }
  }
});

// Change Password API
// Change Password API
app.put("/change-password/", async (req, res) => {
  const { username, oldPassword, newPassword } = req.body;
  const userQuery = `SELECT * FROM user WHERE username='${username}';`;
  const dbResponse = await db.get(userQuery);
  if (dbResponse === undefined) {
    // Invalid UserName
    res.status(400);
    res.send("Invalid Username");
  } else {
    isPasswordMatched = await bcrypt.compare(oldPassword, dbResponse.password);
    if (isPasswordMatched === true) {
      if (newPassword.length < 5) {
        res.status(400);
        res.send("Password is too short");
      } else {
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        const updateUserPasswordQuery = `
          UPDATE user
          SET password = '${hashedNewPassword}'
          WHERE username = '${username}';
        `;
        await db.run(updateUserPasswordQuery);
        res.status(200);
        res.send("Password updated");
      }
    } else {
      res.status(400);
      res.send("Invalid current password");
    }
  }
});
module.exports = app;
