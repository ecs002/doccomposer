const uuid = window.location.href.split('/').reverse()[1];
const csrftoken = getCookie('csrftoken');
let docData = {};
let workingData = {};
let docVariables = [];
let activeStatus = false;
let responseOptionNum = 1;
let lastUpdatedDate = "";
const iconMap = {Selection:'check_box',FreeText:'text_fields',Header:'topic'};

document.addEventListener('DOMContentLoaded', function() {
    const selectFreeTextVariables = document.querySelector('#freeTextVariables');
    fetch(`/${uuid}/getData`)
    .then(response => response.json())
    .then(returnedData => {
        lastUpdatedDate = returnedData.updated;
        docData = returnedData.data;
        docVariables = returnedData.docVariables;
        activeStatus = returnedData.activeStatus;
        document.querySelector('#updateDateTime').innerHTML=lastUpdatedDate;
        docVariables.forEach((docVariable)=>{
            addSelectOptions(docVariable,selectFreeTextVariables,flag='insert_');
        })
        document.querySelectorAll('option').forEach(customSelectMultiple);
        build()
    })
    .catch(error => {
        console.log('Error:', error);
    });
    document.querySelector('#buildLink').onclick=build;
    document.querySelector('#logicLink').onclick=logic;
    document.querySelector('#shareLink').onclick=share;
    document.querySelector('#addElementButton').onclick=show_mobile_add;
    document.querySelector('#addResponseOption').onclick=()=>{
        add_response_option()
    };
    document.querySelectorAll('.add-element').forEach(clickable=>{
        clickable.onclick = function(){
            const fieldType = this.dataset.type;
            show_add_view(fieldType);
            return false;
        };
    });
    document.querySelectorAll('.cancel').forEach(clickable=>{
        clickable.onclick = function(){
            build();
            return false;
        };
    });
    document.querySelectorAll('.cancel-logic').forEach(clickable=>{
        clickable.onclick = function(){
            logic();
            return false;
        };
    });
    document.querySelector('#updateTemplateButton').onclick = function(){
        document.querySelector('#updateTemplateInput').click()
    };
    document.querySelector('#updateTemplateInput').onchange = function(){
        document.querySelector("#updateTemplateForm").submit();
    };
    document.querySelector('#copyLink').onclick = function(){
        const urlField = document.querySelector('#urlToShare');
        urlField.select();
        urlField.setSelectionRange(0, 99999);
        document.execCommand("copy");
    };
    document.querySelector('#liveSwitch').onclick = ()=>{
        activeStatus = !activeStatus;
        updateStatus();
    };
    document.querySelector('#addLogicButton').onclick = ()=>{
        show_add_logic_view();
    };
    document.querySelector('#addSelectionLogicOption').onclick = ()=>{
        add_selection_logic_option();
    };
    document.querySelector(`#addLogicForm`).onsubmit = function(event){
        event.preventDefault();
        if (!event.target.checkValidity()) {
            event.stopPropagation();
            event.target.classList.add('was-validated');
          } else{
              save_logic_item(event);
          }
          return false;
    }
});

