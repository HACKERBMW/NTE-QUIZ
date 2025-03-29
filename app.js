// Global variables
let currentQuiz = null;
let currentQuestionIndex = 0;
let userProfile = {
    name: '',
    username: '',
    bio: '',
    interests: ['teori test'],
    stats: {
        quizzes: 0,
        accuracy: '0%',
        rank: 0
    }
};
let userCreatedQuizzes = [];
let questionCount = 1;
let questionImages = {}; // To store image data for questions
let registeredUsers = []; // To store registered users

// Variables to track user's answers and score
let userAnswers = [];
let currentScore = 0;

// Function to handle navigation between screens
function showScreen(screenId) {
    // Hide all screens
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => {
        screen.style.display = 'none';
    });
    
    // Show the requested screen
    const screenToShow = document.getElementById(screenId);
    if (screenToShow) {
        screenToShow.style.display = 'block';
    }
}

// Function to toggle between login and signup forms
function toggleAuthForms(formType) {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    
    if (formType === 'login') {
        loginForm.style.display = 'block';
        signupForm.style.display = 'none';
    } else if (formType === 'signup') {
        loginForm.style.display = 'none';
        signupForm.style.display = 'block';
    }
}

// Function to copy invite code to clipboard
function copyInviteCode() {
    const code = document.querySelector('.code').textContent;
    navigator.clipboard.writeText(code)
        .then(() => {
            // Update button text temporarily to show success
            const copyButton = document.querySelector('.copy-button');
            const originalText = copyButton.innerHTML;
            copyButton.innerHTML = '<span>Copied!</span>';
            
            // Reset button text after 2 seconds
            setTimeout(() => {
                copyButton.innerHTML = originalText;
            }, 2000);
        })
        .catch(err => {
            console.error('Failed to copy: ', err);
        });
}

// Sample quiz data - empty by default
const quizzes = [];

// Function to load quizzes by category
function loadQuizByCategory(category) {
    // Check if it's a sample category or user quiz
    if (category === 'teori test') {
        // Redirect to My Quizzes or create quiz page if no quizzes
        const userQuizzes = JSON.parse(localStorage.getItem('userCreatedQuizzes')) || [];
        if (userQuizzes.length > 0) {
            showMyQuizzesScreen();
        } else {
            showScreen('quiz-creation-screen');
            alert('Please create your own quiz first');
        }
        return;
    }
    
    const quiz = quizzes.find(q => q.category === category);
    if (quiz) {
        currentQuiz = quiz;
        currentQuestionIndex = 0;
        loadQuestion();
    }
}

// Function to load current question
function loadQuestion() {
    console.log("Loading question:", currentQuestionIndex);
    
    // Check if we have more questions
    if (currentQuestionIndex >= currentQuiz.questions.length) {
        showQuizResults();
        return;
    }
    
    // Get current question
    const currentQuestion = currentQuiz.questions[currentQuestionIndex];
    console.log("Question text:", currentQuestion.text);
    
    // Get quiz content container
    const quizContent = document.querySelector('.quiz-content');
    if (!quizContent) {
        console.error("Quiz content container not found");
        return;
    }
    
    // Clear previous content
    quizContent.innerHTML = '';
    
    // Create question element
    const questionElement = document.createElement('p');
    questionElement.className = 'quiz-question';
    questionElement.textContent = currentQuestion.text;
    quizContent.appendChild(questionElement);
    
    // Add question counter
    const questionCounter = document.createElement('div');
    questionCounter.className = 'question-counter';
    questionCounter.textContent = `Question ${currentQuestionIndex + 1} of ${currentQuiz.questions.length}`;
    quizContent.insertBefore(questionCounter, questionElement);
    
    // Add question image if available
    if (currentQuestion.image) {
        const imageContainer = document.createElement('div');
        imageContainer.className = 'question-image-container';
        
        const image = document.createElement('img');
        image.src = currentQuestion.image;
        image.className = 'question-image';
        image.alt = 'Question Image';
        
        imageContainer.appendChild(image);
        quizContent.appendChild(imageContainer);
    }
    
    // Create options container
    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'quiz-options';
    
    // Add options
    currentQuestion.options.forEach((option, index) => {
        // Create option element
        const optionElement = document.createElement('div');
        optionElement.className = 'quiz-option';
        
        // Create option text
        const optionText = document.createElement('span');
        optionText.textContent = option.text; // Use option.text instead of the entire option object
        
        // Create toggle
        const toggle = document.createElement('label');
        toggle.className = 'toggle';
        
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.dataset.index = index;
        input.addEventListener('change', function() {
            handleOptionSelection(this);
        });
        
        const slider = document.createElement('span');
        slider.className = 'slider';
        
        // Assemble the option
        toggle.appendChild(input);
        toggle.appendChild(slider);
        optionElement.appendChild(optionText);
        optionElement.appendChild(toggle);
        optionsContainer.appendChild(optionElement);
    });
    
    quizContent.appendChild(optionsContainer);
    
    // Add next/finish button
    const actionButton = document.createElement('button');
    actionButton.className = 'primary-button action-button';
    actionButton.textContent = currentQuestionIndex === currentQuiz.questions.length - 1 ? 'Finish' : 'Next';
    actionButton.addEventListener('click', handleNextQuestion);
    quizContent.appendChild(actionButton);
}

// Function to handle option selection
function handleOptionSelection(checkbox) {
    // Get all options for this question
    const optionCheckboxes = document.querySelectorAll('.quiz-option input[type="checkbox"]');
    
    // Store user answer
    if (!userAnswers[currentQuestionIndex]) {
        userAnswers[currentQuestionIndex] = [];
    }
    
    // Clear previous answer and set new one
    userAnswers[currentQuestionIndex] = [];
    
    // Get all selected options
    optionCheckboxes.forEach((box, idx) => {
        if (box.checked) {
            userAnswers[currentQuestionIndex].push(idx);
        }
    });
    
    console.log("User selected options:", userAnswers[currentQuestionIndex]);
}

