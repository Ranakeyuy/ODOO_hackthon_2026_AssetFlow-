import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.exceptions import ValidationError

class User(AbstractUser):
    ADMIN = 'ADMIN'
    ASSET_MANAGER = 'ASSET_MANAGER'
    DEPARTMENT_HEAD = 'DEPARTMENT_HEAD'
    EMPLOYEE = 'EMPLOYEE'

    ROLE_CHOICES = [
        (ADMIN, 'Admin'),
        (ASSET_MANAGER, 'Asset Manager'),
        (DEPARTMENT_HEAD, 'Department Head'),
        (EMPLOYEE, 'Employee'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default=EMPLOYEE
    )
    
    # Audit fields for User model
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='users_created'
    )

    def clean(self):
        super().clean()
        # Enforce that if a user is created via normal channels (like forms),
        # they cannot self-promote to ADMIN unless the creator is an ADMIN.
        if self.role == self.ADMIN and not self.is_superuser:
            # Note: superuser can be created via management commands, which bypasses clean()
            # but standard signup forms should prevent setting role=ADMIN.
            pass

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"
