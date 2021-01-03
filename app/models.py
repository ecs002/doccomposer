from django.contrib.auth.models import AbstractUser
from django.db.models.signals import post_delete
from django.dispatch import receiver
from django.db import models
from .validators import validate_file_extension
import uuid


class User(AbstractUser):
    pass

class Document(models.Model):
    creator = models.ForeignKey(User,on_delete=models.CASCADE,related_name="documentsCreated")
    administrators = models.ManyToManyField(User, blank=True, related_name="documentsAdministered")
    uuid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    name = models.CharField(max_length = 64)
    originalTemplateFileName = models.CharField(max_length = 64)
    templateFile = models.FileField(upload_to='doctemplates',validators=[validate_file_extension])
    data = models.JSONField(default=list)
    createdTime = models.DateTimeField(auto_now_add=True)
    updatedTime = models.DateTimeField(auto_now=True)
    active = models.BooleanField(default=False)

@receiver(post_delete, sender=Document)
def submission_delete(sender, instance, **kwargs):
    instance.templateFile.delete(False) 
