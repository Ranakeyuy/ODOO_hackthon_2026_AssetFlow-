from django import forms
from django.contrib.auth.forms import UserCreationForm
from core.models import User, Asset, AssetAllocation, ResourceBooking, MaintenanceRequest

class CustomUserCreationForm(UserCreationForm):
    class Meta(UserCreationForm.Meta):
        model = User
        fields = UserCreationForm.Meta.fields + ('email', 'first_name', 'last_name')

    def save(self, commit=True):
        user = super().save(commit=False)
        user.role = User.EMPLOYEE
        if commit:
            user.save()
        return user

class AssetRegistrationForm(forms.ModelForm):
    class Meta:
        model = Asset
        fields = ['tag', 'name', 'serial_number', 'category', 'status', 'location', 'is_shared', 'attributes']

class AssetAllocationForm(forms.ModelForm):
    class Meta:
        model = AssetAllocation
        fields = ['asset', 'user', 'expected_return_date']
        widgets = {
            'expected_return_date': forms.DateInput(attrs={'type': 'date'}),
        }

    def clean(self):
        cleaned_data = super().clean()
        asset = cleaned_data.get('asset')
        if asset and asset.status != Asset.AVAILABLE:
            raise forms.ValidationError("This asset is not available for allocation.")
        return cleaned_data

class ResourceBookingForm(forms.ModelForm):
    class Meta:
        model = ResourceBooking
        fields = ['resource', 'user', 'start_time', 'end_time']
        widgets = {
            'start_time': forms.DateTimeInput(attrs={'type': 'datetime-local'}),
            'end_time': forms.DateTimeInput(attrs={'type': 'datetime-local'}),
        }

    def clean(self):
        cleaned_data = super().clean()
        start_time = cleaned_data.get('start_time')
        end_time = cleaned_data.get('end_time')
        resource = cleaned_data.get('resource')
        if start_time and end_time:
            if start_time >= end_time:
                raise forms.ValidationError("Start time must be before end time.")
            if resource:
                overlapping = ResourceBooking.objects.filter(
                    resource=resource,
                    start_time__lt=end_time,
                    end_time__gt=start_time
                )
                if self.instance and self.instance.pk:
                    overlapping = overlapping.exclude(pk=self.instance.pk)
                if overlapping.exists():
                    raise forms.ValidationError("This time slot overlaps with an existing booking.")
        return cleaned_data

class MaintenanceRequestForm(forms.ModelForm):
    class Meta:
        model = MaintenanceRequest
        fields = ['asset', 'requested_by', 'description']