// Function to handle next button click
function handleNextQuestion() {
    // Save current answer if user hasn't selected anything
    if (!userAnswers[currentQuestionIndex]) {
        userAnswers[currentQuestionIndex] = [];
    }
    
    // Check if current answer is correct
    const currentQuestion = currentQuiz.questions[currentQuestionIndex];
    const correctAnswers = currentQuestion.options
        .map((option, index) => option.correct ? index : -1)
        .filter(index => index !== -1);
    
    // Compare user answers with correct answers
    const userSelectedAnswers = userAnswers[currentQuestionIndex];
    let isCorrect = true;
    
    // Check that user selected all correct answers and no incorrect ones
    if (userSelectedAnswers.length !== correctAnswers.length) {
        isCorrect = false;
    } else {
        for (const answer of userSelectedAnswers) {
            if (!correctAnswers.includes(answer)) {
                isCorrect = false;
                break;
            }
        }
    }
    
    // Update score if correct
    if (isCorrect) {
        currentScore++;
    }
    
    // Move to next question
    currentQuestionIndex++;
    
    // Load next question or show results if done
    loadQuestion();
}

// Function to submit answers and show results
function submitAnswers() {
    // Save current answers first
    saveCurrentAnswers();
    
    // Calculate score
    calculateScore();
    
    // Show results screen
    showQuizResults();
}

// Function to calculate the score
function calculateScore() {
    currentScore = 0;
    
    userAnswers.forEach((selectedOptions, index) => {
        const question = currentQuiz.questions[index];
        
        // Check if arrays are equal (regardless of order)
        if (selectedOptions.length === question.correctAnswers.length &&
            selectedOptions.every(option => question.correctAnswers.includes(option))) {
            currentScore++;
        }
    });
}

// Function to show the quiz results
function showQuizResults() {
    // Show results screen
    showScreen('results-screen');
    
    // Update results content
    const resultsContent = document.querySelector('.results-content');
    if (resultsContent) {
        // Update trophy message
        const trophyMessage = resultsContent.querySelector('h2');
        if (trophyMessage) {
            const percentage = Math.round((currentScore / currentQuiz.questions.length) * 100);
            
            if (percentage >= 80) {
                trophyMessage.textContent = 'Excellent!';
            } else if (percentage >= 60) {
                trophyMessage.textContent = 'Good job!';
            } else if (percentage >= 40) {
                trophyMessage.textContent = 'Nice try!';
            } else {
                trophyMessage.textContent = 'Keep practicing!';
            }
        }
        
        // Update single player score display
        const scoreValue = resultsContent.querySelector('.score-value');
        const totalQuestions = resultsContent.querySelector('.total-questions');
        
        if (scoreValue) {
            scoreValue.textContent = currentScore;
        }
        
        if (totalQuestions) {
            totalQuestions.textContent = currentQuiz.questions.length;
        }
    }
    
    // Reset for next quiz
    userAnswers = [];
}

// Function to save user profile
function saveProfile() {
    // Get values from form
    userProfile.name = document.getElementById('profile-name').value;
    userProfile.username = document.getElementById('profile-username').value;
    userProfile.bio = document.getElementById('profile-bio').value;
    
    // Save to local storage
    localStorage.setItem('userProfile', JSON.stringify(userProfile));
    
    // Show success message
    alert('Profile saved successfully!');
    
    // Go back to categories
    showScreen('categories-screen');
}

// Function to toggle interest tag selection
function toggleInterestTag(event) {
    const tag = event.target;
    const interest = tag.textContent;
    
    // Toggle selected class
    tag.classList.toggle('selected');
    
    // Update userProfile interests
    if (tag.classList.contains('selected')) {
        if (!userProfile.interests.includes(interest)) {
            userProfile.interests.push(interest);
        }
    } else {
        userProfile.interests = userProfile.interests.filter(i => i !== interest);
    }
}

// Function to load user profile data
function loadUserProfile() {
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
        userProfile = JSON.parse(savedProfile);
        
        // Update form fields
        document.getElementById('profile-name').value = userProfile.name;
        document.getElementById('profile-username').value = userProfile.username;
        document.getElementById('profile-bio').value = userProfile.bio;
        
        // Update interest tags
        const interestTags = document.querySelectorAll('.interest-tag');
        interestTags.forEach(tag => {
            const interest = tag.textContent;
            if (userProfile.interests.includes(interest)) {
                tag.classList.add('selected');
            } else {
                tag.classList.remove('selected');
            }
        });
        
        // Update connected accounts
        updateConnectedAccounts();
    }
}

