const express = require("express")
const session = require("express-session")
const { Client } = require('pg');
require("dotenv").config()
var router = express.Router()


/*const con = new Client({
    host: process.env.HOST,
    user: process.env.USER,
    port: process.env.DB_PORT,
    password: process.env.PASSWORD,
    database: process.env.DATABASE,
})
con.connect().then(() => console.log("connected"))*/

const con = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

con.connect().then(() => console.log("connected to Neon"))
  .catch(err => console.error('Connection error:', err));

router.get("/", (req,res) => {

    res.render('index')
})



router.get("/login", (req, res) => {
    res.render('login')
})

router.post("/login", async (req, res) => {
  try {
    const username = (req.body.username).trim()
    const password = req.body.password
    const authSecure = !!req.body.auth_secure 

    if (authSecure) {

        const captchaResponse = req.body["g-recaptcha-response"]
        const secretKey = process.env.RECAPTCHA_SECRET_KEY

        const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${captchaResponse}`;

        const response = await fetch(verifyUrl, { method: "POST" })
        const data = await response.json()

        if (!data.success) {
            return res.render("login", { error: "Captcha verifikacija nije uspjela." })
        }

        req.session.cookie.maxAge = 15 * 60 * 1000
        req.session.cookie.httpOnly = true
    } else {
        req.session.cookie.maxAge = 60 * 60 * 1000;
        req.session.cookie.httpOnly = false
    }

    const q = 'SELECT id, username, password FROM users WHERE username = $1'
    const result = await con.query(q, [username])

    if (result.rows.length === 0) {
      const errMsg = authSecure ? 'Nešto je krivo.' : 'Korisničko ime nije pronađeno.'
      return res.render('login', { error: errMsg, username })
    }
    const user = result.rows[0]

    if (password !== user.password) {
      const errMsg = authSecure ? 'Nešto je krivo.' : 'Lozinka je kriva.'
      return res.render('login', { error: errMsg, username })
    }

    req.session.user = { id: user.id, username: user.username, secureMode: authSecure };
    res.redirect("loggedin")
        

  } catch (err) {
    console.error('Login error:', err)
    return res.status(500).render('login', { error: 'Došlo je do pogreške. Pokušajte kasnije.', username: (req.body.username || '') })
  }
});


router.get("/loggedin", (req, res) => {
  if (req.session.user) {
    res.render("loggedin", {
        user: req.session.user,
        cookie_time:(req.session.cookie.maxAge / 60000).toFixed(2) + " minuta",
        cookie_httponly: req.session.cookie.httpOnly,
        cookie_id: req.session.id
    });
  } else {
    res.send("Nemate pristup stranici");
  }
});

router.post("/logout", (req, res) => {

    if (!req.session.user) {
        return res.redirect("/login");
    }

    if (req.session.user.secureMode) {
        req.session.destroy(err => {
            if (err) {
                console.error("Logout error:", err);
                return res.status(500).send("Greška pri odjavi.");
            }
            res.clearCookie("connect.sid");
            return res.redirect("/login");
            });
    } else {
        return res.redirect("/login");
    }
});




router.get("/sql", (req, res) => {
    res.render('sql')
})

function isValidIdentifier(str) {
  if (typeof str !== 'string') return false
  const re = /^[a-zA-Z0-9_-]+$/
  return re.test(str) && str.length >= 1 && str.length <= 50
}

router.post('/sql', async (req, res) => {
  try {
    const sqlInput = req.body.sql_input
    const secureMode = !!req.body.sql_secure


    let executedQuery = ''
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

        executedQuery = `SELECT id, username FROM users WHERE username = $1`
        const result = await con.query(executedQuery, [sqlInput])
        rows = result.rows
    } else {
        executedQuery = `SELECT id, username FROM users WHERE username = '${sqlInput}'`
        const result = await con.query(executedQuery)
        rows = result.rows
    }

    res.render('sql', {
      secureMode,
      sqlInput,
      executedQuery,
      rows,
      error: undefined
    })
  } catch (err) {
    console.error('Error in /sql:', err)
    res.status(500).send('Server error: ' + err.message)
  }
});


module.exports = router