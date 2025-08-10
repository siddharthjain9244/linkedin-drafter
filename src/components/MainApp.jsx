import React, { useState, useRef, useEffect } from 'react';
import { scrapeJobDetails } from '../api/scrapingService';
import { generateMessage } from '../api/generationService';
import { auth } from '../authService';
import axios from 'axios';

const MainApp = ({ onLogout ,user }) => {
  // State variables for app functionality
  const [userName, setUserName] = useState('');
  const [currentCompany, setCurrentCompany] = useState('');
  const [currentRole, setCurrentRole] = useState('');
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
  
  // New state for resume parsing
  const [isParsingResume, setIsParsingResume] = useState(false);
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeInputMethod, setResumeInputMethod] = useState('manual');


  // Refs for auto-scrolling
  const messageOutputRef = useRef(null);
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

  const handleCopy = () => {
    navigator.clipboard.writeText(linkedinMessage);
    setIsCopied(true);
    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  };
  
  const handleScrape = async () => {
    const scrapedDetails = await scrapeJobDetails({
        jobUrl, 
        scrapeApiToken, 
        setError, 
        setIsScrapingJob,
        setJobDescription,
        setCompanyName,
        setRole
    });
    if (scrapedDetails) {
        setJobDescription(scrapedDetails.jobDescription);
        setCompanyName(scrapedDetails.companyName);
        setRole(scrapedDetails.role);
    }
  };

  const handleGenerate = async () => {

    const generatedMessage = await generateMessage({  recruiterName, companyName, role, resume, jobDescription, setError, setIsLoading });
    console.log(generatedMessage);
    if (generatedMessage) {
      setLinkedinMessage(generatedMessage);
    }
    else{
      setError('Failed to generate message. Please try again.');
    }
  };

  const handleJobInputMethodChange = (useUrl) => {
    setUseJobUrl(useUrl);
    if (useUrl !== useJobUrl) {
      setJobDescription('');
      setJobUrl('');
      setError('');
    }
  };

  // New function to handle file upload and API call
  const handleResumeFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setResumeFile(file);
    setIsParsingResume(true);
    setError('');

    const formData = new FormData();
    formData.append('resume', file);
    
    try {
        // const response = await fetch('http://localhost:3000/api/parse-resume', {
        //     method: 'POST',
        //     body: formData,
        // });
        const response = await axios.post(
          'https://linkedin-drafter-backend.onrender.com/api/parse-resume',
          formData,
          {
              timeout: 60000, // 5 seconds
              headers: { 'Content-Type': 'multipart/form-data' }
          }
      );

        // if (!response.ok) {
        //     throw new Error(`API error: ${response.statusText}`);
        // }
        let data = response.data.data;
        console.log(data);
        // Assuming the API returns a JSON object with resume_text field and user info
        if (data.extractedData) {
            setResume(data.extractedData);
            setUserName(data.extractedData.userName || '');
            setCurrentRole(data.extractedData.currentRole || '');
            setCurrentCompany(data.extractedData.currentCompany || '');
            setError('');
        } else {
            setError('Could not extract text from the resume. Please try a different file.');
        }

    } catch (apiError) {
        console.error('Resume parsing API error:', apiError);
        setError(`Failed to parse resume: ${apiError.message}`);
    } finally {
        setIsParsingResume(false);
    }
  };

  const handleResumeInputMethodChange = (method) => {
    setResumeInputMethod(method);
    if (method === 'manual') {
      setResumeFile(null);
    } else {
      setResume('');
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 flex items-center justify-center p-6 font-sans relative overflow-hidden">
      <style>{`
        /* ... (CSS styles remain unchanged) ... */
        .logout-button {
            position: absolute;
            top: 1.5rem;
            right: 1.5rem;
            background-color: rgba(239, 68, 68, 0.9);
            color: #fff;
            padding: 0.5rem 1rem;
            border-radius: 0.75rem;
            font-weight: 600;
            border: none;
            cursor: pointer;
            z-index: 20;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            transition: all 0.2s ease-in-out;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .logout-button:hover {
            background-color: rgba(220, 38, 38, 0.9);
            transform: translateY(-2px);
            box-shadow: 0 6px 8px -2px rgba(0, 0, 0, 0.1);
        }

        @keyframes fade-in-out {
          0% { opacity: 0; transform: translateY(10px); }
          20% { opacity: 1; transform: translateY(0); }
          80% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(10px); }
        }

        .animate-fade-in-out {
          animation: fade-in-out 2s forwards;
        }

        @media (prefers-color-scheme: dark) {
          #app-container {
            background-color: #1f2937;
          }
          #main-card {
            background-color: rgba(31, 41, 55, 0.9);
            border-color: rgba(75, 85, 99, 0.2);
          }
          .header-title {
            color: #f9fafb;
          }
          .info-card {
            background-color: rgba(55, 65, 81, 0.2);
            border-color: rgba(107, 114, 128, 0.15);
          }
          .info-card:hover {
            background-color: rgba(55, 65, 81, 0.3);
          }
          .card-title {
            color: #f3f4f6;
          }
          .card-subtitle {
            color: #9ca3af;
          }
          .label {
            color: #d1d5db;
          }
          .input-field, .textarea-field {
            background-color: #374151;
            color: #e5e7eb;
            border-color: rgba(107, 114, 128, 0.4);
          }
          .radio-label {
            border-color: rgba(107, 114, 128, 0.3);
          }
          .radio-label:hover {
            background-color: rgba(29, 78, 216, 0.2);
          }
          .radio-label span {
            color: #d1d5db;
          }
          .error-message {
            background-color: rgba(153, 27, 27, 0.2);
            border-color: rgba(153, 27, 27, 0.3);
            color: #fecaca;
          }
          .message-output {
            background-color: rgba(17, 94, 69, 0.2);
            border-color: rgba(20, 83, 45, 0.3);
          }
          .message-title {
            color: #d1fae5;
          }
          .message-subtitle {
            color: #a7f3d0;
          }
          .message-content-box {
            background-color: rgba(31, 41, 55, 0.8);
            border-color: rgba(110, 231, 183, 0.2);
          }
          .message-text {
            color: #e5e7eb;
          }
        }
      `}</style>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-gradient-to-br from-blue-500/30 to-purple-500/30 rounded-full blur-2xl animate-bounce" style={{animationDuration: '3s'}}></div>
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-gradient-to-br from-purple-500/40 to-pink-500/40 rounded-full blur-xl animate-bounce" style={{animationDelay: '1s', animationDuration: '4s'}}></div>
        <div className="absolute top-20 right-20 w-64 h-64 bg-gradient-to-br from-indigo-500/35 to-cyan-500/35 rounded-full blur-xl animate-bounce" style={{animationDelay: '2s', animationDuration: '5s'}}></div>
        <div className="absolute top-1/3 left-1/4 w-40 h-40 bg-gradient-to-br from-yellow-400/25 to-orange-400/25 rounded-full blur-lg animate-pulse" style={{animationDelay: '1.5s'}}></div>
        <div className="absolute bottom-1/3 right-1/3 w-48 h-48 bg-gradient-to-br from-emerald-400/30 to-teal-400/30 rounded-full blur-xl animate-pulse" style={{animationDelay: '3s'}}></div>
      </div>
      <div className="bg-white/80 dark:bg-gray-800/90 backdrop-blur-xl shadow-2xl rounded-3xl p-4 max-w-5xl w-full border border-white/10 dark:border-gray-700/20 mx-2 my-2 overflow-hidden hover:shadow-3xl hover:bg-white/85 dark:hover:bg-gray-800/95 transition-all duration-500 relative z-10">
        {user && (
          <button 
            onClick={onLogout} 
            className="logout-button"
          >
            <svg width="20px" height="20px" viewBox="0 0 0.563 0.563" fill="none" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" clipRule="evenodd" d="M0.038 0.038h0.262v0.038H0.075v0.413h0.225v0.038H0.038zm0.369 0.118 0.125 0.125 -0.125 0.135 -0.027 -0.026 0.084 -0.09H0.15V0.262h0.311L0.38 0.182z" fill="#000000"/></svg>
            Logout
          </button>
        )}
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
              <div className="mb-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <label className="flex items-center p-3 rounded-lg border border-gray-100 dark:border-gray-600/30 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200">
                    <input
                      type="radio"
                      name="resumeInputMethod"
                      checked={resumeInputMethod === 'manual'}
                      onChange={() => handleResumeInputMethodChange('manual')}
                      className="mr-3 text-blue-600"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Paste Resume Text</span>
                  </label>
                  <label className="flex items-center p-3 rounded-lg border border-gray-100 dark:border-gray-600/30 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200">
                    <input
                      type="radio"
                      name="resumeInputMethod"
                      checked={resumeInputMethod === 'upload'}
                      onChange={() => handleResumeInputMethodChange('upload')}
                      className="mr-3 text-blue-600"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Upload Resume File</span>
                  </label>
                </div>
              </div>

              {resumeInputMethod === 'manual' ? (
                <textarea
                  id="resume-input"
                  className="w-full p-4 rounded-xl border border-gray-200/60 dark:border-gray-500/40 dark:bg-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm resize-none"
                  rows="10"
                  value={resume}
                  onChange={(e) => setResume(e.target.value)}
                  placeholder="Paste your resume here..."
                  disabled={isParsingResume}
                ></textarea>
              ) : (
                <div className="flex flex-col items-center justify-center w-full h-40 bg-gray-100 dark:bg-gray-700 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-500 cursor-pointer hover:border-blue-500 transition-colors duration-200">
                  <label htmlFor="file-upload" className="flex flex-col items-center justify-center w-full h-full text-center text-gray-500 dark:text-gray-400">
                    {isParsingResume ? (
                      <>
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                        <span className="mt-2 text-sm">Processing resume...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-10 h-10 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        <span className="text-sm font-medium">
                          {resumeFile ? `File Selected: ${resumeFile.name}` : 'Click to upload resume file'}
                        </span>
                        <span className="text-xs mt-1">(PDF or TXT)</span>
                        <input 
                          id="file-upload" 
                          type="file" 
                          accept=".pdf,.txt" 
                          className="hidden" 
                          onChange={handleResumeFileUpload} 
                        />
                      </>
                    )}
                  </label>
                </div>
              )}
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
                      onChange={() => handleJobInputMethodChange(false)}
                      className="mr-3 text-blue-600"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Manual Input</span>
                  </label>
                  <label className="flex items-center p-3 rounded-lg border border-gray-100 dark:border-gray-600/30 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200">
                    <input
                      type="radio"
                      name="jobInputMethod"
                      checked={useJobUrl}
                      onChange={() => handleJobInputMethodChange(true)}
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
                    onClick={handleScrape}
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

        <div className="mt-8 mb-8" ref={generateMessageButtonRef}>
          <button
            onClick={handleGenerate}
            disabled={isLoading || isScrapingJob || isParsingResume || !userName || !currentCompany || !currentRole || !companyName || !role || !recruiterName || !resume || !jobDescription}
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
            ) : isParsingResume ? (
              'Processing Resume...'
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

export default MainApp;
