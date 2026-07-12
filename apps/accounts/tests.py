from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from django.core.exceptions import PermissionDenied, ValidationError
from rest_framework import status
from rest_framework.test import APITestCase
from apps.accounts.models import User
from apps.accounts.services import UserService

class UserModelTests(TestCase):
    def test_create_user_default_role(self):
        """
        Verify that creating a user manually or via default options assigns EMPLOYEE role.
        """
        user = get_user_model().objects.create_user(
            username='testemployee',
            email='emp@company.com',
            password='password123'
        )
        self.assertEqual(user.role, User.EMPLOYEE)
        self.assertFalse(user.is_superuser)

class UserServiceTests(TestCase):
    def test_register_user_always_employee(self):
        """
        UserService.register_user must register the user as an EMPLOYEE.
        """
        user = UserService.register_user(
            username='newuser',
            email='newuser@company.com',
            password='password123',
            first_name='John',
            last_name='Doe'
        )
        self.assertEqual(user.role, User.EMPLOYEE)

    def test_promote_user_by_admin(self):
        """
        Admin should be able to promote an employee to Asset Manager.
        """
        admin = get_user_model().objects.create_superuser(
            username='admin_user',
            email='admin@company.com',
            password='password123',
            role=User.ADMIN
        )
        employee = UserService.register_user(
            username='emp_user',
            email='emp@company.com',
            password='password123'
        )
        
        updated_user = UserService.promote_user(
            user_to_promote=employee,
            new_role=User.ASSET_MANAGER,
            actor=admin
        )
        self.assertEqual(updated_user.role, User.ASSET_MANAGER)
        self.assertEqual(updated_user.created_by, admin)

    def test_promote_user_by_non_admin_fails(self):
        """
        Non-admin user promoting someone else must raise PermissionDenied.
        """
        non_admin = UserService.register_user(
            username='non_admin',
            email='nonadmin@company.com',
            password='password123'
        )
        employee = UserService.register_user(
            username='emp_user2',
            email='emp2@company.com',
            password='password123'
        )
        
        with self.assertRaises(PermissionDenied):
            UserService.promote_user(
                user_to_promote=employee,
                new_role=User.ASSET_MANAGER,
                actor=non_admin
            )

class AuthenticationAPITests(APITestCase):
    def setUp(self):
        self.admin = get_user_model().objects.create_superuser(
            username='apiadmin',
            email='apiadmin@company.com',
            password='password123',
            role=User.ADMIN
        )
        self.employee = UserService.register_user(
            username='apiemp',
            email='apiemp@company.com',
            password='password123'
        )

    def test_api_registration_token_issuance(self):
        """
        API registration should return user data and JWT tokens.
        """
        url = reverse('api_register')
        data = {
            'username': 'newapiuser',
            'email': 'newapi@company.com',
            'password': 'password123',
            'first_name': 'Test',
            'last_name': 'User'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('tokens', response.data)
        self.assertIn('access', response.data['tokens'])
        self.assertIn('refresh', response.data['tokens'])

    def test_jwt_token_obtain_and_refresh(self):
        """
        Verify users can obtain JWT access/refresh tokens and refresh them.
        """
        # Obtain tokens
        token_url = reverse('token_obtain_pair')
        data = {
            'username': 'apiemp',
            'password': 'password123'
        }
        response = self.client.post(token_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        refresh_token = response.data['refresh']

        # Refresh tokens
        refresh_url = reverse('token_refresh')
        refresh_data = {
            'refresh': refresh_token
        }
        refresh_response = self.client.post(refresh_url, refresh_data, format='json')
        self.assertEqual(refresh_response.status_code, status.HTTP_200_OK)
        self.assertIn('access', refresh_response.data)

    def test_role_promotion_api_admin_success(self):
        """
        Admin can promote user via API endpoint.
        """
        self.client.force_authenticate(user=self.admin)
        url = reverse('api_promote')
        data = {
            'user_id': str(self.employee.id),
            'role': User.DEPARTMENT_HEAD
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['user']['role'], User.DEPARTMENT_HEAD)

    def test_role_promotion_api_employee_forbidden(self):
        """
        Employee trying to promote user via API endpoint must get 403 Forbidden.
        """
        self.client.force_authenticate(user=self.employee)
        url = reverse('api_promote')
        data = {
            'user_id': str(self.employee.id),
            'role': User.DEPARTMENT_HEAD
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
