import React, { useState, useEffect } from 'react';

// The main App component for our LinkedIn message drafter.
const App = () => {
  // State variables to hold the user inputs and the generated output.
  const [userName, setUserName] = useState('');
  const [currentCompany, setCurrentCompany] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [role, setRole] = useState('');
  const [recruiterName, setRecruiterName] = useState('');
  const [resume, setResume] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [linkedinMessage, setLinkedinMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Function to handle the API call to the Gemini model with exponential backoff.
  const generateMessage = async () => {
    // Clear previous results and show loading indicator.
    setLinkedinMessage('');
    setError('');
    setIsLoading(true);

    // The prompt for the LLM, instructing it to act as a career advisor.
    const prompt = `
      You are a career advisor. Draft a professional, concise, and engaging LinkedIn message from ${userName} (currently working at ${currentCompany}) to ${recruiterName} at ${companyName} for the ${role} position. The message should be polite, personalized, and directly reference how the candidate's experience and skills from their resume align with the requirements of the job description. Address the recruiter by name and mention the specific company name and role in the message. Do not make up any information. If you cannot find a direct match, write a general but polite message.

      Candidate Name: ${userName}
      Current Company: ${currentCompany}
      Target Company: ${companyName}
      Role/Position: ${role}
      Recruiter Name: ${recruiterName}
      
      Candidate's Resume:
      ${resume}

      Job Description:
      ${jobDescription}

      Draft the LinkedIn message below. The message should be ready to copy and paste and should start with a proper greeting to the recruiter.
    `;

    // API payload for the Gemini model.
    const payload = {
      contents: [{
        role: "user",
        parts: [{ text: prompt }]
      }]
    };
    
    // The API key is provided by the canvas environment.
    const apiKey = "AIzaSyC0HbONDZt_jeveRJiNeI_gq-mftoLBTg4";
    // The API URL for the gemini-2.5-flash-preview-05-20 model.
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

    let retries = 0;
    const maxRetries = 5;
    let delay = 1000; // Start with 1 second delay.

    while (retries < maxRetries) {
      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          if (response.status === 429) { // Too Many Requests
            retries++;
            console.warn(`Retry attempt ${retries}/${maxRetries}. Retrying in ${delay}ms...`);
            await new Promise(res => setTimeout(res, delay));
            delay *= 2; // Exponential backoff
            continue; // Skip the rest of the loop and try again.
          }
          throw new Error(`API error: ${response.statusText}`);
        }

        const result = await response.json();
        
        // Extract the generated text from the API response.
        if (result.candidates && result.candidates.length > 0 &&
            result.candidates[0].content && result.candidates[0].content.parts &&
            result.candidates[0].content.parts.length > 0) {
          const text = result.candidates[0].content.parts[0].text;
          setLinkedinMessage(text);
        } else {
          setError('Could not generate a message. Please try again.');
        }

        break; // Break the loop on success.

      } catch (e) {
        // Handle network errors or other exceptions.
        setError(`An error occurred: ${e.message}`);
        break; // Break the loop on a critical error.
      }
    }

    if (retries === maxRetries) {
      setError('Too many requests. Please try again later.');
    }

    setIsLoading(false);
  };

  // The UI of the application.
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4 font-sans">
      <div className="bg-white dark:bg-gray-800 shadow-2xl rounded-2xl p-8 max-w-4xl w-full">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-900 dark:text-gray-50">
          LinkedIn Message Drafter
        </h1>

        {/* Personal Information */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
            Your Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="user-name-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Your Name
              </label>
              <input
                id="user-name-input"
                type="text"
                className="w-full p-3 rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="e.g., John Smith"
              />
            </div>
            <div>
              <label htmlFor="current-company-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Current Company
              </label>
              <input
                id="current-company-input"
                type="text"
                className="w-full p-3 rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                value={currentCompany}
                onChange={(e) => setCurrentCompany(e.target.value)}
                placeholder="e.g., Apple, Amazon, Startup Inc..."
              />
            </div>
          </div>
        </div>

        {/* Target Information */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
            Target Opportunity
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="company-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Target Company
              </label>
              <input
                id="company-input"
                type="text"
                className="w-full p-3 rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g., Google, Microsoft..."
              />
            </div>
            <div>
              <label htmlFor="role-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Role/Position
              </label>
              <input
                id="role-input"
                type="text"
                className="w-full p-3 rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g., Software Engineer..."
              />
            </div>
            <div>
              <label htmlFor="recruiter-name-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Recruiter's Name
              </label>
              <input
                id="recruiter-name-input"
                type="text"
                className="w-full p-3 rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                value={recruiterName}
                onChange={(e) => setRecruiterName(e.target.value)}
                placeholder="e.g., Sarah Johnson"
              />
            </div>
          </div>
        </div>

        {/* Content Information */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
            Content & Requirements
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="resume-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Your Resume
              </label>
              <textarea
                id="resume-input"
                className="w-full p-3 rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                rows="8"
                value={resume}
                onChange={(e) => setResume(e.target.value)}
                placeholder="Paste your resume here..."
              ></textarea>
            </div>
            <div>
              <label htmlFor="job-description-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Job Description
              </label>
              <textarea
                id="job-description-input"
                className="w-full p-3 rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                rows="8"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the job description here..."
              ></textarea>
            </div>
          </div>
        </div>

        <button
          onClick={generateMessage}
          disabled={isLoading || !userName || !currentCompany || !companyName || !role || !recruiterName || !resume || !jobDescription}
          className="w-full bg-blue-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:bg-blue-700 transition-colors duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Drafting...' : 'Draft Personalized LinkedIn Message'}
        </button>

        {/* Display the output or error messages */}
        <div className="mt-8">
          {error && (
            <div className="bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-200 p-4 rounded-xl shadow-inner text-center">
              {error}
            </div>
          )}

          {linkedinMessage && (
            <div className="bg-green-50 dark:bg-green-900 p-6 rounded-2xl shadow-inner border border-green-200 dark:border-green-700 transition-all duration-300">
              <h2 className="text-xl font-semibold mb-3 text-green-800 dark:text-green-200">
                Generated Message
              </h2>
              <pre className="whitespace-pre-wrap text-gray-800 dark:text-gray-200 font-sans leading-relaxed">
                {linkedinMessage}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
