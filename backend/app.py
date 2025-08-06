
from flask import Flask, request, jsonify, redirect, url_for
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from models import db, User, Todo
from config import Config
import jwt
import datetime
from functools import wraps
import requests
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
import secrets
import smtplib
from email.mime.text import MIMEText
from decouple import config


app = Flask(__name__)
app.config.from_object(Config)
db.init_app(app)
CORS(app, origins=["https://python-todo-frontend.onrender.com"])


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'message': 'Token is missing'}), 401
        try:
            token = token.split(' ')[1]
            data = jwt.decode(token, app.config['JWT_SECRET_KEY'], algorithms=["HS256"])
            current_user = User.query.get(data['user_id'])
        except:
            return jsonify({'message': 'Invalid token'}), 401
        return f(current_user, *args, **kwargs)
    return decorated


def send_todo_email(user_email, todo_title):
    sender_email = config('EMAIL_USER')
    password = config('EMAIL_PASSWORD')
    receiver_email = user_email

    msg = MIMEText(f"New Todo Created!\nTitle: {todo_title}\nYou can view it in your To-Do List.")
    msg['Subject'] = 'New Todo Notification'
    msg['From'] = sender_email
    msg['To'] = receiver_email

    try:
        with smtplib.SMTP('smtp.gmail.com', 587) as server:
            server.starttls()
            server.login(sender_email, password)
            server.send_message(msg)
        print(f"Email sent to {receiver_email}")
    except Exception as e:
        print(f"Failed to send email: {e}")



@app.route('/api/google/login')
def google_login():
    state = secrets.token_urlsafe(16)
    return redirect(f"https://accounts.google.com/o/oauth2/v2/auth?client_id={app.config['GOOGLE_CLIENT_ID']}&redirect_uri={url_for('google_callback', _external=True)}&response_type=code&scope=profile email openid&access_type=offline&state={state}")

# ... (previous imports and code remain the same)

# ... (previous imports remain the same)

@app.route('/api/google/callback')
def google_callback():
    code = request.args.get('code')
    state = request.args.get('state')
    if not code:
        return jsonify({'message': 'Authorization code missing'}), 400
    
    print(f"Received code: {code}, state: {state}")
    try:
        token_url = 'https://oauth2.googleapis.com/token'
        payload = {
            'code': code,
            'client_id': app.config['GOOGLE_CLIENT_ID'],
            'client_secret': app.config['GOOGLE_CLIENT_SECRET'],
            'redirect_uri': url_for('google_callback', _external=True),
            'grant_type': 'authorization_code'
        }
        print(f"Sending payload: {payload}")
        token_response = requests.post(token_url, data=payload)
        print(f"Response status code: {token_response.status_code}")
        print(f"Raw response: {token_response.text}")
        token_data = token_response.json()
        print(f"Token response: {token_data}")
        if 'error' in token_data:
            return jsonify({'message': 'Token exchange failed', 'error': token_data.get('error_description', token_data['error'])}), 400

        id_info = id_token.verify_oauth2_token(
            token_data['id_token'],
            google_requests.Request(),
            app.config['GOOGLE_CLIENT_ID']
        )
        
        google_id = id_info['sub']
        email = id_info['email']  # Get email from Google
        user = User.query.filter_by(google_id=google_id).first()
        if not user:
            user = User(google_id=google_id, username=email.split('@')[0], email=email)
            db.session.add(user)
            db.session.commit()
        elif not user.email:  # Update email if missing
            user.email = email
            db.session.commit()
        
        jwt_token = jwt.encode({
            'user_id': user.id,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        }, app.config['JWT_SECRET_KEY'], algorithm="HS256")
        return redirect(f"http://localhost:3000/?token={jwt_token}")
    except Exception as e:
        print(f"Google callback error: {e}")
        return jsonify({'message': 'Google authentication failed', 'error': str(e)}), 400

# ... (rest of the file remains the same)

# ... (rest of the file remains the same)

@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    email = data.get('email')  # Add email to request
    if not username or not password or not email:
        return jsonify({'message': 'Username, password, and email are required'}), 400
    if User.query.filter_by(username=username).first():
        return jsonify({'message': 'User already exists'}), 400
    new_user = User(username=username, password=password, email=email)
    db.session.add(new_user)
    db.session.commit()
    return jsonify({'message': 'User registered successfully'}), 201


@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    user = User.query.filter_by(username=username, password=password).first()
    if not user or (password != user.password and not user.google_id):
        return jsonify({'message': 'Invalid credentials'}), 401
    token = jwt.encode({
        'user_id': user.id,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    }, app.config['JWT_SECRET_KEY'], algorithm="HS256")
    print(f"Generated token for user {user.id}: {token}")  # Debug log
    return jsonify({'token': token}), 200

@app.route('/api/logout', methods=['POST'])
@token_required
def logout(current_user):
    return jsonify({'message': 'Logout successful, please clear the token'}), 200

@app.route('/api/todos', methods=['GET'])
@token_required
def get_todos(current_user):
    todos = Todo.query.filter_by(user_id=current_user.id).all()
    return jsonify([{'id': todo.id, 'title': todo.title, 'completed': todo.completed} for todo in todos])

@app.route('/api/todos', methods=['POST'])
@token_required
def add_todo(current_user):
    data = request.get_json()
    if not data or not data.get('title'):
        return jsonify({'error': 'Title is required'}), 400
    todo = Todo(title=data['title'], completed=False, user_id=current_user.id)
    db.session.add(todo)
    db.session.commit()
    send_todo_email(current_user.email, todo.title)  # Send email
    return jsonify({'id': todo.id, 'title': todo.title, 'completed': todo.completed}), 201

@app.route('/api/todos/<int:id>', methods=['PUT'])
@token_required
def update_todo(current_user, id):
    todo = Todo.query.get_or_404(id)
    if todo.user_id != current_user.id:
        return jsonify({'message': 'Unauthorized'}), 403
    data = request.get_json()
    todo.title = data.get('title', todo.title)
    todo.completed = data.get('completed', todo.completed)
    db.session.commit()
    return jsonify({'id': todo.id, 'title': todo.title, 'completed': todo.completed})

@app.route('/api/todos/<int:id>', methods=['DELETE'])
@token_required
def delete_todo(current_user, id):
    todo = Todo.query.get_or_404(id)
    if todo.user_id != current_user.id:
        return jsonify({'message': 'Unauthorized'}), 403
    db.session.delete(todo)
    db.session.commit()
    return jsonify({'message': 'Todo deleted'})

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)