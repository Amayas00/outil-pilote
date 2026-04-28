from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("L'email est obligatoire")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('role', 'admin')
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """
    Compte d'authentification. Peut être lié à un Collaborateur (nullable
    pour les comptes admin purs sans présence dans le planning).
    """
    ROLE_CHOICES = [
        ('collaborateur', 'Collaborateur'),
        ('manager', 'Manager'),
        ('admin', 'Administrateur'),
    ]

    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='collaborateur')
    # Lien vers Collaborateur — défini via ForeignKey dans teams pour éviter
    # la dépendance circulaire. On y accède via user.collaborateur (reverse).
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    class Meta:
        verbose_name = 'utilisateur'
        verbose_name_plural = 'utilisateurs'

    def __str__(self):
        return self.email

    @property
    def is_admin(self):
        return self.role == 'admin'

    @property
    def is_manager(self):
        return self.role in ('manager', 'admin')