function build(){
    workingData={};
    const elementDiv = document.querySelector('#elementDiv');
    document.querySelectorAll('.view').forEach(view=>{
        view.style.display='none';
    });
    document.querySelector('#buildView').style.display = 'block';
    document.querySelector('#addElementDiv').style.display = 'none';
    document.querySelector('#addElementButton').style.display="flex";
    elementDiv.style.display='block';
    while (elementDiv.lastElementChild) { // reset the nodes
        elementDiv.removeChild(elementDiv.lastElementChild);
      };
    docData.forEach(function(queryItem,index){
        let queryDiv = document.createElement("div");
        queryDiv.classList.add("card");
        queryDiv.classList.add("query-field");
        queryDiv.setAttribute('data-pos',index)
        queryDiv.innerHTML = `<div class="card-body row">
                                <div class="col-6 col-md-10 truncate-ellipses">
                                    <i class="material-icons md-light md-32 align-middle pe-2">${iconMap[queryItem.type]}</i>
                                    <span class="align-middle">${queryItem.prompt}</span>
                                </div>
                                <div class="col-6 col-md-2 d-flex justify-content-end align-items-center">
                                    <i class="material-icons md-light align-middle delete-icon pe-3">delete</i>
                                    <i class="material-icons md-light align-middle reorder-icon ps-3">open_with</i>
                                </div>
                            </div>`
        queryDiv.onclick= () => {
            show_add_view(queryItem.type,position=index)
        };
        queryDiv.ondragover=function(event){
            event.preventDefault();
            event.currentTarget.classList.add('query-field-drag');
        }
        queryDiv.ondragleave=function(event){
            event.preventDefault();
            event.currentTarget.classList.remove('query-field-drag');
        }
        queryDiv.ondrop=function(event){
            event.preventDefault();
            event.currentTarget.classList.remove('query-field-drag')
            const indexDropped = event.currentTarget.dataset.pos; 
            const indexDragged = event.dataTransfer.getData('position');
            reorder_query_fields(indexFrom=indexDragged,indexTo=indexDropped);
        }
        queryDiv.querySelector('.delete-icon').onclick=(event) => {
            docData.splice(position,1);
            updateData();
            event.stopPropagation();
        };
        queryDiv.querySelector('.reorder-icon').onclick=(event) => {
            event.stopPropagation();
        };
        queryDiv.querySelector('.reorder-icon').onmousedown=function(event){
            const parentCard = this.parentNode.parentNode.parentNode
            parentCard.draggable=true;
            parentCard.ondragstart=function(event){
                event.dataTransfer.setData("position",event.target.dataset.pos);
            };
            parentCard.ondragend=function(event){
                event.preventDefault();
                event.currentTarget.setAttribute('draggable',false)
            }
            event.stopPropagation();
        };
        queryDiv.querySelector('.reorder-icon').onmouseup=function(event){
            this.draggable=false;
        };
        elementDiv.appendChild(queryDiv)
    })
    return false;
};

function logic(){
    workingData={};
    document.querySelectorAll('.view').forEach(view=>{
        view.style.display='none';
    });
    document.querySelector('#logicView').style.display = 'block';
    const logicDiv = document.querySelector('#logicDiv');
    while (logicDiv.lastElementChild) { // reset the nodes
        logicDiv.removeChild(logicDiv.lastElementChild);
    };
    docData.forEach(function(queryItem,index){
        if(queryItem.showIf.length > 0){
            let queryDiv = document.createElement("div");
            queryDiv.classList.add("card");
            queryDiv.classList.add("logic-field");
            queryDiv.innerHTML = `<div class="card-body row">
                                    <div class="col-6 col-md-10 truncate-ellipses">
                                    <i class="material-icons md-light md-32 align-middle">${iconMap[queryItem.type]}</i>
                                    <span class="align-middle">${queryItem.prompt}</span>
                                    </div>
                                    <div class="col-6 col-md-2 d-flex justify-content-end align-items-center">
                                        <i class="material-icons md-light align-middle delete-icon ps-3">delete</i>
                                    </div>
                                </div>`;
            queryDiv.querySelector('.delete-icon').onclick=(event) => {
                docData[index].showIf = [];
                updateData(logic);
                event.stopPropagation();
            };
            queryDiv.onclick= () =>{
                show_add_logic_view(position=index);
            }
            logicDiv.appendChild(queryDiv)
        }
    })

    return false;
    
};

function share(){
    workingData={};
    document.querySelectorAll('.view').forEach(view=>{
        view.style.display='none';
    });
    document.querySelector('#shareView').style.display = 'block';
    const liveSwitch = document.querySelector('#liveSwitch'); //button to publish or deactivate
    const liveStatus = document.querySelector('#liveStatus'); //span showing the active status
    if (activeStatus){
        liveSwitch.innerHTML = 'Deactivate';
        liveStatus.innerHTML = 'LIVE';
        liveStatus.classList.remove('label-text-inactive');
        liveStatus.classList.add('label-text-active');
    }
    else {
        liveSwitch.innerHTML = 'Publish';
        liveStatus.innerHTML = 'NOT LIVE';
        liveStatus.classList.remove('label-text-active');
        liveStatus.classList.add('label-text-inactive');
    }
    return false;
};

function show_mobile_add(){
    document.querySelector('#elementDiv').style.display='none';
    document.querySelector('#addElementDiv').style.display = 'block';
    this.style.display='none';
    return false;
};


