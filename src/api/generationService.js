// src/api/generationService.js

/**
 * Calls the Gemini API to generate a personalized LinkedIn outreach message.
 * @param {object} params - The parameters for message generation.
 * @param {string} params.userName - The user's name.
 * @param {string} params.currentRole - The user's current role.
 * @param {string} params.currentCompany - The user's current company.
 * @param {string} params.recruiterName - The name of the recruiter.
 * @param {string} params.companyName - The name of the target company.
 * @param {string} params.role - The target role/position.
 * @param {string} params.resume - The text content of the user's resume.
 * @param {string} params.jobDescription - The text content of the job description.
 * @param {string} params.geminiApiKey - The API key for the Gemini model.
 * @param {function} params.setError - State setter for handling errors.
 * @param {function} params.setIsLoading - State setter for loading status.
 * @returns {Promise<string|null>} The generated message text or null on failure.
 */
export const generateMessage = async ({
    userName,
    currentRole,
    currentCompany,
    recruiterName,
    companyName,
    role,
    resume,
    jobDescription,
    geminiApiKey,
    setError,
    setIsLoading,
  }) => {
    if (!geminiApiKey) {
      setError('Gemini API key is missing. Please set it in your environment variables.');
      setIsLoading(false);
      return null;
    }
  
    setIsLoading(true);
    setError('');
  
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
  
    const payload = {
      contents: [{
        role: "user",
        parts: [{ text: prompt }]
      }]
    };
    
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
          if (response.status === 429) {
            retries++;
            console.warn(`Retry attempt ${retries}/${maxRetries}. Retrying in ${delay}ms...`);
            await new Promise(res => setTimeout(res, delay));
            delay *= 2;
            continue;
          }
          throw new Error(`API error: ${response.statusText}`);
        }
  
        const result = await response.json();
        
        if (result.candidates && result.candidates.length > 0 &&
            result.candidates[0].content && result.candidates[0].content.parts &&
            result.candidates[0].content.parts.length > 0) {
          const text = result.candidates[0].content.parts[0].text;
          setIsLoading(false);
          return text;
        } else {
          setError('Could not generate a message. Please try again.');
          setIsLoading(false);
          return null;
        }
  
      } catch (e) {
        setError(`An error occurred: ${e.message}`);
        setIsLoading(false);
        return null;
      }
    }
  
    setError('Too many requests. Please try again later.');
    setIsLoading(false);
    return null;
  };
  