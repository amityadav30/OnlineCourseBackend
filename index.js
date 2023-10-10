const express = require("express");
const app = express();

app.use(express.json());

let ADMINS = [];
let USERS = [];
let COURSES = [];

// Admin routes
app.post("/admin/signup", (req, res) => {
  // logic to sign up admin
});

app.post("/admin/login", (req, res) => {
  // logic to log in admin
});

app.post("/admin/courses", (req, res) => {
  // logic to create a course
});

app.put("/admin/courses/:courseId", (req, res) => {
  // logic to edit a course
});

app.get("/admin/courses", (req, res) => {
  // logic to get all courses
});

// User routes
// - POST /users/signup
//    Description: Creates a new user account.
//    Input: { username: 'user', password: 'pass' }
//    Output: { message: 'User created successfully', token: 'jwt_token_here' }
app.post("/users/signup", (req, res) => {
  const { username, password } = req.body;
  let user = USERS.find((item) => item.username === username);
  if (user) {
    res.status(401).send("Username already exists");
  } else {
    USERS.push({
      username,
      password,
    });
  }
});

//----------------------------------
// - POST /users/login
//    Description: Authenticates a user. It requires the user to send username and password in the headers.
//    Input: Headers: { 'username': 'user', 'password': 'pass' }
//    Output: { message: 'Logged in successfully', token: 'jwt_token_here' }
app.post("/users/login", (req, res) => {
  const { username, password } = req.headers;
  let user = USERS.find((item) => item.username === username);
  if (user) {
    if (user.password === password) {
      res.status(200).send("User successfully logged in");
    } else {
      res.status(401).send("Password invalid!!");
    }
  } else {
    res.status(401).send("User not found!!");
  }
});

app.get("/users/courses", (req, res) => {
  // logic to list all courses
});

app.post("/users/courses/:courseId", (req, res) => {
  // logic to purchase a course
});

app.get("/users/purchasedCourses", (req, res) => {
  // logic to view purchased courses
});

app.listen(3000, () => {
  console.log("Server is listening on port 3000");
});
