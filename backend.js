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
