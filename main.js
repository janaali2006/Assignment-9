var fullNameElement = document.getElementById('fullName');
var phoneNumberElement = document.getElementById('phoneNumber');
var emailAddressElement = document.getElementById('emailAddress');
var addressElement = document.getElementById('address');
var notesElement = document.getElementById('notes');
var groupElement = document.getElementById('group');
var isFavoriteElement = document.getElementById('isFavorite');
var isEmergencyElement = document.getElementById('isEmergency');
 
var totalContactsElement = document.getElementById('totalContacts');
var contactsCountElement = document.getElementById('contactsCount');
var favoritesCountElement = document.getElementById('favoritesCount');
var emergencyCountElement = document.getElementById('emergencyCount');
 
var rowData = document.getElementById('rowData');
var favoritesList = document.getElementById('favoritesList');
var emergencyList = document.getElementById('emergencyList');
 
var modalElement = document.getElementById('addContactModal');
var modalTitle = document.getElementById('addContactModalLabel');
var saveContactBtn = document.getElementById('saveContactBtn');
var updateContactBtn = document.getElementById('updateContactBtn');
 


var contacts = JSON.parse(localStorage.getItem('contacts')) || [];
var updateId = null;      
var currentSearch = '';   
var searchTimer;          
var avatarColors = ['bg-danger', 'bg-primary', 'bg-success', 'bg-warning', 'bg-info', 'bg-secondary'];
 
displayContacts();
 
function saveToLocalStorage() {
    localStorage.setItem('contacts', JSON.stringify(contacts));
}
 