// Function to update connected accounts display
function updateConnectedAccounts() {
    const currentUserEmail = localStorage.getItem('user_email');
    if (!currentUserEmail) return;
    
    const users = JSON.parse(localStorage.getItem('registeredUsers')) || [];
    const user = users.find(user => user.email === currentUserEmail);
    
    if (!user) return;
    
    // Update Google connection
    const googleConnectBtn = document.getElementById('google-connect-btn');
    const googleDisconnectBtn = document.getElementById('google-disconnect-btn');
    
    if (user.socialConnections && user.socialConnections.google) {
        // User has connected Google account
        googleConnectBtn.style.display = 'none';
        googleDisconnectBtn.style.display = 'block';
        
        // Add connected email if not already there
        const connectionInfo = document.querySelector('#google-connection .connection-info');
        if (!connectionInfo.querySelector('.connection-email')) {
            const emailElement = document.createElement('div');
            emailElement.className = 'connection-email';
            emailElement.textContent = user.socialConnections.google.email;
            connectionInfo.appendChild(emailElement);
            
            // Add connected status
            const statusElement = document.createElement('div');
            statusElement.className = 'connected-status';
            statusElement.innerHTML = '<div class="status-dot"></div> Connected';
            connectionInfo.appendChild(statusElement);
        }
    } else {
        // User has not connected Google account
        googleConnectBtn.style.display = 'block';
        googleDisconnectBtn.style.display = 'none';
        
        // Remove email and status if they exist
        const connectionInfo = document.querySelector('#google-connection .connection-info');
        const emailElement = connectionInfo.querySelector('.connection-email');
        const statusElement = connectionInfo.querySelector('.connected-status');
        
        if (emailElement) emailElement.remove();
        if (statusElement) statusElement.remove();
    }
    
    // Update Facebook connection
    const facebookConnectBtn = document.getElementById('facebook-connect-btn');
    const facebookDisconnectBtn = document.getElementById('facebook-disconnect-btn');
    
    if (user.socialConnections && user.socialConnections.facebook) {
        // User has connected Facebook account
        facebookConnectBtn.style.display = 'none';
        facebookDisconnectBtn.style.display = 'block';
        
        // Add connected email if not already there
        const connectionInfo = document.querySelector('#facebook-connection .connection-info');
        if (!connectionInfo.querySelector('.connection-email')) {
            const emailElement = document.createElement('div');
            emailElement.className = 'connection-email';
            emailElement.textContent = user.socialConnections.facebook.email;
            connectionInfo.appendChild(emailElement);
            
            // Add connected status
            const statusElement = document.createElement('div');
            statusElement.className = 'connected-status';
            statusElement.innerHTML = '<div class="status-dot"></div> Connected';
            connectionInfo.appendChild(statusElement);
        }
    } else {
        // User has not connected Facebook account
        facebookConnectBtn.style.display = 'block';
        facebookDisconnectBtn.style.display = 'none';
        
        // Remove email and status if they exist
        const connectionInfo = document.querySelector('#facebook-connection .connection-info');
        const emailElement = connectionInfo.querySelector('.connection-email');
        const statusElement = connectionInfo.querySelector('.connected-status');
        
        if (emailElement) emailElement.remove();
        if (statusElement) statusElement.remove();
    }
}

// Function to add a new question to the quiz creator
function addQuestion() {
    // Check if we've reached the maximum of 45 questions
    const questionList = document.getElementById('question-list');
    const questions = questionList.querySelectorAll('.question-item');
    
    if (questions.length >= 45) {
        alert('Maximum limit of 45 questions reached!');
        return;
    }
    
    questionCount++;
    const questionItem = document.createElement('div');
    questionItem.className = 'question-item';
    questionItem.innerHTML = `
        <div class="question-header">
            <span class="question-number">Question ${questionCount}</span>
            <button class="question-delete" onclick="removeQuestion(${questionCount - 1})">×</button>
        </div>
        <div class="form-group">
            <input type="text" class="question-text" placeholder="Enter your question">
        </div>
        <div class="question-image-container">
            <div class="image-preview-area">
                <img class="question-image-preview" style="display: none;">
            </div>
            <div class="image-upload-controls">
                <label for="q${questionCount}-image" class="image-upload-label">
                    <span class="image-icon">🖼️</span> Add Image
                </label>
                <input type="file" id="q${questionCount}-image" class="question-image-input" accept="image/*" onchange="previewQuestionImage(this, ${questionCount - 1})" style="display: none;">
                <button type="button" class="remove-image-btn" onclick="removeQuestionImage(${questionCount - 1})" style="display: none;">Remove Image</button>
            </div>
        </div>
        <div class="answer-options">
            <div class="answer-option">
                <input type="checkbox" id="q${questionCount}-correct-1">
                <input type="text" placeholder="Option 1">
            </div>
            <div class="answer-option">
                <input type="checkbox" id="q${questionCount}-correct-2">
                <input type="text" placeholder="Option 2">
            </div>
            <div class="answer-option">
                <input type="checkbox" id="q${questionCount}-correct-3">
                <input type="text" placeholder="Option 3">
            </div>
            <div class="answer-option">
                <input type="checkbox" id="q${questionCount}-correct-4">
                <input type="text" placeholder="Option 4">
            </div>
        </div>
    `;
    
    questionList.appendChild(questionItem);
    
    // Update question counter display
    updateQuestionCounter();
}

// Function to remove a question from the quiz creator
function removeQuestion(index) {
    const questionList = document.getElementById('question-list');
    const questions = questionList.querySelectorAll('.question-item');
    
    if (questions.length <= 1) {
        alert('Quiz must have at least one question!');
        return;
    }
    
    questions[index].remove();
    questionCount--;
    
    // Update question numbers
    const remainingQuestions = questionList.querySelectorAll('.question-item');
    remainingQuestions.forEach((q, i) => {
        q.querySelector('.question-number').textContent = `Question ${i + 1}`;
        
        // Update delete button onclick
        q.querySelector('.question-delete').setAttribute('onclick', `removeQuestion(${i})`);
        
        // Update checkbox IDs
        const checkboxes = q.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach((cb, j) => {
            cb.id = `q${i + 1}-correct-${j + 1}`;
        });
    });
    
    // Update question counter display
    updateQuestionCounter();
}

