const express = require('express');
const axios = require('axios');
const messageRoutes = require('./routes/messageRoutes');

const app = express();
app.use(express.json());

app.use('/message', messageRoutes);

app.listen(3000, () => {
  console.log('Receive-Send-API rodando na porta 3000')
})
