import uuid
from django.db import models
from django.conf import settings

class SoftDeleteQuerySet(models.QuerySet):
    def delete(self):
        # Perform soft delete instead of hard delete
        return self.update(is_deleted=True)

    def hard_delete(self):
        return super().delete()

    def active(self):
        return self.filter(is_deleted=False)

class BaseModelManager(models.Manager):
    def get_queryset(self):
        return SoftDeleteQuerySet(self.model, using=self._db).active()

    def all_with_deleted(self):
        return SoftDeleteQuerySet(self.model, using=self._db)

class BaseModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="%(class)s_created",
        db_constraint=False  # avoid strict constraints during complex migrations/bootstraps
    )
    modified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="%(class)s_modified",
        db_constraint=False
    )
    
    is_deleted = models.BooleanField(default=False, db_index=True)
    status = models.CharField(max_length=50, blank=True, default="")

    objects = BaseModelManager()
    all_objects = models.Manager()  # Fallback for admin or recovery queries

    class Meta:
        abstract = True

    def delete(self, using=None, keep_parents=False):
        self.is_deleted = True
        self.save(update_fields=['is_deleted'])

    def hard_delete(self, using=None, keep_parents=False):
        super().delete(using=using, keep_parents=keep_parents)