// Function to handle quiz creation form submission
function createQuiz(event) {
    if (event) {
        event.preventDefault();
    }
    
    // Get quiz title
    const quizTitle = document.getElementById('quiz-title').value;
    if (!quizTitle) {
        alert("Please enter a quiz title");
        return;
    }
    
    // Gather all question elements
    const questionElements = document.querySelectorAll('.question-item');
    if (questionElements.length === 0) {
        alert("Please add at least one question");
        return;
    }
    
    // Create questions array
    const questions = [];
    
    // Process each question
    questionElements.forEach((questionElement, index) => {
        // Get question text
        const questionText = questionElement.querySelector('.question-text').value;
        if (!questionText) {
            alert(`Question ${index + 1} is missing text`);
            return;
        }
        
        // Get answer options
        const answerOptions = [];
        const optionElements = questionElement.querySelectorAll('.answer-option');
        
        optionElements.forEach((optionElement, optionIndex) => {
            const optionText = optionElement.querySelector('input[type="text"]').value;
            const isCorrect = optionElement.querySelector('input[type="checkbox"]').checked;
            
            if (optionText) {
                answerOptions.push({
                    text: optionText,
                    correct: isCorrect
                });
            }
        });
        
        // Validate we have at least one correct answer
        const hasCorrectAnswer = answerOptions.some(option => option.correct);
        if (!hasCorrectAnswer) {
            alert(`Question ${index + 1} doesn't have a correct answer marked`);
            return;
        }
        
        // Create question object
        const questionObj = {
            text: questionText,
            options: answerOptions
        };
        
        // Add question image if available
        const imagePreview = questionElement.querySelector('.question-image-preview');
        if (imagePreview && imagePreview.src && !imagePreview.src.endsWith('placeholder.png')) {
            questionObj.image = imagePreview.src;
        }
        
        // Add to questions array
        questions.push(questionObj);
    });
    
    // Get quiz description
    const quizDescription = document.getElementById('quiz-description').value || 'No description';
    
    // Set category to My Quizzes only
    const category = "My Quizzes";
    
    // Get time limit
    const timeLimit = parseInt(document.getElementById('time-limit').value) || 60;
    
    // Get visibility
    const isPublic = document.getElementById('quiz-visibility').checked;
    
    // Create quiz object
    const quiz = {
        id: Date.now().toString(),
        title: quizTitle,
        description: quizDescription,
        category: category,
        timeLimit: timeLimit,
        public: isPublic,
        questions: questions,
        createdAt: new Date().toISOString(),
        createdBy: getCurrentUser() || 'anonymous'
    };
    
    // Save to localStorage
    const userQuizzes = JSON.parse(localStorage.getItem('userQuizzes')) || [];
    userQuizzes.push(quiz);
    localStorage.setItem('userQuizzes', JSON.stringify(userQuizzes));
    
    // Update user stats
    updateUserStats('quizzesCreated');
    
    // Reset form
    document.getElementById('create-quiz-form').reset();
    
    // Show success message
    alert('Quiz created successfully!');
    
    // Go back to categories screen and show the new quiz
    showScreen('categories-screen');
    updateCategoriesWithUserQuizzes();
}

// Function to reset quiz creation form
function resetQuizCreationForm() {
    document.getElementById('quiz-title').value = '';
    document.getElementById('quiz-description').value = '';
    document.getElementById('quiz-time').value = '10';
    document.getElementById('quiz-visibility').value = 'Public';
    
    // Reset questions (keep only one)
    const questionList = document.getElementById('question-list');
    const questions = questionList.querySelectorAll('.question-item');
    
    // Remove all questions except the first one
    for (let i = 1; i < questions.length; i++) {
        questions[i].remove();
    }
    
    // Clear first question inputs
    if (questions.length > 0) {
        const firstQuestion = questions[0];
        firstQuestion.querySelector('.question-text').value = '';
        
        const options = firstQuestion.querySelectorAll('.answer-option input[type="text"]');
        options.forEach(option => {
            option.value = '';
        });
        
        const checkboxes = firstQuestion.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
    }
    
    // Reset question counter
    questionCount = 1;
    
    // Reset question images
    questionImages = {};
    
    // Update question counter display
    updateQuestionCounter();
}

// Function to update the question counter display
function updateQuestionCounter() {
    const questionCounter = document.querySelector('.question-counter');
    const questionList = document.getElementById('question-list');
    const currentCount = questionList.querySelectorAll('.question-item').length;
    
    if (questionCounter) {
        questionCounter.textContent = `${currentCount}/45`;
    }
}

// Function to handle question image preview
function previewQuestionImage(input, questionIndex) {
    const file = input.files[0];
    if (file) {
        // Validate file type
        if (!file.type.match('image.*')) {
            alert('Please select an image file');
            return;
        }
        
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('Image size should be less than 5MB');
            return;
        }
        
        const reader = new FileReader();
        
        reader.onload = function(e) {
            // Store image data
            questionImages[questionIndex] = {
                data: e.target.result,
                name: file.name,
                type: file.type
            };
            
            // Update preview
            const questionItem = document.querySelectorAll('.question-item')[questionIndex];
            const preview = questionItem.querySelector('.question-image-preview');
            const removeBtn = questionItem.querySelector('.remove-image-btn');
            
            preview.src = e.target.result;
            preview.style.display = 'block';
            removeBtn.style.display = 'block';
        };
        
        reader.readAsDataURL(file);
    }
}

// Function to remove question image
function removeQuestionImage(questionIndex) {
    // Remove image data
    if (questionImages[questionIndex]) {
        delete questionImages[questionIndex];
    }
    
    // Update UI
    const questionItem = document.querySelectorAll('.question-item')[questionIndex];
    const preview = questionItem.querySelector('.question-image-preview');
    const removeBtn = questionItem.querySelector('.remove-image-btn');
    const fileInput = questionItem.querySelector('.question-image-input');
    
    preview.src = '';
    preview.style.display = 'none';
    removeBtn.style.display = 'none';
    fileInput.value = ''; // Reset file input
}

