import MySQLdb
from config import DB_CONFIG

def get_connection():
    return MySQLdb.connect(**DB_CONFIG)

def save_message(user_id_send, user_id_receive, message):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("INSERT INTO messages (user_id_send, user_id_receive, message) VALUES (%s, %s, %s)",
                   (user_id_send, user_id_receive, message))
    conn.commit()
    cursor.close()
    conn.close()

def get_messages(user_id_send, user_id_receive):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM messages WHERE (user_id_send = %s AND user_id_receive = %s) ORDER BY message_id ASC",
        (user_id_send, user_id_receive)
    )
    results = cursor.fetchall()
    cursor.close()
    conn.close()
    return results
