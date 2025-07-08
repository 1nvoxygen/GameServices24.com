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