function show_add_view(fieldType, position=null){
    clear_fields()
    document.querySelectorAll('.view').forEach(view=>{
        view.style.display='none';
    });
    const addView = document.querySelector(`#add${fieldType}View`)
    addView.style.display = 'block';
    if (position != null){
        workingData = docData[position];
        switch(fieldType){
            case "Selection":
                addView.querySelector('#selectionTitle').value = workingData['prompt'];
                addView.querySelector('#selectionRequiredCheck').checked = workingData['required'];
                addView.querySelector('#selectionMultipleCheck').checked = workingData['multipleSelect'];
                workingData.responseOptions.forEach(responseOption=>{
                    add_response_option(responseOption=responseOption);
                })
                break;
            case "FreeText":
                addView.querySelector('#freeTextTitle').value = workingData['prompt'];
                addView.querySelector('#freeTextRequiredCheck').checked = workingData['required'];
                const options = addView.querySelector('#freeTextVariables').querySelectorAll('option');
                options.forEach(option=>{
                    if (workingData['linkedVariables'].includes(option.value)){
                        option.selected = true;
                    }
                });
                break;
            case "Header":
                addView.querySelector('#headerTitle').value = workingData['prompt'];
                break;
        }
    }

    document.querySelector(`#add${fieldType}Form`).onsubmit = function(event){
        event.preventDefault();
        if (!event.target.checkValidity()) {
            event.stopPropagation();
            event.target.classList.add('was-validated');
          } else{
              save_query_item(event,fieldType,position=position);
          }
          return false;
    }
};

function show_add_logic_view(position=null){
    document.querySelectorAll('.view').forEach(view=>{
        view.style.display='none';
    });
    document.querySelector('#addLogicView').style.display='block';
    const selectQueryLogicField = document.querySelector('#selectQueryLogicField');
    clear_logic_fields();
    docData.forEach(function(queryItem,index){
        addSelectOptions(queryItem.uuid,selectQueryLogicField,null,`${queryItem.type}_${queryItem.prompt}`);
    })
    if (position != null){
        const relevantUUID = docData[position].uuid;
        // const querySelectionOptions = selectQueryLogicField.querySelectorAll('options');
        // querySelectionOptions.forEach(option=>{
        //     if (option.value == relevantUUID){
        //         option.selected=true;
        //     }
        // })
        selectQueryLogicField.value=relevantUUID;
        selectQueryLogicField.disabled = true;
        const linkedResponses = docData[position].showIf;
        linkedResponses.forEach(response=>{
            add_selection_logic_option(response)
        })
    }
}

function save_query_item(event,fieldType,position=null){
    const form = event.target;
    workingData['type'] = fieldType;
    switch(fieldType){
        case "Selection":
            workingData['prompt'] = form.querySelector('#selectionTitle').value;
            workingData['required'] = form.querySelector('#selectionRequiredCheck').checked;
            workingData['multipleSelect'] = form.querySelector('#selectionMultipleCheck').checked;
            workingData['responseOptions'] = Array.from(form.querySelectorAll('.response-option'), (optionDiv) => {
                let responseOption = {};
                responseOption['uuid'] = optionDiv.querySelector('input.response-option-uuid').value;
                responseOption['option'] = optionDiv.querySelector('input.response-option-text').value;
                responseOption['linkedVariables'] = Array.from(optionDiv.querySelector('select').selectedOptions, x => x.value);
                return responseOption;
            })
            workingData['showIf'] = [];
            break;
        case "FreeText":
            workingData['prompt'] = form.querySelector('#freeTextTitle').value;
            workingData['required'] = form.querySelector('#freeTextRequiredCheck').checked;
            workingData['linkedVariables'] = Array.from(form.querySelector('#freeTextVariables').selectedOptions, x => x.value);
            workingData['showIf'] = [];
            break;
        case "Header":
            workingData['prompt'] = form.querySelector('#headerTitle').value;
            workingData['showIf'] = [];
            break;
    }
    if (position === null){
        docData.push(workingData)
    } else {
        docData[position] = workingData;
    }
    updateData();
    
}

function save_logic_item(event){
    const form = event.target;
    const queryItemUUID = form.querySelector('#selectQueryLogicField').value;
    const queryItemPos = searchArrayByDictValueUnique(docData,"uuid",queryItemUUID).index;
    if (queryItemPos >= 0) { //means queryItem was found, as otherwise it returns -1
        docData[queryItemPos]['showIf'] = Array.from(form.querySelectorAll('.logic-option'),(optionDiv)=>{
            const selectField = optionDiv.querySelector('select.field-option')
            const optionField = optionDiv.querySelector('select.response-option')
            return `${optionField.value}`;
        })
        updateData(logic);
    }
}

