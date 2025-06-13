const authService = require("../services/authService"); // Assuming this might contain verificaAutenticacao or similar
const { createClient } = require("redis");
const axios = require("axios");

async function verificaAutenticacao(token, userId) {
  try {
    const response = await axios.get("http://localhost:8000/token", {
      headers: { Authorization: token },
      params: { user: userId },
    });
    return response.data.auth;
  } catch (err) {
    console.error("Erro na verificação de autenticação:", err.message);
    return false;
  }
}

async function sendMessage(req, res) {
  const token = req.headers.authorization;
  const { userIdSend, userIdReceive, message } = req.body;
  console.log(token)
  const authResult = await verificaAutenticacao(token, userIdSend);
  if (!authResult) {
    return res.status(401).json({ msg: "not auth" });
  }

  const queueKey = `${userIdSend}${userIdReceive}`;

  const redisClient = createClient({ url: "redis://localhost:6379" });
  redisClient.on("error", (err) => console.error("Redis error", err));

  try {
    await redisClient.connect();
    const msgObj = {
      message,
      userIdSend,
      userIdReceive,
    };

    await redisClient.lPush(queueKey, JSON.stringify(msgObj));
    await redisClient.quit();

    console.log(msgObj.auth);
    return res.json({ msg: "Mensagem adicionada na fila com sucesso" });
  } catch (err) {
    console.error("Erro ao adicionar mensagem na fila:", err);
    return res.status(500).json({ msg: "Erro interno ao adicionar mensagem" });
  }
}

async function processMessages(req, res) {
  const redisClient = createClient({ url: "redis://localhost:6379" });
  redisClient.on("error", (err) => console.error("Redis error", err));

  try {
    await redisClient.connect();

    const token = req.headers.authorization;
    const { userIdSend, userIdReceive } = req.body;

    if (!token || !userIdSend || !userIdReceive) {
      await redisClient.quit();
      return res.status(400).json({ msg: "Parâmetros inválidos" });
    }

    const authOk = await verificaAutenticacao(token, userIdSend);
    if (!authOk) {
      await redisClient.quit();
      return res.status(401).json({ msg: "Usuário não autenticado" });
    }

    const queueKey = `${userIdSend}${userIdReceive}`;

    const rawMessages = await redisClient.lRange(queueKey, 0, -1);

    if (rawMessages.length === 0) {
      await redisClient.quit();
      return res.json({
        msg: "Nenhuma mensagem para processar",
        processedMessages: 0,
      });
    }

    const messages = rawMessages.map((msgJson) => JSON.parse(msgJson));

    for (const msg of messages) {
      await axios.post(
        "http://localhost:5000/messages",
        {
          message: msg.message,
          userIdSend: msg.userIdSend,
          user_id_receive: msg.userIdReceive,
        },
        {
          headers: {
            Authorization: token,
          },
        }
      );
    }
    await redisClient.del(queueKey);
    await redisClient.quit();

    return res.json({ msg: "ok", processedMessages: messages.length });
  } catch (err) {
    console.error("Erro no worker:", err);
    try {
      await redisClient.quit();
    } catch (quitErr) {
      console.error("Erro ao fechar conexão Redis no erro:", quitErr);
    }
    return res.status(500).json({ msg: "Erro interno no worker" });
  }
}

async function getMessages(req, res) {
  const token = req.headers.authorization;
  const { user_id_receive } = req.query;
  const { userIdSend } = req.body;

  const redisClient = createClient({ url: "redis://localhost:6379" });
  redisClient.on("error", (err) => console.error("Redis error", err));

  await redisClient.connect();

  const authOk = await verificaAutenticacao(token, userIdSend);
  if (!authOk) {
    await redisClient.quit();
    return res.status(401).json({ msg: "Usuário não autenticado" });
  }
  try {
    const messages = await axios.get("http://localhost:5000/messages", {
      headers: {
        Authorization: token,
      },
      params: {
        user_id_receive: user_id_receive,
      },
    });
    if (!messages || messages.length === 0) {
      return res
        .status(404)
        .json({ error: "Nenhuma mensagem encontrada entre esses usuários." });
    }
    const txt = messages.data.messages[0][1];
    const userId = messages.data.messages[0][2];
    return res.status(200).json({
      userId: userId,
      msg: txt,
    });
  } catch (error) {
    return res.status(500).json({ error: "Erro interno ao buscar mensagens" });
  }
}

module.exports = {
  sendMessage,
  processMessages,
  getMessages,
};
