const express = require("express")
const session = require("express-session")
const app = express();
const port = 5000
const path = require("path")


app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({
    extended: true
}));

var indexRouter = require("./routes/index.js")
app.use("/", indexRouter)

app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 15 * 60 * 1000 } // 1h
}));

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});