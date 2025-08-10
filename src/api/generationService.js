// src/api/generationService.js
import axios from 'axios';
/**
 * Calls the Gemini API to generate a personalized LinkedIn outreach message.
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
    recruiterName,
    companyName,
    role,
    resume,
    jobDescription,
    setError,
    setIsLoading,
  }) => {
    // if (!geminiApiKey) {
    //   setError('Gemini API key is missing. Please set it in your environment variables.');
    //   setIsLoading(false);
    //   return null;
    // }
  
    setIsLoading(true);
    setError('');
  
    // const prompt = `
    //   You are a career advisor. Draft a professional, concise, and engaging outreach message from ${userName} (currently working as a ${currentRole} at ${currentCompany}) to ${recruiterName} at ${companyName} for the ${role} position. The message should be polite, personalized, and directly reference how the candidate's experience and skills from their resume align with the requirements of the job description. Address the recruiter by name and mention the specific company name and role in the message. Do not make up any information. If you cannot find a direct match, write a general but polite message.
  
    //   Candidate Name: ${userName}
    //   Current Role: ${currentRole}
    //   Current Company: ${currentCompany}
    //   Target Company: ${companyName}
    //   Role/Position: ${role}
    //   Recruiter Name: ${recruiterName}
      
    //   Candidate's Resume:
    //   ${resume}
  
    //   Job Description:
    //   ${jobDescription}
  
    //   Draft the outreach message below. The message should be ready to copy and paste and should start with a proper greeting to the recruiter.
    // `;
  
    // const payload = {
    //   contents: [{
    //     role: "user",
    //     parts: [{ text: prompt }]
    //   }]
    // };
    
    const apiUrl = 'https://linkedin-drafter-backend.onrender.com/api/analyseResumeForOutreach';
    let payload = {
      recruiterName,
      companyName,
      role,
      extractedData:resume,
      jobDescription,
    }
  
    let retries = 0;
    const maxRetries = 5;
    let delay = 1000;
  
    while (retries < maxRetries) {
      try {
        // const response = await fetch(apiUrl, {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(payload)
        // });
        const response = await axios.post(apiUrl, payload, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 60000,
        });

        console.log('first',response);
        if (response.status !== 200) {
          if (response.status === 429) {
            retries++;
            console.warn(`Retry attempt ${retries}/${maxRetries}. Retrying in ${delay}ms...`);
            await new Promise(res => setTimeout(res, delay));
            delay *= 2;
            continue;
          }
          throw new Error(`API error: ${response.statusText}`);
        }
  
        const result = response.data.data;
        console.log('second',result);
        
        if (result.outreachMessage) {
          const text = result.outreachMessage;
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
  