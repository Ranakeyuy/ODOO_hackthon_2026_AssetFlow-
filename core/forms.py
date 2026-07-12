from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.core.exceptions import PermissionDenied
from django.utils import timezone
from core.models import (
    User, Asset, AssetAllocation, ResourceBooking,
    MaintenanceRequest, AssetCategory, TransferRequest,
)

_INPUT = (
    'w-full bg-slate-900 border border-slate-700 rounded-lg '
    'px-3 py-2 text-xs text-white placeholder-slate-500 '
    'outline-none focus:border-indigo-500'
)
_SELECT = (
    'w-full bg-slate-900 border border-slate-700 rounded-lg '
    'px-3 py-2 text-xs text-white outline-none focus:border-indigo-500'
)
_CHECKBOX = (
    'w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 '
    'border-slate-700 bg-slate-900'
)


class CustomUserCreationForm(UserCreationForm):
    class Meta(UserCreationForm.Meta):
        model = User
        fields = ('username', 'email', 'first_name', 'last_name', 'password1', 'password2')
        widgets = {
            'username': forms.TextInput(attrs={'class': _INPUT, 'placeholder': 'Username'}),
            'email': forms.EmailInput(attrs={'class': _INPUT, 'placeholder': 'Email address'}),
            'first_name': forms.TextInput(attrs={'class': _INPUT, 'placeholder': 'First name'}),
            'last_name': forms.TextInput(attrs={'class': _INPUT, 'placeholder': 'Last name'}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for field_name in ('password1', 'password2'):
            self.fields[field_name].widget.attrs.update({'class': _INPUT})

    def clean(self):
        cleaned_data = super().clean()
        submitted_role = cleaned_data.get('role')
        if submitted_role and submitted_role != User.EMPLOYEE:
            raise forms.ValidationError(
                "Public registration is restricted to the Employee role only."
            )
        return cleaned_data

    def save(self, commit=True):
        user = super().save(commit=False)
        user.role = User.EMPLOYEE
        if commit:
            user.save()
        return user


class AdminRolePromotionForm(forms.Form):
    target_user = forms.ModelChoiceField(
        queryset=User.objects.all(),
        widget=forms.Select(attrs={'class': _SELECT}),
        label='User to Promote',
    )
    new_role = forms.ChoiceField(
        choices=User.ROLE_CHOICES,
        widget=forms.Select(attrs={'class': _SELECT}),
        label='New Role',
    )

    def __init__(self, *args, requesting_user=None, **kwargs):
        super().__init__(*args, **kwargs)
        self.requesting_user = requesting_user
        self.fields['target_user'].queryset = User.objects.exclude(
            pk=requesting_user.pk if requesting_user else None
        )

    def clean_new_role(self):
        new_role = self.cleaned_data.get('new_role')
        if new_role not in dict(User.ROLE_CHOICES):
            raise forms.ValidationError(f"'{new_role}' is not a valid role.")
        return new_role

    def clean(self):
        cleaned_data = super().clean()
        if self.requesting_user is None or self.requesting_user.role != User.ADMIN:
            raise forms.ValidationError("Only an Admin can promote user roles.")
        return cleaned_data

    def execute(self):
        if not self.is_valid():
            raise ValueError("Form is not valid.")
        target_user = self.cleaned_data['target_user']
        new_role = self.cleaned_data['new_role']
        target_user.promote_role(new_role=new_role, promoted_by=self.requesting_user)
        return target_user


class AssetRegistrationForm(forms.ModelForm):
    class Meta:
        model = Asset
        fields = [
            'name', 'serial_number', 'category', 'status',
            'location', 'is_shared', 'acquisition_date', 'cost',
        ]
        widgets = {
            'name': forms.TextInput(attrs={'class': _INPUT, 'placeholder': 'Asset name'}),
            'serial_number': forms.TextInput(attrs={'class': _INPUT, 'placeholder': 'Serial number'}),
            'category': forms.Select(attrs={'class': _SELECT}),
            'status': forms.Select(attrs={'class': _SELECT}),
            'location': forms.TextInput(attrs={'class': _INPUT, 'placeholder': 'Location'}),
            'is_shared': forms.CheckboxInput(attrs={'class': _CHECKBOX}),
            'acquisition_date': forms.DateInput(attrs={'type': 'date', 'class': _INPUT}),
            'cost': forms.NumberInput(attrs={'class': _INPUT, 'placeholder': '0.00'}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['category'].queryset = AssetCategory.objects.all().order_by('name')
        if not self.instance.pk:
            self.initial.setdefault('status', Asset.AVAILABLE)
            self.initial.setdefault('acquisition_date', timezone.now().date())

    def clean_name(self):
        name = self.cleaned_data.get('name', '').strip()
        if not name:
            raise forms.ValidationError("Asset name cannot be blank.")
        return name

    def clean_cost(self):
        cost = self.cleaned_data.get('cost')
        if cost is not None and cost < 0:
            raise forms.ValidationError("Cost cannot be a negative value.")
        return cost


class AssetAllocationForm(forms.ModelForm):
    class Meta:
        model = AssetAllocation
        fields = ['asset', 'user', 'expected_return_date']
        widgets = {
            'asset': forms.Select(attrs={'class': _SELECT}),
            'user': forms.Select(attrs={'class': _SELECT}),
            'expected_return_date': forms.DateInput(attrs={'type': 'date', 'class': _INPUT}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['asset'].queryset = Asset.objects.filter(
            status=Asset.AVAILABLE
        ).select_related('category').order_by('tag')
        self.fields['user'].queryset = User.objects.filter(
            is_active=True
        ).order_by('last_name', 'first_name')

    def clean(self):
        cleaned_data = super().clean()
        asset = cleaned_data.get('asset')
        expected_return_date = cleaned_data.get('expected_return_date')

        if asset and asset.status != Asset.AVAILABLE:
            active_alloc = (
                AssetAllocation.objects
                .select_related('user')
                .filter(asset=asset, actual_return_date__isnull=True)
                .first()
            )
            holder_name = 'an unidentified user'
            if active_alloc:
                full_name = active_alloc.user.get_full_name()
                holder_name = full_name.strip() if full_name.strip() else active_alloc.user.username
            raise forms.ValidationError(
                f"Asset '{asset.tag}' is not available for allocation. "
                f"It is currently held by {holder_name}."
            )

        if expected_return_date and expected_return_date < timezone.now().date():
            raise forms.ValidationError("Expected return date cannot be in the past.")

        return cleaned_data


class ResourceBookingForm(forms.ModelForm):
    class Meta:
        model = ResourceBooking
        fields = ['resource', 'start_time', 'end_time']
        widgets = {
            'resource': forms.Select(attrs={'class': _SELECT}),
            'start_time': forms.DateTimeInput(
                attrs={'type': 'datetime-local', 'class': _INPUT}, format='%Y-%m-%dT%H:%M'
            ),
            'end_time': forms.DateTimeInput(
                attrs={'type': 'datetime-local', 'class': _INPUT}, format='%Y-%m-%dT%H:%M'
            ),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['resource'].queryset = Asset.objects.filter(
            is_shared=True
        ).order_by('name')

    def clean(self):
        cleaned_data = super().clean()
        start_time = cleaned_data.get('start_time')
        end_time = cleaned_data.get('end_time')
        resource = cleaned_data.get('resource')

        if start_time and end_time:
            if start_time < timezone.now():
                raise forms.ValidationError("Booking start time cannot be in the past.")
            if start_time >= end_time:
                raise forms.ValidationError("Start time must be strictly before end time.")
            if resource:
                overlapping = ResourceBooking.objects.filter(
                    resource=resource,
                    is_cancelled=False,
                    start_time__lt=end_time,
                    end_time__gt=start_time,
                )
                if self.instance and self.instance.pk:
                    overlapping = overlapping.exclude(pk=self.instance.pk)
                if overlapping.exists():
                    raise forms.ValidationError(
                        f"This time slot overlaps with an existing active booking "
                        f"for '{resource.name}'."
                    )
        return cleaned_data


class MaintenanceRequestForm(forms.ModelForm):
    class Meta:
        model = MaintenanceRequest
        fields = ['asset', 'description']
        widgets = {
            'asset': forms.Select(attrs={'class': _SELECT}),
            'description': forms.Textarea(attrs={
                'class': _INPUT,
                'rows': 4,
                'placeholder': 'Describe the issue in detail...',
            }),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['asset'].queryset = Asset.objects.exclude(
            status__in=[Asset.RETIRED, Asset.DISPOSED, Asset.LOST]
        ).select_related('category').order_by('tag')

    def clean_description(self):
        description = self.cleaned_data.get('description', '').strip()
        if len(description) < 10:
            raise forms.ValidationError(
                "Please provide a meaningful description (at least 10 characters)."
            )
        return description


class TransferRequestForm(forms.ModelForm):
    class Meta:
        model = TransferRequest
        fields = ['asset', 'to_user']
        widgets = {
            'asset': forms.Select(attrs={'class': _SELECT}),
            'to_user': forms.Select(attrs={'class': _SELECT}),
        }

    def __init__(self, *args, requesting_user=None, **kwargs):
        super().__init__(*args, **kwargs)
        self.requesting_user = requesting_user
        self.fields['asset'].queryset = Asset.objects.filter(
            status=Asset.ALLOCATED
        ).select_related('category').order_by('tag')
        self.fields['to_user'].label = 'Transfer To'
        self.fields['to_user'].queryset = User.objects.filter(
            is_active=True
        ).exclude(
            pk=requesting_user.pk if requesting_user else None
        ).order_by('last_name', 'first_name')

    def clean(self):
        cleaned_data = super().clean()
        asset = cleaned_data.get('asset')
        to_user = cleaned_data.get('to_user')

        if asset and asset.status != Asset.ALLOCATED:
            raise forms.ValidationError(
                f"Asset '{asset.tag}' is not currently allocated and cannot be transferred."
            )

        if asset and to_user:
            active_alloc = AssetAllocation.objects.filter(
                asset=asset, actual_return_date__isnull=True
            ).first()
            if active_alloc and active_alloc.user == to_user:
                raise forms.ValidationError(
                    f"Asset '{asset.tag}' is already allocated to this user."
                )

        pending_transfer = TransferRequest.objects.filter(
            asset=asset, status=TransferRequest.REQUESTED
        ).exists() if asset else False
        if pending_transfer:
            raise forms.ValidationError(
                f"A pending transfer request already exists for asset '{asset.tag}'."
            )

        return cleaned_data

    def save(self, commit=True):
        instance = super().save(commit=False)
        if self.requesting_user:
            instance.requested_by = self.requesting_user
            active_alloc = AssetAllocation.objects.filter(
                asset=instance.asset, actual_return_date__isnull=True
            ).first()
            instance.from_user = active_alloc.user if active_alloc else self.requesting_user
        if commit:
            instance.save()
        return instance
