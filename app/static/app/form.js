const uuidForm = window.location.href.split('/').reverse()[0];
let docDataForm = {};

document.addEventListener('DOMContentLoaded', function(){
    fetch(`/${uuidForm}/getData`)
    .then(response => response.json())
    .then(returnedData => {
        docDataForm = returnedData.data;
        checkAllDiv();
    })
    .catch(error => {
        console.log('Error:', error);
    });
    document.querySelector('form').onsubmit=(e)=>{
        if (!e.target.checkValidity()) {
            e.preventDefault();
            e.stopPropagation();
          }
        e.target.classList.add('was-validated');
    };
    document.querySelectorAll('input').forEach(inputField=>{
        inputField.onclick = ()=>{
            checkAllDiv();
        }
    })
});

function checkAllDiv(){
    docDataForm.forEach(queryItem=>{
        if (queryItem.showIf.length > 0){
            const conditionalDiv = document.getElementById(`${queryItem.uuid}`);
            conditionalDiv.style.display='none';
            conditionalDiv.querySelectorAll('textarea,input').forEach(inputField=>{
                inputField.disabled = true;
            })
            queryItem.showIf.forEach(linkedOption=>{
                const fieldUUID = linkedOption.split('_')[0];
                const optionUUID = linkedOption.split('_')[1];
                if (document.getElementById(optionUUID).checked){
                    conditionalDiv.style.display='block';
                    conditionalDiv.querySelectorAll('textarea,input').forEach(inputField=>{
                        inputField.disabled = false;
                    })
                }
            })
        }
    })
}