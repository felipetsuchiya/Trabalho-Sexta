from flask import request, jsonify
from utils.jwt_utils import verify_token
from models.message_model import save_message, get_messages

def create_message():
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    payload = verify_token(token)
    if not payload:
        return jsonify({"error": "Token inválido"}), 401

    data = request.get_json()
    user_id_receive = data.get("user_id_receive")
    message = data.get("message")
    user_id_send = payload.get("userId")
    print(user_id_receive)

    if not user_id_receive or not message:
        return jsonify({"error": "Campos 'user_id_receive' e 'message' são obrigatórios"}), 400

    save_message(user_id_send, user_id_receive, message)
    return jsonify({"message": "Mensagem salva com sucesso"}), 201


def fetch_messages():
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    payload = verify_token(token)
    print("Token: ", token)
    print("Payload: ", payload)
    if not payload:
        return jsonify({"error": "Token inválido"}), 401

    user_id_send = payload.get("userId")  
    user_id_receive = request.args.get("user_id_receive")

    messages = get_messages(user_id_send, user_id_receive)
    print(messages)
    return jsonify({"messages": messages}), 200
