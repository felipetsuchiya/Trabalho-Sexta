const amqp = require("amqplib");
const axios = require("axios");

// Função de verificação de autenticação
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

// Envia mensagem para a fila (RabbitMQ)
async function sendMessage(req, res) {
  const token = req.headers.authorization;
  const { userIdSend, userIdReceive, message } = req.body;

  const authResult = await verificaAutenticacao(token, userIdSend);
  if (!authResult) {
    return res.status(401).json({ msg: "not auth" });
  }

  const queueName = `${userIdSend}${userIdReceive}`;

  try {
    const conn = await amqp.connect("amqp://localhost");
    const channel = await conn.createChannel();
    await channel.assertQueue(queueName, { durable: true });

    const msgObj = {
      message,
      userIdSend,
      userIdReceive,
    };

    channel.sendToQueue(queueName, Buffer.from(JSON.stringify(msgObj)), {
      persistent: true,
    });

    await channel.close();
    await conn.close();

    return res.json({ msg: "Mensagem enviada para a fila RabbitMQ com sucesso" });
  } catch (err) {
    console.error("Erro ao enviar mensagem para RabbitMQ:", err);
    return res.status(500).json({ msg: "Erro interno ao enviar mensagem" });
  }
}

// Processa mensagens da fila (RabbitMQ)
async function processMessages(req, res) {
  const token = req.headers.authorization;
  const { userIdSend, userIdReceive } = req.body;

  if (!token || !userIdSend || !userIdReceive) {
    return res.status(400).json({ msg: "Parâmetros inválidos" });
  }

  const authOk = await verificaAutenticacao(token, userIdSend);
  if (!authOk) {
    return res.status(401).json({ msg: "Usuário não autenticado" });
  }

  const queueName = `${userIdSend}${userIdReceive}`;

  try {
    const conn = await amqp.connect("amqp://localhost");
    const channel = await conn.createChannel();
    await channel.assertQueue(queueName, { durable: true });

    let processedMessages = 0;

    await new Promise((resolve) => {
      const timeout = setTimeout(() => resolve(), 5000); // tempo máximo de espera

      channel.consume(
        queueName,
        async (msg) => {
          if (msg !== null) {
            const content = JSON.parse(msg.content.toString());

            try {
              await axios.post(
                "http://localhost:5000/messages",
                {
                  message: content.message,
                  userIdSend: content.userIdSend,
                  user_id_receive: content.userIdReceive,
                },
                {
                  headers: { Authorization: token },
                }
              );

              channel.ack(msg);
              processedMessages++;
            } catch (error) {
              console.error("Erro ao enviar mensagem para o serviço:", error);
              channel.nack(msg);
            }
          }
        },
        { noAck: false }
      );
    });

    await channel.close();
    await conn.close();

    return res.json({ msg: "ok", processedMessages });
  } catch (err) {
    console.error("Erro no processamento RabbitMQ:", err);
    return res.status(500).json({ msg: "Erro interno no processamento" });
  }
}

// Busca mensagens (sem RabbitMQ)
async function getMessages(req, res) {
  const token = req.headers.authorization;
  const { user_id_receive } = req.query;
  const { userIdSend } = req.body;

  const authOk = await verificaAutenticacao(token, userIdSend);
  if (!authOk) {
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

    if (!messages || messages.data.messages.length === 0) {
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