function escapeHTML(text) {
    return String(text || '').replace(/[&<>"']/g, function (ch) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
}
 
function getInitial(name) {
    return name.trim().charAt(0).toUpperCase();
}
 
function getContactById(id) {
    for (var i = 0; i < contacts.length; i++) {
        if (contacts[i].id === id) return contacts[i];
    }
    return null;
}
 
function clearForm() {
    fullNameElement.value = '';
    phoneNumberElement.value = '';
    emailAddressElement.value = '';
    addressElement.value = '';
    notesElement.value = '';
    groupElement.value = '';
    isFavoriteElement.checked = false;
    isEmergencyElement.checked = false;
}
 
function getModal() {
    return bootstrap.Modal.getOrCreateInstance(modalElement);
}
 

modalElement.addEventListener('hidden.bs.modal', function () {
    clearForm();
    updateId = null;
    modalTitle.innerHTML = 'Add New Contact';
    saveContactBtn.classList.remove('d-none');
    updateContactBtn.classList.add('d-none');
});
 

function readForm() {
    var name = fullNameElement.value.trim();
    var phone = phoneNumberElement.value.trim();
 
    if (name === '' || phone === '') {
        Swal.fire({ title: 'Name and phone are required', icon: 'warning' });
        return null;
    }
    return {
        fullName: name,
        phoneNumber: phone,
        emailAddress: emailAddressElement.value.trim(),
        address: addressElement.value.trim(),
        notes: notesElement.value.trim(),
        group: groupElement.value,
        isFavorite: isFavoriteElement.checked,
        isEmergency: isEmergencyElement.checked
    };
}
 
function saveContact() {
    var data = readForm();
    if (!data) return;
 
    data.id = Date.now();
    contacts.push(data);
    saveToLocalStorage();
    displayContacts();
    getModal().hide();
 
    Swal.fire({ title: 'Contact Saved!', icon: 'success' });
}
 
function displayContacts() {
   
    var favCount = 0, emergCount = 0;
    var favBox = '', emergBox = '';
 
    for (var i = 0; i < contacts.length; i++) {
        var c = contacts[i];
        var sideCard = `
            <div class="d-flex align-items-center gap-2 p-2 mb-2 border rounded">
                <div class="rounded-circle bg-primary text-white fw-bold d-flex align-items-center justify-content-center" style="width:40px;height:40px">
                    ${escapeHTML(getInitial(c.fullName))}
                </div>
                <div class="flex-grow-1">
                    <h6 class="mb-0">${escapeHTML(c.fullName)}</h6>
                    <small class="text-muted">${escapeHTML(c.phoneNumber)}</small>
                </div>
                <a class="btn btn-sm btn-success" href="tel:${escapeHTML(c.phoneNumber)}"><i class="fas fa-phone"></i></a>
            </div>`;
        if (c.isFavorite) { favBox += sideCard; favCount++; }
        if (c.isEmergency) { emergBox += sideCard; emergCount++; }
    }
 
    totalContactsElement.innerHTML = contacts.length;
    contactsCountElement.innerHTML = contacts.length;
    favoritesCountElement.innerHTML = favCount;
    emergencyCountElement.innerHTML = emergCount;
    favoritesList.innerHTML = favBox;
    emergencyList.innerHTML = emergBox;
 
    var data = filterContacts(currentSearch);
 
    if (data.length === 0) {
        rowData.innerHTML = '<p class="alert alert-danger text-center">No contacts found</p>';
        return;
    }
 
    var box = '';
    for (var j = 0; j < data.length; j++) {
        var d = data[j];
        var color = avatarColors[d.id % avatarColors.length];
        box += `
        <div class="col-md-6">
            <div class="contact-card">
                <div class="contact-header">
                    <div class="contact-avatar ${color} ${d.isFavorite ? 'favorite' : ''} ${d.isEmergency ? 'emergency' : ''}">
                        ${escapeHTML(getInitial(d.fullName))}
                    </div>
                    <div class="contact-info"><h4>${escapeHTML(d.fullName)}</h4></div>
                </div>
                <div class="contact-details">
                    <div class="contact-detail phone"><i class="fas fa-phone"></i><span>${escapeHTML(d.phoneNumber)}</span></div>
                    <div class="contact-detail email"><i class="fas fa-envelope"></i><span>${escapeHTML(d.emailAddress)}</span></div>
                    <div class="contact-detail address"><i class="fas fa-map-marker-alt"></i><span>${escapeHTML(d.address)}</span></div>
                </div>
                <div class="contact-tags">
                    ${d.group ? `<span class="tag ${escapeHTML(d.group)}">${escapeHTML(d.group)}</span>` : ''}
                    ${d.isEmergency ? '<span class="tag emergency"><i class="fas fa-heartbeat"></i> Emergency</span>' : ''}
                    ${d.isFavorite ? '<span class="tag favorites"><i class="fas fa-star"></i> Favorite</span>' : ''}
                </div>
                <div class="contact-actions">
                    <a class="contact-action call" title="Call" href="tel:${escapeHTML(d.phoneNumber)}"><i class="fas fa-phone"></i></a>
                    <a class="contact-action email" title="Email" href="mailto:${escapeHTML(d.emailAddress)}"><i class="fas fa-envelope"></i></a>
                    <button onclick="toggleFavorite(${d.id})" class="contact-action favorite ${d.isFavorite ? 'active' : ''}" title="Favorite">
                        <i class="${d.isFavorite ? 'fas' : 'far'} fa-star"></i>
                    </button>
                    <button onclick="toggleEmergency(${d.id})" class="contact-action emergency ${d.isEmergency ? 'active' : ''}" title="Emergency">
                        <i class="${d.isEmergency ? 'fas' : 'far'} fa-heart"></i>
                    </button>
                    <button onclick="getContactForUpdate(${d.id})" class="contact-action" title="Edit"><i class="fas fa-edit"></i></button>
                    <button onclick="deleteContact(${d.id})" class="contact-action delete" title="Delete"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        </div>`;
    }
    rowData.innerHTML = box;
}
 
function getContactForUpdate(id) {
    var contact = getContactById(id);
    if (!contact) return;
 
    updateId = id;
    fullNameElement.value = contact.fullName;
    phoneNumberElement.value = contact.phoneNumber;
    emailAddressElement.value = contact.emailAddress;
    addressElement.value = contact.address;
    notesElement.value = contact.notes;
    groupElement.value = contact.group;
    isFavoriteElement.checked = contact.isFavorite;
    isEmergencyElement.checked = contact.isEmergency;
 
    modalTitle.innerHTML = 'Edit Contact';
    saveContactBtn.classList.add('d-none');
    updateContactBtn.classList.remove('d-none');
    getModal().show();
}
 
function updateContact() {
    var data = readForm();
    if (!data) return;
 
    var contact = getContactById(updateId);
    Object.assign(contact, data);
 
    saveToLocalStorage();
    displayContacts();
    getModal().hide();
 
    Swal.fire({ title: 'Updated!', text: 'Your contact has been updated.', icon: 'success' });
}
 
function deleteContact(id) {
    Swal.fire({
        title: 'Are you sure you want to delete this contact?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#10b981',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, delete it!'
    }).then(function (result) {
        if (!result.isConfirmed) return;
 
        var index = contacts.indexOf(getContactById(id));
        contacts.splice(index, 1);
        saveToLocalStorage();
        displayContacts();
 
        Swal.fire({ title: 'Deleted!', text: 'The contact has been deleted.', icon: 'success' });
    });
}
 
function filterContacts(input) {
    var text = input.toLowerCase();
    var result = [];
    for (var i = 0; i < contacts.length; i++) {
        var c = contacts[i];
        if (c.fullName.toLowerCase().includes(text) ||
            c.phoneNumber.includes(text) ||
            c.emailAddress.toLowerCase().includes(text)) {
            result.push(c);
        }
    }
    return result;
}
 
function searchContacts(input) {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(function () {
        currentSearch = input.trim();
        displayContacts();
    }, 300);
}
 
function toggleFavorite(id) {
    var contact = getContactById(id);
    contact.isFavorite = !contact.isFavorite;
    saveToLocalStorage();
    displayContacts();
}
 
function toggleEmergency(id) {
    var contact = getContactById(id);
    contact.isEmergency = !contact.isEmergency;
    saveToLocalStorage();
    displayContacts();
}
 
