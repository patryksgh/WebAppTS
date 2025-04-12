const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = 3001;
const SECRET = "tajny_klucz";
const REFRESH_SECRET = "tajny_refresh";

app.use(cors());
app.use(bodyParser.json());

const users = [
  { id: 1, login: "admin", password: "admin123", name: "Admin Tester" },
];

app.post("/api/login", (req, res) => {
  const { login, password } = req.body;
  const user = users.find(u => u.login === login && u.password === password);
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const token = jwt.sign({ id: user.id }, SECRET, { expiresIn: "15m" });
  const refreshToken = jwt.sign({ id: user.id }, REFRESH_SECRET, { expiresIn: "7d" });

  res.json({ token, refreshToken });
});

app.post("/api/refresh", (req, res) => {
  const { refreshToken } = req.body;
  try {
    const decoded = jwt.verify(refreshToken, REFRESH_SECRET);
    const newToken = jwt.sign({ id: decoded.id }, SECRET, { expiresIn: "15m" });
    res.json({ token: newToken });
  } catch (err) {
    res.status(403).json({ error: "Invalid refresh token" });
  }
});

function authMiddleware(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

app.get("/api/me", authMiddleware, (req, res) => {
  const user = users.find(u => u.id === req.user.id);
  if (!user) return res.sendStatus(404);
  const { password, ...userData } = user;
  res.json(userData);
});

app.listen(PORT, () => {
  console.log(`API działa na http://localhost:${PORT}`);
});
