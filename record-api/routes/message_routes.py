from flask import Blueprint
from controllers.message_controller import create_message, fetch_messages

message_bp = Blueprint("messages", __name__)

message_bp.route("/", methods=["POST"])(create_message)
message_bp.route("/", methods=["GET"])(fetch_messages)