// Function to handle login
function handleLogin() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const rememberMe = document.getElementById('remember-me').checked;
    
    // Clear any existing error messages
    clearValidationErrors('login-form');
    
    // Hide notification if it's visible
    const notification = document.getElementById('login-notification');
    if (notification) {
        notification.style.display = 'none';
    }
    
    // Hide social login notification if it's visible
    const socialNotification = document.getElementById('social-login-notification');
    if (socialNotification) {
        socialNotification.style.display = 'none';
    }
    
    // Validate inputs
    let isValid = true;
    
    // Check for empty fields
    if (!email) {
        showValidationError('login-email', 'Email is required');
        isValid = false;
    } else if (!validateEmail(email)) {
        showValidationError('login-email', 'Please enter a valid email address');
        isValid = false;
    }
    
    if (!password) {
        showValidationError('login-password', 'Password is required');
        isValid = false;
    }
    
    if (!isValid) return;
    
    // Check if user is registered
    const users = JSON.parse(localStorage.getItem('registeredUsers')) || [];
    let user = users.find(user => user.email === email);
    
    if (!user) {
        // Check if this email is connected to an existing account as a social login
        const userWithSocialConnection = users.find(u => 
            u.socialConnections && 
            ((u.socialConnections.google && u.socialConnections.google.email === email) || 
            (u.socialConnections.facebook && u.socialConnections.facebook.email === email))
        );
        
        if (userWithSocialConnection) {
            // Email is connected to an account, login with the main account
            user = userWithSocialConnection;
        } else {
            // Show friendly notification for non-existent user
            if (notification) {
                notification.style.display = 'block';
            }
            return;
        }
    }
    
    // Check if this is a social login account (standalone, not connected)
    if (user.socialLogin) {
        // Show social login notification
        if (socialNotification) {
            socialNotification.style.display = 'block';
            
            // Clear form errors
            clearValidationErrors('login-form');
        }
        return;
    }
    
    // Check password for regular accounts (not needed for connected social accounts)
    if (!user.socialConnections || 
        !(user.socialConnections.google && user.socialConnections.google.email === email) && 
        !(user.socialConnections.facebook && user.socialConnections.facebook.email === email)) {
        
        if (user.password !== password) {
            showValidationError('login-password', 'Invalid password');
            return;
        }
    }
    
    // Login successful
    showScreen('categories-screen');
    
    // Save login info to localStorage or sessionStorage based on remember me
    if (rememberMe) {
        // If remember me is checked, store in localStorage (persists across browser sessions)
        localStorage.setItem('user_email', user.email); // Always store the main account email
        localStorage.setItem('remember_me', 'true');
    } else {
        // If remember me is not checked, use sessionStorage (cleared when browser is closed)
        sessionStorage.setItem('user_email', user.email); // Always store the main account email
        localStorage.removeItem('remember_me');
    }
}

// Function to handle signup
function handleSignup() {
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm-password').value;
    
    // Clear any existing error messages
    clearValidationErrors('signup-form');
    
    // Validate inputs
    let isValid = true;
    
    // Check for empty fields
    if (!email) {
        showValidationError('signup-email', 'Email is required');
        isValid = false;
    } else if (!validateEmail(email)) {
        showValidationError('signup-email', 'Please enter a valid email address');
        isValid = false;
    }
    
    if (!password) {
        showValidationError('signup-password', 'Password is required');
        isValid = false;
    } else if (password.length < 6) {
        showValidationError('signup-password', 'Password must be at least 6 characters');
        isValid = false;
    }
    
    if (!confirmPassword) {
        showValidationError('signup-confirm-password', 'Please confirm your password');
        isValid = false;
    } else if (password !== confirmPassword) {
        showValidationError('signup-confirm-password', 'Passwords do not match');
        isValid = false;
    }
    
    if (!isValid) return;
    
    // Check if email is already registered
    const users = JSON.parse(localStorage.getItem('registeredUsers')) || [];
    if (users.some(user => user.email === email)) {
        showValidationError('signup-email', 'This email is already registered');
        return;
    }
    
    // Add the new user to the registered users
    users.push({ email, password });
    localStorage.setItem('registeredUsers', JSON.stringify(users));
    
    // For demo purposes, any signup works
    // In a real app, you would send to backend
    showScreen('categories-screen');
    
    // Save signup info to localStorage
    localStorage.setItem('user_email', email);
    
    // Create default profile
    userProfile.name = email.split('@')[0]; // Use part before @ as name
    userProfile.username = email.split('@')[0];
    localStorage.setItem('userProfile', JSON.stringify(userProfile));
}

// Function to show validation error
function showValidationError(inputId, message) {
    const inputElement = document.getElementById(inputId);
    if (!inputElement) return;
    
    // Create error message element if it doesn't exist
    let errorElement = inputElement.nextElementSibling;
    if (!errorElement || !errorElement.classList.contains('validation-error')) {
        errorElement = document.createElement('div');
        errorElement.className = 'validation-error';
        inputElement.parentNode.insertBefore(errorElement, inputElement.nextSibling);
    }
    
    // Set error message and add error class to input
    errorElement.textContent = message;
    inputElement.classList.add('input-error');
}

// Function to clear validation errors
function clearValidationErrors(formId) {
    const form = document.getElementById(formId);
    if (!form) return;
    
    // Remove all error messages
    const errorElements = form.querySelectorAll('.validation-error');
    errorElements.forEach(element => {
        element.remove();
    });
    
    // Remove error class from inputs
    const inputElements = form.querySelectorAll('.input-error');
    inputElements.forEach(input => {
        input.classList.remove('input-error');
    });
}

// Function to validate email format
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Function to handle Google login
function handleGoogleLogin() {
    // In a real implementation, this would use the Google OAuth API
    // For this demo, we'll simulate a successful Google login
    const randomEmail = `user${Math.floor(Math.random() * 1000)}@gmail.com`;
    const randomName = `Google User ${Math.floor(Math.random() * 1000)}`;
    
    // Register user if not already registered
    registerSocialUser(randomEmail, randomName, 'google');
    
    // Log the user in
    loginSocialUser(randomEmail, 'google');
}

