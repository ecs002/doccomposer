from django import forms
from django.forms import ModelForm
from .models import Document
from django.forms.utils import ErrorList

class DocumentCreationForm(ModelForm):
    def __init__(self, *args, **kwargs):
        super(DocumentCreationForm, self).__init__(*args, **kwargs)
        for visible in self.visible_fields():
            visible.field.widget.attrs['class'] = 'form-control mb-4'
    class Meta:
        model = Document
        fields = ["name","templateFile"]
        labels = {"name":"Document Name","templateFile":"Upload Your Document Template"}
        widgets = {
            'templateFile': forms.FileInput(attrs={'accept': '.docx'}),
        }

class DivErrorList(ErrorList):
    def __str__(self):
        return self.as_divs()
    def as_divs(self):
        if not self: return ''
        return '<div class="errorlist">%s</div>' % ''.join(['<div class="alert alert-danger">%s</div>' % e for e in self])