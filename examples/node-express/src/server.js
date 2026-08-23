require('dotenv').config();
const express = require('express');
const path = require('path');
const paymentRoutes = require('./routes/payment');

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/', paymentRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Bakong KHQR example running at http://localhost:${PORT}`);
});
