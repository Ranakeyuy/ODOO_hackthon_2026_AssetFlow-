from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from apps.accounts.services import UserService
from apps.accounts.models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = get_user_model()
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'role', 'created_at')
        read_only_fields = ('id', 'role', 'created_at')

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})

    class Meta:
        model = get_user_model()
        fields = ('username', 'email', 'password', 'first_name', 'last_name')

    def create(self, validated_data):
        try:
            return UserService.register_user(
                username=validated_data['username'],
                email=validated_data['email'],
                password=validated_data['password'],
                first_name=validated_data.get('first_name', ''),
                last_name=validated_data.get('last_name', '')
            )
        except ValidationError as e:
            raise serializers.ValidationError(e.message)

class RolePromotionSerializer(serializers.Serializer):
    user_id = serializers.UUIDField(required=True)
    role = serializers.ChoiceField(choices=User.ROLE_CHOICES, required=True)

    def update_role(self, actor) -> User:
        UserClass = get_user_model()
        try:
            target_user = UserClass.objects.get(id=self.validated_data['user_id'])
        except UserClass.DoesNotExist:
            raise serializers.ValidationError("User not found.")

        try:
            return UserService.promote_user(
                user_to_promote=target_user,
                new_role=self.validated_data['role'],
                actor=actor
            )
        except Exception as e:
            raise serializers.ValidationError(str(e))
