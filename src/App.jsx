import React, { useState, useRef, useEffect } from 'react';

// The main App component for our LinkedIn message drafter.
const App = () => {
  // State variables to hold the user inputs and the generated output.
  const [userName, setUserName] = useState('');
  const [currentCompany, setCurrentCompany] = useState('');
  const [currentRole, setCurrentRole] = useState(''); // New state for current role
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
  const [isCopied, setIsCopied] = useState(false);

  // A ref to the message output container for auto-scrolling.
  const messageOutputRef = useRef(null);
  // New ref for the main action button
  const generateMessageButtonRef = useRef(null);

  // Get API keys from environment variables for security.
  const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const scrapeApiToken = import.meta.env.VITE_SCRAPE_API_TOKEN;

  // Use useEffect to automatically scroll down when a new message is generated.
  useEffect(() => {
    if (linkedinMessage && messageOutputRef.current) {
      messageOutputRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [linkedinMessage]);

  // Use useEffect to automatically scroll to the "Generate" button after scraping is successful.
  useEffect(() => {
    if (jobDescription && generateMessageButtonRef.current) {
      generateMessageButtonRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [jobDescription]);


  // Function to handle the copy to clipboard functionality
  const handleCopy = () => {
    navigator.clipboard.writeText(linkedinMessage);
    setIsCopied(true);
    setTimeout(() => {
      setIsCopied(false);
    }, 2000); // Hide message after 2 seconds
  };

  // Function to scrape job details from a URL using scrape.do API
  const scrapeJobDetails = async () => {
    if (!jobUrl.trim()) {
      setError('Please enter a valid job URL');
      return;
    }

    if (!scrapeApiToken) {
      setError('Scrape.do API token is missing. Please set it in your environment variables.');
      return;
    }

    setIsScrapingJob(true);
    setError('');

    try {
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

    if (!geminiApiKey) {
        setError('Gemini API key is missing. Please set it in your environment variables.');
        setIsLoading(false);
        return;
    }

    // The prompt for the LLM, instructing it to act as a career advisor.
    const prompt = `
      You are a career advisor. Draft a professional, concise, and engaging outreach message from ${userName} (currently working as a ${currentRole} at ${currentCompany}) to ${recruiterName} at ${companyName} for the ${role} position. The message should be polite, personalized, and directly reference how the candidate's experience and skills from their resume align with the requirements of the job description. Address the recruiter by name and mention the specific company name and role in the message. Do not make up any information. If you cannot find a direct match, write a general but polite message.

      Candidate Name: ${userName}
      Current Role: ${currentRole}
      Current Company: ${currentCompany}
      Target Company: ${companyName}
      Role/Position: ${role}
      Recruiter Name: ${recruiterName}
      
      Candidate's Resume:
      ${resume}

      Job Description:
      ${jobDescription}

      Draft the outreach message below. The message should be ready to copy and paste and should start with a proper greeting to the recruiter.
    `;

    // API payload for the Gemini model.
    const payload = {
      contents: [{
        role: "user",
        parts: [{ text: prompt }]
      }]
    };
    
    // The API URL for the gemini-2.5-flash-preview-05-20 model.
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${geminiApiKey}`;

    let retries = 0;
    const maxRetries = 5;
    let delay = 1000;

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 flex items-center justify-center p-6 font-sans relative overflow-hidden">
      {/* Enhanced Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-gradient-to-br from-blue-500/30 to-purple-500/30 rounded-full blur-2xl animate-bounce" style={{animationDuration: '3s'}}></div>
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-gradient-to-br from-purple-500/40 to-pink-500/40 rounded-full blur-xl animate-bounce" style={{animationDelay: '1s', animationDuration: '4s'}}></div>
        <div className="absolute top-20 right-20 w-64 h-64 bg-gradient-to-br from-indigo-500/35 to-cyan-500/35 rounded-full blur-xl animate-bounce" style={{animationDelay: '2s', animationDuration: '5s'}}></div>
        <div className="absolute top-1/3 left-1/4 w-40 h-40 bg-gradient-to-br from-yellow-400/25 to-orange-400/25 rounded-full blur-lg animate-pulse" style={{animationDelay: '1.5s'}}></div>
        <div className="absolute bottom-1/3 right-1/3 w-48 h-48 bg-gradient-to-br from-emerald-400/30 to-teal-400/30 rounded-full blur-xl animate-pulse" style={{animationDelay: '3s'}}></div>
      </div>
      <div className="bg-white/80 dark:bg-gray-800/90 backdrop-blur-xl shadow-2xl rounded-3xl p-4 max-w-5xl w-full border border-white/10 dark:border-gray-700/20 mx-2 my-2 overflow-hidden hover:shadow-3xl hover:bg-white/85 dark:hover:bg-gray-800/95 transition-all duration-500 relative z-10">
        {/* Clean Centered Header */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl p-5 mb-6 text-white text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10 rounded-2xl"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-center">
              {/* <div className="flex items-center justify-center w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl mr-3 shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div> */}
              <div>
                <h1 className="text-3xl font-bold text-white leading-tight">
                  First Impression AI
                </h1>
                <p className="text-white/90 text-2xl mt-2 font-medium">
                  ✨ AI-powered professional messages that get responses
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Personal Information */}
        <div className="mb-6 p-5 bg-gray-50/50 dark:bg-gray-700/20 rounded-2xl border border-gray-100/60 dark:border-gray-500/15 hover:bg-gray-50/70 dark:hover:bg-gray-700/30 transition-all duration-300">
          <div className="flex items-center mb-4">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg mr-3 shadow-md">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Your Information</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Tell us about yourself</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="user-name-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Your Name
              </label>
              <input
                id="user-name-input"
                type="text"
                className="w-full p-4 rounded-xl border border-gray-200/60 dark:border-gray-500/40 dark:bg-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
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
                className="w-full p-4 rounded-xl border border-gray-200/60 dark:border-gray-500/40 dark:bg-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
                value={currentCompany}
                onChange={(e) => setCurrentCompany(e.target.value)}
                placeholder="e.g., Apple, Amazon, Startup Inc..."
              />
            </div>
            {/* New Input for Current Role */}
            <div>
              <label htmlFor="current-role-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Your Current Role
              </label>
              <input
                id="current-role-input"
                type="text"
                className="w-full p-4 rounded-xl border border-gray-200/60 dark:border-gray-500/40 dark:bg-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
                value={currentRole}
                onChange={(e) => setCurrentRole(e.target.value)}
                placeholder="e.g., Software Developer"
              />
            </div>
          </div>
        </div>

        {/* Target Information */}
        <div className="mb-6 p-5 bg-gray-50/50 dark:bg-gray-700/20 rounded-2xl border border-gray-100/60 dark:border-gray-500/15 hover:bg-gray-50/70 dark:hover:bg-gray-700/30 transition-all duration-300">
          <div className="flex items-center mb-4">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg mr-3 shadow-md">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Target Opportunity</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Details about your dream job</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="company-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Target Company
              </label>
              <input
                id="company-input"
                type="text"
                className="w-full p-4 rounded-xl border border-gray-200/60 dark:border-gray-500/40 dark:bg-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
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
                className="w-full p-4 rounded-xl border border-gray-200/60 dark:border-gray-500/40 dark:bg-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
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
                className="w-full p-4 rounded-xl border border-gray-200/60 dark:border-gray-500/40 dark:bg-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
                value={recruiterName}
                onChange={(e) => setRecruiterName(e.target.value)}
                placeholder="e.g., Sarah Johnson"
              />
            </div>
          </div>
        </div>

        {/* Content Information */}
        <div className="mb-6 p-5 bg-gray-50/50 dark:bg-gray-700/20 rounded-2xl border border-gray-100/60 dark:border-gray-500/15 hover:bg-gray-50/70 dark:hover:bg-gray-700/30 transition-all duration-300">
          <div className="flex items-center mb-4">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg mr-3 shadow-md">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Content & Requirements</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Your resume and job details</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="resume-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Your Resume
              </label>
              <textarea
                id="resume-input"
                className="w-full p-4 rounded-xl border border-gray-200/60 dark:border-gray-500/40 dark:bg-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm resize-none"
                rows="10"
                value={resume}
                onChange={(e) => setResume(e.target.value)}
                placeholder="Paste your resume here..."
              ></textarea>
            </div>
            <div>
              <div className="mb-6 p-4 bg-white/60 dark:bg-gray-600/20 rounded-xl border border-gray-100/50 dark:border-gray-600/20">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                  Job Information Method
                </label>
                <div className="flex flex-col sm:flex-row gap-4">
                  <label className="flex items-center p-3 rounded-lg border border-gray-100 dark:border-gray-600/30 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200">
                    <input
                      type="radio"
                      name="jobInputMethod"
                      checked={!useJobUrl}
                      onChange={() => handleInputMethodChange(false)}
                      className="mr-3 text-blue-600"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Manual Input</span>
                  </label>
                  <label className="flex items-center p-3 rounded-lg border border-gray-100 dark:border-gray-600/30 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200">
                    <input
                      type="radio"
                      name="jobInputMethod"
                      checked={useJobUrl}
                      onChange={() => handleInputMethodChange(true)}
                      className="mr-3 text-blue-600"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Job URL</span>
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
                      className="w-full p-4 rounded-xl border border-gray-200/60 dark:border-gray-500/40 dark:bg-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
                      value={jobUrl}
                      onChange={(e) => setJobUrl(e.target.value)}
                      placeholder="https://indeed.com/..."
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Supports  Indeed, Glassdoor, and most major job sites
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={scrapeJobDetails}
                    disabled={isScrapingJob || !jobUrl.trim()}
                    className="w-full bg-green-600 text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:bg-green-700 transition-all duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed transform hover:scale-[1.01]"
                  >
                    {isScrapingJob ? 'Extracting Job Details...' : 'Extract Job Details'}
                  </button>
                  {jobDescription && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Extracted Job Description (You can edit this)
                      </label>
                                             <textarea
                         className="w-full p-4 rounded-xl border border-gray-200/60 dark:border-gray-500/40 dark:bg-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm resize-none"
                         rows="8"
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
                     className="w-full p-4 rounded-xl border border-gray-200/60 dark:border-gray-500/40 dark:bg-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm resize-none"
                     rows="10"
                     value={jobDescription}
                     onChange={(e) => setJobDescription(e.target.value)}
                     placeholder="Paste the job description here..."
                   ></textarea>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 mb-8">
          <button
            onClick={generateMessage}
            disabled={isLoading || isScrapingJob || !userName || !currentCompany || !currentRole || !companyName || !role || !recruiterName || !resume || !jobDescription}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-5 px-8 rounded-2xl shadow-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transform hover:scale-[1.02] disabled:transform-none"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l1-2.647z"></path>
                </svg>
                <span>Drafting Message...</span>
              </div>
            ) : isScrapingJob ? (
              'Extracting Job Details...'
            ) : '✨ Generate My Winning Message'}
          </button>
        </div>

        {/* Display the output or error messages */}
        <div className="space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200/60 dark:border-red-700/30 text-red-700 dark:text-red-200 p-6 rounded-2xl shadow-lg text-center">
              <div className="flex items-center justify-center mb-2">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.864-.833-2.634 0L4.17 14.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span className="font-semibold">Error</span>
              </div>
              {error}
            </div>
          )}

          {linkedinMessage && (
            <div ref={messageOutputRef} className="bg-green-50 dark:bg-green-900/20 border border-green-200/60 dark:border-green-700/30 p-8 rounded-3xl shadow-2xl transition-all duration-300">
              <div className="flex items-center mb-4">
                <div className="flex items-center justify-center w-10 h-10 bg-green-500 rounded-xl mr-4">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-green-800 dark:text-green-200">
                    🎉 Your Outreach Message is Ready!
                  </h2>
                  <p className="text-green-600 dark:text-green-300 text-sm">Copy and use this personalized message</p>
                </div>
              </div>
              <div className="relative bg-white/80 dark:bg-gray-800/80 p-6 rounded-2xl border border-green-100/40 dark:border-green-600/20">
                <pre className="whitespace-pre-wrap text-gray-800 dark:text-gray-200 font-sans leading-relaxed text-base">
                  {linkedinMessage}
                </pre>
                <button
                  onClick={handleCopy}
                  className={`absolute top-4 right-4 text-white p-2 rounded-lg shadow-lg transition-all duration-200 hover:scale-105 ${
                    isCopied 
                      ? 'bg-green-600' 
                      : 'bg-green-500 hover:bg-green-600'
                  }`}
                  title={isCopied ? "Copied!" : "Copy to clipboard"}
                >
                  {isCopied ? (
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-xs font-medium">Copied!</span>
                    </div>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
