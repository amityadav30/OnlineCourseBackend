const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");

const mongoose = require("mongoose");
const mongoURI =
  "mongodb+srv://amit3012yadav:Rosedoncic%4030@cluster0.gevzkix.mongodb.net/";

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  dbName: "CoursePlatform",
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => {
  console.log("Connected to MongoDB");
});

app.use(express.json());
app.use(bodyParser.json());
const secretKey = "superS3cr3t1";

let ADMINS = [];
let USERS = [];
let COURSES = [];

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  purchasedCourses: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course", // This should match the model name for the Course schema
    },
  ],
});

const adminSchema = new mongoose.Schema({
  username: String,
  password: String,
});

const courseSchema = new mongoose.Schema({
  title: String,
  description: String,
  price: Number,
  imageLink: String,
  published: Boolean,
});

//define mongoose model
const User = mongoose.model("User", userSchema);
const Admin = mongoose.model("Admin", adminSchema);
const Course = mongoose.model("Course", courseSchema);

const generateToken = (username) => {
  const token = jwt.sign({ username }, secretKey, { expiresIn: "1h" });
  return token;
};

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
app.post("/admin/signup", async (req, res) => {
  const { username, password } = req.body;
  let admin = await Admin.findOne({ username });
  //let user = USERS.find((item) => item.username === username);
  if (admin) {
    res.status(403).send("Admin already exists");
  } else {
    const newAdmin = new Admin({ username, password });
    await newAdmin.save();
    //console.log("User ", user);
    let token = generateToken(username);
    res.send({ message: "Admin Successfully signed up!!", token });
  }
});

app.post("/admin/login", async (req, res) => {
  const { username, password } = req.headers;
  let admin = await Admin.findOne({ username, password });

  if (admin) {
    let token = generateToken(admin);
    res.send({ message: "Admin logged in!!", token });
  } else {
    res.status(403).send("Invalid username or password!!");
  }
});

// POST /admin/courses
// Description: Creates a new course.
// Input: Headers: { 'Authorization': 'Bearer jwt_token_here' }, Body: { title: 'course title', description: 'course description', price: 100, imageLink: 'https://linktoimage.com', published: true }
// Output: { message: 'Course created successfully', courseId: 1 }
app.post("/admin/courses", verifyToken, async (req, res) => {
  const newCourse = new Course(req.body);
  await newCourse.save();
  res.send({ message: "Course added Sucessfully", Id: newCourse.id });
});

// PUT /admin/courses/:courseId
//    Description: Edits an existing course. courseId in the URL path should be replaced with the ID of the course to be edited.
//    Input: Headers: { 'Authorization': 'Bearer jwt_token_here' }, Body: { title: 'updated course title', description: 'updated course description', price: 100, imageLink: 'https://updatedlinktoimage.com', published: false }
//    Output: { message: 'Course updated successfully' }
app.put("/admin/courses/:courseId", verifyToken, async (req, res) => {
  let newCourse = req.body;
  let course = await Course.findByIdAndUpdate(req.params.courseId, req.body, {
    new: true,
  });
  if (course) {
    res.send({ message: "Course updated successfully" });
  } else {
    res.send({ message: "Course not found" });
  }
});

//All Couses
// GET /admin/courses
// Description: Returns all the courses.
// Input: Headers: { 'Authorization': 'Bearer jwt_token_here' }
// Output: { courses: [ { id: 1, title: 'course title', description: 'course description', price: 100, imageLink: 'https://linktoimage.com', published: true }, ... ] }
app.get("/admin/courses", verifyToken, async (req, res) => {
  const courses = await Course.find();
  res.send({ courses });
});

// User routes
// - POST /users/signup
//    Description: Creates a new user account.
//    Input: { username: 'user', password: 'pass' }
//    Output: { message: 'User created successfully', token: 'jwt_token_here' }
app.post("/users/signup", async (req, res) => {
  const { username, password } = req.body;
  let user = await User.findOne({ username });
  if (user) {
    res.status(401).send("Username already exists");
  } else {
    const newUser = new User({ username, password });
    await newUser.save();
    let token = generateToken(username);
    res.send({ message: "Successfully signed up!!", token });
  }
});

//User Login
// - POST /users/login
//    Description: Authenticates a user. It requires the user to send username and password in the headers.
//    Input: Headers: { 'username': 'user', 'password': 'pass' }
//    Output: { message: 'Logged in successfully', token: 'jwt_token_here' }
app.post("/users/login", async (req, res) => {
  const { username, password } = req.headers;
  let user = await User.findOne({ username, password });
  if (user) {
    let token = generateToken(user);
    res.send({ message: "Successfully logged in!!", token });
  } else {
    res.status(401).send("Invalid password or username!!");
  }
});

app.get("/users/courses", verifyToken, async (req, res) => {
  let availableCourses = await Course.find({ published: true });
  res.send(availableCourses);
});

//Purchasing Course
// POST /users/courses/:courseId
//    Description: Purchases a course. courseId in the URL path should be replaced with the ID of the course to be purchased.
//    Input: Headers: { 'Authorization': 'Bearer jwt_token_here' }
//    Output: { message: 'Course purchased successfully' }

app.post("/users/courses/:courseId", verifyToken, async (req, res) => {
  const course = await Course.findById(req.params.courseId);
  console.log(course);
  if (course) {
    const user = await User.findOne({ username: req.user.username });
    console.log("REQ: ", user, req.user);

    if (user) {
      user.purchasedCourses.push(course);
      await user.save();
      res.json({ message: "Course purchased successfully" });
    } else {
      res.status(403).json({ message: "User not found" });
    }
  } else {
    res.status(404).json({ message: "Course not found" });
  }
});

//Courses pusrchased by user
// GET /users/purchasedCourses
//    Description: Lists all the courses purchased by the user.
//    Input: Headers: { 'Authorization': 'Bearer jwt_token_here' }
//    Output: { purchasedCourses: [ { id: 1, title: 'course title', description: 'course description', price: 100, imageLink: 'https://linktoimage.com', published: true }, ... ] }

app.get("/users/purchasedCourses", verifyToken, async (req, res) => {
  const user = await User.findOne({ username: req.user.username }).populate(
    "purchasedCourses"
  );
  if (user) {
    res.json({ purchasedCourses: user.purchasedCourses || [] });
  } else {
    res.status(403).json({ message: "User not found" });
  }
});

app.listen(3000, () => {
  console.log("Server is listening on port 3000");
});