// Function to handle Facebook login
function handleFacebookLogin() {
    // In a real implementation, this would use the Facebook Login API
    // For this demo, we'll simulate a successful Facebook login
    const randomEmail = `user${Math.floor(Math.random() * 1000)}@facebook.com`;
    const randomName = `Facebook User ${Math.floor(Math.random() * 1000)}`;
    
    // Register user if not already registered
    registerSocialUser(randomEmail, randomName, 'facebook');
    
    // Log the user in
    loginSocialUser(randomEmail, 'facebook');
}

// Helper function to register a social media user
function registerSocialUser(email, name, provider) {
    // Get existing users
    const users = JSON.parse(localStorage.getItem('registeredUsers')) || [];
    
    // Check if user already exists
    if (!users.some(user => user.email === email)) {
        // Add the new user with social provider info
        users.push({ 
            email: email, 
            password: null, // No password for social logins
            name: name,
            provider: provider,
            socialLogin: true
        });
        localStorage.setItem('registeredUsers', JSON.stringify(users));
        
        // Create default profile
        userProfile.name = name;
        userProfile.username = name.replace(/\s+/g, '').toLowerCase();
        localStorage.setItem('userProfile', JSON.stringify(userProfile));
    }
}

// Helper function to login a social media user
function loginSocialUser(email, provider) {
    // Hide any error messages or notifications
    const notification = document.getElementById('login-notification');
    if (notification) {
        notification.style.display = 'none';
    }
    
    // Navigate to the main app
    showScreen('categories-screen');
    
    // Save login info
    localStorage.setItem('user_email', email);
    localStorage.setItem('social_provider', provider);
    localStorage.setItem('remember_me', 'true'); // Social logins are remembered by default
}

// Initialize the application when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Check for saved login credentials
    checkSavedLogin();
    
    // Show login form by default
    toggleAuthForms('login');
    
    // Set up real-time validation for form inputs
    setupFormValidation();
    
    // Add event listeners to category items
    const categoryItems = document.querySelectorAll('.category-item');
    categoryItems.forEach(item => {
        item.addEventListener('click', function() {
            const categoryName = this.querySelector('.category-name').textContent;
            loadQuizByCategory(categoryName);
        });
    });
    
    // Set up interest tag event listeners
    const interestTags = document.querySelectorAll('.interest-tag');
    interestTags.forEach(tag => {
        tag.addEventListener('click', toggleInterestTag);
    });
    
    // Add event listener for quiz creation form submission
    const createQuizForm = document.getElementById('create-quiz-form');
    if (createQuizForm) {
        createQuizForm.addEventListener('submit', createQuiz);
    }
    
    // Add event listener for the save quiz button
    const saveQuizButton = document.getElementById('save-quiz-button');
    if (saveQuizButton) {
        saveQuizButton.addEventListener('click', function(event) {
            event.preventDefault();
            createQuiz(event);
        });
    }
    
    // Load user created quizzes from localStorage
    const savedQuizzes = localStorage.getItem('userCreatedQuizzes');
    if (savedQuizzes) {
        userCreatedQuizzes = JSON.parse(savedQuizzes);
        
        // Add user created quizzes to the main quizzes array
        userCreatedQuizzes.forEach(uQuiz => {
            const existingCategory = quizzes.find(q => q.category === uQuiz.category);
            if (existingCategory) {
                // Add questions to existing category
                uQuiz.questions.forEach(q => {
                    // Only add if not already in the array
                    const questionExists = existingCategory.questions.some(eq => eq.text === q.text);
                    if (!questionExists) {
                        existingCategory.questions.push(q);
                    }
                });
            } else {
                // Create new category
                quizzes.push({
                    category: uQuiz.category,
                    questions: uQuiz.questions
                });
            }
        });
        
        // Update category count display
        const categoryCount = document.querySelector('.category-count');
        if (categoryCount) {
            const questionCount = quizzes.find(q => q.category === 'teori test')?.questions.length || 0;
            categoryCount.textContent = `${questionCount} Quizzes`;
        }
    }
    
    // Show profile screen when showScreen('profile-screen') is called
    document.getElementById('profile-screen').addEventListener('show', function() {
        loadUserProfile();
    });
    
    // Custom event listener for showScreen function
    const originalShowScreen = showScreen;
    window.showScreen = function(screenId) {
        originalShowScreen(screenId);
        
        // Dispatch custom event when showing profile screen
        if (screenId === 'profile-screen') {
            loadUserProfile();
        }
        
        // Reset quiz creation form when showing the creation screen
        if (screenId === 'quiz-creation-screen') {
            resetQuizCreationForm();
            updateQuestionCounter();
        }
    };
    
    // Add this near the end of the DOMContentLoaded function
    updateCategoriesWithUserQuizzes();
    
    // Also update after quiz creation
    // Find the resetQuizCreationForm function and add to the end:
    const originalResetQuizCreationForm = resetQuizCreationForm;
    resetQuizCreationForm = function() {
        originalResetQuizCreationForm();
        updateCategoriesWithUserQuizzes();
    };
});

