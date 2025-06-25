// Admin Dashboard JavaScript
document.addEventListener('DOMContentLoaded', function() {
    let currentAdmin = null;
    let allPolls = [];
    let systemStats = {};
    let chart = null;
    
    // Initialize admin dashboard
    initializeAdminDashboard();
    
    function initializeAdminDashboard() {
        // Load admin data
        loadAdminData();
        
        // Load system statistics
        loadSystemStats();
        
        // Load all polls
        loadAllPolls();
        
        // Initialize chart
        initializeChart();
        
        // Set up navigation
        setupAdminNavigation();
        
        // Set up form handlers
        setupFormHandlers();
        
        console.log('Admin dashboard initialized');
    }
    
    function loadAdminData() {
        // Simulate loading admin data
        currentAdmin = {
            id: 'ADMIN001',
            username: 'admin',
            name: 'System Administrator',
            email: 'admin@university.edu',
            role: 'Super Admin',
            lastLogin: '2024-01-24T10:30:00'
        };
    }
    
    function loadSystemStats() {
        // Simulate loading system statistics
        systemStats = {
            totalStudents: 2547,
            totalPolls: 156,
            totalVotes: 12384,
            participationRate: 87,
            activePolls: 12,
            completedPolls: 144,
            averageVotesPerPoll: 79.4,
            topCategory: 'Class Schedule'
        };
        
        // Update stat cards
        updateStatCards();
        
        // Update chart data
        updateChartData();
    }
    
    function updateStatCards() {
        const statElements = {
            totalStudents: document.getElementById('totalStudents'),
            totalPolls: document.getElementById('totalPolls'),
            totalVotes: document.getElementById('totalVotes')
        };
        
        Object.keys(statElements).forEach(key => {
            const element = statElements[key];
            if (element && systemStats[key]) {
                animateCounter(element, systemStats[key]);
            }
        });
    }
    
    function animateCounter(element, target, duration = 1500) {
        let start = 0;
        const increment = target / (duration / 16);
        
        const timer = setInterval(() => {
            start += increment;
            if (start >= target) {
                element.textContent = target.toLocaleString();
                clearInterval(timer);
            } else {
                element.textContent = Math.floor(start).toLocaleString();
            }
        }, 16);
    }
    
    function loadAllPolls() {
        // Simulate loading all polls
        allPolls = [
            {
                id: 1,
                title: "Should we cancel tomorrow's 8 AM Physics lecture?",
                description: "Professor mentioned possible cancellation due to weather conditions.",
                category: "class_schedule",
                status: "active",
                createdDate: "2024-01-24T09:00:00",
                endDate: "2024-01-25T08:00:00",
                totalVotes: 145,
                options: [
                    { text: "Yes, cancel it", votes: 98 },
                    { text: "No, keep it scheduled", votes: 47 }
                ]
            },
            {
                id: 2,
                title: "Rate the quality of Mathematics lectures",
                description: "Help us improve teaching quality.",
                category: "lecture_feedback",
                status: "active",
                createdDate: "2024-01-23T14:00:00",
                endDate: "2024-01-26T23:59:59",
                totalVotes: 89,
                options: [
                    { text: "Excellent", votes: 25 },
                    { text: "Good", votes: 40 },
                    { text: "Average", votes: 18 },
                    { text: "Poor", votes: 6 }
                ]
            },
            {
                id: 3,
                title: "Library opening hours extension",
                description: "Should we extend library hours?",
                category: "campus_facilities",
                status: "closed",
                createdDate: "2024-01-20T10:00:00",
                endDate: "2024-01-23T18:00:00",
                totalVotes: 234,
                options: [
                    { text: "24/7 access", votes: 182 },
                    { text: "Extend to midnight", votes: 35 },
                    { text: "Keep current hours", votes: 17 }
                ]
            }
        ];
        
        displayRecentPolls();
    }
    
    function displayRecentPolls() {
        const recentPollsList = document.getElementById('recentPollsList');
        if (!recentPollsList) return;
        
        const recentPolls = allPolls.slice(0, 5);
        
        recentPollsList.innerHTML = recentPolls.map(poll => `
            <div class="poll-item" style="padding: 1rem; border-bottom: 1px solid var(--gray-200); display: flex; justify-content: space-between; align-items: center;">
                <div style="flex: 1;">
                    <h4 style="margin: 0 0 0.5rem 0; font-size: var(--font-size-base);">${poll.title}</h4>
                    <div style="display: flex; gap: 1rem; font-size: var(--font-size-sm); color: var(--gray-600);">
                        <span><i class="fas fa-users"></i> ${poll.totalVotes} votes</span>
                        <span><i class="fas fa-calendar"></i> ${formatDate(poll.createdDate)}</span>
                        <span class="poll-status status-${poll.status}">${poll.status}</span>
                    </div>
                </div>
                <div style="display: flex; gap: 0.5rem;">
                    <button class="btn btn-outline btn-sm" onclick="viewPollDetails(${poll.id})">
                        <i class="fas fa-eye"></i>
                        View
                    </button>
                    <button class="btn btn-outline btn-sm" onclick="editPoll(${poll.id})">
                        <i class="fas fa-edit"></i>
                        Edit
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    function initializeChart() {
        const ctx = document.getElementById('votingChart');
        if (!ctx) return;
        
        // Sample data for the last 7 days
        const labels = [];
        const votingData = [];
        const pollData = [];
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            labels.push(date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }));
            votingData.push(Math.floor(Math.random() * 100) + 50);
            pollData.push(Math.floor(Math.random() * 10) + 2);
        }
        
        chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Votes Cast',
                    data: votingData,
                    borderColor: '#3B82F6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                    fill: true
                }, {
                    label: 'Polls Created',
                    data: pollData,
                    borderColor: '#8B5CF6',
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    tension: 0.4,
                    fill: true,
                    yAxisID: 'y1'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Voting Activity Over Time'
                    }
                },
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Votes'
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Polls'
                        },
                        grid: {
                            drawOnChartArea: false,
                        },
                    }
                }
            }
        });
    }
    
    function updateChartData() {
        // This would update the chart with real data
        if (chart) {
            chart.update();
        }
    }
    
    // Modal Functions
    window.openCreatePollModal = function() {
        const modal = document.getElementById('createPollModal');
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Set default dates
        const now = new Date();
        const startDate = new Date(now.getTime() + 60000); // 1 minute from now
        const endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 1 week from now
        
        document.getElementById('startDate').value = formatDateTimeLocal(startDate);
        document.getElementById('endDate').value = formatDateTimeLocal(endDate);
    };
    
    window.closeCreatePollModal = function() {
        const modal = document.getElementById('createPollModal');
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
        
        // Reset form
        const form = modal.querySelector('form');
        if (form) form.reset();
        
        // Reset options to default
        resetPollOptions();
    };
    
    window.addOption = function() {
        const container = document.getElementById('optionsContainer');
        const optionCount = container.children.length;
        
        if (optionCount >= 6) {
            showNotification('Maximum 6 options allowed', 'warning');
            return;
        }
        
        const optionDiv = document.createElement('div');
        optionDiv.className = 'option-input';
        optionDiv.innerHTML = `
            <input type="text" name="options[]" placeholder="Option ${optionCount + 1}" required>
            <button type="button" class="remove-option" onclick="removeOption(this)">
                <i class="fas fa-trash"></i>
            </button>
        `;
        
        container.appendChild(optionDiv);
        updateRemoveButtons();
    };
    
    window.removeOption = function(button) {
        const container = document.getElementById('optionsContainer');
        if (container.children.length <= 2) {
            showNotification('At least 2 options required', 'warning');
            return;
        }
        
        button.parentElement.remove();
        updateRemoveButtons();
        updateOptionPlaceholders();
    };
    
    function updateRemoveButtons() {
        const container = document.getElementById('optionsContainer');
        const removeButtons = container.querySelectorAll('.remove-option');
        
        removeButtons.forEach((button, index) => {
            button.disabled = container.children.length <= 2;
        });
    }
    
    function updateOptionPlaceholders() {
        const container = document.getElementById('optionsContainer');
        const inputs = container.querySelectorAll('input[name="options[]"]');
        
        inputs.forEach((input, index) => {
            input.placeholder = `Option ${index + 1}`;
        });
    }
    
    function resetPollOptions() {
        const container = document.getElementById('optionsContainer');
        container.innerHTML = `
            <div class="option-input">
                <input type="text" name="options[]" placeholder="Option 1" required>
                <button type="button" class="remove-option" onclick="removeOption(this)" disabled>
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <div class="option-input">
                <input type="text" name="options[]" placeholder="Option 2" required>
                <button type="button" class="remove-option" onclick="removeOption(this)">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
    }
    
    // Quick Action Functions
    window.viewAllPolls = function() {
        showNotification('Loading all polls...', 'info');
        // This would navigate to the polls management page
    };
    
    window.exportResults = function() {
        showNotification('Exporting poll results...', 'info');
        
        // Simulate export process
        setTimeout(() => {
            // Create a simple CSV export
            const csvContent = createCSVExport();
            downloadCSV(csvContent, 'poll-results-export.csv');
            showNotification('Results exported successfully!', 'success');
        }, 2000);
    };
    
    window.manageUsers = function() {
        showNotification('Loading user management...', 'info');
        // This would navigate to the user management page
    };
    
    window.loadRecentPolls = function() {
        const button = event.target.closest('button');
        const originalText = button.innerHTML;
        
        button.innerHTML = '<i class="spinner"></i> Loading...';
        button.disabled = true;
        
        setTimeout(() => {
            loadAllPolls();
            button.innerHTML = originalText;
            button.disabled = false;
            showNotification('Polls refreshed successfully', 'success');
        }, 1500);
    };
    
    // Poll Management Functions
    window.viewPollDetails = function(pollId) {
        const poll = allPolls.find(p => p.id === pollId);
        if (!poll) return;
        
        showNotification(`Viewing details for: ${poll.title}`, 'info');
        // This would open a detailed poll view modal
    };
    
    window.editPoll = function(pollId) {
        const poll = allPolls.find(p => p.id === pollId);
        if (!poll) return;
        
        showNotification(`Editing poll: ${poll.title}`, 'info');
        // This would open the edit poll modal with pre-filled data
    };
    
    function setupFormHandlers() {
        const createPollForm = document.querySelector('#createPollModal form');
        if (createPollForm) {
            createPollForm.addEventListener('submit', function(e) {
                e.preventDefault();
                handleCreatePoll(this);
            });
        }
    }
    
    function handleCreatePoll(form) {
        const formData = new FormData(form);
        const submitButton = form.querySelector('button[type="submit"]');
        const originalText = submitButton.innerHTML;
        
        // Show loading state
        submitButton.innerHTML = '<i class="spinner"></i> Creating Poll...';
        submitButton.disabled = true;
        
        // Validate form
        const title = formData.get('title');
        const category = formData.get('category');
        const options = formData.getAll('options[]').filter(opt => opt.trim());
        const startDate = formData.get('start_date');
        const endDate = formData.get('end_date');
        
        if (!title || !category || options.length < 2 || !startDate || !endDate) {
            showNotification('Please fill in all required fields', 'error');
            resetSubmitButton();
            return;
        }
        
        if (new Date(startDate) >= new Date(endDate)) {
            showNotification('End date must be after start date', 'error');
            resetSubmitButton();
            return;
        }
        
        // Simulate API call
        setTimeout(() => {
            // Create new poll object
            const newPoll = {
                id: allPolls.length + 1,
                title: title,
                description: formData.get('description') || '',
                category: category,
                status: 'active',
                createdDate: new Date().toISOString(),
                endDate: endDate,
                totalVotes: 0,
                options: options.map(opt => ({ text: opt, votes: 0 })),
                allowComments: formData.get('allow_comments') === 'on'
            };
            
            // Add to polls array
            allPolls.unshift(newPoll);
            
            // Update displays
            displayRecentPolls();
            loadSystemStats();
            
            // Show success message
            showNotification('Poll created successfully!', 'success');
            
            // Close modal
            closeCreatePollModal();
            
            // Reset button
            resetSubmitButton();
        }, 2000);
        
        function resetSubmitButton() {
            submitButton.innerHTML = originalText;
            submitButton.disabled = false;
        }
    }
    
    function setupAdminNavigation() {
        const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', function(e) {
                // Remove active class from all items
                navItems.forEach(nav => nav.classList.remove('active'));
                
                // Add active class to clicked item
                this.classList.add('active');
                
                // Handle navigation logic
                const href = this.getAttribute('href');
                if (href && href.startsWith('#')) {
                    e.preventDefault();
                    handleAdminNavigation(href.substring(1));
                }
            });
        });
    }
    
    function handleAdminNavigation(section) {
        console.log('Admin navigating to:', section);
        
        switch (section) {
            case 'dashboard':
                // Show dashboard content
                break;
            case 'polls':
                // Show polls management
                break;
            case 'users':
                // Show user management
                break;
            case 'analytics':
                // Show analytics
                break;
            case 'settings':
                // Show settings
                break;
        }
    }
    
    // Utility Functions
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
    
    function formatDateTimeLocal(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    }
    
    function createCSVExport() {
        let csv = 'Poll Title,Category,Status,Total Votes,Created Date,End Date\n';
        
        allPolls.forEach(poll => {
            csv += `"${poll.title}","${poll.category}","${poll.status}",${poll.totalVotes},"${formatDate(poll.createdDate)}","${formatDate(poll.endDate)}"\n`;
        });
        
        return csv;
    }
    
    function downloadCSV(content, filename) {
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
    
    // Notification system
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: var(--border-radius);
            color: white;
            font-weight: 500;
            z-index: 10000;
            animation: slideIn 0.3s ease-out;
            max-width: 300px;
            box-shadow: var(--shadow-lg);
        `;
        
        switch(type) {
            case 'success':
                notification.style.background = 'var(--success-color)';
                break;
            case 'error':
                notification.style.background = 'var(--error-color)';
                break;
            case 'warning':
                notification.style.background = 'var(--warning-color)';
                break;
            case 'info':
                notification.style.background = 'var(--primary-color)';
                break;
        }
        
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'fadeOut 0.3s ease-out';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }
    
    // Handle modal clicks outside content
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            closeCreatePollModal();
        }
    });
    
    // Handle escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeCreatePollModal();
        }
    });
    
    console.log('Admin dashboard JavaScript loaded successfully');
});