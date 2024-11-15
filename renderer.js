



const { ipcRenderer } = require('electron');
const path = require('path');


/*
var original_toggle = document.getElementById("startSQL-toggle").getElementsByTagName("path")[0].getAttribute("d");

document.getElementById("startSQL-toggle").addEventListener('mouseover', (event) => {
  var tgl = document.getElementById("startSQL-toggle");
  var svg = tgl.getElementsByTagName("svg")[0];
  if (tgl.getAttribute("status") == "unactivate") {
    svg.firstElementChild.setAttribute("d", "M330.61,225.16,217,159.57c-23.74-13.71-53.41,3.42-53.41,30.84V321.59c0,27.42,29.67,44.55,53.41,30.84l113.61-65.59C354.35,273.13,354.35,238.87,330.61,225.16Z");
    
  } 
});



document.getElementById("startSQL-toggle").addEventListener('mouseout', (event) => {
  var tgl = document.getElementById("startSQL-toggle");
  var svg = tgl.getElementsByTagName("svg")[0];
  svg.firstElementChild.setAttribute("d", original_toggle);

});*/



let apacheVersions;

function serverSender(status) {
  switch (status) {
    case "Start" :
        ipcRenderer.send('open'); break;

    case "Stop" :
        ipcRenderer.send('close'); break;
      
  }

  console.log(status);
}

function openCloseServer(btn, status, send = true) {
  switch (status) {
    case "Start" :
      
      if (send)
        ipcRenderer.send('open');
      
      btn.classList.add("stop");
      btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 12C2 7.28595 2 4.92893 3.46447 3.46447C4.92893 2 7.28595 2 12 2C16.714 2 19.0711 2 20.5355 3.46447C22 4.92893 22 7.28595 22 12C22 16.714 22 19.0711 20.5355 20.5355C19.0711 22 16.714 22 12 22C7.28595 22 4.92893 22 3.46447 20.5355C2 19.0711 2 16.714 2 12Z" fill="currentColor"/></svg>Stop';
      break;
    
    case "Stopping" : 
      /*btn.classList.remove("stop");
      btn.classList.add("closing");
      btn.innerHTML = '<svg width="20" height="20" viewBox="128 128 256 256" data-name="Layer 1" id="Layer_1" xmlns="http://www.w3.org/2000/svg"><path class="cls-1" d="M330.61,225.16,217,159.57c-23.74-13.71-53.41,3.42-53.41,30.84V321.59c0,27.42,29.67,44.55,53.41,30.84l113.61-65.59C354.35,273.13,354.35,238.87,330.61,225.16Z" fill="currentColor"/></svg>Closing';*/
      break;
    case "Stop" :
      if (send)
        ipcRenderer.send('close');
      btn.classList.remove("stop");
      btn.classList.add("stopping");
      btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 12C2 7.28595 2 4.92893 3.46447 3.46447C4.92893 2 7.28595 2 12 2C16.714 2 19.0711 2 20.5355 3.46447C22 4.92893 22 7.28595 22 12C22 16.714 22 19.0711 20.5355 20.5355C19.0711 22 16.714 22 12 22C7.28595 22 4.92893 22 3.46447 20.5355C2 19.0711 2 16.714 2 12Z" fill="currentColor"/></svg>Stopping...';
      break;
  }
}




document.getElementById('open-close').addEventListener('click', (event) => {
  var btn = document.getElementById('open-close');
  var txt = btn.textContent.replace(/\s/g, '');
  serverSender(txt);
});


// Recieve app name.
ipcRenderer.on('closed', function (evt) {
 
  var btn = document.getElementById('open-close');
  if (btn.classList.contains("stopping"))
    btn.classList.remove("stopping");
  btn.innerHTML = '<svg width="20" height="20" viewBox="128 128 256 256" data-name="Layer 1" id="Layer_1" xmlns="http://www.w3.org/2000/svg"><path class="cls-1" d="M330.61,225.16,217,159.57c-23.74-13.71-53.41,3.42-53.41,30.84V321.59c0,27.42,29.67,44.55,53.41,30.84l113.61-65.59C354.35,273.13,354.35,238.87,330.61,225.16Z" fill="currentColor"/></svg>Start';
});

