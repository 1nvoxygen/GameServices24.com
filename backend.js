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

// Dodawanie nowego użytkownika
app.post('/admin/user/add', verifyToken, (req, res) => {
  const { username, email, password, role } = req.body;

  if (!isAdmin(req)) {
    return res.status(403).send("Brak uprawnień do dodawania użytkowników.");
  }

  const hashedPassword = bcrypt.hashSync(password, 10);

  db.run('INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)', 
         [username, email, hashedPassword, role], (err) => {
    if (err) {
      console.error("Błąd przy dodawaniu użytkownika:", err);
      return res.status(500).send("Błąd przy dodawaniu użytkownika.");
    }
    res.send("Użytkownik dodany.");
  });
});

// Usuwanie użytkownika
app.delete('/admin/user/delete', verifyToken, (req, res) => {
  const { userId } = req.body;

  if (!isAdmin(req)) {
    return res.status(403).send("Brak uprawnień do usuwania użytkowników.");
  }

  db.run('DELETE FROM users WHERE id = ?', [userId], (err) => {
    if (err) {
      console.error("Błąd przy usuwaniu użytkownika:", err);
      return res.status(500).send("Błąd przy usuwaniu użytkownika.");
    }
    res.send("Użytkownik usunięty.");
  });
});

// Endpoint do resetowania hasła użytkownika
app.post('/admin/user/reset-password', verifyToken, (req, res) => {
  const { userId, newPassword } = req.body;

  if (!isAdmin(req)) {
    return res.status(403).send("Brak uprawnień do resetowania haseł.");
  }

  const hashedPassword = bcrypt