function add_response_option(responseOption = null){
    const responseOptionsDiv = document.querySelector('#responseOptions');
    const element = document.createElement('div');
    element.classList.add("card");
    element.classList.add("mb-2");
    element.classList.add("response-option"); 
    element.innerHTML = `<div class="card-body row">
                            <div class="col-10">
                            <div class="row g-3">
                                <input type="hidden" class="response-option-uuid" value="">
                                <div class="col-md-6 d-flex align-items-center">
                                    <input type="text" class="form-control response-option-text" placeholder="" value="Option ${responseOptionNum}" required>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label">Link Conditional Variable(s)</label>
                                    <select class="form-select" size="3" multiple>
                                </select>
                                </div>
                            </div>
                            </div>
                            <div class="col-2 d-flex align-items-center justify-content-center">
                            <a href=""><i class="material-icons">delete</i></a>
                            </div>
                        </div>`;
    docVariables.forEach((docVariable)=>{
        addSelectOptions(docVariable,element.querySelector('select'),flag='show_');
    })

    element.querySelectorAll('option').forEach(customSelectMultiple);
    if (responseOption != null){
        element.querySelector('input.response-option-uuid').value = responseOption['uuid'];
        element.querySelector('input.response-option-text').value = responseOption['option'];
        element.querySelectorAll('option').forEach(option=>{
            if (responseOption['linkedVariables'].includes(option.value)){
                option.selected = true;
            }
        })
    }
    const deleteButton = element.querySelector('a');
    deleteButton.onclick = function() {
        this.parentNode.parentNode.parentNode.remove();
        responseOptionNum--;
        return false
    }
    responseOptionsDiv.appendChild(element);
    responseOptionNum++;
}

function add_selection_logic_option(logicOption=null){
    const logicOptionsDiv = document.querySelector('#logicOptions');
    const element = document.createElement('div');
    element.classList.add("card");
    element.classList.add("mb-2");
    element.classList.add("logic-option"); 
    element.innerHTML = `<div class="card-body row">
                            <div class="col-10">
                                <div class="row g-3">
                                    <div class="col-md-6">
                                    <label>Query</label>
                                    <select class="form-select mt-2 field-option" required>
                                        <option hidden disabled selected value> -- Choose a selection field -- </option>
                                    </select>
                                    <div class="invalid-feedback">
                                        Please select a field.
                                    </div>
                                    </div>
                                    <div class="col-md-6 option-div">
                                    <label>Option</label>
                                    <select class="form-select mt-2 response-option" required>
                                    <option hidden disabled selected value> -- Choose a response option -- </option>
                                    </select>
                                    <div class="invalid-feedback">
                                        Please select an option.
                                    </div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-2 d-flex align-items-center justify-content-center">
                                <a href=""><i class="material-icons">delete</i></a>
                            </div>
                        </div>`;
    const logicQuerySelection = element.querySelector('select.field-option');
    const optionDiv = element.querySelector('.option-div');
    optionDiv.style.visibility = 'hidden'
    docData.forEach(function(queryItem,index){
        
        if (queryItem.type == 'Selection'){
            addSelectOptions(queryItem.uuid,logicQuerySelection,null,`${queryItem.type}_${queryItem.prompt}`);
        }
    });
    logicQuerySelection.onchange = function(){
        const siblingOptionDiv = this.parentElement.nextElementSibling.querySelector('select');
        while (siblingOptionDiv.childElementCount>1) { // reset the nodes
            siblingOptionDiv.removeChild(siblingOptionDiv.lastElementChild);
        };
        siblingOptionDiv.parentElement.style.visibility = 'visible';
        const selectedUUID = this.value;
        const queryItem = searchArrayByDictValueUnique(docData,"uuid",selectedUUID).item;
        queryItem.responseOptions.forEach(responseOption=>{
            addSelectOptions(`${queryItem.uuid}_${responseOption.uuid}`,siblingOptionDiv,null,responseOption.option)
        })
    };
    if (logicOption != null){
        const fieldUUID = logicOption.split('_')[0];
        const optionUUID =  logicOption.split('_')[1];
        // logicQuerySelection.querySelector('option').forEach(option=>{
        //     if (option.value == fieldUUID){
        //         option.selected = True;
        //     }
        // });
        logicQuerySelection.value = fieldUUID;
        let event = new Event('change');
        logicQuerySelection.dispatchEvent(event);
        element.querySelector('select.response-option').value=`${fieldUUID}_${optionUUID}`;
    }
    const deleteButton = element.querySelector('a');
    deleteButton.onclick = function() {
        this.parentNode.parentNode.parentNode.remove();
        return false
    }
    logicOptionsDiv.appendChild(element);
}

