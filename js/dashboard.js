// Student Dashboard JavaScript
document.addEventListener('DOMContentLoaded', function() {
    let currentUser = null;
    let polls = [];
    let userVotes = [];
    
    // Initialize dashboard
    initializeDashboard();
    
    function initializeDashboard() {
        // Load user data
        loadUserData();
        
        // Load dashboard stats
        loadDashboardStats();
        
        // Load active polls
        loadPolls();
        
        // Load recent activity
        loadRecentActivity();
        
        // Set up navigation
        setupNavigation();
        
        // Set up refresh functionality
        setupRefreshHandlers();
        
        console.log('Student dashboard initialized');
    }
    
    function loadUserData() {
        // Simulate loading user data
        currentUser = {
            id: 'STU001',
            name: 'John Doe',
            email: 'john.doe@university.edu',
            class: 'Computer Science 2024',
            totalVotes: 15,
            participationRate: 95
        };
        
        // Update UI with user data
        const studentNameElement = document.getElementById('studentName');
        if (studentNameElement) {
            studentNameElement.textContent = currentUser.name;
        }
    }
    
    function loadDashboardStats() {
        const stats = {
            totalVotes: 15,
            activePolls: 5,
            pendingVotes: 3,
            participationRate: 95
        };
        
        // Animate stats
        animateStatCounters(stats);
    }
    
    function animateStatCounters(stats) {
        const statElements = {
            totalVotes: document.getElementById('totalVotes'),
            activePolls: document.getElementById('activePolls'),
            pendingVotes: document.getElementById('pendingVotes')
        };
        
        Object.keys(statElements).forEach(key => {
            const element = statElements[key];
            if (element) {
                animateCounter(element, stats[key]);
            }
        });
    }
    
    function animateCounter(element, target, duration = 1000) {
        let start = 0;
        const increment = target / (duration / 16);
        
        const timer = setInterval(() => {
            start += increment;
            if (start >= target) {
                element.textContent = target;
                clearInterval(timer);
            } else {
                element.textContent = Math.floor(start);
            }
        }, 16);
    }
    
    function loadPolls() {
        // Simulate loading polls data
        polls = [
            {
                id: 1,
                title: "Should we cancel tomorrow's 8 AM Physics lecture?",
                description: "Professor mentioned possible cancellation due to weather conditions.",
                category: "class_schedule",
                options: [
                    { id: 1, text: "Yes, cancel it", votes: 68 },
                    { id: 2, text: "No, keep it scheduled", votes: 32 }
                ],
                status: "active",
                endDate: "2024-01-25T08:00:00",
                allowComments: true,
                hasVoted: false
            },
            {
                id: 2,
                title: "Rate the quality of this week's Mathematics lectures",
                description: "Help us improve the teaching quality by providing your feedback.",
                category: "lecture_feedback",
                options: [
                    { id: 1, text: "Excellent", votes: 25 },
                    { id: 2, text: "Good", votes: 45 },
                    { id: 3, text: "Average", votes: 20 },
                    { id: 4, text: "Poor", votes: 10 }
                ],
                status: "active",
                endDate: "2024-01-26T23:59:59",
                allowComments: true,
                hasVoted: false
            },
            {
                id: 3,
                title: "Should the library extend its opening hours?",
                description: "Current hours are 8 AM - 10 PM. Should we extend to 24/7?",
                category: "campus_facilities",
                options: [
                    { id: 1, text: "Yes, 24/7 access", votes: 78 },
                    { id: 2, text: "Extend to midnight", votes: 15 },
                    { id: 3, text: "Keep current hours", votes: 7 }
                ],
                status: "active",
                endDate: "2024-01-30T18:00:00",
                allowComments: true,
                hasVoted: true
            }
        ];
        
        displayPolls();
    }
    
    function displayPolls() {
        const pollsContainer = document.getElementById('pollsContainer');
        if (!pollsContainer) return;
        
        pollsContainer.innerHTML = '';
        
        if (polls.length === 0) {
            pollsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-vote-yea" style="font-size: 3rem; color: var(--gray-400); margin-bottom: 1rem;"></i>
                    <h3>No Active Polls</h3>
                    <p>There are no active polls at the moment. Check back later!</p>
                </div>
            `;
            return;
        }
        
        polls.forEach(poll => {
            const pollCard = createPollCard(poll);
            pollsContainer.appendChild(pollCard);
        });
    }
    
    function createPollCard(poll) {
        const card = document.createElement('div');
        card.className = 'poll-card';
        card.style.animation = 'fadeIn 0.5s ease-out';
        
        const totalVotes = poll.options.reduce((sum, option) => sum + option.votes, 0);
        const timeRemaining = getTimeRemaining(poll.endDate);
        
        card.innerHTML = `
            <div class="poll-header">
                <div>
                    <h3 class="poll-title">${poll.title}</h3>
                    <p class="poll-meta">
                        <i class="fas fa-clock"></i> ${timeRemaining} remaining
                        <span style="margin-left: 1rem;">
                            <i class="fas fa-users"></i> ${totalVotes} votes
                        </span>
                    </p>
                </div>
                <span class="poll-status status-${poll.status}">${poll.status}</span>
            </div>
            
            <p class="poll-description">${poll.description}</p>
            
            ${poll.hasVoted ? createResultsView(poll, totalVotes) : createVotingView(poll)}
            
            <div class="poll-actions">
                ${!poll.hasVoted ? `
                    <button class="btn btn-primary btn-sm" onclick="openVotingModal(${poll.id})">
                        <i class="fas fa-vote-yea"></i>
                        Vote Now
                    </button>
                ` : `
                    <button class="btn btn-outline btn-sm" onclick="viewPollResults(${poll.id})">
                        <i class="fas fa-chart-bar"></i>
                        View Results
                    </button>
                `}
                <button class="btn btn-outline btn-sm" onclick="sharePoll(${poll.id})">
                    <i class="fas fa-share"></i>
                    Share
                </button>
            </div>
        `;
        
        return card;
    }
    
    function createResultsView(poll, totalVotes) {
        return `
            <div class="voting-options">
                ${poll.options.map(option => {
                    const percentage = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
                    return `
                        <div class="option">
                            <span class="option-text">${option.text}</span>
                            <div class="progress-bar">
                                <div class="progress" style="width: ${percentage}%"></div>
                            </div>
                            <span class="percentage">${percentage}%</span>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }
    
    function createVotingView(poll) {
        return `
            <div class="poll-preview">
                <p><strong>Options:</strong> ${poll.options.map(opt => opt.text).join(', ')}</p>
                <p class="text-primary"><i class="fas fa-info-circle"></i> Click "Vote Now" to cast your vote</p>
            </div>
        `;
    }
    
    function getTimeRemaining(endDate) {
        const now = new Date();
        const end = new Date(endDate);
        const diff = end - now;
        
        if (diff <= 0) return 'Ended';
        
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        if (days > 0) return `${days}d ${hours}h`;
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    }
    
    function loadRecentActivity() {
        const activities = [
            {
                action: 'Voted',
                description: 'Library opening hours extension',
                timestamp: '2 hours ago',
                icon: 'fas fa-vote-yea',
                type: 'vote'
            },
            {
                action: 'Commented',
                description: 'Physics lecture feedback',
                timestamp: '1 day ago',
                icon: 'fas fa-comment',
                type: 'comment'
            },
            {
                action: 'Voted',
                description: 'Cafeteria menu improvement',
                timestamp: '2 days ago',
                icon: 'fas fa-vote-yea',
                type: 'vote'
            },
            {
                action: 'Joined',
                description: 'VoteEdu platform',
                timestamp: '1 week ago',
                icon: 'fas fa-user-plus',
                type: 'join'
            }
        ];
        
        const activityList = document.getElementById('activityList');
        if (!activityList) return;
        
        activityList.innerHTML = activities.map(activity => `
            <div class="activity-item" style="display: flex; align-items: center; gap: 1rem; padding: 1rem; border-bottom: 1px solid var(--gray-200);">
                <div class="activity-icon" style="width: 40px; height: 40px; border-radius: 50%; background: var(--${activity.type === 'vote' ? 'primary' : activity.type === 'comment' ? 'secondary' : 'success'}-light); display: flex; align-items: center; justify-content: center; color: var(--${activity.type === 'vote' ? 'primary' : activity.type === 'comment' ? 'secondary' : 'success'}-color);">
                    <i class="${activity.icon}"></i>
                </div>
                <div class="activity-content" style="flex: 1;">
                    <p style="margin: 0; font-weight: 500;">${activity.action}</p>
                    <p style="margin: 0; color: var(--gray-600); font-size: var(--font-size-sm);">${activity.description}</p>
                </div>
                <div class="activity-time" style="color: var(--gray-500); font-size: var(--font-size-sm);">
                    ${activity.timestamp}
                </div>
            </div>
        `).join('');
    }
    
    // Voting Modal Functions
    window.openVotingModal = function(pollId) {
        const poll = polls.find(p => p.id === pollId);
        if (!poll) return;
        
        const modal = document.getElementById('votingModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalDescription = document.getElementById('modalDescription');
        const votingOptions = document.getElementById('votingOptions');
        
        modalTitle.textContent = poll.title;
        modalDescription.textContent = poll.description;
        
        votingOptions.innerHTML = poll.options.map(option => `
            <div class="voting-option">
                <input type="radio" id="option_${option.id}" name="vote_option" value="${option.id}">
                <label for="option_${option.id}">${option.text}</label>
            </div>
        `).join('');
        
        // Store current poll ID for submission
        modal.dataset.pollId = pollId;
        
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    };
    
    window.closeVotingModal = function() {
        const modal = document.getElementById('votingModal');
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
        
        // Clear form
        const form = modal.querySelector('form');
        if (form) form.reset();
        
        const comment = document.getElementById('voterComment');
        if (comment) comment.value = '';
    };
    
    window.submitVote = function() {
        const modal = document.getElementById('votingModal');
        const pollId = parseInt(modal.dataset.pollId);
        const selectedOption = document.querySelector('input[name="vote_option"]:checked');
        const comment = document.getElementById('voterComment').value.trim();
        
        if (!selectedOption) {
            showNotification('Please select an option to vote', 'error');
            return;
        }
        
        // Simulate vote submission
        const submitButton = modal.querySelector('.btn-primary');
        const originalText = submitButton.innerHTML;
        
        submitButton.innerHTML = '<i class="spinner"></i> Submitting...';
        submitButton.disabled = true;
        
        setTimeout(() => {
            // Update poll data
            const poll = polls.find(p => p.id === pollId);
            if (poll) {
                poll.hasVoted = true;
                const optionId = parseInt(selectedOption.value);
                const option = poll.options.find(opt => opt.id === optionId);
                if (option) {
                    option.votes++;
                }
            }
            
            // Update display
            displayPolls();
            loadDashboardStats();
            
            // Show success message
            showNotification('Vote submitted successfully!', 'success');
            
            // Close modal
            closeVotingModal();
            
            // Reset button
            submitButton.innerHTML = originalText;
            submitButton.disabled = false;
        }, 2000);
    };
    
    // Other Functions
    window.refreshDashboard = function() {
        const button = event.target.closest('button');
        const originalText = button.innerHTML;
        
        button.innerHTML = '<i class="spinner"></i> Refreshing...';
        button.disabled = true;
        
        setTimeout(() => {
            loadDashboardStats();
            loadPolls();
            loadRecentActivity();
            
            button.innerHTML = originalText;
            button.disabled = false;
            
            showNotification('Dashboard refreshed successfully', 'success');
        }, 1500);
    };
    
    window.loadPolls = loadPolls;
    
    window.viewPollResults = function(pollId) {
        const poll = polls.find(p => p.id === pollId);
        if (!poll) return;
        
        // This would typically open a detailed results view
        showNotification(`Viewing results for: ${poll.title}`, 'info');
    };
    
    window.sharePoll = function(pollId) {
        const poll = polls.find(p => p.id === pollId);
        if (!poll) return;
        
        if (navigator.share) {
            navigator.share({
                title: poll.title,
                text: poll.description,
                url: window.location.href + `?poll=${pollId}`
            });
        } else {
            // Fallback - copy to clipboard
            const url = window.location.href + `?poll=${pollId}`;
            navigator.clipboard.writeText(url).then(() => {
                showNotification('Poll URL copied to clipboard', 'success');
            });
        }
    };
    
    function setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', function(e) {
                // Remove active class from all items
                navItems.forEach(nav => nav.classList.remove('active'));
                
                // Add active class to clicked item
                this.classList.add('active');
                
                // Handle navigation logic here
                const href = this.getAttribute('href');
                if (href && href.startsWith('#')) {
                    e.preventDefault();
                    handleNavigation(href.substring(1));
                }
            });
        });
    }
    
    function handleNavigation(section) {
        // This would handle different dashboard sections
        console.log('Navigating to:', section);
        
        switch (section) {
            case 'dashboard':
                // Show dashboard content
                break;
            case 'polls':
                // Show all polls
                break;
            case 'history':
                // Show voting history
                break;
            case 'profile':
                // Show user profile
                break;
        }
    }
    
    function setupRefreshHandlers() {
        // Auto-refresh polls every 30 seconds
        setInterval(() => {
            loadPolls();
        }, 30000);
        
        // Auto-refresh stats every 60 seconds
        setInterval(() => {
            loadDashboardStats();
        }, 60000);
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
            case 'info':
                notification.style.background = 'var(--primary-color)';
                break;
        }
        
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
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
            closeVotingModal();
        }
    });
    
    // Handle escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeVotingModal();
        }
    });
    
    console.log('Dashboard JavaScript loaded successfully');
});