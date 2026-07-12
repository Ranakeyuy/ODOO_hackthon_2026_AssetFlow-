from django.core.exceptions import PermissionDenied, ValidationError
from django.contrib.auth import get_user_model
from apps.accounts.models import User

class UserService:
    @staticmethod
    def register_user(username, email, password, first_name="", last_name="") -> User:
        """
        Business logic for registering a new user. Always defaults to EMPLOYEE role.
        """
        UserClass = get_user_model()
        if UserClass.objects.filter(username=username).exists():
            raise ValidationError("A user with that username already exists.")
        if UserClass.objects.filter(email=email).exists():
            raise ValidationError("A user with that email already exists.")
            
        user = UserClass(
            username=username,
            email=email,
            first_name=first_name,
            last_name=last_name,
            role=UserClass.EMPLOYEE
        )
        user.set_password(password)
        user.save()
        return user

    @staticmethod
    def promote_user(user_to_promote: User, new_role: str, actor: User) -> User:
        """
        Promotes/changes a user's role. Only ADMIN role is allowed to perform this use case.
        """
        if actor.role != User.ADMIN and not actor.is_superuser:
            raise PermissionDenied("Only Administrators can change user roles.")
            
        if new_role not in dict(User.ROLE_CHOICES):
            raise ValidationError(f"Invalid role choices: {new_role}")
            
        user_to_promote.role = new_role
        user_to_promote.created_by = actor
        user_to_promote.save()
        return user_to_promote
