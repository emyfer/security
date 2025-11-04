const express = require("express")
const session = require("express-session")
const { Client } = require('pg');
require("dotenv").config()
var router = express.Router()

const con = new Client({
    host: process.env.HOST,
    user: process.env.USER,
    port: process.env.DB_PORT,
    password: process.env.PASSWORD,
    database: process.env.DATABASE,
})
con.connect().then(() => console.log("connected"))

router.get("/", (req,res) => {

    res.render('index')
})




router.get("/login", (req, res) => {
    res.render('login')
})


router.post("/login", async (req, res) => {
  try {
    const username = (req.body.username).trim();
    const password = req.body.password;
    const authSecure = !!req.body.auth_secure; 

    if (authSecure) {

        const captchaResponse = req.body["g-recaptcha-response"];
        const secretKey = process.env.RECAPTCHA_SECRET_KEY;

        const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${captchaResponse}`;

        const response = await fetch(verifyUrl, { method: "POST" });
        const data = await response.json();

        if (!data.success) {
            return res.render("login", { error: "Captcha verifikacija nije uspjela." });
        }
    }

    const q = 'SELECT id, username, password FROM users WHERE username = $1';
    const result = await con.query(q, [username]);

    if (result.rows.length === 0) {
      const errMsg = authSecure ? 'Nešto je krivo.' : 'Korisničko ime nije pronađeno.';
      return res.render('login', { error: errMsg, username });
    }
    console.log(result.rows)
    const user = result.rows[0];

    let passwordMatches = false;
    passwordMatches = (password === user.password);


    if (!passwordMatches) {
      const errMsg = authSecure ? 'Nešto je krivo.' : 'Lozinka je kriva.';
      return res.render('login', { error: errMsg, username });
    }


    req.session.user = { id: user.id, username: user.username };
    return res.render('loggedin', { user: req.session.user });


  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).render('login', { error: 'Došlo je do pogreške. Pokušajte kasnije.', username: (req.body.username || '') });
  }
});



router.get("/sql", (req, res) => {
    res.render('sql')
})

function isValidIdentifier(str) {
  if (typeof str !== 'string') return false;
  const re = /^[a-zA-Z0-9_-]+$/;
  return re.test(str) && str.length >= 1 && str.length <= 50;
}

router.post('/sql', async (req, res) => {
  try {
    const sqlInput = req.body.sql_input;
    const secureMode = !!req.body.sql_secure;


    let executedQuery = '';
    let rows = [];
    if (secureMode) {

        if (!isValidIdentifier(sqlInput)) {
            return res.render('sql', {
                secureMode,
                sqlInput,
                executedQuery: undefined,
                rows: undefined,
                error: 'Unos sadrži nedozvoljene znakove. Dopusteni su: slova, brojevi, _ i -'
            });
        }


        executedQuery = `SELECT id, username FROM users WHERE username = $1`;
        const result = await con.query(executedQuery, [sqlInput]);
        rows = result.rows;
    } else {
        executedQuery = `SELECT id, username FROM users WHERE username = '${sqlInput}'`;
        const result = await con.query(executedQuery);
        rows = result.rows;
    }

    res.render('sql', {
      secureMode,
      sqlInput,
      executedQuery,
      rows,
      error: undefined
    });
  } catch (err) {
    console.error('Error in /sql:', err);
    res.status(500).send('Server error: ' + err.message);
  }
});


module.exports = router