// Function to set up real-time validation for form inputs
function setupFormValidation() {
    // Login form validation
    const loginEmail = document.getElementById('login-email');
    const loginPassword = document.getElementById('login-password');
    
    if (loginEmail) {
        loginEmail.addEventListener('blur', function() {
            validateField(this, 'Email is required', !this.value);
            
            if (this.value && !validateEmail(this.value)) {
                validateField(this, 'Please enter a valid email address', true);
            }
        });
    }
    
    if (loginPassword) {
        loginPassword.addEventListener('blur', function() {
            validateField(this, 'Password is required', !this.value);
        });
    }
    
    // Signup form validation
    const signupEmail = document.getElementById('signup-email');
    const signupPassword = document.getElementById('signup-password');
    const signupConfirmPassword = document.getElementById('signup-confirm-password');
    
    if (signupEmail) {
        signupEmail.addEventListener('blur', function() {
            validateField(this, 'Email is required', !this.value);
            
            if (this.value && !validateEmail(this.value)) {
                validateField(this, 'Please enter a valid email address', true);
            }
        });
    }
    
    if (signupPassword) {
        signupPassword.addEventListener('blur', function() {
            validateField(this, 'Password is required', !this.value);
            
            if (this.value && this.value.length < 6) {
                validateField(this, 'Password must be at least 6 characters', true);
            }
            
            // Check password match if confirm password has a value
            const confirmPwd = document.getElementById('signup-confirm-password');
            if (confirmPwd && confirmPwd.value) {
                validateField(confirmPwd, 'Passwords do not match', this.value !== confirmPwd.value);
            }
        });
    }
    
    if (signupConfirmPassword) {
        signupConfirmPassword.addEventListener('blur', function() {
            validateField(this, 'Please confirm your password', !this.value);
            
            const pwd = document.getElementById('signup-password');
            if (this.value && pwd && pwd.value) {
                validateField(this, 'Passwords do not match', this.value !== pwd.value);
            }
        });
    }
}

// Helper function for field validation
function validateField(inputElement, errorMessage, hasError) {
    // Remove any existing error message
    let errorElement = inputElement.nextElementSibling;
    if (errorElement && errorElement.classList.contains('validation-error')) {
        errorElement.remove();
    }
    
    // Remove error class
    inputElement.classList.remove('input-error');
    
    // If there's an error, show it
    if (hasError) {
        // Create and add error message
        errorElement = document.createElement('div');
        errorElement.className = 'validation-error';
        errorElement.textContent = errorMessage;
        inputElement.parentNode.insertBefore(errorElement, inputElement.nextSibling);
        
        // Add error class to input
        inputElement.classList.add('input-error');
    }
}

// Function to check for saved login credentials
function checkSavedLogin() {
    // Check if remember me was previously checked
    const rememberMe = localStorage.getItem('remember_me') === 'true';
    
    if (rememberMe) {
        // Get saved email from localStorage
        const savedEmail = localStorage.getItem('user_email');
        
        if (savedEmail) {
            // Fill in the email field
            const emailInput = document.getElementById('login-email');
            if (emailInput) {
                emailInput.value = savedEmail;
            }
            
            // Check the remember me box
            const rememberMeCheckbox = document.getElementById('remember-me');
            if (rememberMeCheckbox) {
                rememberMeCheckbox.checked = true;
            }
            
            // Focus on password field for convenience
            setTimeout(() => {
                const passwordInput = document.getElementById('login-password');
                if (passwordInput) {
                    passwordInput.focus();
                }
            }, 500);
        }
    }
}

// Function to connect Google account to existing user
function connectGoogleAccount() {
    // Check if user is logged in
    const currentUserEmail = localStorage.getItem('user_email');
    if (!currentUserEmail) {
        alert('You must be logged in to connect a social account');
        return;
    }
    
    // Simulate Google OAuth flow
    const randomId = Math.floor(Math.random() * 1000000).toString();
    const googleEmail = `user${randomId}@gmail.com`;
    
    // Add Google connection to the user account
    updateUserSocialConnections(currentUserEmail, 'google', googleEmail);
    
    // Show success message
    alert('Google account connected successfully!');
    
    // Refresh profile if on profile screen
    if (document.getElementById('profile-screen').style.display === 'block') {
        loadUserProfile();
    }
}

// Function to connect Facebook account to existing user
function connectFacebookAccount() {
    // Check if user is logged in
    const currentUserEmail = localStorage.getItem('user_email');
    if (!currentUserEmail) {
        alert('You must be logged in to connect a social account');
        return;
    }
    
    // Simulate Facebook OAuth flow
    const randomId = Math.floor(Math.random() * 1000000).toString();
    const facebookEmail = `user${randomId}@facebook.com`;
    
    // Add Facebook connection to the user account
    updateUserSocialConnections(currentUserEmail, 'facebook', facebookEmail);
    
    // Show success message
    alert('Facebook account connected successfully!');
    
    // Refresh profile if on profile screen
    if (document.getElementById('profile-screen').style.display === 'block') {
        loadUserProfile();
    }
}

// Helper function to update user social connections
function updateUserSocialConnections(userEmail, provider, socialEmail) {
    // Get existing users
    const users = JSON.parse(localStorage.getItem('registeredUsers')) || [];
    
    // Find the user
    const userIndex = users.findIndex(user => user.email === userEmail);
    if (userIndex === -1) return;
    
    // Initialize social connections if it doesn't exist
    if (!users[userIndex].socialConnections) {
        users[userIndex].socialConnections = {};
    }
    
    // Add/update the social connection
    users[userIndex].socialConnections[provider] = {
        email: socialEmail,
        connectedAt: new Date().toISOString()
    };
    
    // Save back to localStorage
    localStorage.setItem('registeredUsers', JSON.stringify(users));
}

// Function to disconnect social account
function disconnectSocialAccount(provider) {
    // Check if user is logged in
    const currentUserEmail = localStorage.getItem('user_email');
    if (!currentUserEmail) return;
    
    // Get existing users
    const users = JSON.parse(localStorage.getItem('registeredUsers')) || [];
    
    // Find the user
    const userIndex = users.findIndex(user => user.email === currentUserEmail);
    if (userIndex === -1) return;
    
    // Check if user has social connections
    if (!users[userIndex].socialConnections || !users[userIndex].socialConnections[provider]) {
        return;
    }
    
    // Remove the social connection
    delete users[userIndex].socialConnections[provider];
    
    // Save back to localStorage
    localStorage.setItem('registeredUsers', JSON.stringify(users));
    
    // Show success message
    alert(`${provider.charAt(0).toUpperCase() + provider.slice(1)} account disconnected`);
    
    // Refresh profile
    loadUserProfile();
}

