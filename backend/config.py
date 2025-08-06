import os
from decouple import config

class Config:
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', '').replace(
        'postgres://', 'postgresql://') or config('DATABASE_URL').replace(
        'postgres://', 'postgresql://')
    JWT_SECRET_KEY = config('JWT_SECRET_KEY')
    GOOGLE_CLIENT_ID = config('GOOGLE_CLIENT_ID')
    GOOGLE_CLIENT_SECRET = config('GOOGLE_CLIENT_SECRET')
    EMAIL_USER = config('EMAIL_USER')
    EMAIL_PASSWORD = config('EMAIL_PASSWORD')
    SQLALCHEMY_TRACK_MODIFICATIONS = False