document.addEventListener('DOMContentLoaded', () => {
    // Page Elements
    const loginContainer = document.getElementById('loginContainer');
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
    
            try {
                const response = await fetch('/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
    
                if (!response.ok) {
                    const errorData = await response.json();
                    loginError.textContent = errorData.message || 'Invalid credentials';
                    return;
                }
    
                const data = await response.json();
                if (data.token) {
                    localStorage.setItem('token', data.token);
                    alert('Login successful.');
                    window.location.href = 'index1.html';
                } else {
                    loginError.textContent = 'Failed to receive token';
                }
            } catch (error) {
                console.error('Error:', error);
                loginError.textContent = 'Error logging in';
            }
        });
    }
    
            
        });