function updateData(runFunction = null){
    const request = new Request(
        `/${uuid}/updateData`,
        {headers: {'X-CSRFToken': csrftoken}}
    );
    fetch(request, {
        method: 'PUT',
        body: JSON.stringify(docData)
    })
    .then(response => response.json())
    .then(returnedData => {
        lastUpdatedDate = returnedData.updated;
        docData = returnedData.data;
        activeStatus = returnedData.activeStatus;
        document.querySelector('#updateDateTime').innerHTML=lastUpdatedDate;
        if (runFunction === null){
            build();
        } else{
            runFunction();
        }
        
    })
    .catch(error => {
        console.log('Error:', error);
    });
}

function updateStatus(){
    const request = new Request(
        `/${uuid}/updateStatus`,
        {headers: {'X-CSRFToken': csrftoken}}
    );
    fetch(request, {
        method: 'PATCH',
        body: JSON.stringify({active:activeStatus})
    })
    .then(response => response.json())
    .then(returnedData => {
        lastUpdatedDate = returnedData.updated;
        docData = returnedData.data;
        activeStatus = returnedData.activeStatus;
        document.querySelector('#updateDateTime').innerHTML=lastUpdatedDate;
        share();
    })
    .catch(error => {
        console.log('Error:', error);
    });
}

function clear_fields(){
    document.querySelectorAll('input').forEach(inputField=>{
        if (inputField.id != 'urlToShare'){
            inputField.value="";
        }
    });
    document.querySelectorAll('textarea').forEach(inputField=>{
        inputField.value="";
    });
    document.querySelectorAll('.form-check-input').forEach(switchField=>{
        switchField.checked=true;
    });
    const responseOptionsDiv = document.querySelector('#responseOptions')
    while (responseOptionsDiv.lastElementChild) { // reset the nodes
        responseOptionsDiv.removeChild(responseOptionsDiv.lastElementChild);
    };
    const options = document.querySelectorAll('option');
    options.forEach(option=>{
            option.selected = false;
    });
    responseOptionNum = 1;
}

function clear_logic_fields(){
    const selectQueryLogicField = document.querySelector('#selectQueryLogicField');
    while (selectQueryLogicField.lastElementChild) { // reset the nodes
        selectQueryLogicField.removeChild(selectQueryLogicField.lastElementChild);
    };
    selectQueryLogicField.disabled = false;
    const optionsDiv = document.querySelector('#logicOptions')
    while (optionsDiv.lastElementChild) { // reset the nodes
        optionsDiv.removeChild(optionsDiv.lastElementChild);
    };
    addSelectOptions("",selectQueryLogicField,null,' -- Choose a field -- ');
    const startingOption = selectQueryLogicField.querySelector('option');
    startingOption.selected = true;
    startingOption.hidden = true;
    startingOption.disabled = true;
     
}

function reorder_query_fields(indexFrom,indexTo){
    if (indexFrom != indexTo){
        const queryItem = docData.splice(indexFrom,1)[0];
        docData.splice(indexTo,0,queryItem);
    }
    updateData();
}

function customSelectMultiple(element){ //change to select multiple without control click
    element.addEventListener("mousedown", 
        function (e)
        {
            e.preventDefault();
            element.parentElement.focus();
            this.selected = !this.selected;
            return false;
        }
        , false
    );
}

function addSelectOptions(value,selectElement,flag=null,text=null){
    if (flag===null || String(value).startsWith(flag)){
        let option = document.createElement("option");
        option.value = String(value);
        if (flag != null){
            if (text===null){
                option.text = String(value).slice(flag.length);
            } else {
                option.text = text;
            }
        } else{
            if (text===null){
                option.text = String(value);
            } else {
                option.text = text;
            }
        }
        selectElement.appendChild(option)
    }
}

function searchArrayByDictValueUnique(array,key,value){
    var returnDict ={};
    var returnindex=-1;
    array.forEach(function(dict,index){
        if (dict[key] == value){
            returnDict = dict;
            returnindex = index;
        }
    })
    return {item:returnDict,index:returnindex};
}

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

