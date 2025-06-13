from flask import Flask
from routes.message_routes import message_bp

app = Flask(__name__)
app.register_blueprint(message_bp, url_prefix="/messages")

if __name__ == "__main__":
    app.run(debug=True)
