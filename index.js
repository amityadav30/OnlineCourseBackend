const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");

app.use(express.json());
app.use(bodyParser.json());
const secretKey = "superS3cr3t1";

let ADMINS = [];
let USERS = [];
let COURSES = [];

const generateToken = (username) => {
  const token = jwt.sign({ username }, secretKey, { expiresIn: "1h" });
  return token;
};

// const verifyToken = (tokenString) => {
//   let token = tokenString.split(" ");
//   let username = jwt.verify(token, secretKey, (err, user) => {
//     if (err) return err;
//     else {
//       return user;
//     }
//   });
// };
const verifyToken = (req, res, next) => {
  let authorizationHeader = req.headers.authorization;
  let token = authorizationHeader.split(" ");

  jwt.verify(token[1], secretKey, (err, user) => {
    if (err) res.send({ message: "ewrwr", err });
    else {
      console.log("YYYY ", user);
      req.user = user;
      next();
    }
  });
};

// Admin routes
app.post("/admin/signup", (req, res) => {
  const { username, password } = req.body;
  let user = USERS.find((item) => item.username === username);
  if (user) {
    res.status(401).send("Admin already exists");
  } else {
    USERS.push({
      username,
      password,
    });
    //console.log("User ", user);
    let token = generateToken(username);
    res.send({ message: "Admin Successfully signed up!!", token });
  }
});

app.post("/admin/login", (req, res) => {
  const { username, password } = req.headers;
  let user = USERS.find((item) => item.username === username);
  console.log("USer ", user);
  if (user) {
    if (user.password === password) {
      let token = generateToken(user);
      res.send({ message: "Admin logged in!!", token });
    } else {
      res.status(401).send("Password invalid!!");
    }
  } else {
    res.status(401).send("Admin not found!!");
  }
});

// POST /admin/courses
// Description: Creates a new course.
// Input: Headers: { 'Authorization': 'Bearer jwt_token_here' }, Body: { title: 'course title', description: 'course description', price: 100, imageLink: 'https://linktoimage.com', published: true }
// Output: { message: 'Course created successfully', courseId: 1 }
app.post("/admin/courses", verifyToken, (req, res) => {
  let course = req.body;
  course.Id = COURSES.length + 1;
  COURSES.push(course);
  res.send({ message: "Course added Sucessfully", Id: course.Id });

  //console.log("WEWEW", req.user);
});

// PUT /admin/courses/:courseId
//    Description: Edits an existing course. courseId in the URL path should be replaced with the ID of the course to be edited.
//    Input: Headers: { 'Authorization': 'Bearer jwt_token_here' }, Body: { title: 'updated course title', description: 'updated course description', price: 100, imageLink: 'https://updatedlinktoimage.com', published: false }
//    Output: { message: 'Course updated successfully' }
app.put("/admin/courses/:courseId", verifyToken, (req, res) => {
  let newCourse = req.body;
  console.log("WWWWWW", req.params.courseId, newCourse);
  COURSES.forEach((item, index) => {
    console.log("Itemsssssss ", typeof item.Id, typeof req.params.courseId);
    if (item.Id == req.params.courseId) {
      newCourse.id = item.id;
      COURSES[index] = newCourse;
      console.log("WWWWWW", index, newCourse);
    }
  });
  res.send({ message: "Course updated successfully" });
});

//All Couses
// GET /admin/courses
// Description: Returns all the courses.
// Input: Headers: { 'Authorization': 'Bearer jwt_token_here' }
// Output: { courses: [ { id: 1, title: 'course title', description: 'course description', price: 100, imageLink: 'https://linktoimage.com', published: true }, ... ] }
app.get("/admin/courses", verifyToken, (req, res) => {
  res.send(COURSES);
});

// User routes
// - POST /users/signup
//    Description: Creates a new user account.
//    Input: { username: 'user', password: 'pass' }
//    Output: { message: 'User created successfully', token: 'jwt_token_here' }
app.post("/users/signup", (req, res) => {
  console.log("req ", req);
  const { username, password } = req.body;
  let user = USERS.find((item) => item.username === username);
  if (user) {
    res.status(401).send("Username already exists");
  } else {
    USERS.push({
      username,
      password,
    });
    console.log("User ", user);
    let token = generateToken(username);
    res.send({ message: "Successfully signed up!!", token });
  }
});

//User Login
// - POST /users/login
//    Description: Authenticates a user. It requires the user to send username and password in the headers.
//    Input: Headers: { 'username': 'user', 'password': 'pass' }
//    Output: { message: 'Logged in successfully', token: 'jwt_token_here' }
app.post("/users/login", (req, res) => {
  const { username, password } = req.headers;
  let user = USERS.find((item) => item.username === username);
  console.log("USer ", user);
  if (user) {
    if (user.password === password) {
      let token = generateToken(user);
      res.send({ message: "Successfully logged in!!", token });
    } else {
      res.status(401).send("Password invalid!!");
    }
  } else {
    res.status(401).send("User not found!!");
  }
});

app.get("/users/courses", verifyToken, (req, res) => {
  let availableCourses = COURSES.filter((item) => item.published === true);
  res.send(availableCourses);
});

//Purchasing Course
// POST /users/courses/:courseId
//    Description: Purchases a course. courseId in the URL path should be replaced with the ID of the course to be purchased.
//    Input: Headers: { 'Authorization': 'Bearer jwt_token_here' }
//    Output: { message: 'Course purchased successfully' }

app.post("/users/courses/:courseId", verifyToken, (req, res) => {
  const courseId = req.params.courseId;
  // Find the course with the specified courseId
  const course = COURSES.find((item) => item.Id == courseId);
  if (!course) {
    // Course not found
    return res.status(404).json({ message: "Course not found" });
  }
  if (!course.published) {
    // Course is not published
    return res.status(403).json({ message: "Course is not published" });
  }
  // Find the user by username (assuming req.user contains user info)
  const user = USERS.find((item) => item.username == req.user.username);

  if (!user) {
    // User not found
    return res.status(404).json({ message: "User not found" });
  }

  // Check if the user has already purchased the course
  user.purchasedCourses = user.purchasedCourses || [];

  if (
    user.purchasedCourses.some(
      (purchasedCourse) => purchasedCourse.id == courseId
    )
  ) {
    return res.status(400).json({ message: "Course already purchased" });
  }

  // Add the course to the user's purchasedCourses array
  user.purchasedCourses.push(course);

  res.status(200).json({ message: "Course purchased successfully" });
});

//Courses pusrchased by user
// GET /users/purchasedCourses
//    Description: Lists all the courses purchased by the user.
//    Input: Headers: { 'Authorization': 'Bearer jwt_token_here' }
//    Output: { purchasedCourses: [ { id: 1, title: 'course title', description: 'course description', price: 100, imageLink: 'https://linktoimage.com', published: true }, ... ] }

app.get("/users/purchasedCourses", verifyToken, (req, res) => {
  const user = USERS.find((item) => item.username === req.user.username);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const purchasedCourses = user.purchasedCourses || [];

  res.send(purchasedCourses);
});

app.listen(3000, () => {
  console.log("Server is listening on port 3000");
});
