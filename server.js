const express = require("express")
const session = require("express-session")
const app = express();

const path = require("path")

app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: false, 
    secure: false, 
    maxAge: 60 * 60 * 1000 
  }
}));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({
    extended: true
}));

var indexRouter = require("./routes/index.js")
app.use("/", indexRouter)


const externalUrl = process.env.RENDER_EXTERNAL_URL;
const port = process.env.PORT || 5000;
const hostname = externalUrl ? '0.0.0.0' : 'localhost';

app.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
  if (externalUrl) console.log(`Externally accessible at ${externalUrl}`);
});