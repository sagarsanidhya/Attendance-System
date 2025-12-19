// Add this utility function to convert Unicode to ASCII for CSV
        function toAsciiText(text) {
            if (!text) return '';

            // Replace Unicode box-drawing characters with ASCII equivalents
            const replacements = {
                '─': '-',       // horizontal line
                '│': '|',       // vertical line
                '┌': '+',       // top-left corner
                '┐': '+',       // top-right corner
                '└': '+',       // bottom-left corner
                '┘': '+',       // bottom-right corner
                '├': '+',       // left tee
                '┤': '+',       // right tee
                '┬': '+',       // top tee
                '┴': '+',       // bottom tee
                '┼': '+',       // cross
                '═': '=',       // double horizontal line
                '║': '|',       // double vertical line
                '╔': '+',       // double top-left corner
                '╗': '+',       // double top-right corner
                '╚': '+',       // double bottom-left corner
                '╝': '+',       // double bottom-right corner
                '╠': '+',       // double left tee
                '╣': '+',       // double right tee
                '╦': '+',       // double top tee
                '╩': '+',       // double bottom tee
                '╬': '+',       // double cross
                '📊': ' [Chart] ',
                '📋': ' [Clipboard] ',
                '📅': ' [Calendar] ',
                '👥': ' [People] ',
                '👨‍🏫': ' [Teacher] ',
                '📚': ' [Books] ',
                '✅': ' [Yes] ',
                '❌': ' [No] ',
                'ℹ️': ' [Info] ',
                '📁': ' [Folder] ',
                '📂': ' [Open Folder] ',
                '📄': ' [Document] ',
                '📤': ' [Upload] ',
                '📥': ' [Download] ',
                '⚙️': ' [Settings] ',
                '🗑️': ' [Trash] ',
                '🔍': ' [Search] ',
                '💾': ' [Save] ',
                '📦': ' [Package] ',
                '🔁': ' [Repeat] ',
                '⚠️': ' [Warning] ',
                '👤': ' [Person] ',
                '📈': ' [Chart Up] ',
                '🔄': ' [Refresh] ',
                '🧹': ' [Broom] ',
                '📭': ' [Mailbox] ',
                '⏳': ' [Hourglass] ',
                '🚀': ' [Rocket] ',
                '🎓': ' [Graduation] ',
                '🏫': ' [School] ',
                '📅': ' [Calendar] ',
                '🏢': ' [Building] '
            };

            let result = text;
            for (const [unicode, ascii] of Object.entries(replacements)) {
                result = result.replace(new RegExp(unicode, 'g'), ascii);
            }

            return result;
        }


        let db;
        const DB_NAME = 'AdvancedAttendanceDB';
        const DB_VERSION = 2;
        const ADMIN_PASSWORD = 'GecKaimur@148';
        let currentUser = null;

        // Branch Mapping
        const branchMap = {
            '101': 'Civil',
            '102': 'Mechanical',
            '103': 'Electrical',
            '104': 'ECE',
            '152': 'CSE(Cyber Security)',
            '156': 'CSE(Networks)'
        };

        let activeStudentFilter = {
            year: 'all',
            semester: null,
            branch: 'all'
        };

        let activeClassFilter = {
            year: 'all',
            semester: null
        };

        let displayedStudents = [];
        let selectedStudentIds = new Set();

        function showToast(message, type = 'success') {
            const container = document.getElementById('toastContainer');
            const toast = document.createElement('div');
            toast.className = `toast ${type}`;

            let icon = '✅';
            if (type === 'error') icon = '❌';
            if (type === 'info') icon = 'ℹ️';

            toast.innerHTML = `<div>${icon}</div><div>${message}</div>`;
            container.appendChild(toast);

            setTimeout(() => {
                toast.style.animation = 'fadeOut 0.3s ease forwards';
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        }

        let pendingAction = null;

        function showConfirm(message, actionCallback) {
            document.getElementById('confirmationMessage').textContent = message;
            pendingAction = actionCallback;
            openModal('confirmationModal');
        }

        document.getElementById('confirmActionBtn').onclick = function () {
            if (pendingAction) pendingAction();
            closeModal('confirmationModal');
            pendingAction = null;
        };

        function openModal(modalId) {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.classList.add('show');
                modal.style.display = 'flex';
            }
        }

        function closeModal(modalId) {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.classList.remove('show');
                modal.style.display = 'none';
            }
        }
        // Password Change Functions
        function openPasswordChangeModal() {
            // Clear previous values
            document.getElementById('currentPassword').value = '';
            document.getElementById('newPassword').value = '';
            document.getElementById('confirmPassword').value = '';
            document.getElementById('passwordChangeError').style.display = 'none';
            document.getElementById('passwordChangeError').textContent = '';

            openModal('passwordChangeModal');

            // Add password strength indicator
            const newPasswordInput = document.getElementById('newPassword');
            newPasswordInput.addEventListener('input', checkPasswordStrength);
        }

        function checkPasswordStrength() {
            const password = document.getElementById('newPassword').value;
            const strengthDiv = document.getElementById('passwordStrength') || createPasswordStrengthIndicator();

            if (password.length === 0) {
                strengthDiv.className = 'password-strength';
                strengthDiv.querySelector('.password-strength-bar').style.width = '0%';
                return;
            }

            let strength = 0;

            // Check length
            if (password.length >= 8) strength++;

            // Check for mixed case
            if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;

            // Check for numbers
            if (/\d/.test(password)) strength++;

            // Check for special characters
            if (/[^A-Za-z0-9]/.test(password)) strength++;

            // Update strength indicator
            const strengthBar = strengthDiv.querySelector('.password-strength-bar');
            if (strength <= 1) {
                strengthDiv.className = 'password-strength weak';
            } else if (strength <= 3) {
                strengthDiv.className = 'password-strength medium';
            } else {
                strengthDiv.className = 'password-strength strong';
            }
        }

        function createPasswordStrengthIndicator() {
            const formGroup = document.getElementById('newPassword').closest('.form-group');
            const strengthDiv = document.createElement('div');
            strengthDiv.id = 'passwordStrength';
            strengthDiv.className = 'password-strength';
            strengthDiv.innerHTML = '<div class="password-strength-bar"></div>';
            formGroup.appendChild(strengthDiv);

            // Add hint
            const hint = document.createElement('small');
            hint.className = 'password-hint';
            hint.textContent = 'Use at least 8 characters with uppercase, lowercase, numbers and symbols for strong password';
            formGroup.appendChild(hint);

            return strengthDiv;
        }

        async function handlePasswordChange(event) {
            event.preventDefault();

            const currentPassword = document.getElementById('currentPassword').value;
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const errorDiv = document.getElementById('passwordChangeError');

            // Clear previous errors
            errorDiv.style.display = 'none';
            errorDiv.textContent = '';

            // Validate
            if (!currentPassword) {
                showError('Current password is required');
                return;
            }

            if (newPassword.length < 6) {
                showError('New password must be at least 6 characters long');
                return;
            }

            if (newPassword !== confirmPassword) {
                showError('New passwords do not match');
                return;
            }

            try {
                if (currentUser.role === 'admin') {
                    // Admin password change
                    if (currentPassword !== ADMIN_PASSWORD) {
                        showError('Current admin password is incorrect');
                        return;
                    }

                    // In a real app, you'd want to update the ADMIN_PASSWORD
                    // For now, we'll show a message since ADMIN_PASSWORD is a constant
                    showError('Admin password change requires server-side implementation');
                    return;

                } else if (currentUser.role === 'faculty') {
                    // Faculty password change
                    const allFaculty = await getAll('faculty');
                    const facultyMember = allFaculty.find(f => f.id === currentUser.id);

                    if (!facultyMember) {
                        showError('Faculty member not found');
                        return;
                    }

                    // Check current password
                    const storedPassword = facultyMember.password || 'password123';
                    if (currentPassword !== storedPassword) {
                        showError('Current password is incorrect');
                        return;
                    }

                    // Update password
                    facultyMember.password = newPassword;
                    await updateRecord('faculty', facultyMember);

                    showToast('Password changed successfully!', 'success');
                    closeModal('passwordChangeModal');

                } else {
                    showError('Password change not available for students');
                }
            } catch (error) {
                console.error('Password change error:', error);
                showError('An error occurred. Please try again.');
            }

            function showError(message) {
                errorDiv.textContent = '❌ ' + message;
                errorDiv.style.display = 'block';
            }
        }

        window.onclick = function (event) {
            // Close modal when clicking outside modal content
            if (event.target.classList.contains('modal')) {
                event.target.classList.remove('show');
                event.target.style.display = 'none';
            }

            // Also handle close button clicks
            if (event.target.classList.contains('close-btn')) {
                const modal = event.target.closest('.modal');
                if (modal) {
                    modal.classList.remove('show');
                    modal.style.display = 'none';
                }
            }
        };

        // Add this function to toggle date range inputs
        function toggleDateRange() {
            const dateRangeInputs = document.getElementById('dateRangeInputs');
            const dateFilterRadios = document.querySelectorAll('input[name="dateFilterType"]');

            // Find checked radio
            let checkedValue = 'all';
            dateFilterRadios.forEach(radio => {
                if (radio.checked) {
                    checkedValue = radio.value;
                }
            });

            if (checkedValue === 'range') {
                dateRangeInputs.style.display = 'block';

                // Set default dates (last 30 days)
                const today = new Date();
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(today.getDate() - 30);

                document.getElementById('adminDateFrom').value = thirtyDaysAgo.toISOString().split('T')[0];
                document.getElementById('adminDateTo').value = today.toISOString().split('T')[0];
            } else {
                dateRangeInputs.style.display = 'none';
                // Clear date inputs
                document.getElementById('adminDateFrom').value = '';
                document.getElementById('adminDateTo').value = '';
            }
        }

        async function viewYearDetails(year) {
            // Set filters for the selected year
            document.getElementById('adminYearFilter').value = year;
            document.getElementById('adminSemesterFilter').value = 'all';
            document.getElementById('adminClassFilter').value = 'all';
            document.getElementById('adminBranchFilter').value = 'all';

            // Reset date filter
            document.querySelector('input[name="dateFilterType"][value="all"]').checked = true;
            document.getElementById('dateRangeInputs').style.display = 'none';
            document.getElementById('adminDateFrom').value = '';
            document.getElementById('adminDateTo').value = '';

            document.getElementById('adminStatusFilter').value = 'all';
            document.getElementById('adminSortBy').value = 'percentage_desc';

            // Scroll to the table
            document.getElementById('adminAttendanceHistory').scrollIntoView({ behavior: 'smooth' });

            showToast(`Filters set for Year ${year}. Click "Load Attendance" to view data.`, 'info');
        }

        function initDB() {
            return new Promise((resolve, reject) => {
                const request = indexedDB.open(DB_NAME, DB_VERSION);
                request.onerror = () => reject(request.error);
                request.onsuccess = () => {
                    db = request.result;
                    resolve(db);
                };
                request.onupgradeneeded = (e) => {
                    db = e.target.result;
                    const stores = ['students', 'faculty', 'classes', 'attendance', 'settings', 'years'];
                    stores.forEach(store => {
                        if (!db.objectStoreNames.contains(store)) {
                            db.createObjectStore(store, { keyPath: 'id', autoIncrement: true });
                        }
                    });
                };
            });
        }

        function addRecord(storeName, data) {
            return new Promise((resolve, reject) => {
                const transaction = db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                const request = store.add(data);
                request.onerror = () => reject(request.error);
                request.onsuccess = () => resolve(request.result);
            });
        }

        function updateRecord(storeName, data) {
            return new Promise((resolve, reject) => {
                const transaction = db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                const request = store.put(data);
                request.onerror = () => reject(request.error);
                request.onsuccess = () => resolve(request.result);
            });
        }

        function getAll(storeName) {
            return new Promise((resolve, reject) => {
                const transaction = db.transaction([storeName], 'readonly');
                const store = transaction.objectStore(storeName);
                const request = store.getAll();
                request.onerror = () => reject(request.error);
                request.onsuccess = () => resolve(request.result);
            });
        }

        function getRecord(storeName, id) {
            return new Promise((resolve, reject) => {
                const transaction = db.transaction([storeName], 'readonly');
                const store = transaction.objectStore(storeName);
                const request = store.get(id);
                request.onerror = () => reject(request.error);
                request.onsuccess = () => resolve(request.result);
            });
        }

        function deleteRecord(storeName, id) {
            return new Promise((resolve, reject) => {
                const transaction = db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                const request = store.delete(id);
                request.onerror = () => reject(request.error);
                request.onsuccess = () => resolve();
            });
        }

        function clearStore(storeName) {
            return new Promise((resolve, reject) => {
                const transaction = db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                const request = store.clear();
                request.onerror = () => reject(request.error);
                request.onsuccess = () => resolve();
            });
        }

        function switchLoginTab(role) {
            document.querySelectorAll('.login-tab').forEach(t => t.classList.remove('active'));
            document.querySelector(`.login-tab[data-role="${role}"]`).classList.add('active');
            document.querySelectorAll('.login-form').forEach(f => f.classList.remove('active'));
            document.getElementById(role + 'LoginForm').classList.add('active');
            document.querySelectorAll('.alert-error').forEach(e => {
                e.style.display = 'none';
                e.textContent = '';
            });
        }

        async function handleAdminLogin(event) {
            event.preventDefault();
            const password = document.getElementById('adminPassword').value;
            const errorDiv = document.getElementById('adminLoginError');
            if (password === ADMIN_PASSWORD) {
                completeLogin('admin', { name: 'Admin User' });
            } else {
                errorDiv.textContent = '❌ Incorrect Admin Password';
                errorDiv.style.display = 'block';
            }
        }
        // Faculty Password Reset (Admin Only)
        async function openFacultyPasswordResetModal() {
            if (currentUser.role !== 'admin') {
                showToast('Only admin can reset faculty passwords', 'error');
                return;
            }

            const select = document.getElementById('resetFacultySelect');
            select.innerHTML = '<option value="">-- Select Faculty --</option>';

            const allFaculty = await getAll('faculty');
            allFaculty.forEach(faculty => {
                const option = document.createElement('option');
                option.value = faculty.id;
                option.textContent = `${faculty.facultyId} - ${faculty.firstName} ${faculty.lastName} (${faculty.department})`;
                select.appendChild(option);
            });

            document.getElementById('resetFacultyPassword').value = 'password123';
            document.getElementById('resetFacultyInfo').style.display = 'none';

            openModal('facultyPasswordResetModal');
        }

        async function resetFacultyPassword() {
            const facultyId = parseInt(document.getElementById('resetFacultySelect').value);
            const newPassword = document.getElementById('resetFacultyPassword').value;

            if (!facultyId || !newPassword) {
                showToast('Please select faculty and enter new password', 'error');
                return;
            }

            if (newPassword.length < 6) {
                showToast('Password must be at least 6 characters', 'error');
                return;
            }

            try {
                const faculty = await getRecord('faculty', facultyId);
                if (!faculty) {
                    showToast('Faculty not found', 'error');
                    return;
                }

                faculty.password = newPassword;
                await updateRecord('faculty', faculty);

                showToast(`Password reset for ${faculty.firstName} ${faculty.lastName}`, 'success');

                // Show the new password
                const infoDiv = document.getElementById('resetFacultyInfo');
                infoDiv.innerHTML = `✅ Password updated successfully!<br><strong>New Password:</strong> ${newPassword}<br><strong>Faculty ID:</strong> ${faculty.facultyId}`;
                infoDiv.style.display = 'block';

                // Clear the selection after 3 seconds
                setTimeout(() => {
                    document.getElementById('resetFacultySelect').value = '';
                    document.getElementById('resetFacultyPassword').value = 'password123';
                    infoDiv.style.display = 'none';
                }, 3000);

            } catch (error) {
                console.error('Password reset error:', error);
                showToast('Error resetting password', 'error');
            }
        }

        async function handleFacultyLogin(event) {
            event.preventDefault();
            const id = document.getElementById('loginFacultyId').value;
            const password = document.getElementById('loginFacultyPassword').value;
            const errorDiv = document.getElementById('facultyLoginError');
            const allFaculty = await getAll('faculty');
            const facultyMember = allFaculty.find(f => f.facultyId === id);
            if (facultyMember) {
                const storedPassword = facultyMember.password || 'password123';
                if (password === storedPassword) {
                    completeLogin('faculty', facultyMember);
                } else {
                    errorDiv.textContent = '❌ Incorrect Password';
                    errorDiv.style.display = 'block';
                }
            } else {
                errorDiv.textContent = '❌ Faculty ID not found';
                errorDiv.style.display = 'block';
            }
        }

        async function handleStudentLogin(event) {
            event.preventDefault();
            const rollNo = document.getElementById('loginStudentId').value;
            const errorDiv = document.getElementById('studentLoginError');
            const allStudents = await getAll('students');
            const student = allStudents.find(s => s.rollNo === rollNo);
            if (student) {
                completeLogin('student', student);
            } else {
                errorDiv.textContent = '❌ Student Roll No not found';
                errorDiv.style.display = 'block';
            }
        }

        function completeLogin(role, userData) {
            currentUser = { role, ...userData };
            document.getElementById('loginOverlay').style.display = 'none';
            document.getElementById('mainContainer').style.display = 'block';

            const name = role === 'admin' ? 'Admin User' : `${userData.firstName} ${userData.lastName}`;
            document.getElementById('loggedInUser').textContent = name;
            document.getElementById('roleBadge').textContent = role.toUpperCase();

            document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
            // Show/hide password change button
            const passwordChangeBtn = document.getElementById('passwordChangeBtn');
            if (role === 'admin' || role === 'faculty') {
                passwordChangeBtn.style.display = 'inline-block';
            } else {
                passwordChangeBtn.style.display = 'none';
            }
            document.getElementById(role + 'Panel').classList.add('active');

            if (role === 'faculty') {
                populateFacultyClassDropdown();
                // Add multi-session button
                setTimeout(addMultiSessionButton, 500);
            } else if (role === 'student') {
                populateStudentDashboard(userData);
            } else if (role === 'admin') {
                populateFacultyClassDropdown();
                populateAdminClassFilter('all', 'all');
            }

            document.getElementById('adminPassword').value = '';
            document.getElementById('loginFacultyId').value = '';
            document.getElementById('loginFacultyPassword').value = '';
            document.getElementById('loginStudentId').value = '';
        }

        async function populateFacultyClassDropdown() {
            const classes = await getAll('classes');
            const facultySelect = document.getElementById('facultyClassSelect');
            const historySelect = document.getElementById('historyClassSelect');

            facultySelect.innerHTML = '<option value="">-- Select a class --</option>';
            historySelect.innerHTML = '<option value="">-- Select a class --</option>';

            const facultyName = `${currentUser.firstName} ${currentUser.lastName}`;
            let myClasses;

            if (currentUser.role === 'admin') {
                myClasses = classes; // Admins can see all classes
            } else {
                myClasses = classes.filter(c => c.faculty === facultyName);
            }

            myClasses.forEach(cls => {
                const opt1 = document.createElement('option');
                opt1.value = cls.id;
                opt1.textContent = `${cls.code}: ${cls.name} (Sem ${cls.semester}, ${cls.department})`;
                facultySelect.appendChild(opt1.cloneNode(true));
                historySelect.appendChild(opt1);
            });
        }

        // UPDATED: populateAdminClassFilter with semester and branch filtering
        async function populateAdminClassFilter(semesterFilter = 'all', branchFilter = 'all') {
            const classes = await getAll('classes');
            const classSelect = document.getElementById('adminClassFilter');

            classSelect.innerHTML = '<option value="all">All Classes</option>';

            let filteredClasses = classes;

            if (semesterFilter !== 'all') {
                filteredClasses = filteredClasses.filter(cls => cls.semester == semesterFilter);
            }

            if (branchFilter !== 'all') {
                filteredClasses = filteredClasses.filter(cls => cls.department === branchFilter);
            }

            filteredClasses.forEach(cls => {
                const opt = document.createElement('option');
                opt.value = cls.id;
                opt.textContent = `${cls.code}: ${cls.name} (Sem ${cls.semester}, ${cls.department})`;
                classSelect.appendChild(opt);
            });
        }

        // NEW FUNCTION: Update class filter dropdown based on semester and branch filters
        async function updateClassFilterDropdown(semesterFilter, branchFilter) {
            const classSelect = document.getElementById('adminClassFilter');
            const allClasses = await getAll('classes');

            // Store the current selection
            const currentSelection = classSelect.value;

            // Clear options except the first one
            classSelect.innerHTML = '<option value="all">All Classes</option>';

            // Filter classes based on semester and branch
            let filteredClasses = allClasses;

            if (semesterFilter !== 'all') {
                filteredClasses = filteredClasses.filter(cls => cls.semester == semesterFilter);
            }

            if (branchFilter !== 'all') {
                filteredClasses = filteredClasses.filter(cls => cls.department === branchFilter);
            }

            // Add filtered classes to dropdown
            filteredClasses.forEach(cls => {
                const opt = document.createElement('option');
                opt.value = cls.id;
                opt.textContent = `${cls.code}: ${cls.name} (Sem ${cls.semester}, ${cls.department})`;

                // Restore selection if this was the previously selected class
                if (currentSelection == cls.id) {
                    opt.selected = true;
                }

                classSelect.appendChild(opt);
            });

            // If current selection is not "all" and not in filtered list, select "all"
            if (currentSelection !== 'all' && !filteredClasses.find(c => c.id == currentSelection)) {
                classSelect.value = 'all';
            }
        }

        async function populateStudentDashboard(student) {
            document.getElementById('studentNameDisplay').textContent = `${student.firstName} ${student.lastName}`;
            document.getElementById('studentRollDisplay').textContent = `Roll No: ${student.rollNo}`;
            document.getElementById('studentEmailDisplay').textContent = student.email || 'N/A';
            document.getElementById('studentDeptDisplay').textContent = student.department;
            document.getElementById('studentSemDisplay').textContent = student.semester;
            document.getElementById('studentYearDisplay').textContent = student.year;

            await loadStudentStats(student.id);
        }

        async function loadStudentStats(studentId) {
            const attendance = await getAll('attendance');
            const classes = await getAll('classes');

            // Filter attendance for this student
            const studentAttendance = attendance.filter(r => r.studentId === studentId);

            // Group by classId and session
            const attendanceByClass = {};
            studentAttendance.forEach(r => {
                if (!attendanceByClass[r.classId]) {
                    attendanceByClass[r.classId] = { total: 0, present: 0, absent: 0, sessions: new Set() };
                }
                attendanceByClass[r.classId].total++;
                if (r.status === 'present') attendanceByClass[r.classId].present++;
                if (r.status === 'absent') attendanceByClass[r.classId].absent++;

                // Track unique sessions
                if (r.session) {
                    attendanceByClass[r.classId].sessions.add(`${r.date}-${r.session}`);
                }
            });

            const tbody = document.getElementById('studentAttendanceBody');
            tbody.innerHTML = '';

            if (Object.keys(attendanceByClass).length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No attendance records found yet.</td></tr>';
                return;
            }

            for (const classId in attendanceByClass) {
                const cls = classes.find(c => c.id === parseInt(classId));
                if (!cls) continue;

                const stats = attendanceByClass[classId];
                const percentage = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0;
                const uniqueSessions = stats.sessions.size;
                const status = percentage >= 75 ? '<span class="status-badge" style="background:#d4edda; color:#155724;">Good</span>' : '<span class="status-badge" style="background:#f8d7da; color:#721c24;">Low</span>';

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${cls.name} (${cls.code})</td>
                    <td>${cls.faculty}</td>
                    <td>${stats.total} (${uniqueSessions} sessions)</td>
                    <td>${stats.present}</td>
                    <td>${percentage}%</td>
                    <td>${status}</td>
                 `;
                tbody.appendChild(row);
            }
        }

        function handleLogout() {
            showConfirm('Are you sure you want to logout?', function () {
                currentUser = null;
                document.getElementById('facultyClassSelect').innerHTML = '<option value="">-- Select a class --</option>';
                document.getElementById('studentGrid').innerHTML = '';
                document.getElementById('studentGridContainer').style.display = 'none';

                document.getElementById('loginOverlay').style.display = 'flex';
                document.getElementById('mainContainer').style.display = 'none';
                showToast('Logged out successfully', 'info');
            });
        }

        function switchFacultyTab(tab, event) {
            if (event) {
                document.querySelectorAll('#facultyPanel .tab-btn').forEach(b => b.classList.remove('active'));
                event.target.classList.add('active');
            }

            // Hide all tab contents
            document.querySelectorAll('#facultyPanel .tab-content').forEach(content => {
                content.style.display = 'none';
            });

            // Show selected tab
            const selectedTab = document.getElementById('faculty' + tab.charAt(0).toUpperCase() + tab.slice(1));
            if (selectedTab) {
                selectedTab.style.display = 'block';
            }

            // Load data for specific tabs
            if (tab === 'history') {
                loadAttendanceHistory();
            } else if (tab === 'report') {
                generateYearlyReport();
            }
        }

        // Updated loadAttendanceHistory function with better session separation
        async function loadAttendanceHistory() {
            const classId = parseInt(document.getElementById('historyClassSelect').value);
            const dateFilter = document.getElementById('historyDateFilter').value;
            const container = document.getElementById('historyList');

            if (!classId) {
                container.innerHTML = '<p style="text-align:center; color:gray;">Please select a class first.</p>';
                return;
            }

            const allAttendance = await getAll('attendance');
            const allStudents = await getAll('students');
            const allClasses = await getAll('classes');

            const classInfo = allClasses.find(c => c.id === classId);
            if (!classInfo) return;

            let classRecords = allAttendance.filter(r => r.classId === classId);

            if (dateFilter) {
                classRecords = classRecords.filter(r => r.date === dateFilter);
            }

            // Group by date first, then by session
            const dateGroups = {};
            classRecords.forEach(r => {
                if (!dateGroups[r.date]) {
                    dateGroups[r.date] = [];
                }
                dateGroups[r.date].push(r);
            });

            container.innerHTML = '';

            if (Object.keys(dateGroups).length === 0) {
                container.innerHTML = '<p style="text-align:center; color:gray;">No attendance records found.</p>';
                return;
            }

            // Sort dates in descending order (most recent first)
            const sortedDates = Object.keys(dateGroups).sort((a, b) =>
                new Date(b) - new Date(a)
            );

            // Process each date
            sortedDates.forEach(date => {
                const recordsForDate = dateGroups[date];

                // Group by session within this date
                const sessionGroups = {};
                recordsForDate.forEach(r => {
                    const session = r.session || 1;
                    if (!sessionGroups[session]) {
                        sessionGroups[session] = [];
                    }
                    sessionGroups[session].push(r);
                });

                // Sort sessions numerically
                const sortedSessions = Object.keys(sessionGroups).sort((a, b) => a - b);

                // Create date header with session count
                const dateHeader = document.createElement('div');
                dateHeader.style.background = 'linear-gradient(135deg, #3498db, #2980b9)';
                dateHeader.style.color = 'white';
                dateHeader.style.padding = '12px 20px';
                dateHeader.style.borderRadius = '8px 8px 0 0';
                dateHeader.style.marginTop = '20px';
                dateHeader.style.fontWeight = '600';
                dateHeader.style.display = 'flex';
                dateHeader.style.justifyContent = 'space-between';
                dateHeader.style.alignItems = 'center';

                // Format date nicely
                const formattedDate = new Date(date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });

                dateHeader.innerHTML = `
            <div>
                <span style="font-size: 16px;">📅 ${formattedDate}</span>
                <span style="font-size: 12px; opacity: 0.9; margin-left: 10px;">(${sortedSessions.length} session${sortedSessions.length > 1 ? 's' : ''})</span>
            </div>
            <div style="font-size: 12px; opacity: 0.9;">
                Total Records: ${recordsForDate.length}
            </div>
        `;
                container.appendChild(dateHeader);

                // Process each session for this date
                sortedSessions.forEach(sessionNum => {
                    const recordsForSession = sessionGroups[sessionNum];
                    const total = recordsForSession.length;
                    const present = recordsForSession.filter(r => r.status === 'present').length;
                    const absent = recordsForSession.filter(r => r.status === 'absent').length;

                    // Create session header
                    const sessionHeader = document.createElement('div');
                    sessionHeader.style.background = 'rgba(52, 152, 219, 0.1)';
                    sessionHeader.style.padding = '15px';
                    sessionHeader.style.borderBottom = '1px solid rgba(52, 152, 219, 0.2)';
                    sessionHeader.style.fontWeight = '600';
                    sessionHeader.style.color = '#2c5282';

                    sessionHeader.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <span style="font-size: 14px;">📋 Session ${sessionNum}</span>
                        <span class="session-indicator">${classInfo.code}: ${classInfo.name}</span>
                    </div>
                    <div style="display:flex; gap:10px;">
                        <span style="padding: 4px 8px; background: #d4edda; color: #155724; border-radius: 4px; font-size: 12px; font-weight:600;">
                            ✅ ${present} Present
                        </span>
                        <span style="padding: 4px 8px; background: #f8d7da; color: #721c24; border-radius: 4px; font-size: 12px; font-weight:600;">
                            ❌ ${absent} Absent
                        </span>
                    </div>
                </div>
            `;
                    container.appendChild(sessionHeader);

                    // Create session content container
                    const sessionContent = document.createElement('div');
                    sessionContent.style.background = 'white';
                    sessionContent.style.padding = '15px';
                    sessionContent.style.borderBottom = '2px solid #f0f0f0';

                    // Create table for this session
                    sessionContent.innerHTML = `
                <table style="width:100%; font-size:13px; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #f8f9fa; border-bottom: 2px solid #e9ecef;">
                            <th style="padding: 10px; text-align:left; font-weight:600;">Student Name</th>
                            <th style="padding: 10px; text-align:left; font-weight:600;">Roll No</th>
                            <th style="padding: 10px; text-align:left; font-weight:600;">Status</th>
                            <th style="padding: 10px; text-align:left; font-weight:600;">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="records-${date.replace(/-/g, '')}-${sessionNum}">
                        <!-- Records will be populated here -->
                    </tbody>
                </table>
            `;
                    container.appendChild(sessionContent);

                    // Populate individual records for this session
                    const tbody = document.getElementById(`records-${date.replace(/-/g, '')}-${sessionNum}`);
                    recordsForSession.sort((a, b) => {
                        const studentA = allStudents.find(s => s.id === a.studentId) || {};
                        const studentB = allStudents.find(s => s.id === b.studentId) || {};
                        return (studentA.rollNo || '').localeCompare(studentB.rollNo || '');
                    });

                    recordsForSession.forEach(record => {
                        const student = allStudents.find(s => s.id === record.studentId) || {};
                        const statusColors = {
                            present: { bg: '#d4edda', color: '#155724', icon: '✅' },
                            absent: { bg: '#f8d7da', color: '#721c24', icon: '❌' }
                        };
                        const status = statusColors[record.status] || statusColors.absent;

                        const tr = document.createElement('tr');
                        tr.style.borderBottom = '1px solid #f0f0f0';
                        tr.style.transition = 'background 0.2s';
                        tr.onmouseenter = () => tr.style.background = '#f8f9fa';
                        tr.onmouseleave = () => tr.style.background = '';

                        tr.innerHTML = `
                    <td style="padding: 10px;">${student.firstName || ''} ${student.lastName || ''}</td>
                    <td style="padding: 10px; font-weight:500;">${student.rollNo || 'N/A'}</td>
                    <td style="padding: 10px;">
                        <span style="padding: 6px 12px; background: ${status.bg}; color: ${status.color}; border-radius: 20px; font-size: 12px; font-weight:600; display:inline-block; min-width: 70px; text-align:center;">
                            ${status.icon} ${record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                        </span>
                    </td>
                    <td style="padding: 10px;">
                        <button class="btn btn-small btn-info" onclick="openEditAttendanceModal(${record.id})" style="padding: 4px 12px; font-size: 12px;">
                            ✏️ Edit
                        </button>
                    </td>
                `;
                        tbody.appendChild(tr);
                    });

                    // Add separator between sessions (except after last session)
                    if (sessionNum < sortedSessions[sortedSessions.length - 1]) {
                        const separator = document.createElement('div');
                        separator.style.height = '2px';
                        separator.style.background = 'linear-gradient(90deg, transparent, #e0e0e0, transparent)';
                        separator.style.margin = '15px 0';
                        container.appendChild(separator);
                    }
                });

                // Add date footer with summary
                const dateFooter = document.createElement('div');
                dateFooter.style.background = '#f8f9fa';
                dateFooter.style.padding = '10px 20px';
                dateFooter.style.borderRadius = '0 0 8px 8px';
                dateFooter.style.borderTop = '1px solid #e9ecef';
                dateFooter.style.fontSize = '12px';
                dateFooter.style.color = '#666';
                dateFooter.style.display = 'flex';
                dateFooter.style.justifyContent = 'space-between';

                // Calculate date-wide totals
                let dateTotal = 0;
                let datePresent = 0;
                let dateAbsent = 0;
                recordsForDate.forEach(r => {
                    dateTotal++;
                    if (r.status === 'present') datePresent++;
                    else if (r.status === 'absent') dateAbsent++;
                });
                const datePercentage = dateTotal > 0 ? Math.round((datePresent / dateTotal) * 100) : 0;

                dateFooter.innerHTML = `
            <div>
                <strong>Date Summary:</strong> 
                <span style="color: #27ae60; margin-left: 5px;">${datePresent} Present</span> | 
                <span style="color: #e74c3c; margin: 0 5px;">${dateAbsent} Absent</span> | 
                <span style="color: #3498db; margin-left: 5px;">${datePercentage}% Attendance</span>
            </div>
            <div>
                <button class="btn btn-small btn-secondary" onclick="exportDateAttendance('${date}', ${classId})" style="padding: 3px 10px; font-size: 11px;">
                    📥 Export This Date
                </button>
            </div>
        `;
                container.appendChild(dateFooter);

                // Add visual separator between dates
                if (date !== sortedDates[sortedDates.length - 1]) {
                    const dateSeparator = document.createElement('div');
                    dateSeparator.style.height = '20px';
                    dateSeparator.style.background = 'repeating-linear-gradient(45deg, transparent, transparent 5px, #f0f0f0 5px, #f0f0f0 10px)';
                    dateSeparator.style.margin = '20px 0';
                    container.appendChild(dateSeparator);
                }
            });

            // Add summary at the end
            if (sortedDates.length > 1) {
                const overallSummary = document.createElement('div');
                overallSummary.style.background = 'linear-gradient(135deg, #2c3e50, #34495e)';
                overallSummary.style.color = 'white';
                overallSummary.style.padding = '15px 20px';
                overallSummary.style.borderRadius = '8px';
                overallSummary.style.marginTop = '30px';
                overallSummary.style.textAlign = 'center';

                let allRecords = [];
                sortedDates.forEach(date => {
                    allRecords = allRecords.concat(dateGroups[date]);
                });

                const totalRecords = allRecords.length;
                const totalPresent = allRecords.filter(r => r.status === 'present').length;
                const totalAbsent = allRecords.filter(r => r.status === 'absent').length;
                const overallPercentage = totalRecords > 0 ? Math.round((totalPresent / totalRecords) * 100) : 0;

                overallSummary.innerHTML = `
            <h4 style="margin-bottom: 10px; opacity: 0.9;">📊 Overall Summary</h4>
            <div style="display: flex; justify-content: center; gap: 30px; flex-wrap: wrap;">
                <div style="text-align: center;">
                    <div style="font-size: 24px; font-weight: bold;">${sortedDates.length}</div>
                    <div style="font-size: 12px; opacity: 0.8;">Dates</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 24px; font-weight: bold; color: #27ae60;">${totalPresent}</div>
                    <div style="font-size: 12px; opacity: 0.8;">Total Present</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 24px; font-weight: bold; color: #e74c3c;">${totalAbsent}</div>
                    <div style="font-size: 12px; opacity: 0.8;">Total Absent</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 24px; font-weight: bold; color: #3498db;">${overallPercentage}%</div>
                    <div style="font-size: 12px; opacity: 0.8;">Overall Attendance</div>
                </div>
            </div>
        `;
                container.appendChild(overallSummary);
            }
        }

        async function exportDateAttendance(date, classId) {
            const allAttendance = await getAll('attendance');
            const allStudents = await getAll('students');
            const allClasses = await getAll('classes');

            const classInfo = allClasses.find(c => c.id === classId);
            if (!classInfo) return;

            const dateRecords = allAttendance.filter(r =>
                r.classId === classId && r.date === date
            );

            if (dateRecords.length === 0) {
                showToast('No records found for this date', 'info');
                return;
            }

            // Group by session
            const sessions = {};
            dateRecords.forEach(r => {
                const session = r.session || 1;
                if (!sessions[session]) {
                    sessions[session] = [];
                }
                sessions[session].push(r);
            });

            let csvContent = `Attendance Export - ${classInfo.code}: ${classInfo.name}\n`;
            csvContent += `Date: ${date}\n\n`;

            // Sort sessions numerically
            const sortedSessions = Object.keys(sessions).sort((a, b) => a - b);

            sortedSessions.forEach(sessionNum => {
                csvContent += `Session ${sessionNum}\n`;
                csvContent += 'Roll No,Name,Status\n';

                const sessionRecords = sessions[sessionNum];
                sessionRecords.forEach(r => {
                    const student = allStudents.find(s => s.id === r.studentId) || {};
                    csvContent += `${student.rollNo || 'N/A'},"${student.firstName || ''} ${student.lastName || ''}",${r.status}\n`;
                });

                csvContent += '\n'; // Blank line between sessions
            });

            // Add summary
            csvContent += 'Summary\n';
            csvContent += 'Session,Total,Present,Absent,Percentage\n';

            sortedSessions.forEach(sessionNum => {
                const sessionRecords = sessions[sessionNum];
                const total = sessionRecords.length;
                const present = sessionRecords.filter(r => r.status === 'present').length;
                const absent = sessionRecords.filter(r => r.status === 'absent').length;
                const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

                csvContent += `${sessionNum},${total},${present},${absent},${percentage}%\n`;
            });

            // Use downloadCSV which will convert to ASCII
            downloadCSV(csvContent, `attendance_${classInfo.code}_${date.replace(/-/g, '')}.csv`);
            showToast(`Exported attendance for ${date}`, 'success');
        }

        async function downloadHistoryCSV() {
            const classSelect = document.getElementById('historyClassSelect');
            const classId = parseInt(classSelect.value);
            const dateFilter = document.getElementById('historyDateFilter').value;

            if (!classId) {
                showToast('Please select a class first', 'error');
                return;
            }

            const allAttendance = await getAll('attendance');
            const allStudents = await getAll('students');
            const allClasses = await getAll('classes');

            const classInfo = allClasses.find(c => c.id === classId);
            if (!classInfo) return;

            let classRecords = allAttendance.filter(r => r.classId === classId);

            // Apply date filter if specified
            if (dateFilter) {
                classRecords = classRecords.filter(r => r.date === dateFilter);
            }

            if (classRecords.length === 0) {
                showToast('No history found for this class', 'info');
                return;
            }

            // Group by date first, then by session
            const dateGroups = {};
            classRecords.forEach(r => {
                if (!dateGroups[r.date]) {
                    dateGroups[r.date] = [];
                }
                dateGroups[r.date].push(r);
            });

            // Sort dates in descending order (most recent first)
            const sortedDates = Object.keys(dateGroups).sort((a, b) =>
                new Date(b) - new Date(a)
            );

            let csvContent = '';

            // Use ASCII-only separators
            csvContent += '==================================================================\n';
            csvContent += `ATTENDANCE HISTORY - ${classInfo.code}: ${classInfo.name}\n`;
            csvContent += `Department: ${classInfo.department}, Semester: ${classInfo.semester}\n`;
            csvContent += `Faculty: ${classInfo.faculty}\n`;

            if (dateFilter) {
                csvContent += `Filtered Date: ${new Date(dateFilter).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                })}\n`;
            }

            csvContent += `Total Records: ${classRecords.length}\n`;
            csvContent += '==================================================================\n\n';

            // Process each date
            sortedDates.forEach((currentDate, dateIndex) => {
                const recordsForDate = dateGroups[currentDate];

                // Group by session within this date
                const sessionGroups = {};
                recordsForDate.forEach(r => {
                    const session = r.session || 1;
                    if (!sessionGroups[session]) {
                        sessionGroups[session] = [];
                    }
                    sessionGroups[session].push(r);
                });

                // Sort sessions numerically
                const sortedSessions = Object.keys(sessionGroups).sort((a, b) => a - b);

                // Format date nicely
                const formattedDate = new Date(currentDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });

                // Date header in CSV - use ASCII only
                csvContent += `Date: ${formattedDate} (${sortedSessions.length} session${sortedSessions.length > 1 ? 's' : ''})\n`;
                csvContent += '='.repeat(70) + '\n';

                // Process each session for this date
                sortedSessions.forEach((sessionNum, sessionIndex) => {
                    const recordsForSession = sessionGroups[sessionNum];

                    // Session header - use ASCII only
                    csvContent += `   Session ${sessionNum}\n`;
                    csvContent += '   ' + '-'.repeat(60) + '\n';

                    // Session table headers
                    csvContent += '   Roll No,Student Name,Status,Time Recorded\n';

                    // Sort records by roll number
                    recordsForSession.sort((a, b) => {
                        const studentA = allStudents.find(s => s.id === a.studentId) || {};
                        const studentB = allStudents.find(s => s.id === b.studentId) || {};
                        return (studentA.rollNo || '').localeCompare(studentB.rollNo || '');
                    });

                    // Add each student record - use P/A instead of emojis
                    recordsForSession.forEach(record => {
                        const student = allStudents.find(s => s.id === record.studentId) || {};
                        const statusText = record.status === 'present' ? 'P' : 'A';
                        const timeRecorded = record.createdAt ?
                            new Date(record.createdAt).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit'
                            }) : 'N/A';

                        csvContent += `   ${student.rollNo || 'N/A'},"${student.firstName || ''} ${student.lastName || ''}",${statusText},${timeRecorded}\n`;
                    });

                    // Calculate session totals
                    const total = recordsForSession.length;
                    const present = recordsForSession.filter(r => r.status === 'present').length;
                    const absent = recordsForSession.filter(r => r.status === 'absent').length;
                    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

                    csvContent += `   -- Session ${sessionNum} Summary: ${present} Present | ${absent} Absent | ${percentage}% --\n\n`;
                });

                // Calculate date-wide totals
                let dateTotal = 0;
                let datePresent = 0;
                let dateAbsent = 0;
                recordsForDate.forEach(r => {
                    dateTotal++;
                    if (r.status === 'present') datePresent++;
                    else if (r.status === 'absent') dateAbsent++;
                });
                const datePercentage = dateTotal > 0 ? Math.round((datePresent / dateTotal) * 100) : 0;

                // Date summary
                csvContent += `   Date Summary: ${datePresent} Present | ${dateAbsent} Absent | ${datePercentage}% Attendance\n`;

                // Add separator between dates (except after the last one)
                if (dateIndex < sortedDates.length - 1) {
                    csvContent += '='.repeat(70) + '\n\n';
                } else {
                    csvContent += '\n';
                }
            });

            // Add overall summary at the end
            const overallTotal = classRecords.length;
            const overallPresent = classRecords.filter(r => r.status === 'present').length;
            const overallAbsent = classRecords.filter(r => r.status === 'absent').length;
            const overallPercentage = overallTotal > 0 ? Math.round((overallPresent / overallTotal) * 100) : 0;

            // Count total unique sessions
            const totalUniqueSessions = Object.values(dateGroups).reduce((acc, sessions) => {
                const sessionMap = {};
                sessions.forEach(r => {
                    sessionMap[r.session || 1] = true;
                });
                return acc + Object.keys(sessionMap).length;
            }, 0);

            csvContent += '==================================================================\n';
            csvContent += 'OVERALL SUMMARY\n';
            csvContent += '==================================================================\n';
            csvContent += `Total Dates: ${sortedDates.length}\n`;
            csvContent += `Total Sessions: ${totalUniqueSessions}\n`;
            csvContent += `Total Records: ${overallTotal}\n`;
            csvContent += `Total Present: ${overallPresent}\n`;
            csvContent += `Total Absent: ${overallAbsent}\n`;
            csvContent += `Overall Attendance: ${overallPercentage}%\n`;
            csvContent += `Export Date: ${new Date().toLocaleString()}\n`;

            // Create filename
            let filename = `attendance_history_${classInfo.code}`;
            if (dateFilter) {
                const datePart = dateFilter.replace(/-/g, '');
                filename += `_${datePart}`;
            } else {
                filename += '_all_dates';
            }
            filename += `_${new Date().getTime()}.csv`;

            // Use the downloadCSV function which will convert to ASCII
            downloadCSV(csvContent, filename);
            showToast(`Exported history for ${sortedDates.length} date${sortedDates.length !== 1 ? 's' : ''}`, 'success');
        }


        async function generateYearlyReport() {
            const tbody = document.getElementById('yearWiseAttendanceBody');
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Loading stats...</td></tr>';

            const attendance = await getAll('attendance');
            const students = await getAll('students');
            const classes = await getAll('classes'); // Need to know class year

            // Map classId -> Year
            const classYearMap = new Map();
            classes.forEach(c => classYearMap.set(c.id, c.year));

            // Initialize Stats per Year (1,2,3,4)
            const stats = {
                1: { held: 0, present: 0, absent: 0 },
                2: { held: 0, present: 0, absent: 0 },
                3: { held: 0, present: 0, absent: 0 },
                4: { held: 0, present: 0, absent: 0 }
            };

            // Aggregate
            attendance.forEach(r => {
                // Try to get year from class, if fails try student year
                let year = classYearMap.get(r.classId);
                if (!year) {
                    const s = students.find(st => st.id === r.studentId);
                    if (s) year = Math.ceil(s.semester / 2); // Approx year from sem
                }

                if (year && stats[year]) {
                    stats[year].held++; // Counting total records as "held opportunities"
                    if (r.status === 'present') stats[year].present++;
                    else if (r.status === 'absent') stats[year].absent++;
                }
            });

            tbody.innerHTML = '';

            for (let year = 1; year <= 4; year++) {
                const s = stats[year];
                const total = s.present + s.absent;
                const percent = total > 0 ? Math.round((s.present / total) * 100) : 0;

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${year}</td>
                    <td>${total}</td>
                    <td>${s.present}</td>
                    <td>${s.absent}</td>
                    <td><strong>${percent}%</strong></td>
                 `;
                tbody.appendChild(row);
            }
        }

        // Edit Attendance Modal Functions
        async function openEditAttendanceModal(attendanceId) {
            const record = await getRecord('attendance', attendanceId);
            if (!record) return;

            const allStudents = await getAll('students');
            const allClasses = await getAll('classes');

            const student = allStudents.find(s => s.id === record.studentId);
            const classInfo = allClasses.find(c => c.id === record.classId);

            document.getElementById('editAttendanceId').value = attendanceId;
            document.getElementById('editAttendanceStudentId').value = record.studentId;

            document.getElementById('editStudentInfo').textContent =
                student ? `${student.firstName} ${student.lastName} (${student.rollNo})` : 'Unknown Student';
            document.getElementById('editClassInfo').textContent =
                classInfo ? `${classInfo.code} - ${classInfo.name}` : 'Unknown Class';
            document.getElementById('editDateInfo').textContent = `${record.date} (Session ${record.session || 1})`;
            document.getElementById('editFacultyInfo').textContent =
                classInfo ? classInfo.faculty : 'Unknown Faculty';
            document.getElementById('editAttendanceNotes').value = record.notes || '';

            // Set session selector
            document.getElementById('editSessionSelector').value = record.session || 1;

            // Set the correct radio button
            document.querySelector(`input[name="attendanceStatus"][value="${record.status}"]`).checked = true;

            openModal('editAttendanceModal');
        }

        async function saveEditedAttendance(event) {
            event.preventDefault();

            const attendanceId = parseInt(document.getElementById('editAttendanceId').value);
            const record = await getRecord('attendance', attendanceId);

            if (!record) {
                showToast('Record not found!', 'error');
                return;
            }

            const newStatus = document.querySelector('input[name="attendanceStatus"]:checked').value;
            const notes = document.getElementById('editAttendanceNotes').value;
            const newSession = parseInt(document.getElementById('editSessionSelector').value) || 1;

            record.status = newStatus;
            record.notes = notes;
            record.session = newSession;
            record.updatedAt = new Date().toISOString();

            await updateRecord('attendance', record);
            showToast('Attendance updated successfully!');
            closeModal('editAttendanceModal');

            // Refresh the current view
            if (currentUser.role === 'faculty') {
                loadAttendanceHistory();
            } else if (currentUser.role === 'admin') {
                loadAdminAttendanceHistory();
            }
        }

        async function deleteAttendanceRecord() {
            const attendanceId = parseInt(document.getElementById('editAttendanceId').value);

            showConfirm('Delete this attendance record permanently?', async function () {
                await deleteRecord('attendance', attendanceId);
                showToast('Attendance record deleted!', 'info');
                closeModal('editAttendanceModal');

                // Refresh the current view
                if (currentUser.role === 'faculty') {
                    loadAttendanceHistory();
                } else if (currentUser.role === 'admin') {
                    loadAdminAttendanceHistory();
                }
            });
        }
        // Add this function to handle downloading attendance reports for the current class
        async function downloadAttendanceReport() {
            const classSelect = document.getElementById('facultyClassSelect');
            const classId = parseInt(classSelect.value);
            const date = document.getElementById('attendanceDate').value;

            if (!classId) {
                showToast('Please select a class first', 'error');
                return;
            }

            const allAttendance = await getAll('attendance');
            const allStudents = await getAll('students');
            const allClasses = await getAll('classes');

            const classInfo = allClasses.find(c => c.id === classId);
            if (!classInfo) return;

            let classRecords = allAttendance.filter(r => r.classId === classId);

            if (date) {
                classRecords = classRecords.filter(r => r.date === date);
            }

            if (classRecords.length === 0) {
                showToast('No attendance records found for this class', 'info');
                return;
            }

            // Group by date then session
            const dateGroups = {};
            classRecords.forEach(r => {
                if (!dateGroups[r.date]) {
                    dateGroups[r.date] = [];
                }
                dateGroups[r.date].push(r);
            });

            // Sort dates in descending order
            const sortedDates = Object.keys(dateGroups).sort((a, b) =>
                new Date(b) - new Date(a)
            );

            // Create CLEAN CSV - SAME FORMAT AS ATTENDANCE HISTORY
            let csvLines = [];
            csvLines.push('==================================================================');
            csvLines.push(`ATTENDANCE REPORT - ${classInfo.code}: ${classInfo.name}`);
            csvLines.push(`Department: ${classInfo.department}, Semester: ${classInfo.semester}`);
            csvLines.push(`Faculty: ${classInfo.faculty}`);
            if (date) {
                csvLines.push(`Filtered Date: ${date}`);
            }
            csvLines.push(`Total Records: ${classRecords.length}`);
            csvLines.push('==================================================================');
            csvLines.push('');

            // Summary
            let totalPresent = 0, totalAbsent = 0;
            classRecords.forEach(r => {
                if (r.status === 'present') totalPresent++;
                else totalAbsent++;
            });

            csvLines.push('SUMMARY');
            csvLines.push(`Total Records,${classRecords.length}`);
            csvLines.push(`Total Present,${totalPresent}`);
            csvLines.push(`Total Absent,${totalAbsent}`);
            csvLines.push(`Overall Attendance %,${classRecords.length > 0 ? Math.round((totalPresent / classRecords.length) * 100) : 0}`);
            csvLines.push('');
            csvLines.push('');

            // Detailed records by date and session
            sortedDates.forEach((currentDate, dateIndex) => {
                const recordsForDate = dateGroups[currentDate];

                // Group by session
                const sessionGroups = {};
                recordsForDate.forEach(r => {
                    const session = r.session || 1;
                    if (!sessionGroups[session]) {
                        sessionGroups[session] = [];
                    }
                    sessionGroups[session].push(r);
                });

                const sortedSessions = Object.keys(sessionGroups).sort((a, b) => a - b);

                // ADD LONG SEPARATOR BEFORE EACH DATE (except first one)
                if (dateIndex > 0) {
                    csvLines.push('-------------------------------------------------------------------------------------------------------------');
                    csvLines.push('');
                }

                csvLines.push(`Date: ${new Date(currentDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                })} (${sortedSessions.length} session${sortedSessions.length > 1 ? 's' : ''})`);
                csvLines.push('======================================================================');

                sortedSessions.forEach((sessionNum, sessionIndex) => {
                    const sessionRecords = sessionGroups[sessionNum];

                    // ADD X SEPARATOR FOR SESSION
                    csvLines.push('xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');
                    csvLines.push(`   Session ${sessionNum}`);
                    csvLines.push('   ' + '-'.repeat(60));
                    csvLines.push('   Roll No,Student Name,Status,Time Recorded');

                    sessionRecords.forEach(record => {
                        const student = allStudents.find(s => s.id === record.studentId) || {};
                        const rollNo = String(student.rollNo || 'N/A');
                        const name = `${student.firstName || ''} ${student.lastName || ''}`.trim();
                        const statusText = record.status === 'present' ? 'P' : 'A';
                        const timeRecorded = record.createdAt ?
                            new Date(record.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) :
                            new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                        csvLines.push(`   ${rollNo},"${name}",${statusText},${timeRecorded}`);
                    });

                    const present = sessionRecords.filter(r => r.status === 'present').length;
                    const absent = sessionRecords.filter(r => r.status === 'absent').length;
                    const percentage = sessionRecords.length > 0 ? Math.round((present / sessionRecords.length) * 100) : 0;
                    csvLines.push(`   -- Session ${sessionNum} Summary: ${present} Present | ${absent} Absent | ${percentage}% --`);
                    csvLines.push('');
                });

                // Date summary
                const datePresent = recordsForDate.filter(r => r.status === 'present').length;
                const dateAbsent = recordsForDate.filter(r => r.status === 'absent').length;
                const datePercentage = recordsForDate.length > 0 ? Math.round((datePresent / recordsForDate.length) * 100) : 0;
                csvLines.push(`   Date Summary: ${datePresent} Present | ${dateAbsent} Absent | ${datePercentage}% Attendance`);
                csvLines.push('======================================================================');
            });

            csvLines.push('');
            csvLines.push('==================================================================');
            csvLines.push('OVERALL SUMMARY');
            csvLines.push('==================================================================');
            csvLines.push(`Total Dates: ${sortedDates.length}`);
            csvLines.push(`Total Sessions: ${Object.values(dateGroups).reduce((sum, records) => {
                const sessions = new Set(records.map(r => r.session || 1));
                return sum + sessions.size;
            }, 0)}`);
            csvLines.push(`Total Records: ${classRecords.length}`);
            csvLines.push(`Total Present: ${totalPresent}`);
            csvLines.push(`Total Absent: ${totalAbsent}`);
            csvLines.push(`Overall Attendance: ${classRecords.length > 0 ? Math.round((totalPresent / classRecords.length) * 100) : 0}%`);
            csvLines.push(`Export Date: ${new Date().toLocaleString()}`);

            const csvContent = csvLines.join('\n');
            downloadCSV(csvContent, `attendance_report_${classInfo.code}_${date ? date.replace(/-/g, '') : 'all'}_${new Date().getTime()}.csv`);
            showToast(`Exported ${classRecords.length} attendance records`, 'success');
        }


        function addMultiSessionButton() {
            const submitButton = document.querySelector('#facultyMark .btn-success');
            if (!submitButton) return;

            const multiSessionBtn = document.createElement('button');
            multiSessionBtn.type = 'button';
            multiSessionBtn.className = 'btn btn-warning';
            multiSessionBtn.id = 'multiSessionBtn';
            multiSessionBtn.textContent = '📅 Mark Multiple Sessions';
            multiSessionBtn.onclick = markMultipleSessions;
            multiSessionBtn.style.display = 'inline-block';
            multiSessionBtn.style.marginLeft = '10px';

            submitButton.parentNode.insertBefore(multiSessionBtn, submitButton.nextSibling);
        }

        // Function to mark attendance for multiple sessions at once
        async function markMultipleSessions() {
            const classId = parseInt(document.getElementById('facultyClassSelect').value);
            const date = document.getElementById('attendanceDate').value;
            const endSession = parseInt(document.getElementById('attendanceSession').value);

            if (!classId || !date || endSession < 1) {
                showToast('Please select Class, Date, and Session number', 'error');
                return;
            }

            showConfirm(`Mark attendance for ${endSession} sessions on ${date}?`, async function () {
                const checkboxes = document.querySelectorAll('.attendance-checkbox');
                if (checkboxes.length === 0) {
                    showToast('No students to mark', 'error');
                    return;
                }

                const allAttendance = await getAll('attendance');
                let totalRecords = 0;

                // For each session from 1 to endSession
                for (let session = 1; session <= endSession; session++) {
                    const existingForSession = allAttendance.filter(r =>
                        r.classId === classId &&
                        r.date === date &&
                        r.session === session
                    );
                    const existingMap = new Map(existingForSession.map(r => [r.studentId, r]));

                    const promises = [];

                    checkboxes.forEach(cb => {
                        const studentId = parseInt(cb.value);
                        const status = cb.checked ? 'present' : 'absent';

                        const record = {
                            classId: classId,
                            studentId: studentId,
                            date: date,
                            session: session,
                            status: status,
                            notes: `Session ${session}`,
                            createdAt: new Date().toISOString()
                        };

                        const existing = existingMap.get(studentId);
                        if (existing) {
                            record.id = existing.id;
                            promises.push(updateRecord('attendance', record));
                        } else {
                            promises.push(addRecord('attendance', record));
                        }
                    });

                    try {
                        await Promise.all(promises);
                        totalRecords += promises.length;
                    } catch (e) {
                        console.error(`Error saving session ${session}:`, e);
                    }
                }

                showToast(`Attendance saved for ${totalRecords} records across ${endSession} sessions!`);
                generateYearlyReport();

                // Clear checkboxes after successful submission
                checkboxes.forEach(cb => cb.checked = false);
            });
        }

        // --- FIXED: LOAD ADMIN ATTENDANCE HISTORY ---
        async function loadAdminAttendanceHistory() {
            console.log('Loading admin attendance history...');

            // Get filter values
            const yearFilter = document.getElementById('adminYearFilter').value;
            const branchFilter = document.getElementById('adminBranchFilter').value;
            const semesterFilter = document.getElementById('adminSemesterFilter').value;
            const classFilter = document.getElementById('adminClassFilter').value;
            const dateFrom = document.getElementById('adminDateFrom').value;
            const dateTo = document.getElementById('adminDateTo').value;
            const statusFilter = document.getElementById('adminStatusFilter').value;
            const sortBy = document.getElementById('adminSortBy').value;

            // Show loading state
            const tableBody = document.getElementById('adminAttendanceBody');
            const recordCount = document.getElementById('adminRecordCount');
            tableBody.innerHTML = `
                <tr>
                    <td colspan="10" style="text-align:center; padding: 40px; color: gray;">
                        ⏳ Loading attendance data...
                    </td>
                </tr>
            `;
            recordCount.textContent = `(Loading...)`;

            try {
                // Get all data
                const allAttendance = await getAll('attendance');
                const allStudents = await getAll('students');
                const allClasses = await getAll('classes');

                // Filter students based on criteria
                let filteredStudents = allStudents;

                if (yearFilter !== 'all') {
                    const yearNum = parseInt(yearFilter);
                    filteredStudents = filteredStudents.filter(student =>
                        Math.ceil(student.semester / 2) === yearNum
                    );
                }

                if (branchFilter !== 'all') {
                    filteredStudents = filteredStudents.filter(student =>
                        student.department === branchFilter
                    );
                }

                if (semesterFilter !== 'all') {
                    filteredStudents = filteredStudents.filter(student =>
                        student.semester == semesterFilter
                    );
                }

                // Get selected class if any
                let selectedClass = null;
                if (classFilter !== 'all') {
                    selectedClass = allClasses.find(c => c.id === parseInt(classFilter));

                    // If semester filter is set, verify the selected class matches the semester
                    if (semesterFilter !== 'all' && selectedClass && selectedClass.semester != semesterFilter) {
                        // Don't show data if class doesn't match selected semester
                        tableBody.innerHTML = `
                            <tr>
                                <td colspan="10" style="text-align:center; padding: 40px; color: #e74c3c;">
                                    ⚠️ Selected class (${selectedClass.name}) is not in Semester ${semesterFilter}.<br>
                                    Please select a different class or clear the semester filter.
                                </td>
                            </tr>
                        `;
                        recordCount.textContent = `(0)`;
                        document.getElementById('statTotalRecords').textContent = '0';
                        document.getElementById('statAvgPercentage').textContent = '0%';
                        document.getElementById('statAbove75').textContent = '0';
                        document.getElementById('statBelow75').textContent = '0';
                        document.getElementById('yearWiseAttendanceSummary').innerHTML = '<p style="color: #999;">No data available</p>';
                        return;
                    }
                }

                // Filter classes by semester if semester filter is set
                let filteredClasses = allClasses;
                if (semesterFilter !== 'all') {
                    filteredClasses = allClasses.filter(cls => cls.semester == semesterFilter);

                    // Also filter by branch if branch filter is set
                    if (branchFilter !== 'all') {
                        filteredClasses = filteredClasses.filter(cls => cls.department === branchFilter);
                    }
                }

                // Prepare data for table
                const tableData = [];
                let above75Count = 0;
                let below75Count = 0;
                let totalPercentage = 0;
                let studentCount = 0;

                for (const student of filteredStudents) {
                    // Get relevant classes for this student - only from filteredClasses
                    const studentClasses = filteredClasses.filter(cls =>
                        cls.semester == student.semester &&
                        cls.department === student.department
                    );

                    let relevantClassIds = studentClasses.map(c => c.id);
                    if (classFilter !== 'all') {
                        relevantClassIds = [parseInt(classFilter)];

                        // If specific class is selected, check if student is in correct dept/sem
                        if (selectedClass && (student.department !== selectedClass.department || student.semester != selectedClass.semester)) {
                            continue;
                        }
                    }

                    // If no relevant classes, skip this student
                    if (relevantClassIds.length === 0) {
                        continue;
                    }

                    // Get attendance for this student
                    const studentAttendance = allAttendance.filter(record =>
                        record.studentId === student.id &&
                        relevantClassIds.includes(record.classId)
                    );

                    // Apply date filter
                    let filteredAttendance = studentAttendance;
                    const dateFilterType = document.querySelector('input[name="dateFilterType"]:checked')?.value || 'all';

                    if (dateFilterType === 'range' && dateFrom && dateTo) {
                        filteredAttendance = studentAttendance.filter(r => {
                            const recordDate = new Date(r.date);
                            const fromDate = new Date(dateFrom);
                            const toDate = new Date(dateTo);

                            fromDate.setHours(0, 0, 0, 0);
                            toDate.setHours(23, 59, 59, 999);

                            return recordDate >= fromDate && recordDate <= toDate;
                        });
                    }

                    const totalClasses = filteredAttendance.length;
                    const presentClasses = filteredAttendance.filter(r => r.status === 'present').length;
                    const attendancePercentage = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 0;

                    // Apply status filter
                    if (statusFilter === 'present' && attendancePercentage === 0) continue;
                    if (statusFilter === 'absent' && (totalClasses - presentClasses) === 0) continue;

                    // Get class name(s) for display
                    let className = '';
                    if (selectedClass) {
                        className = `${selectedClass.name} (${selectedClass.code})`;
                    } else if (relevantClassIds.length === 1) {
                        const cls = allClasses.find(c => c.id === relevantClassIds[0]);
                        className = cls ? `${cls.name} (${cls.code})` : 'Multiple';
                    } else {
                        className = `${relevantClassIds.length} classes`;
                    }

                    // Add to table data
                    tableData.push({
                        id: student.id,
                        rollNo: student.rollNo || 'N/A',
                        name: `${student.firstName || ''} ${student.lastName || ''}`,
                        department: student.department || 'N/A',
                        year: Math.ceil(student.semester / 2),
                        semester: student.semester || 'N/A',
                        className: className,
                        totalClasses: totalClasses,
                        presentClasses: presentClasses,
                        absentClasses: totalClasses - presentClasses,
                        attendancePercentage: attendancePercentage,
                        student: student
                    });

                    // Update statistics
                    studentCount++;
                    totalPercentage += attendancePercentage;

                    if (attendancePercentage >= 75) {
                        above75Count++;
                    } else {
                        below75Count++;
                    }
                }

                // Apply sorting
                tableData.sort((a, b) => {
                    switch (sortBy) {
                        case 'percentage_desc':
                            return b.attendancePercentage - a.attendancePercentage;
                        case 'percentage_asc':
                            return a.attendancePercentage - b.attendancePercentage;
                        case 'rollno_asc':
                            return (a.rollNo || '').localeCompare(b.rollNo || '');
                        case 'rollno_desc':
                            return (b.rollNo || '').localeCompare(a.rollNo || '');
                        case 'name_asc':
                            return (a.name || '').localeCompare(b.name || '');
                        case 'name_desc':
                            return (b.name || '').localeCompare(a.name || '');
                        default:
                            return b.attendancePercentage - a.attendancePercentage;
                    }
                });

                // Update table
                tableBody.innerHTML = '';

                if (tableData.length === 0) {
                    tableBody.innerHTML = `
                        <tr>
                            <td colspan="10" style="text-align:center; padding: 40px; color: gray;">
                                📭 No attendance records found with the current filters.
                            </td>
                        </tr>
                    `;
                } else {
                    tableData.forEach(item => {
                        const row = document.createElement('tr');
                        const percentageColor = item.attendancePercentage >= 75 ? 'status-present' : 'status-absent';

                        row.innerHTML = `
                            <td>${item.rollNo}</td>
                            <td>${item.name}</td>
                            <td>${item.department}</td>
                            <td>${item.year}</td>
                            <td>${item.semester}</td>
                            <td>${item.className}</td>
                            <td>${item.totalClasses}</td>
                            <td><span class="status-badge-table status-present">${item.presentClasses}</span></td>
                            <td><span class="status-badge-table status-absent">${item.absentClasses}</span></td>
                            <td><span class="status-badge-table ${percentageColor}">${item.attendancePercentage}%</span></td>
                        `;
                        tableBody.appendChild(row);
                    });
                }

                // Update record count
                recordCount.textContent = `(${tableData.length})`;

                // Update statistics
                const avgPercentage = studentCount > 0 ? Math.round(totalPercentage / studentCount) : 0;
                document.getElementById('statTotalRecords').textContent = studentCount;
                document.getElementById('statAvgPercentage').textContent = `${avgPercentage}%`;
                document.getElementById('statAbove75').textContent = above75Count;
                document.getElementById('statBelow75').textContent = below75Count;

                // Generate year-wise summary
                generateYearWiseSummary(tableData);

                // Update class filter dropdown based on semester filter
                updateClassFilterDropdown(semesterFilter, branchFilter);

                showToast(`Loaded ${tableData.length} attendance records`, 'success');

            } catch (error) {
                console.error('Error loading attendance history:', error);
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="10" style="text-align:center; padding: 40px; color: #e74c3c;">
                            ❌ Error loading attendance data. Please try again.
                        </td>
                    </tr>
                `;
                recordCount.textContent = `(Error)`;
                showToast('Error loading attendance data', 'error');
            }
        }

        // --- GENERATE YEAR-WISE SUMMARY ---
        function generateYearWiseSummary(tableData) {
            const summaryContainer = document.getElementById('yearWiseAttendanceSummary');

            if (tableData.length === 0) {
                summaryContainer.innerHTML = '<p style="color: #999; font-style: italic;">No data available for summary</p>';
                return;
            }

            // Group by year
            const yearStats = {};

            tableData.forEach(item => {
                const year = item.year;
                if (!yearStats[year]) {
                    yearStats[year] = {
                        totalStudents: 0,
                        totalPercentage: 0,
                        above75: 0,
                        below75: 0
                    };
                }

                yearStats[year].totalStudents++;
                yearStats[year].totalPercentage += item.attendancePercentage;

                if (item.attendancePercentage >= 75) {
                    yearStats[year].above75++;
                } else {
                    yearStats[year].below75++;
                }
            });

            let summaryHTML = '<div style="display: flex; flex-wrap: wrap; gap: 15px; margin-top: 10px;">';

            for (const year in yearStats) {
                const stats = yearStats[year];
                const avgPercentage = Math.round(stats.totalPercentage / stats.totalStudents);
                const percentageColor = avgPercentage >= 75 ? '#27ae60' : '#e74c3c';

                summaryHTML += `
                    <div style="flex: 1; min-width: 200px; background: white; border-radius: 8px; padding: 15px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); border-left: 4px solid ${percentageColor};">
                        <div style="font-weight: bold; font-size: 16px; margin-bottom: 10px; color: #2c3e50;">📊 Year ${year}</div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                            <span style="color: #666;">Students:</span>
                            <span style="font-weight: bold;">${stats.totalStudents}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                            <span style="color: #666;">Avg. Attendance:</span>
                            <span style="font-weight: bold; color: ${percentageColor};">${avgPercentage}%</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                            <span style="color: #666;">Above 75%:</span>
                            <span style="font-weight: bold; color: #27ae60;">${stats.above75}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span style="color: #666;">Below 75%:</span>
                            <span style="font-weight: bold; color: #e74c3c;">${stats.below75}</span>
                        </div>
                        <div style="margin-top: 10px; text-align: center;">
                            <button class="btn btn-small btn-info" onclick="viewYearDetails(${year})" style="font-size: 11px; padding: 4px 8px;">
                                View Details
                            </button>
                        </div>
                    </div>
                `;
            }

            summaryHTML += '</div>';
            summaryContainer.innerHTML = summaryHTML;
        }

        // --- CLEAR ADMIN FILTERS ---
        function clearAdminFilters() {
            document.getElementById('adminYearFilter').value = 'all';
            document.getElementById('adminBranchFilter').value = 'all';
            document.getElementById('adminSemesterFilter').value = 'all';

            // Reset class filter with all classes
            const classSelect = document.getElementById('adminClassFilter');
            classSelect.innerHTML = '<option value="all">All Classes</option>';
            // Repopulate with all classes
            populateAdminClassFilter('all', 'all');

            document.getElementById('adminStatusFilter').value = 'all';
            document.getElementById('adminSortBy').value = 'percentage_desc';

            // Reset date filter
            document.querySelector('input[name="dateFilterType"][value="all"]').checked = true;
            document.getElementById('dateRangeInputs').style.display = 'none';
            document.getElementById('adminDateFrom').value = '';
            document.getElementById('adminDateTo').value = '';

            showToast('Filters cleared', 'info');
        }

        // --- ENHANCED EXPORT FUNCTIONS WITH DETAILED SUBJECT INFORMATION ---
        async function exportAdminHistory(format) {
            const yearFilter = document.getElementById('adminYearFilter').value;
            const branchFilter = document.getElementById('adminBranchFilter').value;
            const semesterFilter = document.getElementById('adminSemesterFilter').value;
            const classFilter = document.getElementById('adminClassFilter').value;
            const dateFrom = document.getElementById('adminDateFrom').value;
            const dateTo = document.getElementById('adminDateTo').value;
            const statusFilter = document.getElementById('adminStatusFilter').value;

            const allAttendance = await getAll('attendance');
            const allStudents = await getAll('students');
            const allClasses = await getAll('classes');

            // Filter students
            let filteredStudents = allStudents;

            if (yearFilter !== 'all') {
                const yearNum = parseInt(yearFilter);
                filteredStudents = filteredStudents.filter(student =>
                    Math.ceil(student.semester / 2) === yearNum
                );
            }

            if (branchFilter !== 'all') {
                filteredStudents = filteredStudents.filter(student =>
                    student.department === branchFilter
                );
            }

            if (semesterFilter !== 'all') {
                filteredStudents = filteredStudents.filter(student =>
                    student.semester == semesterFilter
                );
            }

            // Get selected class details
            let selectedClass = null;
            if (classFilter !== 'all') {
                selectedClass = allClasses.find(c => c.id === parseInt(classFilter));
            }

            // Prepare data with detailed subject information
            const exportData = [];

            // Track unique classes for statistics
            const classStats = new Map();

            // Track attendance records for statistics
            let totalAttendanceRecords = 0;
            let uniqueStudentIds = new Set();
            let classAttendanceRecords = new Map(); // classId -> [attendance records]

            // Track unique class sessions (class + date combinations)
            const uniqueClassSessions = new Set();
            let totalUniqueSessions = 0;

            for (const student of filteredStudents) {
                const studentClasses = allClasses.filter(cls =>
                    cls.semester == student.semester &&
                    cls.department === student.department
                );

                let relevantClassIds = studentClasses.map(c => c.id);
                if (classFilter !== 'all') {
                    relevantClassIds = [parseInt(classFilter)];

                    // If specific class is selected, check if student is in correct dept/sem
                    if (selectedClass && (student.department !== selectedClass.department || student.semester != selectedClass.semester)) {
                        continue;
                    }
                }

                const studentAttendance = allAttendance.filter(record =>
                    record.studentId === student.id &&
                    relevantClassIds.includes(record.classId)
                );

                let filteredAttendance = studentAttendance;
                const dateFilterType = document.querySelector('input[name="dateFilterType"]:checked')?.value || 'all';

                if (dateFilterType === 'range' && dateFrom && dateTo) {
                    filteredAttendance = studentAttendance.filter(r => {
                        const recordDate = new Date(r.date);
                        const fromDate = new Date(dateFrom);
                        const toDate = new Date(dateTo);

                        // Set time to beginning/end of day for proper range comparison
                        fromDate.setHours(0, 0, 0, 0);
                        toDate.setHours(23, 59, 59, 999);

                        return recordDate >= fromDate && recordDate <= toDate;
                    });
                }

                // Collect class statistics
                filteredAttendance.forEach(record => {
                    totalAttendanceRecords++;
                    uniqueStudentIds.add(student.id);

                    // Track unique class sessions (classId + date + session combination)
                    const sessionKey = `${record.classId}-${record.date}-${record.session || 1}`;
                    if (!uniqueClassSessions.has(sessionKey)) {
                        uniqueClassSessions.add(sessionKey);
                        totalUniqueSessions++;
                    }

                    if (!classStats.has(record.classId)) {
                        const cls = allClasses.find(c => c.id === record.classId);
                        if (cls) {
                            classStats.set(record.classId, {
                                classId: record.classId,
                                className: cls.name,
                                classCode: cls.code,
                                faculty: cls.faculty,
                                department: cls.department,
                                semester: cls.semester,
                                year: cls.year,
                                totalRecords: 0,
                                uniqueStudents: new Set(),
                                uniqueSessions: new Set() // Track unique sessions per class
                            });
                        }
                    }

                    const stat = classStats.get(record.classId);
                    if (stat) {
                        stat.totalRecords++;
                        stat.uniqueStudents.add(student.id);
                        // Add this date to unique sessions for this class
                        stat.uniqueSessions.add(`${record.date}-${record.session || 1}`);
                    }

                    // Track attendance records per class
                    if (!classAttendanceRecords.has(record.classId)) {
                        classAttendanceRecords.set(record.classId, []);
                    }
                    classAttendanceRecords.get(record.classId).push(record);
                });

                const totalClasses = filteredAttendance.length;
                const presentClasses = filteredAttendance.filter(r => r.status === 'present').length;
                const attendancePercentage = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 0;

                // Apply status filter
                if (statusFilter === 'present' && attendancePercentage === 0) continue;
                if (statusFilter === 'absent' && (totalClasses - presentClasses) === 0) continue;

                exportData.push({
                    rollNo: student.rollNo || 'N/A',
                    name: `${student.firstName || ''} ${student.lastName || ''}`,
                    department: student.department || 'N/A',
                    year: Math.ceil(student.semester / 2),
                    semester: student.semester || 'N/A',
                    totalClasses: totalClasses,
                    presentClasses: presentClasses,
                    absentClasses: totalClasses - presentClasses,
                    attendancePercentage: attendancePercentage + '%',
                    status: attendancePercentage >= 75 ? 'Above 75%' : 'Below 75%'
                });
            }

            // Calculate subject summary
            const currentYear = new Date().getFullYear();
            let academicYear = '';

            // FIX 1: Academic Year calculation for specific class
            if (selectedClass) {
                // If a specific class is selected, use its year directly
                academicYear = selectedClass.year || currentYear;
                // Format as academic year (e.g., 2023-2024)
                if (academicYear) {
                    academicYear = `${academicYear}-${parseInt(academicYear) + 1}`;
                } else {
                    academicYear = currentYear;
                }
            } else if (yearFilter !== 'all') {
                // If year filter is set, calculate academic year from filter
                const yearNum = parseInt(yearFilter);
                // Calculate academic year based on current year and year filter
                const baseYear = currentYear - yearNum + 1;
                academicYear = `${baseYear}-${baseYear + 1}`;
            } else if (semesterFilter !== 'all') {
                // If semester filter is set, estimate academic year
                const sem = parseInt(semesterFilter);
                const approxYear = Math.ceil(sem / 2);
                const baseYear = currentYear - approxYear + 1;
                academicYear = `${baseYear}-${baseYear + 1}`;
            } else {
                academicYear = 'All Years';
            }

            const classDetails = [];
            let totalUniqueClasses = 0;
            let totalStudents = uniqueStudentIds.size;
            let totalSessionsAcrossAllClasses = 0;

            // FIX 2: Calculate average strength per session correctly
            let totalPresentAcrossAllSessions = 0;

            classStats.forEach(stat => {
                totalUniqueClasses++;

                // Calculate average attendance per class
                const classRecords = classAttendanceRecords.get(stat.classId) || [];
                const uniqueDates = stat.uniqueSessions.size; // Use the unique dates per class

                // Add to total sessions across all classes
                totalSessionsAcrossAllClasses += uniqueDates;

                // Calculate average strength (average attendance per session)
                let avgStrength = 0;
                if (uniqueDates > 0) {
                    // Group attendance by date and session
                    const attendanceBySession = {};
                    classRecords.forEach(record => {
                        const sessionKey = `${record.date}-${record.session || 1}`;
                        if (!attendanceBySession[sessionKey]) {
                            attendanceBySession[sessionKey] = {
                                present: 0,
                                total: 0
                            };
                        }
                        attendanceBySession[sessionKey].total++;
                        if (record.status === 'present') {
                            attendanceBySession[sessionKey].present++;
                        }
                    });

                    // Calculate average attendance across all sessions
                    const totalAttendance = Object.values(attendanceBySession).reduce((sum, day) => sum + day.present, 0);
                    avgStrength = Math.round(totalAttendance / uniqueDates * 10) / 10;
                    totalPresentAcrossAllSessions += totalAttendance;
                }

                classDetails.push({
                    Subject: `${stat.className} (${stat.classCode})`,
                    Faculty: stat.faculty,
                    'Department': stat.department,
                    'Semester': stat.semester,
                    'Total Sessions': uniqueDates,
                    'Total Students': stat.uniqueStudents.size,
                    'Average Attendance per Session': avgStrength
                });
            });

            // FIX 3: Subject and Faculty names for specific class
            let subjectName = 'Multiple Subjects';
            let facultyName = 'Multiple Faculty';
            let departmentName = branchFilter !== 'all' ? branchFilter : 'All Departments';
            let semesterName = semesterFilter !== 'all' ? `Semester ${semesterFilter}` : 'All Semesters';

            if (selectedClass) {
                subjectName = `${selectedClass.name} (${selectedClass.code})`;
                facultyName = selectedClass.faculty || 'Not Assigned';
                departmentName = selectedClass.department;
                semesterName = `Semester ${selectedClass.semester}`;
            } else if (totalUniqueClasses === 1) {
                // If only one class in the results, use that class info
                const stat = Array.from(classStats.values())[0];
                if (stat) {
                    subjectName = `${stat.className} (${stat.classCode})`;
                    facultyName = stat.faculty || 'Not Assigned';
                    departmentName = stat.department;
                    semesterName = `Semester ${stat.semester}`;
                }
            }

            // FIX 4: Calculate average strength correctly
            const averageStrength = totalUniqueSessions > 0 ?
                Math.round(totalPresentAcrossAllSessions / totalUniqueSessions * 10) / 10 : 0;

            const subjectSummary = {
                subjectName: subjectName,
                facultyName: facultyName,
                department: departmentName,
                semester: semesterName,
                academicYear: academicYear,
                totalSessions: totalUniqueSessions, // Use unique sessions, not total attendance records
                totalStudents: totalStudents,
                averageStrength: averageStrength,
                totalAttendanceRecords: totalAttendanceRecords
            };

            // Create enhanced export with subject summary
            const enhancedExport = {
                subjectSummary: subjectSummary,
                classDetails: classDetails,
                studentData: exportData,
                exportDate: new Date().toLocaleString(),
                statistics: {
                    totalAttendanceRecords: totalAttendanceRecords,
                    uniqueClassSessions: totalUniqueSessions,
                    uniqueStudents: totalStudents,
                    uniqueClasses: totalUniqueClasses
                }
            };

            switch (format) {
                case 'csv':
                    exportToCSVEnhanced(enhancedExport);
                    break;
                case 'excel':
                    exportToExcelEnhanced(enhancedExport);
                    break;
                case 'json':
                    exportToJSONEnhanced(enhancedExport);
                    break;
                case 'pdf':
                    exportToPDFEnhanced(enhancedExport);
                    break;
            }
        }

        function exportToCSVEnhanced(data) {
            if (data.studentData.length === 0) {
                showToast('No data to export', 'error');
                return;
            }

            let csvContent = '==================================================\n';
            csvContent += 'ATTENDANCE REPORT - DETAILED SUBJECT ANALYSIS\n';
            csvContent += '==================================================\n\n';

            // Subject Summary Section - use ASCII only
            csvContent += 'SUBJECT SUMMARY:\n';
            csvContent += '================\n';
            csvContent += `Subject: ${data.subjectSummary.subjectName}\n`;
            csvContent += `Faculty: ${data.subjectSummary.facultyName}\n`;
            csvContent += `Department: ${data.subjectSummary.department}\n`;
            csvContent += `Semester: ${data.subjectSummary.semester}\n`;
            csvContent += `Academic Year: ${data.subjectSummary.academicYear}\n`;
            csvContent += `Total Sessions: ${data.subjectSummary.totalSessions}\n`;
            csvContent += `Total Students: ${data.subjectSummary.totalStudents}\n`;
            csvContent += `Average Strength: ${data.subjectSummary.averageStrength}\n`;
            csvContent += `Unique Classes: ${data.statistics.uniqueClasses}\n`;
            csvContent += `Total Attendance Records: ${data.statistics.totalAttendanceRecords}\n\n`;

            // Class Details Section (if multiple classes)
            if (data.classDetails.length > 0) {
                csvContent += 'CLASS-WISE DETAILS:\n';
                csvContent += '===================\n';
                csvContent += 'Subject,Faculty,Department,Semester,Total Sessions,Total Students,Average Attendance per Session\n';
                data.classDetails.forEach(cls => {
                    csvContent += `${cls.Subject},${cls.Faculty},${cls.Department},${cls.Semester},${cls['Total Sessions']},${cls['Total Students']},${cls['Average Attendance per Session']}\n`;
                });
                csvContent += '\n';
            }

            csvContent += `Export Date: ${data.exportDate}\n\n`;

            // Student Data Section
            csvContent += 'STUDENT ATTENDANCE DETAILS:\n';
            csvContent += '===========================\n';
            const headers = Object.keys(data.studentData[0]).join(',');
            const rows = data.studentData.map(item =>
                Object.values(item).map(value => {
                    // Convert any remaining Unicode characters in values
                    const stringValue = String(value);
                    const asciiValue = toAsciiText(stringValue);
                    return `"${asciiValue.replace(/"/g, '""')}"`;
                }).join(',')
            );

            csvContent += headers + '\n';
            csvContent += rows.join('\n');

            downloadCSV(csvContent, `attendance_report_${new Date().getTime()}.csv`);
            showToast('CSV exported with detailed subject information!');
        }

        function exportToExcelEnhanced(data) {
            if (data.studentData.length === 0) {
                showToast('No data to export', 'error');
                return;
            }

            // Create HTML table for Excel
            let html = '<html><head><meta charset="UTF-8">';
            html += '<style>body { font-family: Arial; margin: 20px; } ';
            html += 'h1, h2, h3 { color: #2c3e50; } ';
            html += '.summary { background: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px; } ';
            html += 'table { width: 100%; border-collapse: collapse; margin-top: 20px; } ';
            html += 'th { background: #1f96d3; color: white; padding: 12px; text-align: left; font-weight: 600; } ';
            html += 'td { padding: 10px; border: 1px solid #ddd; } ';
            html += '.header-row { background: #2c3e50; color: white; font-weight: bold; } ';
            html += '</style></head><body>';

            // Title
            html += '<h1>📊 Attendance Report - Detailed Subject Analysis</h1>';
            html += `<p><strong>Export Date:</strong> ${data.exportDate}</p>`;

            // Subject Summary
            html += '<div class="summary">';
            html += '<h2>Subject Summary</h2>';
            html += `<p><strong>Subject:</strong> ${data.subjectSummary.subjectName}</p>`;
            html += `<p><strong>Faculty:</strong> ${data.subjectSummary.facultyName}</p>`;
            html += `<p><strong>Department:</strong> ${data.subjectSummary.department}</p>`;
            html += `<p><strong>Semester:</strong> ${data.subjectSummary.semester}</p>`;
            html += `<p><strong>Academic Year:</strong> ${data.subjectSummary.academicYear}</p>`;
            html += `<p><strong>Total Sessions:</strong> ${data.subjectSummary.totalSessions}</p>`;
            html += `<p><strong>Total Students:</strong> ${data.subjectSummary.totalStudents}</p>`;
            html += `<p><strong>Average Strength:</strong> ${data.subjectSummary.averageStrength}</p>`;
            html += `<p><strong>Unique Classes:</strong> ${data.statistics.uniqueClasses}</p>`;
            html += `<p><strong>Total Attendance Records:</strong> ${data.statistics.totalAttendanceRecords}</p>`;
            html += '</div>';

            // Class Details Table (if multiple classes)
            if (data.classDetails.length > 0) {
                html += '<h3>Class-wise Details</h3>';
                html += '<table border="1">';
                html += '<thead><tr class="header-row">';
                html += '<th>Subject</th><th>Faculty</th><th>Department</th><th>Semester</th><th>Total Sessions</th><th>Total Students</th><th>Average Attendance per Session</th>';
                html += '</tr></thead><tbody>';

                data.classDetails.forEach(cls => {
                    html += '<tr>';
                    html += `<td>${cls.Subject}</td>`;
                    html += `<td>${cls.Faculty}</td>`;
                    html += `<td>${cls.Department}</td>`;
                    html += `<td>${cls.Semester}</td>`;
                    html += `<td>${cls['Total Sessions']}</td>`;
                    html += `<td>${cls['Total Students']}</td>`;
                    html += `<td>${cls['Average Attendance per Session']}</td>`;
                    html += '</tr>';
                });

                html += '</tbody></table>';
            }

            // Student Data Table
            html += '<h3>Student Attendance Details</h3>';
            html += '<table border="1">';
            html += '<thead><tr class="header-row">';

            // Headers
            Object.keys(data.studentData[0]).forEach(key => {
                html += `<th>${key}</th>`;
            });
            html += '</tr></thead><tbody>';

            // Data rows
            data.studentData.forEach(item => {
                html += '<tr>';
                Object.values(item).forEach(value => {
                    html += `<td>${value}</td>`;
                });
                html += '</tr>';
            });

            html += '</tbody></table>';
            html += '</body></html>';

            const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", `attendance_report_${new Date().getTime()}.xls`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showToast('Excel report exported with detailed subject information!');
        }

        function exportToJSONEnhanced(data) {
            if (data.studentData.length === 0) {
                showToast('No data to export', 'error');
                return;
            }

            const json = JSON.stringify(data, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", `attendance_report_${new Date().getTime()}.json`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showToast('JSON report exported with detailed subject information!');
        }

        function exportToPDFEnhanced(data) {
            if (data.studentData.length === 0) {
                showToast('No data to export', 'error');
                return;
            }

            // Simple PDF generation using window.print()
            const printWindow = window.open('', '_blank');
            printWindow.document.write('<html><head><title>Attendance Detailed Report</title>');
            printWindow.document.write('<style>');
            printWindow.document.write('body { font-family: Arial; margin: 20px; }');
            printWindow.document.write('h1, h2, h3 { color: #2c3e50; }');
            printWindow.document.write('.summary { background: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px; border: 1px solid #ddd; }');
            printWindow.document.write('table { width: 100%; border-collapse: collapse; margin-top: 20px; }');
            printWindow.document.write('th { background-color: #1f96d3; color: white; padding: 12px; text-align: left; font-weight: 600; }');
            printWindow.document.write('td { border: 1px solid #ddd; padding: 8px; text-align: left; }');
            printWindow.document.write('.header { background: #2c3e50; color: white; padding: 10px; text-align: center; font-size: 20px; font-weight: bold; margin-bottom: 20px; }');
            printWindow.document.write('</style>');
            printWindow.document.write('</head><body>');

            // Header
            printWindow.document.write('<div class="header">📊 Attendance Report - Detailed Subject Analysis</div>');
            printWindow.document.write(`<p style="text-align: right;"><strong>Export Date:</strong> ${data.exportDate}</p>`);

            // Subject Summary
            printWindow.document.write('<div class="summary">');
            printWindow.document.write('<h2>📚 Subject Summary</h2>');
            printWindow.document.write(`<p><strong>Subject:</strong> ${data.subjectSummary.subjectName}</p>`);
            printWindow.document.write(`<p><strong>Faculty:</strong> ${data.subjectSummary.facultyName}</p>`);
            printWindow.document.write(`<p><strong>Department:</strong> ${data.subjectSummary.department}</p>`);
            printWindow.document.write(`<p><strong>Semester:</strong> ${data.subjectSummary.semester}</p>`);
            printWindow.document.write(`<p><strong>Academic Year:</strong> ${data.subjectSummary.academicYear}</p>`);
            printWindow.document.write(`<p><strong>Total Sessions:</strong> ${data.subjectSummary.totalSessions}</p>`);
            printWindow.document.write(`<p><strong>Total Students:</strong> ${data.subjectSummary.totalStudents}</p>`);
            printWindow.document.write(`<p><strong>Average Strength:</strong> ${data.subjectSummary.averageStrength}</p>`);
            printWindow.document.write(`<p><strong>Unique Classes:</strong> ${data.statistics.uniqueClasses}</p>`);
            printWindow.document.write(`<p><strong>Total Attendance Records:</strong> ${data.statistics.totalAttendanceRecords}</p>`);
            printWindow.document.write('</div>');

            // Class Details Table (if multiple classes)
            if (data.classDetails.length > 0) {
                printWindow.document.write('<h3>📊 Class-wise Details</h3>');
                printWindow.document.write('<table border="1">');
                printWindow.document.write('<thead><tr>');
                printWindow.document.write('<th>Subject</th><th>Faculty</th><th>Department</th><th>Semester</th><th>Total Sessions</th><th>Total Students</th><th>Average Attendance per Session</th>');
                printWindow.document.write('</tr></thead><tbody>');

                data.classDetails.forEach(cls => {
                    printWindow.document.write('<tr>');
                    printWindow.document.write(`<td>${cls.Subject}</td>`);
                    printWindow.document.write(`<td>${cls.Faculty}</td>`);
                    printWindow.document.write(`<td>${cls.Department}</td>`);
                    printWindow.document.write(`<td>${cls.Semester}</td>`);
                    printWindow.document.write(`<td>${cls['Total Sessions']}</td>`);
                    printWindow.document.write(`<td>${cls['Total Students']}</td>`);
                    printWindow.document.write(`<td>${cls['Average Attendance per Session']}</td>`);
                    printWindow.document.write('</tr>');
                });

                printWindow.document.write('</tbody></table>');
            }

            // Student Data Table
            printWindow.document.write('<h3>👥 Student Attendance Details</h3>');
            printWindow.document.write('<table border="1">');
            printWindow.document.write('<thead><tr>');

            // Headers
            Object.keys(data.studentData[0]).forEach(key => {
                printWindow.document.write(`<th>${key}</th>`);
            });
            printWindow.document.write('</tr></thead><tbody>');

            // Data rows
            data.studentData.forEach(item => {
                printWindow.document.write('<tr>');
                Object.values(item).forEach(value => {
                    printWindow.document.write(`<td>${value}</td>`);
                });
                printWindow.document.write('</tr>');
            });

            printWindow.document.write('</tbody></table>');
            printWindow.document.write('</body></html>');
            printWindow.document.close();

            setTimeout(() => {
                printWindow.print();
                showToast('PDF report generated! Use print dialog to save as PDF.');
            }, 500);
        }

        // --- BULK EXPORT FUNCTIONS ---
        async function exportBulkData(type) {
            switch (type) {
                case 'students':
                    await exportStudentsYearWise();
                    break;
                case 'classes':
                    await exportClassesYearWise();
                    break;
                case 'faculty':
                    await exportAllFaculty();
                    break;
            }
        }

        async function exportStudentsYearWise() {
            const allStudents = await getAll('students');
            if (allStudents.length === 0) {
                showToast('No students to export', 'error');
                return;
            }

            // Group by year
            const studentsByYear = {};
            allStudents.forEach(student => {
                const year = student.year || Math.ceil(student.semester / 2);
                if (!studentsByYear[year]) {
                    studentsByYear[year] = [];
                }
                studentsByYear[year].push(student);
            });

            let csvContent = '';

            // Export each year separately
            for (const year in studentsByYear) {
                const yearStudents = studentsByYear[year];

                const headers = [
                    'Roll No', 'First Name', 'Last Name', 'Email',
                    'Department', 'Year', 'Semester', 'Created Date'
                ];

                csvContent += `--- Year ${year} Students (${yearStudents.length} records) ---\n`;
                csvContent += headers.join(',') + '\n';

                yearStudents.forEach(student => {
                    const row = [
                        `"${student.rollNo || ''}"`,
                        `"${student.firstName || ''}"`,
                        `"${student.lastName || ''}"`,
                        `"${student.email || ''}"`,
                        `"${student.department || ''}"`,
                        student.year || '',
                        student.semester || '',
                        `"${new Date(student.createdAt).toLocaleDateString()}"`
                    ];
                    csvContent += row.join(',') + '\n';
                });

                csvContent += '\n'; // Add blank line between years
            }

            downloadCSV(csvContent, `students_export_yearwise_${new Date().getTime()}.csv`);
            showToast(`Exported ${allStudents.length} students grouped by year`);
        }

        async function exportClassesYearWise() {
            const allClasses = await getAll('classes');
            if (allClasses.length === 0) {
                showToast('No classes to export', 'error');
                return;
            }

            // Group by year
            const classesByYear = {};
            allClasses.forEach(cls => {
                const year = cls.year;
                if (!classesByYear[year]) {
                    classesByYear[year] = [];
                }
                classesByYear[year].push(cls);
            });

            let csvContent = '';

            // Export each year separately
            for (const year in classesByYear) {
                const yearClasses = classesByYear[year];

                const headers = [
                    'Class Code', 'Course Name', 'Department', 'Semester',
                    'Faculty', 'Year', 'Credits', 'Created Date'
                ];

                csvContent += `--- Year ${year} Classes (${yearClasses.length} records) ---\n`;
                csvContent += headers.join(',') + '\n';

                yearClasses.forEach(cls => {
                    const row = [
                        `"${cls.code || ''}"`,
                        `"${cls.name || ''}"`,
                        `"${cls.department || ''}"`,
                        cls.semester || '',
                        `"${cls.faculty || ''}"`,
                        cls.year || '',
                        cls.credits || '3',
                        `"${new Date(cls.createdAt).toLocaleDateString()}"`
                    ];
                    csvContent += row.join(',') + '\n';
                });

                csvContent += '\n'; // Add blank line between years
            }

            downloadCSV(csvContent, `classes_export_yearwise_${new Date().getTime()}.csv`);
            showToast(`Exported ${allClasses.length} classes grouped by year`);
        }

        async function exportAllFaculty() {
            const allFaculty = await getAll('faculty');
            if (allFaculty.length === 0) {
                showToast('No faculty to export', 'error');
                return;
            }

            const headers = [
                'Faculty ID', 'First Name', 'Last Name', 'Email',
                'Department', 'Specialization', 'Created Date'
            ];

            let csvContent = headers.join(',') + '\n';

            allFaculty.forEach(faculty => {
                const row = [
                    `"${faculty.facultyId || ''}"`,
                    `"${faculty.firstName || ''}"`,
                    `"${faculty.lastName || ''}"`,
                    `"${faculty.email || ''}"`,
                    `"${faculty.department || ''}"`,
                    `"${faculty.specialization || ''}"`,
                    `"${new Date(faculty.createdAt).toLocaleDateString()}"`
                ];
                csvContent += row.join(',') + '\n';
            });

            downloadCSV(csvContent, `faculty_export_${new Date().getTime()}.csv`);
            showToast(`Exported ${allFaculty.length} faculty members`);
        }
        function downloadCSV(content, filename) {
            // Convert content to ASCII-only text
            const asciiContent = toAsciiText(content);

            // Add UTF-8 BOM for compatibility
            const BOM = '\uFEFF';
            const csvContent = BOM + asciiContent;

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }

        // Export all data in one ZIP file
        async function exportAllInOne() {
            showToast('Preparing bulk export...', 'info');

            try {
                // Get all data
                const students = await getAll('students');
                const faculty = await getAll('faculty');
                const classes = await getAll('classes');

                if (students.length === 0 && faculty.length === 0 && classes.length === 0) {
                    showToast('No data to export', 'error');
                    return;
                }

                // Create CSV for each type
                const timestamp = new Date().getTime();
                const files = [];

                // Students CSV
                if (students.length > 0) {
                    let studentCSV = 'Roll No,First Name,Last Name,Email,Department,Year,Semester,Created Date\n';
                    students.forEach(student => {
                        studentCSV += [
                            `"${student.rollNo || ''}"`,
                            `"${student.firstName || ''}"`,
                            `"${student.lastName || ''}"`,
                            `"${student.email || ''}"`,
                            `"${student.department || ''}"`,
                            student.year || '',
                            student.semester || '',
                            `"${new Date(student.createdAt).toLocaleDateString()}"`
                        ].join(',') + '\n';
                    });
                    files.push({ name: `students_${timestamp}.csv`, content: studentCSV });
                }

                // Faculty CSV
                if (faculty.length > 0) {
                    let facultyCSV = 'Faculty ID,First Name,Last Name,Email,Department,Specialization,Created Date\n';
                    faculty.forEach(fac => {
                        facultyCSV += [
                            `"${fac.facultyId || ''}"`,
                            `"${fac.firstName || ''}"`,
                            `"${fac.lastName || ''}"`,
                            `"${fac.email || ''}"`,
                            `"${fac.department || ''}"`,
                            `"${fac.specialization || ''}"`,
                            `"${new Date(fac.createdAt).toLocaleDateString()}"`
                        ].join(',') + '\n';
                    });
                    files.push({ name: `faculty_${timestamp}.csv`, content: facultyCSV });
                }

                // Classes CSV
                if (classes.length > 0) {
                    let classCSV = 'Class Code,Course Name,Department,Semester,Faculty,Year,Credits,Created Date\n';
                    classes.forEach(cls => {
                        classCSV += [
                            `"${cls.code || ''}"`,
                            `"${cls.name || ''}"`,
                            `"${cls.department || ''}"`,
                            cls.semester || '',
                            `"${cls.faculty || ''}"`,
                            cls.year || '',
                            cls.credits || '3',
                            `"${new Date(cls.createdAt).toLocaleDateString()}"`
                        ].join(',') + '\n';
                    });
                    files.push({ name: `classes_${timestamp}.csv`, content: classCSV });
                }

                // If only one file, download it directly
                if (files.length === 1) {
                    downloadCSV(files[0].content, files[0].name);
                    showToast(`Exported ${files[0].name}`, 'success');
                    return;
                }

                // For multiple files, create a zip using JSZip
                if (typeof JSZip === 'undefined') {
                    // If JSZip not available, download files separately
                    files.forEach(file => {
                        downloadCSV(file.content, file.name);
                    });
                    showToast(`Exported ${files.length} files separately`, 'success');
                } else {
                    // Create ZIP with JSZip
                    const zip = new JSZip();
                    files.forEach(file => {
                        zip.file(file.name, file.content);
                    });

                    zip.generateAsync({ type: "blob" }).then(content => {
                        const link = document.createElement("a");
                        const url = URL.createObjectURL(content);
                        link.setAttribute("href", url);
                        link.setAttribute("download", `attendance_system_export_${timestamp}.zip`);
                        link.style.visibility = 'hidden';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        showToast(`Exported ${files.length} files in ZIP`, 'success');
                    });
                }

            } catch (error) {
                console.error('Export error:', error);
                showToast('Error during export', 'error');
            }
        }

        // --- COMPLETE DATABASE EXPORT ---
        async function exportCompleteDatabase() {
            showToast('Preparing complete database export...', 'info');

            try {
                // Get all data from all stores
                const students = await getAll('students');
                const faculty = await getAll('faculty');
                const classes = await getAll('classes');
                const attendance = await getAll('attendance');
                const years = await getAll('years');
                const settings = await getAll('settings');

                // Create metadata
                const metadata = {
                    exportType: 'Complete Database Backup',
                    exportDate: new Date().toISOString(),
                    records: {
                        students: students.length,
                        faculty: faculty.length,
                        classes: classes.length,
                        attendance: attendance.length,
                        years: years.length,
                        settings: settings.length
                    },
                    systemInfo: {
                        dbName: DB_NAME,
                        dbVersion: DB_VERSION,
                        appName: 'Advanced Attendance System',
                        version: '1.0'
                    }
                };

                // Create structured data object
                const completeData = {
                    metadata: metadata,
                    data: {
                        students: students,
                        faculty: faculty,
                        classes: classes,
                        attendance: attendance,
                        years: years,
                        settings: settings
                    }
                };

                // Convert to JSON
                const jsonData = JSON.stringify(completeData, null, 2);

                // Check if JSZip is available
                if (typeof JSZip === 'undefined') {
                    // If JSZip not available, download as JSON
                    downloadFile(jsonData, `attendance_complete_backup_${new Date().getTime()}.json`, 'application/json');
                    showToast('Complete database exported as JSON!', 'success');
                } else {
                    // Create ZIP with multiple files for better organization
                    const zip = new JSZip();

                    // Add metadata file
                    zip.file("metadata.json", JSON.stringify(metadata, null, 2));

                    // Add data files organized by type
                    zip.file("students.json", JSON.stringify(students, null, 2));
                    zip.file("faculty.json", JSON.stringify(faculty, null, 2));
                    zip.file("classes.json", JSON.stringify(classes, null, 2));
                    zip.file("attendance.json", JSON.stringify(attendance, null, 2));
                    zip.file("years.json", JSON.stringify(years, null, 2));
                    zip.file("settings.json", JSON.stringify(settings, null, 2));

                    // Also create CSV versions for easy viewing
                    zip.file("students.csv", convertToCSV(students, 'students'));
                    zip.file("faculty.csv", convertToCSV(faculty, 'faculty'));
                    zip.file("classes.csv", convertToCSV(classes, 'classes'));
                    zip.file("attendance.csv", convertToCSV(attendance, 'attendance'));
                    zip.file("README.txt",
                        `COMPLETE DATABASE BACKUP
=========================
Exported: ${new Date().toLocaleString()}
Total Records: ${students.length} students, ${faculty.length} faculty, ${classes.length} classes, ${attendance.length} attendance records

Files included:
1. students.json - All student records
2. faculty.json - All faculty records
3. classes.json - All class records
4. attendance.json - All attendance records (date-wise)
5. years.json - Academic years
6. settings.json - System settings
7. *.csv - CSV versions for easy viewing

To import: Use the "Complete Database Import" feature in the Bulk Import tab.`);

                    // Generate ZIP
                    zip.generateAsync({ type: "blob" }).then(content => {
                        downloadFile(content, `attendance_complete_backup_${new Date().getTime()}.zip`, 'application/zip');
                        showToast(`Complete database exported with ${Object.values(metadata.records).reduce((a, b) => a + b, 0)} total records!`, 'success');
                    });
                }

            } catch (error) {
                console.error('Complete database export error:', error);
                showToast('Error during complete database export', 'error');
            }
        }

        // Helper function to convert data to CSV
        function convertToCSV(data, type) {
            if (!data || data.length === 0) return 'No data';

            const headers = Object.keys(data[0]);
            const rows = data.map(item =>
                headers.map(header => {
                    const value = item[header];
                    // Handle special cases for CSV formatting
                    if (typeof value === 'object' && value !== null) {
                        return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
                    }
                    return `"${String(value).replace(/"/g, '""')}"`;
                }).join(',')
            );

            return [headers.join(','), ...rows].join('\n');
        }

        // Helper function to download file
        function downloadFile(content, filename, mimeType) {
            const blob = new Blob([content], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            a.style.visibility = 'hidden';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }

        // --- COMPLETE DATABASE IMPORT ---
        async function handleCompleteDbUpload(event) {
            const file = event.target.files[0];
            if (!file) return;

            const progress = document.getElementById('completeDbProgress');
            const progressBar = document.getElementById('completeDbProgressBar');
            progress.style.display = 'block';
            progressBar.style.width = '10%';
            progressBar.textContent = '10%';

            try {
                let completeData;

                // Check file type
                if (file.name.toLowerCase().endsWith('.zip')) {
                    // Handle ZIP file
                    if (typeof JSZip === 'undefined') {
                        throw new Error('JSZip library not loaded. Cannot process ZIP files.');
                    }

                    progressBar.style.width = '20%';
                    progressBar.textContent = '20%';

                    const zip = new JSZip();
                    const zipContent = await zip.loadAsync(file);

                    progressBar.style.width = '40%';
                    progressBar.textContent = '40%';

                    // Check for metadata file first
                    let metadataFile = zipContent.file("metadata.json");
                    if (!metadataFile) {
                        // Try to find any JSON file
                        const jsonFiles = Object.keys(zipContent.files).filter(name => name.endsWith('.json'));
                        if (jsonFiles.length === 0) {
                            throw new Error('No JSON files found in ZIP');
                        }
                        metadataFile = zipContent.file(jsonFiles[0]);
                    }

                    const metadataText = await metadataFile.async('text');
                    const metadata = JSON.parse(metadataText);

                    progressBar.style.width = '60%';
                    progressBar.textContent = '60%';

                    // Import data based on metadata
                    if (metadata.exportType === 'Complete Database Backup') {
                        // This is a structured export
                        await importStructuredData(zipContent, progressBar);
                    } else {
                        // This might be individual files
                        await importIndividualFiles(zipContent, progressBar);
                    }

                } else if (file.name.toLowerCase().endsWith('.json')) {
                    // Handle JSON file
                    progressBar.style.width = '30%';
                    progressBar.textContent = '30%';

                    const text = await file.text();
                    completeData = JSON.parse(text);

                    progressBar.style.width = '60%';
                    progressBar.textContent = '60%';

                    // Check if this is our structured format
                    if (completeData.metadata && completeData.metadata.exportType === 'Complete Database Backup') {
                        await importFromStructuredJSON(completeData, progressBar);
                    } else {
                        // Assume this is an old-style backup
                        await importFromLegacyJSON(completeData, progressBar);
                    }
                } else {
                    throw new Error('Unsupported file format. Please use ZIP or JSON.');
                }

                progressBar.style.width = '100%';
                progressBar.textContent = '100%';

                // Show success message
                setTimeout(() => {
                    progress.style.display = 'none';
                    showToast('Complete database imported successfully! Refreshing data...', 'success');

                    // Refresh all data displays
                    loadStudents();
                    loadFaculty();
                    loadClasses();
                    loadYears();
                    updateDashboard();
                    updateExportStats();

                    // If admin is viewing attendance history, refresh it too
                    if (document.getElementById('adminAttendanceHistory').classList.contains('active')) {
                        loadAdminAttendanceHistory();
                    }

                }, 1000);

            } catch (error) {
                console.error('Complete database import error:', error);
                progress.style.display = 'none';
                showToast(`Import failed: ${error.message}`, 'error');
            }

            event.target.value = '';
        }

        // Helper function to import structured data from ZIP
        async function importStructuredData(zipContent, progressBar) {
            const stores = ['students', 'faculty', 'classes', 'attendance', 'years', 'settings'];

            for (let i = 0; i < stores.length; i++) {
                const store = stores[i];
                const file = zipContent.file(`${store}.json`);

                if (file) {
                    const text = await file.async('text');
                    const data = JSON.parse(text);

                    // Clear existing data
                    await clearStore(store);

                    // Import new data
                    for (const item of data) {
                        await addRecord(store, item);
                    }

                    // Update progress
                    const percent = 60 + Math.round((i + 1) / stores.length * 30);
                    progressBar.style.width = percent + '%';
                    progressBar.textContent = percent + '%';
                }
            }
        }

        // Helper function to import individual files from ZIP
        async function importIndividualFiles(zipContent, progressBar) {
            const fileMappings = {
                'students': ['students.json', 'students.csv'],
                'faculty': ['faculty.json', 'faculty.csv'],
                'classes': ['classes.json', 'classes.csv'],
                'attendance': ['attendance.json', 'attendance.csv'],
                'years': ['years.json'],
                'settings': ['settings.json']
            };

            let processed = 0;
            const total = Object.keys(fileMappings).length;

            for (const [store, possibleFiles] of Object.entries(fileMappings)) {
                let imported = false;

                for (const fileName of possibleFiles) {
                    const file = zipContent.file(fileName);
                    if (file) {
                        const text = await file.async('text');
                        let data;

                        if (fileName.endsWith('.json')) {
                            data = JSON.parse(text);
                        } else if (fileName.endsWith('.csv')) {
                            // Simple CSV parsing for backup files
                            data = parseCSVToObjects(text);
                        }

                        if (data && data.length > 0) {
                            // Clear existing data
                            await clearStore(store);

                            // Import new data
                            for (const item of data) {
                                await addRecord(store, item);
                            }

                            imported = true;
                            break;
                        }
                    }
                }

                processed++;
                const percent = 60 + Math.round(processed / total * 30);
                progressBar.style.width = percent + '%';
                progressBar.textContent = percent + '%';
            }
        }

        // Helper function to import from structured JSON
        async function importFromStructuredJSON(completeData, progressBar) {
            const stores = ['students', 'faculty', 'classes', 'attendance', 'years', 'settings'];

            for (let i = 0; i < stores.length; i++) {
                const store = stores[i];
                const data = completeData.data[store];

                if (data && Array.isArray(data)) {
                    // Clear existing data
                    await clearStore(store);

                    // Import new data
                    for (const item of data) {
                        await addRecord(store, item);
                    }
                }

                // Update progress
                const percent = 60 + Math.round((i + 1) / stores.length * 30);
                progressBar.style.width = percent + '%';
                progressBar.textContent = percent + '%';
            }
        }

        // Helper function to import from legacy JSON format
        async function importFromLegacyJSON(data, progressBar) {
            // Old format: direct object with store names as keys
            const stores = ['students', 'faculty', 'classes', 'attendance', 'years', 'settings'];

            for (let i = 0; i < stores.length; i++) {
                const store = stores[i];

                if (data[store] && Array.isArray(data[store])) {
                    // Clear existing data
                    await clearStore(store);

                    // Import new data
                    for (const item of data[store]) {
                        await addRecord(store, item);
                    }
                }

                // Update progress
                const percent = 60 + Math.round((i + 1) / stores.length * 30);
                progressBar.style.width = percent + '%';
                progressBar.textContent = percent + '%';
            }
        }

        // Simple CSV parser for backup files
        function parseCSVToObjects(csvText) {
            const lines = csvText.split('\n');
            if (lines.length < 2) return [];

            const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim());
            const result = [];

            for (let i = 1; i < lines.length; i++) {
                if (lines[i].trim() === '') continue;

                const values = [];
                let current = '';
                let inQuotes = false;

                for (let char of lines[i]) {
                    if (char === '"') {
                        inQuotes = !inQuotes;
                    } else if (char === ',' && !inQuotes) {
                        values.push(current);
                        current = '';
                    } else {
                        current += char;
                    }
                }
                values.push(current);

                const obj = {};
                headers.forEach((header, index) => {
                    if (index < values.length) {
                        let value = values[index].replace(/^"|"$/g, '').trim();

                        // Try to parse numbers and dates
                        if (!isNaN(value) && value !== '') {
                            value = Number(value);
                        } else if (value.match(/^\d{4}-\d{2}-\d{2}/)) {
                            // ISO date format
                            value = new Date(value).toISOString();
                        }

                        obj[header] = value;
                    }
                });

                result.push(obj);
            }

            return result;
        }

        function downloadCompleteDbTemplate() {
            const template = {
                metadata: {
                    exportType: "Complete Database Backup Template",
                    exportDate: new Date().toISOString(),
                    instructions: "Fill this template with your data and import using 'Complete Database Import'"
                },
                data: {
                    students: [
                        {
                            id: 1,
                            rollNo: "22156148040",
                            firstName: "John",
                            lastName: "Doe",
                            email: "john@college.edu",
                            department: "Computer Science",
                            year: 3,
                            semester: 5,
                            createdAt: new Date().toISOString()
                        }
                    ],
                    faculty: [
                        {
                            id: 1,
                            facultyId: "FAC001",
                            firstName: "Faculty",
                            lastName: "One",
                            email: "faculty1@college.edu",
                            department: "Computer Science",
                            specialization: "Data Structures",
                            password: "pass123",
                            createdAt: new Date().toISOString()
                        }
                    ],
                    classes: [
                        {
                            id: 1,
                            code: "CS101",
                            name: "Data Structures",
                            department: "Computer Science",
                            semester: 5,
                            faculty: "Faculty One",
                            year: 3,
                            credits: 3,
                            createdAt: new Date().toISOString()
                        }
                    ],
                    attendance: [
                        {
                            id: 1,
                            classId: 1,
                            studentId: 1,
                            date: "2024-01-15",
                            session: 1,
                            status: "present",
                            notes: "",
                            createdAt: new Date().toISOString()
                        }
                    ],
                    years: [
                        {
                            id: 1,
                            year: 2024,
                            startDate: "2024-06-01",
                            endDate: "2025-05-31",
                            type: "academic",
                            createdAt: new Date().toISOString()
                        }
                    ],
                    settings: [
                        {
                            id: 1,
                            key: "minAttendance",
                            value: "75",
                            createdAt: new Date().toISOString()
                        }
                    ]
                }
            };

            const json = JSON.stringify(template, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'complete_database_template.json';
            a.click();
            showToast('Complete database template downloaded!', 'info');
        }

        async function updateExportStats() {
            const students = await getAll('students');
            const faculty = await getAll('faculty');
            const classes = await getAll('classes');

            document.getElementById('exportStudentCount').textContent = students.length;
            document.getElementById('exportFacultyCount').textContent = faculty.length;
            document.getElementById('exportClassCount').textContent = classes.length;
        }

        // --- CLASS FILTERING LOGIC ---
        function filterClasses(year) {
            activeClassFilter.year = year;
            activeClassFilter.semester = null;
            const buttons = document.getElementById('classYearFilterGroup').children;
            for (let btn of buttons) {
                btn.classList.remove('active');
            }
            event.target.classList.add('active');
            const semContainer = document.getElementById('classSemesterFilterGroup');
            const semButtons = document.getElementById('classSemesterButtons');
            semButtons.innerHTML = '';
            if (year === 'all') {
                semContainer.style.display = 'none';
            } else {
                semContainer.style.display = 'block';
                const startSem = (year - 1) * 2 + 1;
                const endSem = startSem + 1;
                const allBtn = document.createElement('button');
                allBtn.className = 'filter-btn active';
                allBtn.textContent = 'All';
                allBtn.onclick = (e) => filterClassesBySemester(null, e);
                semButtons.appendChild(allBtn);
                for (let i = startSem; i <= endSem; i++) {
                    const btn = document.createElement('button');
                    btn.className = 'filter-btn';
                    btn.textContent = `Sem ${i}`;
                    btn.onclick = (e) => filterClassesBySemester(i, e);
                    semButtons.appendChild(btn);
                }
            }
            loadClasses();
        }

        function filterClassesBySemester(sem, event) {
            activeClassFilter.semester = sem;
            const buttons = document.getElementById('classSemesterButtons').children;
            for (let btn of buttons) {
                btn.classList.remove('active');
            }
            event.target.classList.add('active');
            loadClasses();
        }

        // --- FILTERING & SELECTION LOGIC (Student Panel) ---
        function filterStudents(year) {
            activeStudentFilter.year = year;
            activeStudentFilter.semester = null;
            selectedStudentIds.clear();
            document.getElementById('masterCheckbox').checked = false;
            const buttons = document.getElementById('yearFilterGroup').children;
            for (let btn of buttons) {
                btn.classList.remove('active');
            }
            event.target.classList.add('active');
            const semContainer = document.getElementById('semesterFilterGroup');
            const semButtons = document.getElementById('semesterButtons');
            semButtons.innerHTML = '';
            if (year === 'all') {
                semContainer.style.display = 'none';
            } else {
                semContainer.style.display = 'block';
                const startSem = (year - 1) * 2 + 1;
                const endSem = startSem + 1;
                const allBtn = document.createElement('button');
                allBtn.className = 'filter-btn active';
                allBtn.textContent = 'All';
                allBtn.onclick = (e) => filterBySemester(null, e);
                semButtons.appendChild(allBtn);
                for (let i = startSem; i <= endSem; i++) {
                    const btn = document.createElement('button');
                    btn.className = 'filter-btn';
                    btn.textContent = `Sem ${i}`;
                    btn.onclick = (e) => filterBySemester(i, e);
                    semButtons.appendChild(btn);
                }
            }
            loadStudents();
        }

        function filterBySemester(sem, event) {
            activeStudentFilter.semester = sem;
            selectedStudentIds.clear();
            document.getElementById('masterCheckbox').checked = false;
            const buttons = document.getElementById('semesterButtons').children;
            for (let btn of buttons) {
                btn.classList.remove('active');
            }
            event.target.classList.add('active');
            loadStudents();
        }

        function filterByBranch(branch) {
            activeStudentFilter.branch = branch;
            selectedStudentIds.clear();
            document.getElementById('masterCheckbox').checked = false;
            loadStudents();
        }

        function handleCheckboxChange(checkbox) {
            const studentId = parseInt(checkbox.value);
            if (checkbox.checked) {
                selectedStudentIds.add(studentId);
            } else {
                selectedStudentIds.delete(studentId);
                document.getElementById('masterCheckbox').checked = false;
            }
            updateSelectionUI();
        }

        function toggleSelectAll() {
            const masterCheckbox = document.getElementById('masterCheckbox');
            const isChecked = masterCheckbox.checked;
            const checkboxes = document.querySelectorAll('.student-checkbox');
            checkboxes.forEach(cb => {
                cb.checked = isChecked;
                const id = parseInt(cb.value);
                if (isChecked) {
                    selectedStudentIds.add(id);
                } else {
                    selectedStudentIds.delete(id);
                }
            });
            updateSelectionUI();
        }

        function selectAllListed() {
            displayedStudents.forEach(s => selectedStudentIds.add(s.id));
            document.querySelectorAll('.student-checkbox').forEach(cb => cb.checked = true);
            document.getElementById('masterCheckbox').checked = true;
            updateSelectionUI();
        }

        function updateSelectionUI() {
            const banner = document.getElementById('selectAllBanner');
            const count = selectedStudentIds.size;
            const targets = document.querySelectorAll('.action-target-text');
            targets.forEach(el => {
                if (count > 0) {
                    el.textContent = `Selected (${count})`;
                } else {
                    el.textContent = 'All Listed';
                }
            });
            if (count >= 4 && count < displayedStudents.length) {
                banner.style.display = 'flex';
                document.getElementById('selectAllText').textContent = `You have selected ${count} students.`;
                document.getElementById('selectAllCount').textContent = displayedStudents.length;
            } else {
                banner.style.display = 'none';
            }
        }

        function getTargetStudents() {
            if (selectedStudentIds.size > 0) {
                return displayedStudents.filter(s => selectedStudentIds.has(s.id));
            }
            return displayedStudents;
        }

        // --- CORE LOGIC ---
        function switchAdminTab(tabName) {
            document.querySelectorAll('#adminPanel .tab-content').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('#adminPanel .tab-btn').forEach(b => b.classList.remove('active'));
            const tabId = 'admin' + tabName.charAt(0).toUpperCase() + tabName.slice(1);
            document.getElementById(tabId).classList.add('active');
            event.target.classList.add('active');

            // If opening attendance history tab, show a message
            if (tabName === 'attendanceHistory') {
                // Clear the table and show a message
                document.getElementById('adminAttendanceBody').innerHTML = `
                    <tr>
                        <td colspan="10" style="text-align:center; padding: 40px; color: gray;">
                            ⚙️ Set your filters and click "Load Attendance" to view data
                        </td>
                    </tr>
                `;
                document.getElementById('adminRecordCount').textContent = `(0)`;
                document.getElementById('yearWiseAttendanceSummary').innerHTML = '<p style="color: #999;">Click "Load Attendance" to generate summary</p>';

                // Reset statistics
                document.getElementById('statTotalRecords').textContent = '0';
                document.getElementById('statAvgPercentage').textContent = '0%';
                document.getElementById('statAbove75').textContent = '0';
                document.getElementById('statBelow75').textContent = '0';
            }

            // Update export statistics when bulk export tab is opened
            if (tabName === 'bulkExport') {
                updateExportStats();
            }
        }

        function openBulkAttendanceModal() {
            const classSelect = document.getElementById('facultyClassSelect');
            if (!classSelect.value) {
                showToast('Please select a class first!', 'error');
                return;
            }
            document.getElementById('bulkAttendanceInput').value = '';
            openModal('bulkAttendanceModal');
        }

        async function saveBulkAttendance() {
            const classId = parseInt(document.getElementById('facultyClassSelect').value);
            if (!classId) return;

            const date = document.getElementById('attendanceDate').value;
            if (!date) {
                showToast('Please select a date first', 'error');
                return;
            }

            const session = parseInt(document.getElementById('bulkAttendanceSession').value);
            if (!session) {
                showToast('Please select a session', 'error');
                return;
            }

            const input = document.getElementById('bulkAttendanceInput').value;
            const lines = input.split(/\r\n|\n|\r/);

            const allStudents = await getAll('students');
            const allAttendance = await getAll('attendance');

            let successCount = 0;

            for (let line of lines) {
                if (!line.trim()) continue;
                const parts = line.split(',').map(s => s.trim());
                const rollNo = parts[0];
                const statusKey = parts.length > 1 ? parts[1].toUpperCase() : 'P';

                // Validate status - only P or A allowed
                let status = 'present';
                if (statusKey === 'A') status = 'absent';

                // Find student
                const student = allStudents.find(s => s.rollNo === rollNo);
                if (student) {
                    // Check existing for this specific session
                    const existingRecord = allAttendance.find(r =>
                        r.classId === classId &&
                        r.studentId === student.id &&
                        r.date === date &&
                        r.session === session
                    );

                    const record = {
                        classId: classId,
                        studentId: student.id,
                        date: date,
                        session: session,
                        status: status,
                        notes: `Session ${session}`,
                        createdAt: new Date().toISOString()
                    };

                    if (existingRecord) {
                        record.id = existingRecord.id;
                        await updateRecord('attendance', record);
                    } else {
                        await addRecord('attendance', record);
                    }

                    successCount++;

                    // Update UI if student card exists and same session
                    const currentSession = parseInt(document.getElementById('attendanceSession').value);
                    if (session === currentSession) {
                        const card = document.getElementById(`student-card-${student.id}`);
                        if (card) {
                            const checkbox = card.querySelector('.attendance-checkbox');
                            if (checkbox) {
                                checkbox.checked = (status === 'present');
                            }
                        }
                    }
                }
            }

            showToast(`Processed ${successCount} attendance records for Session ${session}`, 'success');
            closeModal('bulkAttendanceModal');
            generateYearlyReport();
        }

        async function submitAttendance() {
            const classSelect = document.getElementById('facultyClassSelect');
            const classId = parseInt(classSelect.value);
            const date = document.getElementById('attendanceDate').value;
            const session = parseInt(document.getElementById('attendanceSession').value);

            if (!classId || !date || !session) {
                showToast('Please select Class, Date, and Session', 'error');
                return;
            }

            const checkboxes = document.querySelectorAll('.attendance-checkbox');
            if (checkboxes.length === 0) {
                showToast('No students to mark', 'error');
                return;
            }

            // Pre-fetch existing records to avoid duplication
            const allAttendance = await getAll('attendance');
            const existingForSession = allAttendance.filter(r =>
                r.classId === classId &&
                r.date === date &&
                r.session === session
            );
            const existingMap = new Map(existingForSession.map(r => [r.studentId, r]));

            const promises = [];

            checkboxes.forEach(cb => {
                const studentId = parseInt(cb.value);
                const status = cb.checked ? 'present' : 'absent';

                const record = {
                    classId: classId,
                    studentId: studentId,
                    date: date,
                    session: session,
                    status: status,
                    notes: `Session ${session}`,
                    createdAt: new Date().toISOString()
                };

                const existing = existingMap.get(studentId);
                if (existing) {
                    record.id = existing.id;
                    promises.push(updateRecord('attendance', record));
                } else {
                    promises.push(addRecord('attendance', record));
                }
            });

            try {
                await Promise.all(promises);
                showToast(`Attendance saved for ${checkboxes.length} students in Session ${session}!`);
                generateYearlyReport();

                // Clear checkboxes after successful submission
                checkboxes.forEach(cb => cb.checked = false);

            } catch (e) {
                console.error(e);
                showToast('Error saving attendance', 'error');
            }
        }

        function openBatchClassModal() {
            document.getElementById('batchClassModal').classList.add('show');
            document.getElementById('batchPreviewArea').style.display = 'none';
            document.getElementById('batchPreviewTable').querySelector('tbody').innerHTML = '';
            document.getElementById('batchClassInput').value = '';
        }

        // Batch Class Logic
        let parsedBatchClasses = [];

        function previewBatchClasses() {
            const input = document.getElementById('batchClassInput').value;
            const branch = document.getElementById('batchBranch').value;
            const year = document.getElementById('batchYear').value;

            const lines = input.split(/\r\n|\n|\r/);
            const tbody = document.getElementById('batchPreviewTable').querySelector('tbody');
            tbody.innerHTML = '';
            parsedBatchClasses = [];

            lines.forEach(line => {
                if (!line.trim()) return;
                const parts = line.split(',').map(p => p.trim());
                if (parts.length >= 4) {
                    const cls = {
                        semester: parseInt(parts[0]),
                        name: parts[1],
                        code: parts[2],
                        faculty: parts[3],
                        department: branch,
                        year: parseInt(year),
                        credits: 3,
                        createdAt: new Date().toISOString()
                    };
                    parsedBatchClasses.push(cls);
                    const tr = document.createElement('tr');
                    tr.innerHTML = `<td>${cls.semester}</td><td>${cls.name}</td><td>${cls.code}</td><td>${cls.faculty}</td>`;
                    tbody.appendChild(tr);
                }
            });

            if (parsedBatchClasses.length > 0) {
                document.getElementById('batchPreviewArea').style.display = 'block';
            } else {
                showToast('No valid lines found. Format: Sem, Name, Code, Faculty', 'error');
            }
        }

        async function saveBatchClasses() {
            try {
                const allFaculty = await getAll('faculty');
                const existingFacultyNames = new Set(allFaculty.map(f => `${f.firstName} ${f.lastName}`.toLowerCase().trim()));
                const newFacultyMap = new Map();

                parsedBatchClasses.forEach(cls => {
                    const facName = cls.faculty.trim();
                    if (!facName) return;
                    const facNameLower = facName.toLowerCase();

                    if (!existingFacultyNames.has(facNameLower) && !newFacultyMap.has(facNameLower)) {
                        const nameParts = facName.split(' ');
                        let firstName = nameParts[0];
                        let lastName = nameParts.slice(1).join(' ');
                        if (!lastName) lastName = '.';

                        let deducedDept = '';
                        const subj = cls.name.toLowerCase();
                        const code = cls.code.toLowerCase();

                        if (subj.includes('security') || subj.includes('cyber')) deducedDept = 'CSE(Cyber Security)';
                        else if (subj.includes('network')) deducedDept = 'CSE(Networks)';
                        else if (subj.includes('computer') || subj.includes('data') || subj.includes('programming') || subj.includes('algorithm') || code.startsWith('cs')) deducedDept = 'Computer Science';
                        else if (subj.includes('civil') || subj.includes('structure') || subj.includes('concrete') || code.startsWith('ce')) deducedDept = 'Civil';
                        else if (subj.includes('mech') || subj.includes('thermo') || subj.includes('fluid') || code.startsWith('me')) deducedDept = 'Mechanical';
                        else if (subj.includes('electric') || subj.includes('power') || code.startsWith('ee')) deducedDept = 'Electrical';
                        else if (subj.includes('electronic') || subj.includes('signal') || subj.includes('digital') || code.startsWith('ec')) deducedDept = 'ECE';
                        else if (subj.includes('physics') || subj.includes('chemistry') || subj.includes('math') || subj.includes('english')) deducedDept = 'Applied Science';
                        else deducedDept = cls.department;

                        const newFaculty = {
                            facultyId: '',
                            firstName: firstName,
                            lastName: lastName,
                            email: 'N/A',
                            department: deducedDept,
                            specialization: cls.name,
                            password: 'pass123',
                            createdAt: new Date().toISOString()
                        };
                        newFacultyMap.set(facNameLower, newFaculty);
                    }
                });

                if (newFacultyMap.size > 0) {
                    const facultyPromises = Array.from(newFacultyMap.values()).map(f => addRecord('faculty', f));
                    await Promise.all(facultyPromises);
                    showToast(`Created ${newFacultyMap.size} new faculty profiles (Default Password: pass123)`, 'info');
                    await loadFaculty();
                }

                const classPromises = parsedBatchClasses.map(cls => addRecord('classes', cls));
                await Promise.all(classPromises);

                showToast(`Successfully created ${parsedBatchClasses.length} classes!`);
                closeModal('batchClassModal');
                loadClasses();
            } catch (e) {
                console.error(e);
                showToast('Error saving classes', 'error');
            }
        }

        // Add Student
        async function addStudent(event) {
            event.preventDefault();
            const student = {
                rollNo: document.getElementById('studentRollNo').value,
                firstName: document.getElementById('studentFirstName').value,
                lastName: document.getElementById('studentLastName').value,
                email: document.getElementById('studentEmail').value,
                department: document.getElementById('studentDept').value,
                year: parseInt(document.getElementById('studentYear').value),
                semester: parseInt(document.getElementById('studentSemester').value),
                createdAt: new Date().toISOString()
            };
            await addRecord('students', student);
            showToast('Student added successfully!');
            event.target.reset();
            closeModal('addUserModal');
            loadStudents();
        }

        function autoFillStudentDetails() {
            const regNo = document.getElementById('studentRollNo').value;
            if (regNo.length < 5) return;
            const yearCode = regNo.substring(0, 2);
            const branchCode = regNo.substring(2, 5);
            let isLateral = false;
            if (regNo.length >= 11) {
                const serial = parseInt(regNo.substring(8, 11));
                if (serial >= 901) isLateral = true;
            }
            let batchYear = 2000 + parseInt(yearCode);
            if (isLateral) batchYear += 1;
            const department = branchMap[branchCode];
            if (department) document.getElementById('studentDept').value = department;
            if (!isNaN(batchYear)) document.getElementById('studentYear').value = batchYear;
        }

        // Load Students
        async function loadStudents() {
            const allStudents = await getAll('students');
            const tbody = document.getElementById('usersTableBody');
            const bulkContainer = document.getElementById('bulkActionContainer');
            const countLabel = document.getElementById('studentCount');
            tbody.innerHTML = '';
            displayedStudents = allStudents.filter(student => {
                if (activeStudentFilter.year !== 'all') {
                    const sem = student.semester;
                    const expectedMinSem = (activeStudentFilter.year - 1) * 2 + 1;
                    const expectedMaxSem = expectedMinSem + 1;
                    if (sem < expectedMinSem || sem > expectedMaxSem) return false;
                }
                if (activeStudentFilter.semester !== null) {
                    if (student.semester !== activeStudentFilter.semester) return false;
                }
                if (activeStudentFilter.branch !== 'all') {
                    if (student.department !== activeStudentFilter.branch) return false;
                }
                return true;
            });
            displayedStudents.forEach(student => {
                const isSelected = selectedStudentIds.has(student.id);
                const tr = document.createElement('tr');
                tr.innerHTML = `<td><input type="checkbox" class="student-checkbox" value="${student.id}" onchange="handleCheckboxChange(this)" ${isSelected ? 'checked' : ''}></td><td>${student.rollNo || ''}</td><td>${student.firstName || ''} ${student.lastName || ''}</td><td>${student.department || ''}</td><td>${student.year || ''}</td><td><span class="status-badge" style="background:#eaf6fd; color:#2c5282;">Sem ${student.semester || ''}</span></td><td><button class="btn btn-small btn-danger" onclick="deleteStudent(${student.id})">Delete</button></td>`;
                tbody.appendChild(tr);
            });
            countLabel.textContent = `(${displayedStudents.length})`;
            if (activeStudentFilter.year !== 'all' && displayedStudents.length > 0) {
                bulkContainer.style.display = 'flex';
            } else {
                bulkContainer.style.display = 'none';
            }
            updateSelectionUI();
            updateDashboard();
        }

        // Delete Student
        async function deleteStudent(id) {
            showConfirm('Delete this student record permanently?', async function () {
                await deleteRecord('students', id);
                selectedStudentIds.delete(id);
                showToast('Student deleted successfully', 'info');
                loadStudents();
            });
        }

        function promoteFilteredStudents() {
            const targets = getTargetStudents();
            if (targets.length === 0) { showToast("No students to promote!", "error"); return; }
            const type = selectedStudentIds.size > 0 ? "SELECTED" : "LISTED";
            showConfirm(`Are you sure you want to promote these ${targets.length} ${type} students?`, async function () {
                let updatedCount = 0;
                for (const student of targets) {
                    const newSem = student.semester + 1;
                    student.semester = newSem > 8 ? 9 : newSem;
                    student.year = Math.ceil(student.semester / 2);
                    await updateRecord('students', student);
                    updatedCount++;
                }
                showToast(`Promoted ${updatedCount} students!`);
                selectedStudentIds.clear();
                loadStudents();
            });
        }

        function setBulkSemester() {
            const targets = getTargetStudents();
            if (targets.length === 0) { showToast("No students to update!", "error"); return; }
            const targetSem = parseInt(document.getElementById('bulkSemSelect').value);
            showConfirm(`Move ${targets.length} students to Semester ${targetSem}?`, async function () {
                let updatedCount = 0;
                for (const student of targets) {
                    student.semester = targetSem;
                    student.year = Math.ceil(targetSem / 2);
                    await updateRecord('students', student);
                    updatedCount++;
                }
                showToast(`Updated ${updatedCount} students!`);
                selectedStudentIds.clear();
                loadStudents();
            });
        }

        function deleteFilteredStudents() {
            const targets = getTargetStudents();
            if (targets.length === 0) { showToast("No students to delete!", "error"); return; }
            showConfirm(`⚠️ DANGER: Permanently delete ${targets.length} students?`, async function () {
                const deletePromises = targets.map(student => deleteRecord('students', student.id));
                await Promise.all(deletePromises);
                showToast(`Deleted ${targets.length} students!`, 'success');
                selectedStudentIds.clear();
                loadStudents();
            });
        }

        async function clearAllStudents() {
            showConfirm("⚠️ EXTREME DANGER: Delete ALL students permanently?", async function () {
                await clearStore('students');
                showToast("All students deleted", "success");
                loadStudents();
            });
        }

        // Add Faculty
        async function addFaculty(event) {
            event.preventDefault();
            const faculty = {
                facultyId: document.getElementById('facultyId').value,
                password: document.getElementById('facultyPassword').value,
                firstName: document.getElementById('facultyFirstName').value,
                lastName: document.getElementById('facultyLastName').value,
                email: document.getElementById('facultyEmail').value || 'N/A',
                department: document.getElementById('facultyDept').value,
                specialization: document.getElementById('facultySpecial').value || 'N/A',
                createdAt: new Date().toISOString()
            };
            await addRecord('faculty', faculty);
            showToast('Faculty added successfully!');
            event.target.reset();
            closeModal('addFacultyModal');
            loadFaculty();
        }

        // EDIT FACULTY SYSTEM
        async function openEditFacultyModal(id) {
            const faculty = await getRecord('faculty', id);
            if (!faculty) return;
            document.getElementById('editFacultyIdKey').value = faculty.id;
            document.getElementById('editFacultyId').value = faculty.facultyId;
            document.getElementById('editFacultyFirstName').value = faculty.firstName;
            document.getElementById('editFacultyLastName').value = faculty.lastName;
            document.getElementById('editFacultyEmail').value = faculty.email;
            document.getElementById('editFacultyDept').value = faculty.department;
            document.getElementById('editFacultySpecial').value = faculty.specialization || '';
            document.getElementById('editFacultyPassword').value = '';

            const classes = await getAll('classes');
            const deptClasses = classes.filter(c => c.department === faculty.department);
            const container = document.getElementById('editFacultyClassesList');
            container.innerHTML = '';
            const facultyFullName = `${faculty.firstName} ${faculty.lastName}`;

            if (deptClasses.length === 0) {
                container.innerHTML = '<p style="color:#999;">No classes found for this department.</p>';
            } else {
                deptClasses.forEach(cls => {
                    const isAssigned = cls.faculty === facultyFullName;
                    const div = document.createElement('div');
                    div.className = 'class-assign-item';
                    div.innerHTML = `<input type="checkbox" name="assignedClasses" value="${cls.id}" ${isAssigned ? 'checked' : ''}><span><strong>${cls.code}</strong><br>${cls.name} (Sem ${cls.semester})</span>`;
                    container.appendChild(div);
                });
            }
            openModal('editFacultyModal');
        }

        async function updateFaculty(event) {
            event.preventDefault();
            const idKey = parseInt(document.getElementById('editFacultyIdKey').value);
            const oldFaculty = await getRecord('faculty', idKey);
            const oldName = `${oldFaculty.firstName} ${oldFaculty.lastName}`;
            const newFirstName = document.getElementById('editFacultyFirstName').value;
            const newLastName = document.getElementById('editFacultyLastName').value;
            const newFullName = `${newFirstName} ${newLastName}`;

            const updatedData = {
                id: idKey,
                facultyId: document.getElementById('editFacultyId').value,
                firstName: newFirstName,
                lastName: newLastName,
                email: document.getElementById('editFacultyEmail').value,
                department: document.getElementById('editFacultyDept').value,
                specialization: document.getElementById('editFacultySpecial').value,
                password: document.getElementById('editFacultyPassword').value || oldFaculty.password,
                createdAt: oldFaculty.createdAt
            };
            await updateRecord('faculty', updatedData);

            const checkboxes = document.querySelectorAll('input[name="assignedClasses"]');
            for (let cb of checkboxes) {
                const clsId = parseInt(cb.value);
                const clsRecord = await getRecord('classes', clsId);
                if (cb.checked) {
                    clsRecord.faculty = newFullName;
                    await updateRecord('classes', clsRecord);
                } else if (!cb.checked && clsRecord.faculty === oldName) {
                    clsRecord.faculty = "";
                    await updateRecord('classes', clsRecord);
                }
            }

            if (oldName !== newFullName) {
                const allClasses = await getAll('classes');
                for (let cls of allClasses) {
                    if (cls.faculty === oldName) {
                        cls.faculty = newFullName;
                        await updateRecord('classes', cls);
                    }
                }
            }
            showToast('Faculty updated successfully!');
            closeModal('editFacultyModal');
            document.getElementById('facultyProfileModal').classList.remove('show');
            loadFaculty();
        }

        async function viewFacultyProfile(id) {
            const faculty = await getRecord('faculty', id);
            const classes = await getAll('classes');
            if (!faculty) return;
            const fullName = `${faculty.firstName} ${faculty.lastName}`;
            const myClasses = classes.filter(c => c.faculty === fullName);
            const container = document.getElementById('facultyProfileContent');
            let classRows = '';
            if (myClasses.length === 0) {
                classRows = '<tr><td colspan="4" style="text-align:center; color:gray;">No classes assigned.</td></tr>';
            } else {
                myClasses.forEach(cls => {
                    classRows += `<tr><td><strong>${cls.code}</strong></td><td>${cls.name}</td><td>${cls.semester}</td><td>${cls.year}</td></tr>`;
                });
            }
            container.innerHTML = `<div class="profile-section"><h2 style="color:var(--color-primary); margin-bottom:5px;">${fullName}</h2><span class="status-badge" style="background:#eaf6fd; color:#2c5282; font-size:14px;">${faculty.facultyId}</span></div><div class="profile-info-grid"><div class="profile-info-item"><label>Department</label><div>${faculty.department}</div></div><div class="profile-info-item"><label>Email</label><div>${faculty.email || 'N/A'}</div></div><div class="profile-info-item"><label>Specialization</label><div>${faculty.specialization || 'N/A'}</div></div><div class="profile-info-item"><label>Joined Date</label><div>${new Date(faculty.createdAt).toLocaleDateString()}</div></div></div><h3 style="margin-bottom:15px; font-size:18px; border-bottom:2px solid var(--color-light); padding-bottom:10px;">📚 Assigned Classes Workload</h3><table><thead><tr><th>Code</th><th>Subject Name</th><th>Sem</th><th>Year</th></tr></thead><tbody>${classRows}</tbody></table>`;
            const btn = document.getElementById('btnEditFacultyClasses');
            btn.onclick = function () { openEditFacultyModal(id); };
            document.getElementById('facultyProfileModal').classList.add('show');
        }

        async function loadFaculty() {
            const allFaculty = await getAll('faculty');
            const classes = await getAll('classes');
            const tbody = document.getElementById('facultyTableBody');
            const filterBranch = document.getElementById('facultyBranchFilter').value;
            tbody.innerHTML = '';
            const filteredFaculty = allFaculty.filter(f => filterBranch === 'all' ? true : f.department === filterBranch);
            filteredFaculty.forEach(fac => {
                const fullName = `${fac.firstName} ${fac.lastName}`;
                const myClasses = classes.filter(c => c.faculty === fullName);
                const classBadges = myClasses.map(c => `<span class="assigned-classes-badge">${c.code} (${c.semester})</span>`).join('');
                const tr = document.createElement('tr');
                tr.innerHTML = `<td>${fac.facultyId}</td><td><a href="#" onclick="viewFacultyProfile(${fac.id})" style="color:var(--color-primary); font-weight:bold; text-decoration:none;">${fullName}</a></td><td>${classBadges || '<span style="color:#999; font-size:11px;">None</span>'}</td><td>${fac.department}</td><td>${fac.specialization}</td><td><button class="btn btn-small btn-info" onclick="openEditFacultyModal(${fac.id})">Edit</button><button class="btn btn-small btn-danger" onclick="deleteFaculty(${fac.id})">Delete</button></td>`;
                tbody.appendChild(tr);
            });
            const select = document.getElementById('classFaculty');
            select.innerHTML = '<option value="">-- Select Faculty --</option>';
            allFaculty.forEach(fac => {
                const name = `${fac.firstName} ${fac.lastName}`;
                const opt = document.createElement('option');
                opt.value = name;
                opt.textContent = name;
                select.appendChild(opt);
            });
            updateDashboard();
        }

        async function deleteFaculty(id) {
            showConfirm('Delete this faculty member?', async function () {
                await deleteRecord('faculty', id);
                showToast('Faculty deleted successfully', 'info');
                loadFaculty();
            });
        }

        async function addClass(event) {
            event.preventDefault();
            const classData = {
                code: document.getElementById('classCode').value,
                name: document.getElementById('courseName').value,
                department: document.getElementById('classDept').value,
                semester: parseInt(document.getElementById('classSemester').value),
                faculty: document.getElementById('classFaculty').value,
                year: parseInt(document.getElementById('classYear').value),
                credits: parseInt(document.getElementById('classCredits').value),
                createdAt: new Date().toISOString()
            };
            await addRecord('classes', classData);
            showToast('Class added successfully!');
            event.target.reset();
            closeModal('addClassModal');
            loadClasses();
        }

        async function updateClass(event) {
            event.preventDefault();
            const id = parseInt(document.getElementById('editClassIdKey').value);
            const updatedData = {
                id: id,
                code: document.getElementById('editClassCode').value,
                name: document.getElementById('editCourseName').value,
                department: document.getElementById('editClassDept').value,
                semester: parseInt(document.getElementById('editClassSemester').value),
                faculty: document.getElementById('editClassFaculty').value,
                year: parseInt(document.getElementById('editClassYear').value),
                credits: parseInt(document.getElementById('editClassCredits').value),
                createdAt: new Date().toISOString()
            };
            const oldRecord = await getRecord('classes', id);
            if (oldRecord) updatedData.createdAt = oldRecord.createdAt;
            await updateRecord('classes', updatedData);
            showToast('Class updated successfully!');
            closeModal('editClassModal');
            loadClasses();
        }

        async function openEditClassModal(id) {
            const cls = await getRecord('classes', id);
            if (!cls) return;
            document.getElementById('editClassIdKey').value = cls.id;
            document.getElementById('editClassCode').value = cls.code;
            document.getElementById('editCourseName').value = cls.name;
            document.getElementById('editClassDept').value = cls.department;
            document.getElementById('editClassSemester').value = cls.semester;
            document.getElementById('editClassYear').value = cls.year;
            document.getElementById('editClassCredits').value = cls.credits;
            const allFaculty = await getAll('faculty');
            const select = document.getElementById('editClassFaculty');
            select.innerHTML = '<option value="">-- Select Faculty --</option>';
            allFaculty.forEach(fac => {
                const name = `${fac.firstName} ${fac.lastName}`;
                const opt = document.createElement('option');
                opt.value = name;
                opt.textContent = name;
                if (name === cls.faculty) opt.selected = true;
                select.appendChild(opt);
            });
            openModal('editClassModal');
        }

        async function loadClasses() {
            const allClasses = await getAll('classes');
            const tbody = document.getElementById('classesTableBody');
            const select = document.getElementById('facultyClassSelect');
            tbody.innerHTML = '';
            const displayedClasses = allClasses.filter(cls => {
                if (activeClassFilter.year !== 'all') {
                    const expectedMinSem = (activeClassFilter.year - 1) * 2 + 1;
                    const expectedMaxSem = expectedMinSem + 1;
                    if (cls.semester < expectedMinSem || cls.semester > expectedMaxSem) return false;
                }
                if (activeClassFilter.semester !== null) {
                    if (cls.semester !== activeClassFilter.semester) return false;
                }
                return true;
            });
            displayedClasses.forEach(cls => {
                const tr = document.createElement('tr');
                tr.innerHTML = `<td>${cls.code}</td><td>${cls.name}</td><td>${cls.department}</td><td>${cls.semester}</td><td>${cls.faculty}</td><td>${cls.year}</td><td>${cls.credits}</td><td><button class="btn btn-small btn-info" onclick="openEditClassModal(${cls.id})">Edit</button><button class="btn btn-small btn-danger" onclick="deleteClass(${cls.id})">Delete</button></td>`;
                tbody.appendChild(tr);
            });
            updateDashboard();
        }

        async function loadClassStudents(dateOverride) {
            const classSelect = document.getElementById('facultyClassSelect');
            const classId = parseInt(classSelect.value);
            const date = dateOverride || document.getElementById('attendanceDate').value;
            const session = parseInt(document.getElementById('attendanceSession').value);

            if (dateOverride) document.getElementById('attendanceDate').value = dateOverride;

            if (!classId || !date) {
                document.getElementById('studentGrid').innerHTML = '';
                document.getElementById('studentGridContainer').style.display = 'none';
                return;
            }

            const classes = await getAll('classes');
            const selectedClass = classes.find(c => c.id === classId);
            if (!selectedClass) return;

            const allStudents = await getAll('students');
            const classStudents = allStudents.filter(s =>
                s.semester === selectedClass.semester &&
                s.department === selectedClass.department
            );

            const allAttendance = await getAll('attendance');
            const existingAttendance = allAttendance.filter(r =>
                r.classId === classId &&
                r.date === date &&
                r.session === session
            );

            const attendanceMap = new Map(existingAttendance.map(r => [r.studentId, r.status]));

            const grid = document.getElementById('studentGrid');
            grid.innerHTML = '';

            if (classStudents.length === 0) {
                grid.innerHTML = '<p style="text-align:center; width:100%;">No students found for this class criteria.</p>';
            }

            classStudents.forEach(student => {
                const status = attendanceMap.get(student.id) || 'absent';
                renderStudentCard(student, status === 'present');
            });

            document.getElementById('studentGridContainer').style.display = 'block';
            document.getElementById('currentSessionDisplay').textContent = session;
        }

        function renderStudentCard(student, isChecked = false) {
            const grid = document.getElementById('studentGrid');
            if (document.getElementById(`student-card-${student.id}`)) {
                const checkbox = document.querySelector(`#student-card-${student.id} .attendance-checkbox`);
                if (checkbox) checkbox.checked = isChecked;
                return;
            }
            const div = document.createElement('div');
            div.id = `student-card-${student.id}`;
            div.className = 'student-attendance-card';
            div.style.padding = '15px';
            div.style.background = 'white';
            div.style.border = '1px solid #ddd';
            div.style.borderRadius = '8px';
            div.style.display = 'flex';
            div.style.justifyContent = 'space-between';
            div.style.alignItems = 'center';

            div.innerHTML = `<div style="text-align:left;"><div style="font-weight:bold; color:var(--color-dark);">${student.firstName} ${student.lastName}</div><div style="font-size:12px; color:var(--color-gray);">${student.rollNo}</div></div><label class="attendance-toggle"><input type="checkbox" class="attendance-checkbox" value="${student.id}" ${isChecked ? 'checked' : ''}><span class="toggle-label">Present</span></label>`;
            grid.appendChild(div);
        }

        async function addStudentToSession() {
            const input = document.getElementById('addStudentToSessionInput');
            const rollNo = input.value.trim();
            if (!rollNo) { showToast('Please enter a Roll No', 'error'); return; }
            const allStudents = await getAll('students');
            const student = allStudents.find(s => s.rollNo === rollNo);
            if (student) {
                renderStudentCard(student, true);
                showToast(`Added ${student.firstName} to list`, 'success');
                input.value = '';
            } else {
                showToast('Student not found with this Roll No', 'error');
            }
        }

        async function addBatchToSession() {
            const branch = document.getElementById('addBatchBranch').value;
            const sem = parseInt(document.getElementById('addBatchSem').value);
            if (!branch || !sem) { showToast('Please select Branch and Semester', 'error'); return; }
            const allStudents = await getAll('students');
            const targetStudents = allStudents.filter(s => s.department === branch && s.semester === sem);
            if (targetStudents.length === 0) { showToast('No students found for this criteria', 'error'); return; }
            let addedCount = 0;
            targetStudents.forEach(student => {
                if (!document.getElementById(`student-card-${student.id}`)) {
                    renderStudentCard(student);
                    addedCount++;
                }
            });
            if (addedCount > 0) {
                showToast(`Added ${addedCount} students from ${branch} - Sem ${sem}`, 'success');
                document.getElementById('studentGridContainer').style.display = 'block';
            } else {
                showToast('All students from this batch are already in the list', 'info');
            }
        }

        function deleteClass(id) {
            showConfirm('Delete this class?', async function () {
                await deleteRecord('classes', id);
                showToast('Class deleted successfully', 'info');
                loadClasses();
                loadFaculty();
            });
        }

        async function addAcademicYear(event) {
            event.preventDefault();
            const year = {
                year: parseInt(document.getElementById('academicYear').value),
                startDate: document.getElementById('yearStartDate').value,
                endDate: document.getElementById('yearEndDate').value,
                createdAt: new Date().toISOString()
            };
            await addRecord('years', year);
            showToast('Academic year added successfully!');
            event.target.reset();
            closeModal('addYearModal');
            loadYears();
        }

        async function loadYears() {
            const years = await getAll('years');
            const container = document.getElementById('yearsContainer');
            container.innerHTML = '';
            if (years.length === 0) {
                container.innerHTML = '<p style="color: var(--color-gray);">No academic years configured yet.</p>';
                return;
            }
            years.forEach(year => {
                const div = document.createElement('div');
                div.className = 'summary-box';
                div.innerHTML = `<strong>Year ${year.year}:</strong> ${year.startDate} to ${year.endDate}<button class="btn btn-small btn-danger" style="float: right;" onclick="deleteYear(${year.id})">Delete</button>`;
                container.appendChild(div);
            });
            updateDashboard();
        }

        async function deleteYear(id) {
            showConfirm('Delete this academic year?', async function () {
                await deleteRecord('years', id);
                showToast('Academic year deleted', 'info');
                loadYears();
            });
        }

        async function addCustomSemester() {
            const year = document.getElementById('customYearInput').value;
            const semester = document.getElementById('customSemesterInput').value;
            if (!year || !semester) {
                showToast('Please fill all fields', 'error');
                return;
            }
            const record = {
                year: parseInt(year),
                semester: parseInt(semester),
                type: 'custom',
                createdAt: new Date().toISOString()
            };
            await addRecord('years', record);
            showToast('Semester added successfully!');
            document.getElementById('customYearInput').value = '';
            document.getElementById('customSemesterInput').value = '';
            loadYears();
        }

        // UPDATED: Download templates that match export format
        function downloadTemplate(type) {
            const templates = {
                students: `Roll No,First Name,Last Name,Email,Department,Year,Semester,Created Date\n22156148040,John,Doe,john@college.edu,Computer Science,3,5,2023-09-01\n22101148001,Alice,Smith,alice@college.edu,Computer Science,3,5,2023-09-01`,
                faculty: `Faculty ID,First Name,Last Name,Email,Department,Specialization,Created Date\nFAC001,Faculty,One,faculty1@college.edu,Computer Science,Data Structures,2023-09-01\nFAC002,Faculty,Two,faculty2@college.edu,Computer Science,Networks,2023-09-01`,
                classes: `Class Code,Course Name,Department,Semester,Faculty,Year,Credits,Created Date\nCS101,Data Structures,Computer Science,5,Faculty One,3,3,2023-09-01\nCS102,Programming,Computer Science,5,Faculty One,3,3,2023-09-01`
            };
            const csv = templates[type];
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${type}_import_template.csv`;
            a.click();
            showToast(`Downloaded ${type} import template`, 'info');
        }

        // UPDATED: Student import to match export format
        async function handleStudentUpload(event) {
            const file = event.target.files[0];
            if (!file) return;

            let text = await file.text();
            text = text.replace(/^\uFEFF/, ''); // Remove BOM

            const sections = text.split('--- Year ');
            const progress = document.getElementById('studentProgress');
            const progressBar = document.getElementById('studentProgressBar');
            progress.style.display = 'block';

            let imported = 0;
            let skipped = 0;
            let totalProcessed = 0;

            for (let section of sections) {
                if (!section.trim()) continue;

                const lines = section.split(/\r\n|\n|\r/);
                if (lines.length < 2) continue;

                // Skip the first line (Year header)
                let startIndex = 1;
                if (lines[0].includes('Students')) {
                    startIndex = 2; // Skip the header line too
                }

                for (let i = startIndex; i < lines.length; i++) {
                    if (lines[i].trim() === '' || lines[i].includes('--- Year')) continue;

                    totalProcessed++;

                    // Parse CSV line properly handling quotes
                    const values = [];
                    let inQuotes = false;
                    let currentValue = '';

                    for (let char of lines[i]) {
                        if (char === '"') {
                            inQuotes = !inQuotes;
                        } else if (char === ',' && !inQuotes) {
                            values.push(currentValue);
                            currentValue = '';
                        } else {
                            currentValue += char;
                        }
                    }
                    values.push(currentValue);

                    // Trim all values
                    const cleanedValues = values.map(v => v.trim());

                    // Expected columns: Roll No, First Name, Last Name, Email, Department, Year, Semester, Created Date
                    if (cleanedValues.length < 8) {
                        console.log('Skipping - insufficient columns:', cleanedValues);
                        skipped++;
                        continue;
                    }

                    try {
                        // Parse the data
                        const rollNo = cleanedValues[0];
                        const firstName = cleanedValues[1];
                        const lastName = cleanedValues[2];
                        const email = cleanedValues[3] || 'N/A';
                        const department = cleanedValues[4];
                        const year = parseInt(cleanedValues[5]) || 1;
                        const semester = parseInt(cleanedValues[6]) || 1;

                        // Parse the date - handle different formats
                        let createdDate = new Date().toISOString();
                        const dateStr = cleanedValues[7];
                        if (dateStr) {
                            // Try parsing "MM/DD/YYYY" format
                            const dateParts = dateStr.split('/');
                            if (dateParts.length === 3) {
                                const month = parseInt(dateParts[0]) - 1; // JS months are 0-indexed
                                const day = parseInt(dateParts[1]);
                                const year = parseInt(dateParts[2]);
                                const dateObj = new Date(year, month, day);
                                if (!isNaN(dateObj.getTime())) {
                                    createdDate = dateObj.toISOString();
                                }
                            }
                        }

                        // Basic validation
                        if (!rollNo || !firstName) {
                            console.log('Skipping - missing rollNo or firstName:', cleanedValues);
                            skipped++;
                            continue;
                        }

                        // Check if student already exists
                        const allStudents = await getAll('students');
                        const exists = allStudents.find(s => s.rollNo === rollNo);

                        if (exists) {
                            console.log('Skipping - already exists:', rollNo);
                            skipped++;
                            continue;
                        }

                        // Add the student
                        await addRecord('students', {
                            rollNo: rollNo,
                            firstName: firstName,
                            lastName: lastName || '',
                            email: email,
                            department: department,
                            year: year,
                            semester: semester,
                            createdAt: createdDate
                        });

                        imported++;

                    } catch (e) {
                        console.error('Error importing row:', e, cleanedValues);
                        skipped++;
                    }

                    // Update progress
                    const percent = Math.round((totalProcessed / 300) * 100); // Approximate total
                    progressBar.style.width = Math.min(percent, 100) + '%';
                    progressBar.textContent = Math.min(percent, 100) + '%';
                }
            }

            progress.style.display = 'none';

            if (imported > 0) {
                showToast(`Successfully imported ${imported} students! ${skipped > 0 ? `(${skipped} skipped)` : ''}`);
                loadStudents();
            } else {
                showToast(`No students imported. ${skipped} skipped. Check console for details.`, 'error');
            }

            event.target.value = '';
        }

        // UPDATED: Faculty import to match export format
        async function handleFacultyUpload(event) {
            const file = event.target.files[0];
            if (!file) return;
            let text = await file.text();
            text = text.replace(/^\uFEFF/, '');
            const lines = text.split(/\r\n|\n|\r/);
            const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim().toLowerCase().replace(/\s+/g, ''));

            const progress = document.getElementById('facultyProgress');
            const progressBar = document.getElementById('facultyProgressBar');
            progress.style.display = 'block';
            let imported = 0;
            let skipped = 0;

            for (let i = 1; i < lines.length; i++) {
                if (lines[i].trim() === '') continue;
                const values = lines[i].split(',').map(v => v.replace(/^"|"$/g, '').trim());
                if (values.length < 2) continue;

                const record = {};
                headers.forEach((header, idx) => {
                    if (idx < values.length) {
                        record[header] = values[idx];
                    }
                });

                // Map headers to our data structure
                const facultyId = record['facultyid'] || record['faculty_id'] || '';
                const firstName = record['firstname'] || record['first_name'] || '';
                const lastName = record['lastname'] || record['last_name'] || '';
                const email = record['email'] || '';
                const department = record['department'] || '';
                const specialization = record['specialization'] || '';
                const createdDate = record['createddate'] || record['created_date'] || new Date().toISOString();

                if (!facultyId || !firstName) {
                    skipped++;
                    continue;
                }

                try {
                    await addRecord('faculty', {
                        facultyId: facultyId,
                        password: 'pass123', // Default password for imported faculty
                        firstName: firstName,
                        lastName: lastName,
                        email: email,
                        department: department,
                        specialization: specialization,
                        createdAt: createdDate
                    });
                    imported++;
                } catch (e) {
                    console.error('Error importing row:', e);
                    skipped++;
                }

                const percent = Math.round((i / lines.length) * 100);
                progressBar.style.width = percent + '%';
                progressBar.textContent = percent + '%';
            }

            progress.style.display = 'none';
            showToast(`Imported ${imported} faculty members successfully! ${skipped > 0 ? `(${skipped} skipped)` : ''}`);
            loadFaculty();
            event.target.value = '';
        }

        // UPDATED: Classes import to match export format
        async function handleClassesUpload(event) {
            const file = event.target.files[0];
            if (!file) return;

            let text = await file.text();
            text = text.replace(/^\uFEFF/, ''); // Remove BOM

            const sections = text.split('--- Year ');
            const progress = document.getElementById('classesProgress');
            const progressBar = document.getElementById('classesProgressBar');
            progress.style.display = 'block';

            let imported = 0;
            let skipped = 0;
            let totalProcessed = 0;
            const allFaculty = await getAll('faculty');

            // Normalize department names
            const normalizeDepartment = (dept) => {
                if (!dept) return 'Computer Science';

                const lowerDept = dept.toLowerCase();
                if (lowerDept.includes('cyber')) return 'CSE(Cyber Security)';
                if (lowerDept.includes('network')) return 'CSE(Networks)';
                if (lowerDept.includes('computer science') || lowerDept.includes('cse')) return 'Computer Science';
                if (lowerDept.includes('civil')) return 'Civil';
                if (lowerDept.includes('mechanical')) return 'Mechanical';
                if (lowerDept.includes('electrical')) return 'Electrical';
                if (lowerDept.includes('ece') || lowerDept.includes('electronic')) return 'ECE';
                if (lowerDept.includes('applied') || lowerDept.includes('science')) return 'Applied Science';
                return 'Computer Science'; // Default
            };

            for (let section of sections) {
                if (!section.trim()) continue;

                const lines = section.split(/\r\n|\n|\r/);
                if (lines.length < 2) continue;

                // Skip the first line (Year header)
                let startIndex = 1;
                if (lines[0].includes('Classes')) {
                    startIndex = 2; // Skip the header line too
                }

                for (let i = startIndex; i < lines.length; i++) {
                    if (lines[i].trim() === '' || lines[i].includes('--- Year')) continue;

                    totalProcessed++;

                    // Parse CSV line properly handling quotes
                    const values = [];
                    let inQuotes = false;
                    let currentValue = '';

                    for (let char of lines[i]) {
                        if (char === '"') {
                            inQuotes = !inQuotes;
                        } else if (char === ',' && !inQuotes) {
                            values.push(currentValue);
                            currentValue = '';
                        } else {
                            currentValue += char;
                        }
                    }
                    values.push(currentValue);

                    // Trim all values
                    const cleanedValues = values.map(v => v.trim());

                    // Expected columns: Class Code, Course Name, Department, Semester, Faculty, Year, Credits, Created Date
                    if (cleanedValues.length < 8) {
                        console.log('Skipping class - insufficient columns:', cleanedValues);
                        skipped++;
                        continue;
                    }

                    try {
                        // Parse the data
                        const code = cleanedValues[0];
                        const name = cleanedValues[1];
                        const rawDepartment = cleanedValues[2];
                        const semester = parseInt(cleanedValues[3]) || 1;
                        const facultyName = cleanedValues[4];
                        const year = parseInt(cleanedValues[5]) || new Date().getFullYear();
                        const credits = parseInt(cleanedValues[6]) || 3;

                        // Normalize department
                        const department = normalizeDepartment(rawDepartment);

                        // Parse the date
                        let createdDate = new Date().toISOString();
                        const dateStr = cleanedValues[7];
                        if (dateStr) {
                            // Try parsing "MM/DD/YYYY" format
                            const dateParts = dateStr.split('/');
                            if (dateParts.length === 3) {
                                const month = parseInt(dateParts[0]) - 1;
                                const day = parseInt(dateParts[1]);
                                const year = parseInt(dateParts[2]);
                                const dateObj = new Date(year, month, day);
                                if (!isNaN(dateObj.getTime())) {
                                    createdDate = dateObj.toISOString();
                                }
                            }
                        }

                        // Basic validation
                        if (!code || !name) {
                            console.log('Skipping class - missing code or name:', cleanedValues);
                            skipped++;
                            continue;
                        }

                        // Check if faculty exists, create if not
                        let assignedFaculty = facultyName;
                        const facultyNameLower = facultyName.toLowerCase().trim();
                        const existingFaculty = allFaculty.find(f =>
                            `${f.firstName} ${f.lastName}`.toLowerCase() === facultyNameLower
                        );

                        if (!existingFaculty && facultyName && facultyName !== 'New Faculty') {
                            // Create new faculty with default credentials
                            const nameParts = facultyName.split(' ');
                            const firstName = nameParts[0] || 'Faculty';
                            const lastName = nameParts.slice(1).join(' ') || 'Member';

                            const newFaculty = {
                                facultyId: `FAC${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
                                firstName: firstName,
                                lastName: lastName,
                                email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@college.edu`,
                                department: department,
                                specialization: name,
                                password: 'pass123',
                                createdAt: new Date().toISOString()
                            };

                            await addRecord('faculty', newFaculty);
                            allFaculty.push(newFaculty);
                            console.log('Created new faculty:', facultyName);
                        } else if (facultyName === 'New Faculty') {
                            assignedFaculty = ''; // Leave empty for admin to assign later
                        }

                        // Check if class already exists
                        const allClasses = await getAll('classes');
                        const exists = allClasses.find(c => c.code === code && c.year === year);

                        if (exists) {
                            console.log('Skipping class - already exists:', code);
                            skipped++;
                            continue;
                        }

                        // Add the class
                        await addRecord('classes', {
                            code: code,
                            name: name,
                            department: department,
                            semester: semester,
                            faculty: assignedFaculty,
                            year: year,
                            credits: credits,
                            createdAt: createdDate
                        });

                        imported++;

                    } catch (e) {
                        console.error('Error importing class row:', e, cleanedValues);
                        skipped++;
                    }

                    // Update progress
                    const percent = Math.round((totalProcessed / 30) * 100); // Approximate total
                    progressBar.style.width = Math.min(percent, 100) + '%';
                    progressBar.textContent = Math.min(percent, 100) + '%';
                }
            }

            progress.style.display = 'none';

            if (imported > 0) {
                showToast(`Successfully imported ${imported} classes! ${skipped > 0 ? `(${skipped} skipped)` : ''}`);
                loadClasses();
                loadFaculty(); // Refresh faculty list
            } else {
                showToast(`No classes imported. ${skipped} skipped. Check console for details.`, 'error');
            }

            event.target.value = '';
        }

        function toggleStatus(element) {
            const statuses = ['absent', 'present'];
            const current = element.dataset.status;
            const currentIndex = statuses.indexOf(current);
            const nextStatus = statuses[(currentIndex + 1) % statuses.length];
            element.dataset.status = nextStatus;
            element.style.borderColor = nextStatus === 'present' ? 'green' : 'red';
            element.style.background = nextStatus === 'present' ? 'rgba(39,174,96,0.2)' : 'rgba(231,76,60,0.2)';
        }

        function resetAttendance() {
            document.querySelectorAll('#studentGrid > div').forEach(el => {
                el.dataset.status = 'absent';
                el.style.borderColor = 'transparent';
                el.style.background = 'var(--color-light)';
            });
        }

        async function updateDashboard() {
            const students = await getAll('students');
            const faculty = await getAll('faculty');
            const classes = await getAll('classes');
            document.getElementById('totalStudents').textContent = students.length;
            document.getElementById('totalFaculty').textContent = faculty.length;
            document.getElementById('totalClasses').textContent = classes.length;
            const activeYearsSet = new Set();
            students.forEach(student => {
                if (student.semester) {
                    const year = Math.ceil(student.semester / 2);
                    activeYearsSet.add(year);
                }
            });
            document.getElementById('activeYears').textContent = activeYearsSet.size;
        }

        async function saveSettings(event) {
            event.preventDefault();
            showToast('Settings saved!');
        }

        async function exportAllData() {
            const data = {
                students: await getAll('students'),
                faculty: await getAll('faculty'),
                classes: await getAll('classes'),
                years: await getAll('years'),
                exportDate: new Date().toISOString()
            };
            const json = JSON.stringify(data, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `attendance_backup_${new Date().getTime()}.json`;
            a.click();
        }

        document.getElementById('attendanceDate').valueAsDate = new Date();

        (async () => {
            await initDB();
            await loadStudents();
            await loadFaculty();
            await loadClasses();
            await loadYears();
            await populateAdminClassFilter('all', 'all');
            await updateDashboard();

            // Initialize date filter
            document.querySelectorAll('input[name="dateFilterType"]').forEach(radio => {
                radio.addEventListener('change', toggleDateRange);
            });
            toggleDateRange(); // Initial call

            // Add event listeners for filters to update class dropdown
            document.getElementById('adminSemesterFilter').addEventListener('change', async function () {
                const semesterFilter = this.value;
                const branchFilter = document.getElementById('adminBranchFilter').value;
                await updateClassFilterDropdown(semesterFilter, branchFilter);
            });

            document.getElementById('adminBranchFilter').addEventListener('change', async function () {
                const branchFilter = this.value;
                const semesterFilter = document.getElementById('adminSemesterFilter').value;
                await updateClassFilterDropdown(semesterFilter, branchFilter);
            });
        })();