from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Enrichit le token JWT avec les infos utilisateur."""
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = user.role
        token['email'] = user.email
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        user = self.user
        # Ajouter les infos utilisateur dans la réponse de login
        data['user'] = UserSerializer(user).data
        return data


class UserSerializer(serializers.ModelSerializer):
    collaborateur_id = serializers.SerializerMethodField()
    nom_complet = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'email', 'role', 'is_active', 'collaborateur_id', 'nom_complet', 'date_joined']
        read_only_fields = ['id', 'date_joined']

    def get_collaborateur_id(self, obj):
        try:
            return obj.collaborateur.id
        except Exception:
            return None

    def get_nom_complet(self, obj):
        try:
            c = obj.collaborateur
            return f"{c.prenom} {c.nom}"
        except Exception:
            return obj.email


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ['email', 'password', 'role']

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['role', 'is_active']
