import json
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.db import IntegrityError
from django.http import JsonResponse, FileResponse, Http404
from django.shortcuts import HttpResponse, HttpResponseRedirect, render
from django.urls import reverse
from django.views.decorators.csrf import csrf_exempt
from .models import User, Document
from .forms import DocumentCreationForm, DivErrorList
from django.core.exceptions import PermissionDenied

import io
import uuid
import docxtpl
from uuid import uuid4
# Page views

def home(request):
    return render(request, "app/home.html")

@login_required
def docs(request):
    documents = request.user.documentsCreated.all() | request.user.documentsAdministered.all()
    return render(request, "app/docs.html",{
        "documents":documents,
    })

@login_required
def createDoc(request):
    if request.method == "POST":
        form = DocumentCreationForm(request.POST,request.FILES,error_class=DivErrorList)
        if form.is_valid():
            newDocID = uuid.uuid4()
            newDoc = form.save(commit=False)
            newDoc.uuid = newDocID
            newDoc.creator = request.user
            newDoc.originalTemplateFileName = newDoc.templateFile.name
            newDoc.templateFile.name = f"{newDocID}.docx"
            newDoc.save()
            return HttpResponseRedirect(reverse("app:editDoc", kwargs={"uuidStr":str(newDocID)}))
        return render(request, "app/createDoc.html",{
            "form":form
        })
    else:
        return render(request, "app/createDoc.html",{
            "form":DocumentCreationForm()
        })

@login_required
def editDoc(request, uuidStr):
    document = Document.objects.get(uuid=uuidStr)
    if not (request.user == document.creator or request.user in document.administrators.all()):
        raise PermissionDenied
    return render(request, "app/formAdmin.html",{
        "document":document,
        "formURL":request.build_absolute_uri(f"/{uuidStr}"),
    })

@login_required
def deleteDoc(request, uuidStr):
    document = Document.objects.get(uuid=uuidStr)
    if not (request.user == document.creator or request.user in document.administrators.all()):
        raise PermissionDenied
    document.delete()
    return HttpResponseRedirect(reverse("app:docs"))

@login_required
def updateTemplate(request, uuidStr):
    if request.method == "POST":
        document = Document.objects.get(uuid=uuidStr)
        if request.user == document.creator or request.user in document.administrators.all():
            document.templateFile.delete(False)
            document.templateFile = request.FILES['updatedTemplate']
            document.originalTemplateFileName = document.templateFile.name
            document.templateFile.name = f"{uuidStr}.docx"
            document.save()
            return HttpResponseRedirect(reverse("app:editDoc", kwargs={"uuidStr":uuidStr}))
        else:
            raise PermissionDenied

@login_required
def previewDoc(request, uuidStr):
    document = Document.objects.get(uuid=uuidStr)
    if not (request.user == document.creator or request.user in document.administrators.all()):
        raise PermissionDenied
    docData = document.data
    questionIndex = 0
    for queryItem in docData:
        if queryItem['type'] != 'Header':
            questionIndex += 1
            queryItem['questionIndex'] = questionIndex
    return render(request, "app/form.html",{
        "name":document.name,
        "docData":docData,
        "uuid":document.uuid,
        "isLive":False,
    })

def form(request, uuidStr):
    try:
        document = Document.objects.get(uuid=uuidStr)
        docData = document.data
    except:
        raise Http404("Document does not exist")
    if not document.active:
        raise Http404("Document does not exist")
    if request.method == "POST":
        formData = request.POST
        docTemplate = docxtpl.DocxTemplate(document.templateFile.path)
        docVariables = sorted(docTemplate.undeclared_template_variables,key=str.casefold)
        docContext = {}
        for variable in docVariables:
            if variable.startswith("show_"):
                docContext[variable] = False
            elif variable.startswith("insert_"):
                docContext[variable] = ""
        for index,queryItem in enumerate(docData):
            if queryItem["type"] == "Selection":
                responseOptions = queryItem.get('responseOptions',[])
                selectedOptions = formData.getlist(f'item{index}_Selection',[])
                for selectedOption in selectedOptions:
                    selectedResponseOptions = list(filter(lambda responseOption: responseOption.get('option') == selectedOption,responseOptions)) #should only be one unless form creator set two options with identical names
                    for selectedResponseOption in selectedResponseOptions: #no need but in case he set two options with identical names and different selections
                        for linkedVariable in selectedResponseOption.get('linkedVariables',[]):
                            docContext[linkedVariable] = True
            elif queryItem["type"] == "FreeText":
                textToInsert = formData.get(f'item{index}_FreeText',"")
                for linkedVariable in queryItem.get("linkedVariables",[]):
                    docContext[linkedVariable] = textToInsert
        request.session[f'{uuidStr}_context'] = docContext

        return HttpResponseRedirect(reverse("app:thankYou", kwargs={"uuidStr":document.uuid}))

    questionIndex = 0
    for queryItem in docData:
        if queryItem['type'] != 'Header':
            questionIndex += 1
            queryItem['questionIndex'] = questionIndex

    return render(request, "app/form.html",{
        "name":document.name,
        "docData":docData,
        "uuid":document.uuid,
        "isLive":True,
    })

