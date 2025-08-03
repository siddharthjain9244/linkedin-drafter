**LinkedIn Message Drafter
AI-powered tool to craft professional LinkedIn outreach messages for recruiters.**

💡 About the Project
This is a web application designed to help you write personalized and effective LinkedIn messages to recruiters. Instead of sending a generic message, this tool uses a large language model to draft a message that highlights your relevant skills and experience based on your resume and the specific job description you're applying for.

The application allows you to:

Input your personal details (name, current company).

Provide information about the target role and recruiter.

Paste your resume and the job description.

Or, use the built-in scraper to automatically extract job details from a URL.

This makes the process of sending personalized outreach messages fast and efficient, increasing your chances of getting a response.

✨ Key Features
Personalized Messaging: Generates a unique message by analyzing your resume against a specific job description.

Job Details Scraper: Automatically extracts job descriptions from popular job sites like LinkedIn and Indeed by simply providing the URL.

Secure API Handling: Uses environment variables to securely handle API keys, ensuring they are not exposed in the source code.

Clean and Modern UI: A simple, intuitive interface built with React that is easy to navigate.

🚀 Getting Started
To get a local copy of the project up and running, follow these simple steps.

Prerequisites
You will need to have Node.js installed on your machine.

Installation
Clone the repository:

git clone https://github.com/siddharthjain9244/linkedin-drafter.git

Navigate to the project directory:

cd linkedin-drafter

Install dependencies:

npm install

Set up API Keys:
You will need a Gemini API key and a Scrape.do API key to use the full functionality of the application.

Create a .env file in the root of your project.

Add your API keys to the file, like this:

VITE_GEMINI_API_KEY=YOUR_GEMINI_API_KEY
VITE_SCRAPE_DO_API_TOKEN=YOUR_SCRAPE_DO_TOKEN

Note: Make sure .env is in your .gitignore file so your keys are not uploaded to GitHub.

Run the application:

npm run dev

The application will now be running on a local server, typically at http://localhost:5173.

🖥️ Usage
Fill in the form with your personal information and the details of the job and recruiter.

Paste your resume and the job description into the respective text boxes, or use the "Job URL" option to automatically extract the job description from a supported job site.

Click the "Draft Personalized LinkedIn Message" button.

The AI-generated message will appear, ready for you to copy and send.

⚙️ Deployment
This project is a static web application and can be easily deployed to a service like GitHub Pages.

Make sure you have configured the base path in vite.config.js for your repository name.

Run the deployment command:

npm run deploy

🙏 Acknowledgments
Vite & React: For the project's front-end development environment.

Gemini API: For the powerful text generation capabilities.

Scrape.do API: For the web scraping functionality.

Custom CSS: For the clean, responsive user interface design.
