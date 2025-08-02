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
  const [jobUrl, setJobUrl] = useState('');
  const [useJobUrl, setUseJobUrl] = useState(false);
  const [linkedinMessage, setLinkedinMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isScrapingJob, setIsScrapingJob] = useState(false);
  const [error, setError] = useState('');

  // Function to scrape job details from a URL using scrape.do API
  const scrapeJobDetails = async () => {
    if (!jobUrl.trim()) {
      setError('Please enter a valid job URL');
      return;
    }

    setIsScrapingJob(true);
    setError('');

    try {
      // The scrape.do API token is provided by the developer
      const scrapeApiToken = "f17f8292f3744621a92bb83dd9f8921d9715873253d"; // Replace with your actual token
      
      // Use scrape.do API for better scraping capabilities
      const scrapeApiUrl = `https://api.scrape.do/?token=${encodeURIComponent(scrapeApiToken)}&url=${encodeURIComponent(jobUrl)}`;
      
      const response = await fetch(scrapeApiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Invalid API token. Please check your scrape.do token.');
        } else if (response.status === 403) {
          throw new Error('Access denied. Please check your scrape.do subscription.');
        } else if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }
        throw new Error(`Failed to fetch job page: ${response.status} ${response.statusText}`);
      }

      const htmlContent = await response.text();

      // Parse the HTML to extract job details
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, 'text/html');

      // Extract job description using comprehensive selectors for various job sites
      let extractedJobDescription = '';
      let extractedCompany = '';
      let extractedRole = '';
      
      // Enhanced selectors for popular job sites
      const jobDescriptionSelectors = [
        // LinkedIn
        '.description__text',
        '.jobs-description-content__text',
        '.jobs-description__container',
        
        // Indeed
        '.jobsearch-jobDescriptionText',
        '#jobDescriptionText',
        '.jobsearch-JobComponent-description',
        
        // Glassdoor
        '.jobDescriptionContent',
        '[data-test="jobDescription"]',
        
        // AngelList/Wellfound
        '[data-test-id="job-description"]',
        '.job-description',
        
        // Monster
        '.job-description-container',
        
        // ZipRecruiter
        '.job_description',
        
        // Generic selectors
        '[data-testid="job-description"]',
        '[data-test="job-description"]',
        '.job-details',
        '.job-content',
        '.description',
        '[class*="description"]',
        '[class*="job-details"]',
        '.posting-description',
        '.job-posting-description',
        '.job-summary',
        '.position-description',
        
        // Fallback selectors
        'main [role="main"]',
        'main',
        'article',
        '.content'
      ];

      // Try each selector until we find content
      for (const selector of jobDescriptionSelectors) {
        const element = doc.querySelector(selector);
        if (element) {
          const text = element.textContent || element.innerText || '';
          if (text.length > 100) { // Only use if substantial content
            extractedJobDescription = text;
            break;
          }
        }
      }

      // Extract company name from various sources
      const companySelectors = [
        // LinkedIn
        '.jobs-details-top-card__company-url',
        '.job-details-jobs-unified-top-card__company-name',
        
        // Indeed
        '.jobsearch-InlineCompanyRating',
        '[data-testid="inlineHeader-companyName"]',
        
        // General
        '[data-test="employer-name"]',
        '.company-name',
        '[class*="company"]',
        'h1 + div',
        'title'
      ];

      for (const selector of companySelectors) {
        const element = doc.querySelector(selector);
        if (element) {
          const text = (element.textContent || element.innerText || '').trim();
          if (text && !text.toLowerCase().includes('job') && text.length < 100) {
            extractedCompany = text;
            break;
          }
        }
      }

      // Extract role/title from various sources
      const roleSelectors = [
        // LinkedIn
        '.jobs-details-top-card__job-title',
        
        // Indeed
        '[data-testid="jobTitle"]',
        '.jobsearch-JobInfoHeader-title',
        
        // General
        'h1',
        '.job-title',
        '[class*="title"]',
        '[data-test="job-title"]'
      ];

      for (const selector of roleSelectors) {
        const element = doc.querySelector(selector);
        if (element) {
          const text = (element.textContent || element.innerText || '').trim();
          if (text && text.length < 200) {
            extractedRole = text;
            break;
          }
        }
      }

      // Clean up the extracted text
      if (extractedJobDescription) {
        extractedJobDescription = extractedJobDescription
          .replace(/\s+/g, ' ')
          .replace(/\n\s*\n/g, '\n')
          .trim();
      }

      // Set the extracted data
      if (extractedJobDescription && extractedJobDescription.length > 100) {
        setJobDescription(extractedJobDescription);
        
        // Auto-fill company name and role if not already filled and we extracted them
        if (!companyName && extractedCompany) {
          setCompanyName(extractedCompany);
        }

        if (!role && extractedRole) {
          setRole(extractedRole);
        }

        setError('');
      } else {
        // If we couldn't extract much, try to get the page title at least
        const titleElement = doc.querySelector('title');
        const pageTitle = titleElement ? titleElement.textContent : '';
        
        if (pageTitle) {
          // Extract info from page title as fallback
          if (!companyName) {
            const companyMatch = pageTitle.match(/at\s+([^|,-]+)/i);
            if (companyMatch) {
              setCompanyName(companyMatch[1].trim());
            }
          }

          if (!role) {
            const roleMatch = pageTitle.match(/^([^|,-]+)/);
            if (roleMatch) {
              setRole(roleMatch[1].trim());
            }
          }
        }

        setError('Could not extract detailed job description from the provided URL. The page structure might not be supported. Please try pasting the job description manually.');
      }

    } catch (err) {
      console.error('Scraping error:', err);
      setError(`Failed to scrape job details: ${err.message}`);
    } finally {
      setIsScrapingJob(false);
    }
  };

  // Function to handle switching between job input methods
  const handleInputMethodChange = (useUrl) => {
    setUseJobUrl(useUrl);
    if (useUrl !== useJobUrl) {
      // Clear job-related fields when switching methods
      setJobDescription('');
      setJobUrl('');
      setError('');
    }
  };

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
              <div className="flex items-center mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Job Information
                </label>
                <div className="ml-4 flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="jobInputMethod"
                      checked={!useJobUrl}
                      onChange={() => handleInputMethodChange(false)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Manual Input</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="jobInputMethod"
                      checked={useJobUrl}
                      onChange={() => handleInputMethodChange(true)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Job URL</span>
                  </label>
                </div>
              </div>

              {useJobUrl ? (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="job-url-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Job URL
                    </label>
                    <input
                      id="job-url-input"
                      type="url"
                      className="w-full p-3 rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      value={jobUrl}
                      onChange={(e) => setJobUrl(e.target.value)}
                      placeholder="https://jobs.linkedin.com/... or https://indeed.com/..."
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Supports LinkedIn, Indeed, Glassdoor, and most major job sites
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={scrapeJobDetails}
                    disabled={isScrapingJob || !jobUrl.trim()}
                    className="w-full bg-green-600 text-white font-semibold py-2 px-4 rounded-xl shadow-lg hover:bg-green-700 transition-colors duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {isScrapingJob ? 'Extracting Job Details...' : 'Extract Job Details'}
                  </button>
                  {jobDescription && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Extracted Job Description (You can edit this)
                      </label>
                      <textarea
                        className="w-full p-3 rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        rows="6"
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        placeholder="Extracted job description will appear here..."
                      ></textarea>
                    </div>
                  )}
                </div>
              ) : (
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
              )}
            </div>
          </div>
        </div>

        <button
          onClick={generateMessage}
          disabled={isLoading || isScrapingJob || !userName || !currentCompany || !companyName || !role || !recruiterName || !resume || !jobDescription}
          className="w-full bg-blue-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:bg-blue-700 transition-colors duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Drafting...' : isScrapingJob ? 'Extracting Job Details...' : 'Draft Personalized LinkedIn Message'}
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
