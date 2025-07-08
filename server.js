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

// Dodanie nowego zamówienia
app.post('/order', verifyToken, (req, res) => {
  const { service } = req.body;
  const userId = req.user.id;

  if (!service) return res.status(400).send("Brak usługi");

  db.run("INSERT INTO orders (user_id, service) VALUES (?, ?)", [userId, service], function (err) {
    if (err) return res.status(500).send("Błąd podczas zapisu zamówienia");
    res.send("Zamówienie zapisane");
  });
});

// Historia zamówień użytkownika
app.get('/orders', verifyToken, (req, res) => {
  const userId = req.user.id;
  db.all("SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC", [userId], (err, rows) => {
    if (err) return res.status(500).send("Błąd przy pobieraniu zamówień");
    res.json(rows);
  });
});

const stripe = require('stripe')('TWÓJ_KLUCZ_STRIPE_SECRET');

app.post('/create-checkout-session', verifyToken, async (req, res) => {
  const { service, amount } = req.body; // Kwota za usługę
  const userId = req.user.id;

  // Tworzenie sesji płatności w Stripe
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'pln',
          product_data: {
            name: service
          },
          unit_amount: amount, // Przesyłamy kwotę w groszach
        },
        quantity: 1,
      }
    ],
    mode: 'payment',
    success_url: http://localhost:3000/success.html?order=${service},
    cancel_url: 'http://localhost:3000/cancel.html',
  });

  // Zwrócenie URL do strony płatności Stripe
  res.json({ url: session.url });
});

const endpointSecret = 'TWÓJ_KLUCZ_WEBHOOK_SECRET';

app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.log(Webhook error: ${err.message});
    return res.status(400).send(Webhook error: ${err.message});
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.metadata.userId;
    const service = session.metadata.service;

    // Zaktualizuj zamówienie w bazie danych jako opłacone
    db.run('UPDATE orders SET paid = 1 WHERE user_id = ? AND service = ?', [userId, service], (err) => {
      if (err) console.error("Błąd aktualizacji zamówienia", err);
    });
  }

  res.status(200).send('Webhook received');
});

const session = await stripe.checkout.sessions.create({
  payment_method_types: ['card'],
  line_items: [
    {
      price_data: {
        currency: 'pln',
        product_data: {
          name: service
        },
        unit_amount: amount,
      },
      quantity: 1,
    }
  ],
  mode: 'payment',
  success_url: http://localhost:3000/success.html?order=${service},
  cancel_url: 'http://localhost:3000/cancel.html',
  metadata: {
    userId: userId,
    service: service,
  },
});

const nodemailer = require('nodemailer');

// Konfiguracja transportera do wysyłania e-maili (używamy Gmaila w tym przypadku)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'twojemail@gmail.com',  // Twój adres e-mail
    pass: 'twojehaslo',           // Twoje hasło aplikacyjne (nie hasło do Gmaila)
  },
});

// Funkcja do wysyłania e-maili z potwierdzeniem zamówienia
function sendOrderConfirmationEmail(userEmail, service) {
  const mailOptions = {
    from: 'twojemail@gmail.com',
    to: userEmail,
    subject: 'Potwierdzenie zamówienia',
    text: Dziękujemy za złożenie zamówienia na usługę: ${service}. Twoje zamówienie jest w trakcie realizacji.,
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.error('Błąd przy wysyłaniu e-maila:', err);
    } else {
      console.log('E-mail wysłany:', info.response);
    }
  });
}

if (event.type === 'checkout.session.completed') {
  const session = event.data.object;
  const userId = session.metadata.userId;
  const service = session.metadata.service;
  const userEmail = session.metadata.userEmail;  // Dodajemy e-mail użytkownika do metadanych sesji Stripe

  // Zaktualizuj zamówienie w bazie danych jako opłacone
  db.run('UPDATE orders SET paid = 1 WHERE user_id = ? AND service = ?', [userId, service], (err) => {
    if (err) console.error("Błąd aktualizacji zamówienia", err);
  });

  // Wyślij potwierdzenie e-mail
  sendOrderConfirmationEmail(userEmail, service);
}

metadata: {
  userId: userId,
  service: service,
  userEmail: userEmail,
}

// Endpoint do przeglądania zamówień przez administratora
app.get('/admin/orders', verifyToken, (req, res) => {
  const token = req.headers['authorization'];

  if (!token || !isAdmin(token)) {  // Funkcja sprawdzająca, czy token należy do administratora
    return res.status(403).send("Brak uprawnień");
  }

  db.all("SELECT * FROM orders ORDER BY created_at DESC", (err, rows) => {
    if (err) return res.status(500).send("Błąd przy pobieraniu zamówień");
    res.json(rows);
  });
});

// Funkcja pomocnicza do sprawdzania, czy użytkownik jest administratorem
function isAdmin(token) {
  // Dodaj logikę weryfikacji, np. sprawdzając role w JWT
  return true;  // Zakładając, że każdy token to administrator
}

// Endpoint do aktualizacji statusu zamówienia przez administratora
app.post('/admin/order/update', verifyToken, (req, res) => {
  const { orderId, status } = req.body;  // orderId - ID zamówienia, status - nowy status

  // Sprawdzamy, czy użytkownik jest administratorem
  if (!isAdmin(req)) {
    return res.status(403).send("Brak uprawnień do edytowania zamówienia.");
  }

  // Sprawdzamy, czy status jest poprawny
  if (!['w toku', 'zrealizowane'].includes(status)) {
    return res.status(400).send("Niepoprawny status zamówienia.");
  }

  // Aktualizujemy status w bazie danych
  db.run('UPDATE orders SET status = ? WHERE id = ?', [status, orderId], (err) => {
    if (err) {
      console.error("Błąd przy aktualizacji statusu zamówienia:", err);
      return res.status(500).send("Błąd przy aktualizacji statusu zamówienia.");
    }
    res.send("Status zamówienia zaktualizowany.");
  });
});

// Funkcja pomocnicza sprawdzająca, czy użytkownik ma uprawnienia administratora
function isAdmin(req) {
  const token = req.headers['authorization'];
  // Zastosuj weryfikację tokena, aby sprawdzić, czy użytkownik ma rolę administratora
  return true;  // W tym przypadku załóżmy, że każdy użytkownik jest administratorem (możesz dostosować to do roli w JWT)
}
