from django import forms
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from apps.accounts.models import User

class CustomUserCreationForm(UserCreationForm):
    email = forms.EmailField(required=True)

    class Meta(UserCreationForm.Meta):
        model = User
        fields = ('username', 'email', 'first_name', 'last_name')

    def save(self, commit=True):
        user = super().save(commit=False)
        user.role = User.EMPLOYEE  # Force employee on registration
        if commit:
            user.save()
        return user

class RememberMeAuthenticationForm(AuthenticationForm):
    remember_me = forms.BooleanField(required=False, initial=False)
