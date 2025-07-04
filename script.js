script.js
<button onclick="kupUsluge('boosting')">Kup Boosting</button>

<script>
  function kupUsluge(usluga) {
    fetch('http://localhost:4242/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ service: usluga })
    })
    .then(res => res.json())
    .then(data => window.location.href = data.url)
    .catch(err => console.error(err));
  }
</script>
