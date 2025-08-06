

from decouple import config

class Config:
    SQLALCHEMY_DATABASE_URI = config('DATABASE_URL')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = config('JWT_SECRET_KEY')
    GOOGLE_CLIENT_ID = config('GOOGLE_CLIENT_ID')
    GOOGLE_CLIENT_SECRET = config('GOOGLE_CLIENT_SECRET')  # Add this line
