// popupRenderer.js
const { ipcRenderer } = require('electron');

ipcRenderer.on('extensions-list', (event, extensions) => {
  const extensionsContainer = document.getElementById('extensionsContainer');
  extensionsContainer.innerHTML = '';
  
  extensions.forEach(extension => {
    let listItem = document.createElement('div');
    if (extension.enabled)
      listItem.classList.add("selected");

    const checkbtn = document.createElement('button');
    checkbtn.className = "check";
        
    checkbtn.innerHTML = '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12ZM16.0303 8.96967C16.3232 9.26256 16.3232 9.73744 16.0303 10.0303L11.0303 15.0303C10.7374 15.3232 10.2626 15.3232 9.96967 15.0303L7.96967 13.0303C7.67678 12.7374 7.67678 12.2626 7.96967 11.9697C8.26256 11.6768 8.73744 11.6768 9.03033 11.9697L10.5 13.4393L12.7348 11.2045L14.9697 8.96967C15.2626 8.67678 15.7374 8.67678 16.0303 8.96967Z" fill="currentColor"/></svg><div class="background"></div>';

    
    listItem.addEventListener('click', (evt) => {
      if (listItem.classList.contains("selected")) { // It is selected, so we unselect
        listItem.classList.remove("selected");
      } else {
        listItem.classList.add("selected");
      }
      
      ipcRenderer.send('update-extension-status', extension.name, (listItem.classList.contains("selected")));
    });

    const label = document.createElement('span');
    label.textContent = extension.name;

    
    listItem.classList.add("item");
    listItem.appendChild(label);
    listItem.appendChild(checkbtn);
    

    extensionsContainer.appendChild(listItem);
  });
});


document.getElementById("search").addEventListener("input", (event) => {
  var val = document.getElementById("search").value;
  var elements = document.getElementById("extensionsContainer").children;
  for (var element of elements) {
    var c = element.textContent.replace(/\//g, '\\');
    if (c.includes(val)) {
      element.style.display = "flex";
    } else {
      element.style.display = "none";
    }
  }
});