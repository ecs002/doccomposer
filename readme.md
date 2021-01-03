# DocComposer
DocComposer is a system that allows one to create a templated word document, and then configure a linked questionnaire. The questionnaire can then be shared with others, in the form of a web form. Once the questionnaire is completed, the final document is generated from the original template, depending on the responses to the questionnaire and how it is configured.

DocComposer has been [published on Azure](https://doccomposer.azurewebsites.net/) so you can play around with it on the internet too! The accompanying video can be found at [this link](https://youtu.be/CEiE7ftEn5s).

## Overview
The system comprises 4 main parts:
 1. Creation of an MS Word template
 2. Creation of a document template in the web application
 3. Questionnaire configuration and administration
 4. Questionnaire serving

Part 1 is implemented using MS Word Macros (VBA) and is not part of the web application proper. Parts 2 - 4 are part of the Django web application. 

The overall user journey is as follows:

 1. Document creator creates Word Template in MS Word, using the VBA macros to insert the relevant tags.
 2. The document creator then signs in to the Django web application, and creates a new Document Template
	 a. This involves naming the template and uploading the MS Word template file. 
 3. The document creator enters the admin interface where he can edit the questionnaire.
 4. When done, the document creator can publish the questionnaire to make it available to anonymous users.
 5. The anonymous end users can then fill the questionnaire (rendered as a webform).
 6. Depending on their responses to the questions, the finalised word document will be generated.

## I. Creation of document template in MS Word
Even though the creation of the document template takes place "offline", it is key to the system as a whole. In order to create the document template, an MS Word macro-enabled template (Base Template.dotm) is provided (included in the project folder for reference). This contains macros that enable the user to mark out text as one of two different kind of fields. A description of both fields follows, as this is important to understanding the application.

 - Variable Text Field
 - Conditional Field

### Variable Text Field

A variable text field is a field in the template which is linked to a particular free text user response. The field will be updated with the user’s response.

To insert a variable text field, place your cursor at the location where you want the variable text field to appear, then run the “Insert_variable_text_field” macro. You will be prompted to give a name to this particular field. This name will be used in the Form Creation step to link the variable text field to the user question.

For example, for the para below, we have a variable text field, meant to be filled with the contract duration, which we will eventually ask the user for:

![](https://lh6.googleusercontent.com/yaOEdoXVdjm2ZBl2Wv-SJD91x4reM0G2xt0t5Wijo-UNw5lyEwzbL8iCD_XiYTFPfobp1jMhNSE5quB_e8y6cA4igoHr1ab416mhFSFd7S-M9WrTwdmcNYgrQgcjkErAHxgQAWhf)

To insert the variable text field, set the cursor there, then run the “Insert_variable_text_field” macro:

![](https://lh6.googleusercontent.com/H6BsBU8bvOTYt0vVtfIpaJIHivgZct4hJOzQzUUe2qNLJiVx_1XmXgNSPpFcafyetjb10EN-2DbEXlzSe6jGArADaJYyrgNbZScWw7XMoaTwS-BcoxZzSXK0S-6GJCUpXkSJb-Lz)

After inserting the variable text field, the paragraph will look like this:

![](https://lh4.googleusercontent.com/83L85tbrQbvYIA3Bf5VIx8S3ADniuNdCMPWefZTXUU-SPKnkXUuDbEWTvfLrvfID_q0PuGaT8dZ8ObU7IUdpDK9KJwZSv_qSqNGZL70kISwVCjEx4KUHyE8gTMcPtckxYo-C1wdS)

The variable text field name will subsequently be used in the Form Creation step.

### Conditional Paragraph/Text

Conditional paragraphs and conditional texts are another way of varying the document according to user responses. Instead of variable text fields, which are updated and replaced with the user’s (free text) response, conditional paragraphs/texts are areas in the document template which are hidden by default, but can be linked to questions with a fixed selection of response options. When a conditional paragraph/text is linked to a particular response option, it will be shown in the final generated document when the user selects that option.

#### Conditional Paragraph vs Conditional Text

Conditional Paragraphs and Conditional Text are conceptually the same – use paragraph when the area of interest is a paragraph (i.e. ends with the *Enter* key) and text when the area of interest is a smaller selection of text within a paragraph. To demarcate conditional paragraphs, highlight the entire area of interest, before running the conditional paragraph macro. To demarcate conditional text, do the same but with the conditional text macro.

To build on the earlier example, in the case below:

![](https://lh6.googleusercontent.com/EOTY7JnK3DIw7Je-QgsEt3jy4F0SfS95v4Rpvhiqs1uYQ3o6-Bc6xo8-Mfqc47SZBf0Jz6T2wbA3wI2CIaFUOte-ogMHhN9lDb_19Po1hbRG8ZBCDdBuzhTMp2QXVQTMw26hBCKO)

We want to display the content in the Box for para 4A.1 assuming the contract is evergreen with no fixed term. Otherwise, we want to display the 4A.1 which is not in the box.

To create this behavior in the document template generator, we have to key in both variants in the body text. We then set each variant as a conditional paragraph1(because the area of interest is a paragraph):

![](https://lh5.googleusercontent.com/RihPwbfrpCrkV4cfm94nZVdDcexfQ5_SovR4bc5NXs3x5BbdBauhpyET6zkL-2IywJc9d5QJuqL3z-E09T9UazuTkYB5SGUhYYasnKcWAZndj-gJwT0g23u4retrv-Ek5byGG8XS)

After setting the conditional paragraphs, the document will look like this:

![](https://lh5.googleusercontent.com/HpTLxOHvyOEY_BftV_H169rmR3nG53lWzrEH0c7blphowgfOWb-YzqzMs_aU_f4-U9xP_zbSetBmXcjWDeiOygHGABJF81ugp0ew2q_rQyORMCDMD_8YJAW-qNTdGZozLsgwmSH2)

The conditional paragraph/text name will subsequently be used in the Form Creation step.
 
### Uploading
 Once the word document template is finalised, it will be uploaded to the web application and form the basis of the whole system.
 
## II. Creation of a document template in the web application
Once the word document is completed, the document creator should move on to the web application. Here, he will sign in (or register), and create a new document in the web application.

### Model Fields

Each document is saved as a Document object in Django, with the following fields:

 - creator - Tracks the creator of the document
 - administrator - Allows the creator to add more administrators (not implemented yet)
 - uuid - Gives each document a unique identifier, with which anonymous users will use to access the form
 - name - Name of document
 - templateFile - <**Important**> stores the location of the Word file created in the first step
 - originalTemplateFileName - Stores the original file name as the file is saved as [uuid].docx in the application
 - data - <**Important**> A jsonFileField that contains all the data (in json format) that models the questionaire itself. See next section for more details.
 - createdTime
 - updatedTime
 - active - Tracks whether document is published or not. Anonymous users can only access published forms.

### Relevant Views
 
This part of the application comprises the following views in views.py:
 - createDoc - renders a form that allows the document creator to create a Document Template and upload the Word template.
 - docs - renders a template that shows all the document that the user administers.
 - updateTemplate - allows users to upload a new Word template
 - getTemplate (API) - allows the document creator to download the word template.

## III. Questionnaire Configuration and Administration

DocComposer allows document creators to create 3 different types of questionnaire fields:

### Questionnaire Fields
 - Selection Fields, which have one or more options that are linked to conditional text/paragraphs fields in the Word Template. The linked conditional text/paragraphs will display if the linked option is selected.
 - Free Text Fields, which are linked to variable text fields in the Word Template. The variable text fields will be replaced by what the end-user keys in the free text field.
 - Header Field, that allows the questionnaire to be split into sections more clearly, but is not linked to anything in the Word Template.

While each document is saved as a Document object in Django, the questionnaire itself is modelled using a json object (an array of javascript objects each representing one question in the questionnaire). This is stored as a jsonFileField under the Document object (Document.data). The main heavy lifting of questionnaire configuration and administration is done in admin.js, which together with formAdmin.html, is effectively a single page application that manipulates the questionnaire json object (docData) within Javascript. This enables the document creator to do all kinds of data manipulations, including linking the questionnaire fields to the corresponding conditional text/variable fields, rearranging the questionnaire fields, and even applying logic to the questionaire (i.e. only allowing certain questionnaire fields to appear if others are selected)

Ultimately, while everything happens in Javascript to docData, each time the user clicks on save, the docData is Javascript is posted to the server (updateData API view), updating the jsonFileField in the document object.

### Relevant Views

This part of the application comprises the following views in views.py:

 - getData (API) - allows the Javascript access to the questionnaire data json object
 - updateData (API) - updates the questionnaire data json object in the Django backend
 - updateStatus (API) - updates the "live" status of the form. Only published forms are live and are accessible by anonymous users.
 - editDoc - renders the single page application, comprising static/app/admin.js and formAdmin.html

## III. Questionnaire serving
Once the Document has been published, anonymous users can access the plain route `/<document.uuid>` (available for copying and sharing from the share tab in the admin application). When they access this route, the "form" view triggers, and renders the questionnaire as a webform. Most of the heavy lifting here is done in the html template (form.html) using jinja2 where we loop through `Document.data`, which is a list of dictionaries (or javascript objects) representing a questionnaire field. Selection Fields are rendered as either radios or checkboxes, depending on whether multiple selection is enabled by the document creator. Free Text Fields are rendered as a textarea.  Header fields are merely cosmetic. A function in form.js (checkAllDiv) implements the questionnaire logic, where if configured in the earlier step, some fields only appear conditionally.

When the form is submitted, the context dictionary to pass into the docxtpl template is created and stored in the sessions object. The user is then redirected to the final thank you page, where if he clicks on the download link, the getDocument view is triggered, which loads the Word template into docxtpl, passes in the context dictionary, and generates a file response that the anonymous user can download, thus completing the user journey.

### Relevant Views

This part of the application comprises the following views in views.py:

 - form - renders the form together with form.js
 - thankYou - renders the ending page
 - getDocument - create the final word template and passes back the file response where the anonymous user can then download.

## IV. Utility Functions and Random Stuff
The remaining views and the static css files are for utility and cosmetic purposes:

 - previewDoc: Allows document creator to preview the form before publishing, or at any point.
 - signin_view
 - signout_view
 - register
 - home: Landing page that explains DocComposer

## V. Complexity and Distinctiveness
The web application aspect of this project is both distinctive from and more complex than the previous ones in CS50 primarily because of its two-part nature. Part 1 focuses on creation of the document and the administration and configuration of the questionnaire, while the other part is more involved with the serving of the questionnaire to the anonymous end-user. The two parts are very different in their implementation. The questionnaire configuration and administration is mainly done in javascript, in the form of a single page application with many new front-end features involved (e.g. drag and drop for reordering). In contrast, the serving portion involves mostly the server side, with the heavy lifting primarily being done in the jinja2 template. Many of these ideas and functionality were not easy to conceptualise and implement, as many different situations and field types had to be catered for.

The project also taps on docxtpl, an external python package that allows document creators to set up their documents in Word. This is the natural place to do so in the office context, and allows linking of the questionnaire to the word template. This use of external packages and tools is quite novel beyond of the context of CS50. Also, the project involves working with file downloads and attachments, which was not covered in the previous projects.

Finally, the use of json objects in a JsonFileField to model and represent the questionnaire is quite different and is more aligned with the noSQL paradigm. This meant that all the manipulations of the questionnaire fields during the configuration phase took place on the json object on the frontend, before being posted to the backend as one complete json list object when done. Rendering the form from this list, primarily using jinja2, was also something new. 

## VI. Future Improvements
Future plans are as follows:

 - Segregate out the 2 parts into separate applications in the Django project, as described briefly in Lecture 3
 - Cater to more types of fields, e.g. formulas, and logic options
 - Move to a proper database on Azure (currently using the default sqlite)
 - Create a user guide
 - Move the first step (configuring of the word template) from MS Word and into the application proper

Please feel free to give me any suggestions at tanbingwen89@gmail.com. Thanks!