// Function to update categories screen to show user created quizzes
function updateCategoriesWithUserQuizzes() {
    // Get user quizzes from local storage
    const userQuizzes = JSON.parse(localStorage.getItem('userQuizzes')) || [];
    
    if (userQuizzes.length === 0) {
        // No user quizzes to display
        return;
    }
    
    // Find or create user quizzes section
    let userQuizzesSection = document.querySelector('.user-quizzes-section');
    if (!userQuizzesSection) {
        // Create a new section for user quizzes if it doesn't exist
        userQuizzesSection = document.createElement('section');
        userQuizzesSection.className = 'user-quizzes-section';
        userQuizzesSection.innerHTML = `
            <h2>My Created Quizzes</h2>
            <div class="user-quizzes-container"></div>
        `;
        
        // Get categories container and append this section after it
        const categoriesContainer = document.querySelector('.categories-grid');
        if (categoriesContainer) {
            categoriesContainer.parentNode.insertBefore(userQuizzesSection, categoriesContainer.nextSibling);
        }
    }
    
    // Get the container for user quizzes
    const userQuizzesContainer = userQuizzesSection.querySelector('.user-quizzes-container');
    if (!userQuizzesContainer) return;
    
    // Clear existing content
    userQuizzesContainer.innerHTML = '';
    
    // Add each quiz to the container
    userQuizzes.forEach(quiz => {
        const quizItem = document.createElement('div');
        quizItem.className = 'category-item custom-quiz-item';
        quizItem.innerHTML = `
            <div class="category-icon">📝</div>
            <div class="category-name">${quiz.title}</div>
            <div class="category-count">${quiz.questions.length} questions</div>
        `;
        
        quizItem.addEventListener('click', () => {
            startQuizWithCustomQuestions(quiz);
        });
        
        userQuizzesContainer.appendChild(quizItem);
    });
}

// Function to show My Quizzes screen
function showMyQuizzesScreen() {
    // Get user created quizzes
    const userQuizzes = JSON.parse(localStorage.getItem('userCreatedQuizzes')) || [];
    
    // Check if My Quizzes screen exists
    let myQuizzesScreen = document.getElementById('my-quizzes-screen');
    
    if (!myQuizzesScreen) {
        // Create the screen
        myQuizzesScreen = document.createElement('div');
        myQuizzesScreen.id = 'my-quizzes-screen';
        myQuizzesScreen.className = 'screen';
        myQuizzesScreen.innerHTML = `
            <div class="screen-header">
                <button class="back-button" onclick="showScreen('categories-screen')">
                    <span class="back-arrow">←</span>
                </button>
                <h1>My Quizzes</h1>
            </div>
            <div class="my-quizzes-list"></div>
        `;
        
        // Add to document
        document.body.appendChild(myQuizzesScreen);
    }
    
    // Show the screen
    showScreen('my-quizzes-screen');
    
    // Populate with quizzes
    const quizzesList = myQuizzesScreen.querySelector('.my-quizzes-list');
    quizzesList.innerHTML = '';
    
    if (userQuizzes.length === 0) {
        quizzesList.innerHTML = '<div class="empty-state">You haven\'t created any quizzes yet. Go to Quiz Creation to make your first quiz!</div>';
        return;
    }
    
    userQuizzes.forEach(quiz => {
        const quizItem = document.createElement('div');
        quizItem.className = 'my-quiz-item';
        quizItem.innerHTML = `
            <div class="my-quiz-info">
                <h3>${quiz.title}</h3>
                <p>${quiz.description || 'No description'}</p>
                <div class="my-quiz-meta">
                    <span>${quiz.questions.length} Questions</span>
                    <span>Created: ${new Date(quiz.createdAt).toLocaleDateString()}</span>
                </div>
            </div>
            <div class="my-quiz-actions">
                <button class="play-button" aria-label="Start Quiz">▶</button>
            </div>
        `;
        
        // Add click event to start this quiz
        const playButton = quizItem.querySelector('.play-button');
        playButton.addEventListener('click', function() {
            startQuizWithCustomQuestions(quiz);
        });
        
        quizzesList.appendChild(quizItem);
    });
}

// Function to start a quiz with custom questions
function startQuizWithCustomQuestions(quiz) {
    console.log("Starting quiz:", quiz.title);
    console.log("Questions:", quiz.questions.length);
    
    // Set current quiz
    currentQuiz = {
        category: quiz.title,
        questions: quiz.questions
    };
    
    // Reset question index and answers
    currentQuestionIndex = 0;
    userAnswers = [];
    currentScore = 0;
    
    // Show quiz screen first
    showScreen('quiz-screen');
    
    // Force redraw by small timeout
    setTimeout(() => {
        try {
            // Try to get quiz content to check if it exists
            const quizContent = document.querySelector('.quiz-content');
            console.log("Quiz content found:", quizContent !== null);
            
            // Load first question
            loadQuestion();
            console.log("Loaded first question");
        } catch (error) {
            console.error("Error loading quiz:", error);
            alert("There was an error loading the quiz. Please try again.");
        }
    }, 100);
}

// Helper function to get current user email
function getCurrentUser() {
    // Try to get from localStorage first, then sessionStorage
    return localStorage.getItem('user_email') || sessionStorage.getItem('user_email') || null;
}

// Function to update user stats
function updateUserStats(statName) {
    // Get current user profile
    const userProfile = JSON.parse(localStorage.getItem('userProfile')) || {
        stats: {
            quizzes: 0,
            accuracy: '0%',
            rank: 0,
            quizzesCreated: 0
        }
    };
    
    // Update requested stat
    if (statName === 'quizzesCreated') {
        userProfile.stats.quizzesCreated = (userProfile.stats.quizzesCreated || 0) + 1;
        userProfile.stats.quizzes = userProfile.stats.quizzesCreated;
    }
    
    // Save back to localStorage
    localStorage.setItem('userProfile', JSON.stringify(userProfile));
} 