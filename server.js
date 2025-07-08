const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

const SECRET = process.env.JWT_SECRET  'tajnyklucz';

app.post('/register', async (req, res) => {
  const { email, password } = req.body;
  const hash = await bcrypt.hash(password, 10);

  db.run("INSERT INTO users (email, password) VALUES (?, ?)", [email, hash], function (err) {
    if (err) return res.status(400).send("Użytkownik już istnieje");
    res.send("Zarejestrowano pomyślnie");
  });
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;
  db.get("SELECT * FROM users WHERE email = ?", [email], async (err, user) => {
    if (err  !user) return res.status(401).send("Nieprawidłowe dane");

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).send("Nieprawidłowe dane");

    const token = jwt.sign({ id: user.id, email: user.email }, SECRET);
    res.json({ token });
  });
});

// Chroniona trasa
app.get('/dashboard', verifyToken, (req, res) => {
  res.json({ message: Witaj, użytkowniku ${req.user.email} });
});

function verifyToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

app.listen(4000, () => console.log('API działa na http://localhost:4000'));
