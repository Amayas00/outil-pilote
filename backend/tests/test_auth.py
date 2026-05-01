"""
Tests d'authentification JWT.
Vérifie le login par email, la réponse enrichie,
et le comportement sur credentials incorrects.
"""
import pytest
from django.urls import reverse


@pytest.mark.django_db
class TestLogin:

    def test_login_success_returns_tokens_and_user(self, api_client, admin_user):
        """Un login valide retourne access, refresh et les infos utilisateur."""
        res = api_client.post('/api/v1/auth/login/', {
            'email': 'admin@test.com',
            'password': 'admin1234',
        }, format='json')

        assert res.status_code == 200
        assert 'access' in res.data
        assert 'refresh' in res.data
        assert 'user' in res.data
        assert res.data['user']['role'] == 'admin'
        assert res.data['user']['email'] == 'admin@test.com'

    def test_login_wrong_password_returns_401(self, api_client, admin_user):
        res = api_client.post('/api/v1/auth/login/', {
            'email': 'admin@test.com',
            'password': 'mauvais',
        }, format='json')
        assert res.status_code == 401

    def test_login_unknown_email_returns_401(self, api_client, db):
        res = api_client.post('/api/v1/auth/login/', {
            'email': 'inconnu@test.com',
            'password': 'nimporte',
        }, format='json')
        assert res.status_code == 401

    def test_login_inactive_user_returns_401(self, api_client, admin_user):
        admin_user.is_active = False
        admin_user.save()
        res = api_client.post('/api/v1/auth/login/', {
            'email': 'admin@test.com',
            'password': 'admin1234',
        }, format='json')
        assert res.status_code == 401

    def test_me_returns_current_user(self, admin_client, admin_user):
        res = admin_client.get('/api/v1/auth/me/')
        assert res.status_code == 200
        assert res.data['email'] == 'admin@test.com'
        assert res.data['role'] == 'admin'

    def test_me_unauthenticated_returns_401(self, api_client):
        res = api_client.get('/api/v1/auth/me/')
        assert res.status_code == 401

    def test_token_refresh(self, api_client, admin_user):
        """Le refresh token permet d'obtenir un nouveau access token."""
        login = api_client.post('/api/v1/auth/login/', {
            'email': 'admin@test.com', 'password': 'admin1234'
        }, format='json')
        refresh = login.data['refresh']

        res = api_client.post('/api/v1/auth/refresh/', {'refresh': refresh}, format='json')
        assert res.status_code == 200
        assert 'access' in res.data
