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

router.post("/login", (req, res) => {
    const username = req.body.username
    const password = req.body.password
    const authInput = req.body.auth_input


})

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

       /* if (!isValidIdentifier(sqlInput)) {
            return res.render('sql', {
                secureMode,
                sqlInput,
                executedQuery: undefined,
                rows: undefined,
                error: 'Unos sadrži nedozvoljene znakove. Dopusteni su: slova, brojevi, _ i -'
            });
        }*/


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
      rows
    });
  } catch (err) {
    console.error('Error in /sql:', err);
    res.status(500).send('Server error: ' + err.message);
  }
});


module.exports = router