// Recieve app name.
ipcRenderer.on('open', function (evt) {
  var btn = document.getElementById('open-close');
  openCloseServer(btn, "Start", false);
});

// Recieve app name.
ipcRenderer.on('stopping', function (evt) {
  var btn = document.getElementById('open-close');
  var txt = btn.textContent.replace(/\s/g, '');
  openCloseServer(btn, txt, false);
});

document.getElementById('reveal').addEventListener('click', (event) => {
  ipcRenderer.send('reveal');
});

document.getElementById('editor').addEventListener('click', (event) => {
  ipcRenderer.send('editor');
});




document.getElementById('browser').addEventListener('click', (event) => {
  if (document.getElementById('browser').classList.contains("activated")) {
    ipcRenderer.send('browse');
  }
  
});

document.getElementById('manage-extensions').addEventListener('click', (event) => {
  ipcRenderer.send('manage-extensions');
});







document.getElementById("search").addEventListener("input", (event) => {
  var val = document.getElementById("search").value;
  var cards = document.getElementsByClassName("cards-container")[0].children;
  for (var element of cards) {
    
    var c = element.textContent.replace(/\//g, '\\');
    console.log(c);
    if (c.includes(val) && element.id != "empty") {
      element.style.display = "block";
    } else {
      element.style.display = "none";
    }
  }
});







// Send message.
ipcRenderer.send('asynchronous-message', 'php-versions');

// Recieve app name.
ipcRenderer.on('php-versions', function (evt, data) {
  /*var versions = Object.keys(data);
  var select = document.getElementById('php-versions');
  for (var version of versions) {
    var c = document.createElement("option");
    c.value = version;
    c.textContent = version;
    select.appendChild(c);
  }*/
});




function select_new_project(project_name) {
  if (project_name == null) {
    document.getElementById("app-name").textContent = "";
    return;
  }
  
  document.getElementById("app-name").textContent = project_name;

  var cards = document.getElementsByClassName("cards-container")[0].children;
  for (var element of cards) {
    
    var c = element.getAttribute("name");
    if (c == project_name) {
      if (!element.classList.contains("selected"))
        element.classList.add("selected");
        // Put first position
        //element.parentNode.prepend(element);
    } else {
      if (element.classList.contains("selected"))
        element.classList.remove("selected");
    }
  }
}

ipcRenderer.on('select-project', function (evt, data) {
  var project_name = data.project_name;
  select_new_project(project_name);
});




// Receive app name.
ipcRenderer.on('currentProject', function (evt, data) {
  var currentProject = data;
  select_new_project(currentProject);
});

// Receive progress.
ipcRenderer.on('progress-load', function (evt, data) {
  var progress = data;
  console.log(progress);
});


ipcRenderer.send('asynchronous-message', 'get-projects');


function generateCardHTML(name, date, selected = false) {
  const selectedClass = selected ? 'selected' : '';
  return `
    <div class="card ${selectedClass}" name="${name}">
      <div class="header">
        <!--<img src="../${name}/favicon.ico">-->
        <div class="round"></div>
      </div>
      <span></span>
      <div class="content">
        <button class="check">
          <svg width="25" height="25" viewBox="2 2 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12ZM16.0303 8.96967C16.3232 9.26256 16.3232 9.73744 16.0303 10.0303L11.0303 15.0303C10.7374 15.3232 10.2626 15.3232 9.96967 15.0303L7.96967 13.0303C7.67678 12.7374 7.67678 12.2626 7.96967 11.9697C8.26256 11.6768 8.73744 11.6768 9.03033 11.9697L10.5 13.4393L12.7348 11.2045L14.9697 8.96967C15.2626 8.67678 15.7374 8.67678 16.0303 8.96967Z" fill="currentColor"/>
          </svg>
          <div class="background"></div>
        </button>
        
        <article>
          <h3>${name}</h3>
          <div class="footer">
            <span>${date}</span>
          </div>
        </article>
        
      </div>
    </div>`;
}

function add_project(name, date, selected = false) {
  
  let ca = generateCardHTML(name, date);
  document.getElementsByClassName("cards-container")[0].insertAdjacentHTML( 'beforeend', ca );

  var card = document.getElementsByClassName("cards-container")[0].lastChild;

  if (selected)
    select_new_project(name);
  
  card.addEventListener('click', (event) => {
    var name = {"name": card.getAttribute("name")};
    ipcRenderer.send('select_project', name);
    
    select_new_project(name.name);
  });
}

function remove_project(name) {
  for (var element of document.getElementsByClassName("cards-container")[0].children) {
    if (element.getAttribute("name") == name) {
      element.parentElement.removeChild(element);
      break;
    }
  }
}

// Receive app name.
ipcRenderer.on('get-projects', function (evt, projects) {
  
  for (var key of Object.keys(projects)) {
    var proj = projects[key];
    var name = key;
    var date = proj.last_edited;

    add_project(name, date);
  }


  for (let card of document.getElementsByClassName("cards-container")[0].children) {
    card.addEventListener('click', (event) => {
      var name = {"name": card.getAttribute("name")};
      ipcRenderer.send('select_project', name);
      
      select_new_project(name.name);
    });
  }
  

  ipcRenderer.send('asynchronous-message', 'currentProject');


    
});


function find_popup(e) {
  if (e.classList.contains("popup"))
      return e;
  return find_popup(e.parentElement);
}

function close_popup(element) {
  find_popup(element).style.display = "none";
}


for (var close_btn of document.getElementsByClassName("close-popup")) {
  close_btn.addEventListener("click", (evt) => {
    close_popup(close_btn);
  })
}


document.getElementById("add").addEventListener("click", () => {
  document.getElementById("add-project").style.display = "flex";
})


document.getElementById("add-project").style.display = "none";


function load_folder(result) {
  const folderPath = result.path;
  const date = result.date
  const selected = result.selected;

  console.log(result.config);

  if (folderPath) {
    
    const folderName = path.basename(folderPath);
    add_project(folderName, date, selected);

    close_popup(document.getElementById("add-project"));
    // You can update the UI or handle the folder path as needed
  } else {
    console.log('No folder selected');
  }
}

document.getElementById("select-folder").addEventListener("click", async () => {
  // Send a message to the main process to open the folder dialog
  var result = await ipcRenderer.invoke('open-folder-dialog')
  load_folder(result);


});

ipcRenderer.on('close-but-running', function (evt, result) {

  document.getElementById("close-but-server-running").style.display = "flex";

});

document.getElementById("cancel-close").addEventListener("click", async () => {

  document.getElementById("close-but-server-running").style.display = "none";

});

document.getElementById("accept-close").addEventListener("click", async () => {

  ipcRenderer.send("close-app")

});

// Prevent default behavior for dragover event
document.getElementById("select-folder").addEventListener('dragover', (event) => {
  event.preventDefault();
});

document.getElementById("select-folder").addEventListener('drop', async (event) => {
  event.preventDefault();
  event.stopPropagation();

  event.preventDefault();
  const filePath = event.dataTransfer.files[0].path;
  console.log(filePath);
  ipcRenderer.send('folder-dropped', filePath);
});



ipcRenderer.on('folder-dropped', function (evt, result) {

  load_folder(result);

});




// Add event listener for right click on elements with the .card class
window.addEventListener('contextmenu', (event) => {
  if (event.target.closest('.card')) {
    event.preventDefault();
    const name = event.target.closest('.card').getAttribute('name');
    ipcRenderer.send('show-context-menu', { "action": 'delete', "name": name });
  }
});



// Listen for context menu commands
ipcRenderer.on('context-menu-command', (event, data) => {
  if (data.command === 'delete') {
    remove_project(data.name);
  }
});

// Listen for context menu commands
ipcRenderer.on('select_project', (event, name) => {
  console.log(name);
  select_new_project(name);
});


const dropZone = document.getElementById('select-folder');

dropZone.addEventListener('dragenter', (event) => {
  event.preventDefault();
  dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragover', (event) => {
  event.preventDefault();
  dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', (event) => {
  event.preventDefault();
  dropZone.classList.remove('drag-over');
});


// When body is dragged, lets open the popup
document.body.addEventListener('dragover', (event) => {
  event.preventDefault();
  event.stopPropagation();
  if (document.getElementById("add-project").style.display == "none") 
    document.getElementById("add-project").style.display = "flex";
});





ipcRenderer.send('asynchronous-message', 'getApacheversion');

// Listen for context menu commands
ipcRenderer.on('getApacheversion', (event, data) => {
  var version = data.version;
  var mode = data.mode;

  var boolstatus = mode == "Online";

  document.getElementById("apache-lan-toggle").setAttribute("status", (boolstatus) ? "activate" : "unactivate");

  document.getElementById("apache-version").textContent = version;
});


document.getElementById("open-apache-folder").addEventListener('click', (event) => {
  ipcRenderer.send('asynchronous-message', 'openApacheFolder');
});


document.getElementById("open-php-folder").addEventListener('click', (event) => {
  ipcRenderer.send('asynchronous-message', 'openPHPFolder');
});


ipcRenderer.send('asynchronous-message', 'getPhpVersions');

// Listen for context menu commands
ipcRenderer.on('getPhpVersions', (event, data) => {


  let selected = data.selected;

  var versionsContainer = document.getElementById("php-versions").getElementsByClassName("content")[0];
  var versions = Object.keys(data.paths);
  versions.reverse()
  
  for (let version of versions) {
    var htmlButtonContent = `
      ${version}
      <div class="check">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path fill-rule="evenodd" clip-rule="evenodd" d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12ZM16.0303 8.96967C16.3232 9.26256 16.3232 9.73744 16.0303 10.0303L11.0303 15.0303C10.7374 15.3232 10.2626 15.3232 9.96967 15.0303L7.96967 13.0303C7.67678 12.7374 7.67678 12.2626 7.96967 11.9697C8.26256 11.6768 8.73744 11.6768 9.03033 11.9697L10.5 13.4393L12.7348 11.2045L14.9697 8.96967C15.2626 8.67678 15.7374 8.67678 16.0303 8.96967Z" fill="currentColor"/>
        </svg>
        <div class="background"></div>
      </div>
    `
    let newBtn = document.createElement("button");
    newBtn.innerHTML = htmlButtonContent;
    newBtn.className = (version == selected) ? "selected" : "";

    newBtn.addEventListener("click", () => {
      ipcRenderer.send('change-PHP-version', version);
      var par = newBtn.parentElement;
      var btntoremove = par.getElementsByClassName("selected")[0]
      btntoremove.className = "";
      newBtn.className = "selected";
      
    });

    versionsContainer.insertBefore(newBtn, versionsContainer.firstChild);
  };

  document.getElementById("php-version").textContent = selected;
});


ipcRenderer.send('asynchronous-message', 'getMariaDBversion');


function toggle_listener(clickable, toggle) {
  
  clickable.addEventListener("click", () => {
    
    if (toggle.getAttribute("status") == "activate") {
      toggle.setAttribute("status", "unactivate");

    } else {
      toggle.setAttribute("status", "activate");
    }

    var msg = toggle.getAttribute("message");
    ipcRenderer.send(msg, toggle.getAttribute("status") == "activate");

  });
}

for (let toggle of document.getElementsByClassName("toggle")) {
  

  let clickable = toggle;


  if (toggle.parentElement.tagName.toLowerCase() == "button") {
    clickable = toggle.parentElement;
  }

  toggle_listener(clickable, toggle);
}



// Listen for context menu commands
ipcRenderer.on('getMariaDBversion', (event, data) => {
  var version = data.version;
  var status = data.status;

  var boolstatus = status == "Started";

  document.getElementById("startSQL-toggle").setAttribute("status", (boolstatus) ? "activate" : "unactivate");

  document.getElementById("sql-installed-version").textContent = version;



  set_sql_server_status(boolstatus);
});


function set_sql_server_status(status) {
  const status_info = document.getElementById("status-db");
  if (status) {
    status_info.textContent = "Online";
    status_info.className = "open-sql";
  } else {
    status_info.textContent = "Offline";
    status_info.className = "close-sql";
  }
}

document.getElementById("open-SQL-folder").addEventListener('click', (event) => {
  ipcRenderer.send('asynchronous-message', 'openSQLFolder');
});



document.getElementById('create-new').addEventListener('click', async () => {
  const result = await ipcRenderer.invoke('show-create-folder-dialog');
  load_folder(result);
});