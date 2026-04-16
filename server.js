require("dotenv").config()

const express = require("express")
const path = require("path")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const cookieParser = require("cookie-parser")
const Database = require("better-sqlite3")
const cors = require("cors")

const app = express()
const db = new Database("lumino.db")
db.pragma("journal_mode = WAL")

// -------------------- MIDDLEWARE --------------------
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(cookieParser())

app.use(cors())


app.use(express.static(path.join(__dirname, "lumino-frontend")))

app.set("view engine", "ejs")
app.set("views", path.join(__dirname, "views"))

// -------------------- GLOBAL USER MIDDLEWARE --------------------
app.use((req, res, next) => {
  const token = req.cookies.token

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWTSECRET)
      req.user = decoded
    } catch {
      req.user = null
    }
  } else {
    req.user = null
  }

  // ✅ available in ALL EJS files
  res.locals.user = req.user

  next()
})

// -------------------- DB --------------------
db.prepare(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    email TEXT UNIQUE,
    phone TEXT,
    password TEXT
  )
`).run()

db.prepare(`
  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    body TEXT,
    user_id INTEGER
  )
`).run()

// -------------------- AUTH --------------------
function requireAuth(req, res, next) {
  if (!req.user) return res.redirect("/login")
  next()
}

//      Api (FOR FRONTEND JS)
let sales = []

app.get('/api/sales', (req, res) => {
  res.json(sales)
})

app.post('/api/sales', (req, res) => {
  sales.push(req.body)
  res.json({ success: true })
})

app.delete('/api/sales/:index', (req, res) => {
  sales.splice(req.params.index, 1)
  res.json({ success: true })
})

// -------------------- HOME (DASHBOARD) --------------------
app.get("/", requireAuth, (req, res) => {
  const posts = db.prepare(`
    SELECT posts.*, users.username
    FROM posts
    JOIN users ON posts.user_id = users.id
    ORDER BY posts.id DESC
  `).all()

  res.render("home", { posts })
})

// -------------------- REGISTER --------------------
app.get("/register", (req, res) => {
  res.render("register", { errors: [] })
})

app.post("/register", async (req, res) => {
  const { username, email, phone, password } = req.body
  const errors = []

  if (!username || !email || !phone || !password) {
    errors.push("All fields are required")
    return res.render("register", { errors: ["All fields are required"] })
  }

  try {
    const hashed = await bcrypt.hash(password, 10)

    //important line

    const result = db.prepare(`
      INSERT INTO users (username, email, phone, password)
      VALUES (?, ?, ?, ?)
    `).run(username, email, phone, hashed)
    // auto login starts here
    const token = jwt.sign(
      {
        id: result.lastInsertRowid,
        username: username,
        email: email,
        phone: phone
      },
      process.env.JWTSECRET,
      { expiresIn: "1d" }
    )
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "strict",
      maxAge: 86400000
    })
    // redirect to dashboard/home
    res.redirect("/")

  } catch (err)  {
     console.log(err.message)
     
     if (err.message.includes("users.email")) {
      return res.render("register", { errors: ["Email already exists"] })
     }
      if (err.message.includes("users.username")) {
        return res.render("register", { errors: ["Username already exists"] })
      }

     res.render("register", { errors: ["User already exists"] })
  }
})

// -------------------- LOGIN --------------------
app.get("/login", (req, res) => {
  res.render("login", { errors: [] })
})

app.post("/login", async (req, res) => {
  const { username, password } = req.body
  const errors = []

  const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username)

  if (!user) {
    errors.push("Invalid credentials")
    return res.render("login", { errors })
  }

  const match = await bcrypt.compare(password, user.password)

  if (!match) {
    errors.push("Invalid credentials")
    return res.render("login", { errors })
  }

  const token = jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
      phone: user.phone
    },
    process.env.JWTSECRET,
    { expiresIn: "1d" }
  )

  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "strict",
    maxAge: 86400000
  })

  res.redirect("/")
})

// -------------------- CREATE POST --------------------
app.post("/create-post", requireAuth, (req, res) => {
  const { title, body } = req.body

  db.prepare(`
    INSERT INTO posts (title, body, user_id)
    VALUES (?, ?, ?)
  `).run(title, body, req.user.id)

  res.redirect("/")
})

// -------------------- LOGOUT --------------------
app.get("/logout", (req, res) => {
  res.clearCookie("token")
  res.redirect("/login")
})

// -------------------- START --------------------



app.listen(3000, () => {
  console.log("Server running on port 3000")
})