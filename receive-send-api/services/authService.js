// services/authService.js
const axios = require('axios');

const AUTH_API_BASE = 'http://localhost:8000'; // ajuste para onde roda sua Auth-API

async function validarToken(token, userId) {
    try {
        const response = await axios.get(`${AUTH_API_BASE}/token?user=${userId}`, {
            headers: {
                Authorization: token
            }
        });

        return response.data; // { auth: true } ou { auth: false }
    } catch (error) {
        console.error('Erro ao validar token:', error.message);
        return { auth: false };
    }
}

module.exports = {
    validarToken
};