def thankYou(request, uuidStr):
    try:
        document = Document.objects.get(uuid=uuidStr)
    except:
        raise Http404("Document does not exist")

    return render(request,"app/thankYou.html",{
        "document":document
    })

#API views

def getData(request, uuidStr):
    if not request.user.is_authenticated:
        return JsonResponse({
            "error": "Login required."
        }, status=401)
    if request.method == "GET":
        document = Document.objects.get(uuid=uuidStr)
        if request.user == document.creator or request.user in document.administrators.all():
            return JsonResponse({
                                "updated":document.updatedTime.strftime("%I:%M %p, %d/%m/%y"),
                                "data":document.data,
                                "activeStatus":document.active,
                                "docVariables":sorted(docxtpl.DocxTemplate(document.templateFile.path).undeclared_template_variables,key=str.casefold),
                                })
        else:
            return JsonResponse({
                "error": "You are not authorised to request data from this document"
            }, status=403)

def updateData(request, uuidStr):
    if not request.user.is_authenticated:
        return JsonResponse({
            "error": "Login required."
        }, status=401)
    if request.method == "PUT":
        document = Document.objects.get(uuid=uuidStr)
        if request.user == document.creator or request.user in document.administrators.all():
            data = json.loads(request.body)
            for queryItem in data: #add UUIDs to each queryItem and responseOption
                if "uuid" not in queryItem or queryItem["uuid"]=="":
                    queryItem["uuid"] = str(uuid4())
                if queryItem["type"] == "Selection":
                    for responseOption in queryItem.get("responseOptions",[]):
                        if "uuid" not in responseOption or responseOption["uuid"]=="":
                            responseOption["uuid"]=str(uuid4())
            document.data = data
            document.save()
            return JsonResponse({
                                "updated":document.updatedTime.strftime("%I:%M %p, %d/%m/%y"),
                                "data":document.data,
                                "activeStatus":document.active,
                                "docVariables":sorted(docxtpl.DocxTemplate(document.templateFile.path).undeclared_template_variables,key=str.casefold),
                                })
        else:
            return JsonResponse({
                "error": "You are not authorised to update this document"
            }, status=403)

def updateStatus(request, uuidStr):
    if not request.user.is_authenticated:
        return JsonResponse({
            "error": "Login required."
        }, status=401)
    if request.method == "PATCH":
        document = Document.objects.get(uuid=uuidStr)
        if request.user == document.creator or request.user in document.administrators.all():
            data = json.loads(request.body)
            document.active = data["active"]
            document.save()
            return JsonResponse({
                                "updated":document.updatedTime.strftime("%I:%M %p, %d/%m/%y"),
                                "data":document.data,
                                "activeStatus":document.active,
                                "docVariables":sorted(docxtpl.DocxTemplate(document.templateFile.path).undeclared_template_variables,key=str.casefold),
                                })
        else:
            return JsonResponse({
                "error": "You are not authorised to update this document"
            }, status=403)

def getTemplate(request, uuidStr):
    if not request.user.is_authenticated:
        return JsonResponse({
            "error": "Login required."
        }, status=401)
    if request.method == "GET":
        document = Document.objects.get(uuid=uuidStr)
        if request.user == document.creator or request.user in document.administrators.all():
            return FileResponse(open(document.templateFile.path, 'rb'),as_attachment=True,filename=document.originalTemplateFileName)
        else:
            return JsonResponse({
                "error": "You are not authorised to request data from this document"
            }, status=403)

def getDocument(request, uuidStr):
    try:
        document = Document.objects.get(uuid=uuidStr)
    except:
        raise Http404("Document does not exist")
    docContext = request.session.get(f'{uuidStr}_context')
    if docContext is not None:
        docTemplate = docxtpl.DocxTemplate(document.templateFile.path)
        docTemplate.render(docContext)
        doc_io = io.BytesIO() # create a file-like object
        docTemplate.save(doc_io) # save data to file-like object
        doc_io.seek(0) # go to the beginning of the file-like object
        response = HttpResponse(doc_io.read())
        # Content-Disposition header makes a file downloadable
        response["Content-Disposition"] = f"attachment; filename={document.name}_generated.docx"
        # Set the appropriate Content-Type for docx file
        response["Content-Type"] = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        return response
    else:
        return JsonResponse({
            "error": "Data not found"
        }, status=404)

#user administration views

def signin_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        email = request.POST["email"]
        password = request.POST["password"]
        nextURL = request.POST["next"]
        user = authenticate(request, username=email, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(nextURL)
        else:
            return render(request, "app/signin.html", {
                "message": "Invalid email and/or password."
            })
    else:
        return render(request, "app/signin.html")


def signout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("app:home"))


def register(request):
    if request.method == "POST":
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "app/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(email, email, password)
            user.save()
        except IntegrityError as e:
            return render(request, "app/register.html", {
                "message": "Email address already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("app:home"))
    else:
        return render(request, "app/register.html")
