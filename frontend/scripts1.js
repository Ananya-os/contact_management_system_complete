document.addEventListener('DOMContentLoaded', () => {
    const loginContainer = document.getElementById('loginContainer');
    const contactContainer = document.getElementById('contactContainer');
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');
    const logoutBtn = document.getElementById('logoutBtn');
    const contactModal = document.getElementById('contactModal');
    const searchModal = document.getElementById('searchModal');
    const closeBtns = document.querySelectorAll('.close-btn');
    const contactForm = document.getElementById('contactForm');
    const contactTableBody = document.getElementById('contactTableBody');
    const searchBtn = document.getElementById('searchBtn');
    const searchInput = document.getElementById('searchInput');
    const searchResultsList = document.getElementById('searchResultsList');
    let editContactId = null;

    const token = localStorage.getItem('token');

    async function getData() {
        try {
            const response = await fetch('/contacts', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Response status: ${response.status}`);
            }

            const data = await response.json();
            populateTable(data);
        } catch (error) {
            console.error('Error fetching contacts:', error.message);
        }
    }

    async function populateTable(contactsList) {
        contactTableBody.innerHTML = '';

        contactsList.forEach(contact => {
            const newRow = document.createElement('tr');
            newRow.dataset.id = contact._id;
            newRow.innerHTML = `
                <td>${contact.name}</td>
                <td>${contact.email}</td>
                <td>${contact.phone}</td>
                <td class="action-btns">
                    <button class="edit-btn">Edit</button>
                    <button class="delete-btn">Delete</button>
                </td>
            `;

            contactTableBody.appendChild(newRow);

            newRow.querySelector('.delete-btn').addEventListener('click', async () => {
                try {
                    await fetch(`/delete/${contact._id}`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    getData();
                } catch (error) {
                    console.error('Error deleting contact:', error.message);
                }
            });

            newRow.querySelector('.edit-btn').addEventListener('click', () => {
                document.getElementById('modalTitle').textContent = 'Edit Contact';
                document.getElementById('contactForm').reset();
                editContactId = contact._id;
                contactModal.style.display = 'block';
                document.getElementById('name').value = contact.name;
                document.getElementById('email').value = contact.email;
                document.getElementById('phone').value = contact.phone;
            });
        });
    }

    getData();

    logoutBtn.addEventListener('click', async () => {
        localStorage.removeItem('token');
        /*loginContainer.style.display = 'block';
        contactContainer.style.display = 'none';*/
      console.log("going back");
      await fetch('/');
      window.location.href = '/';
    });

    document.getElementById('createContactBtn').addEventListener('click', () => {
        document.getElementById('modalTitle').textContent = 'Create Contact';
        document.getElementById('contactForm').reset();
        editContactId = null;
        contactModal.style.display = 'block';
    });

    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const phone = document.getElementById('phone').value;
        const formError = document.getElementById('formError');

        formError.textContent = '';

        if (!name || !email || !phone) {
            formError.textContent = 'All fields are required.';
            return;
        }

        if (!/^\d{10}$/.test(phone)) {
            formError.textContent = 'Phone number should be 10 digits.';
            return;
        }

        try {
            const method = editContactId ? 'PATCH' : 'POST';
            const endpoint = editContactId ? `/update/${editContactId}` : '/add';

            const response = await fetch(endpoint, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, email, phone })
            });

            if (response.ok) {
                getData();
                contactModal.style.display = 'none';
            } else {
                formError.textContent = 'Error saving contact';
            }
        } catch (error) {
            formError.textContent = 'Error saving contact';
        }
    });

    searchBtn.addEventListener('click', () => {
        searchModal.style.display = 'block';
    });

    searchInput.addEventListener('input', () => {
        const query = searchInput.value.toLowerCase();
        searchResultsList.innerHTML = '';

        Array.from(contactTableBody.rows).forEach(row => {
            const name = row.cells[0].textContent.toLowerCase();
            const email = row.cells[1].textContent.toLowerCase();
            if (name.includes(query) || email.includes(query)) {
                const li = document.createElement('li');
                li.textContent = `Name: ${name}, Email: ${email}, Phone: ${row.cells[2].textContent}`;
                searchResultsList.appendChild(li);
            }
        });

        if (!searchResultsList.children.length) {
            const li = document.createElement('li');
            li.textContent = 'No contacts found.';
            searchResultsList.appendChild(li);
        }
    });

    closeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            contactModal.style.display = 'none';
            searchModal.style.display = 'none';
        });
    });
});
