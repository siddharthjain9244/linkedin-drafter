// src/api/scrapingService.js

/**
 * Scrapes job details (description, company, role) from a given URL.
 * @param {object} params - The parameters for scraping.
 * @param {string} params.jobUrl - The URL of the job post.
 * @param {string} params.scrapeApiToken - The API token for scrape.do.
 * @param {function} params.setError - State setter for handling errors.
 * @param {function} params.setIsScrapingJob - State setter for scraping status.
 * @param {function} params.setJobDescription - State setter for job description.
 * @param {function} params.setCompanyName - State setter for company name.
 * @param {function} params.setRole - State setter for job role.
 * @returns {Promise<object|null>} An object with scraped data or null on failure.
 */
export const scrapeJobDetails = async ({
    jobUrl,
    scrapeApiToken,
    setError,
    setIsScrapingJob,
    setJobDescription,
    setCompanyName,
    setRole,
  }) => {
    if (!jobUrl.trim()) {
      setError('Please enter a valid job URL');
      return null;
    }
  
    if (!scrapeApiToken) {
      setError('Scrape.do API token is missing. Please set it in your environment variables.');
      return null;
    }
  
    setIsScrapingJob(true);
    setError('');
  
    try {
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
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, 'text/html');
  
      let extractedJobDescription = '';
      let extractedCompany = '';
      let extractedRole = '';
      
      const jobDescriptionSelectors = [
        '.description__text', '.jobs-description-content__text', '.jobs-description__container',
        '.jobsearch-jobDescriptionText', '#jobDescriptionText', '.jobsearch-JobComponent-description',
        '.jobDescriptionContent', '[data-test="jobDescription"]',
        '[data-test-id="job-description"]', '.job-description',
        '.job-description-container', '.job_description',
        '[data-testid="job-description"]', '[data-test="job-description"]', '.job-details',
        '.job-content', '.description', '[class*="description"]', '[class*="job-details"]',
        '.posting-description', '.job-posting-description', '.job-summary', '.position-description',
        'main [role="main"]', 'main', 'article', '.content'
      ];
  
      for (const selector of jobDescriptionSelectors) {
        const element = doc.querySelector(selector);
        if (element) {
          const text = element.textContent || element.innerText || '';
          if (text.length > 100) {
            extractedJobDescription = text;
            break;
          }
        }
      }
  
      const companySelectors = [
        '.jobs-details-top-card__company-url', '.job-details-jobs-unified-top-card__company-name',
        '.jobsearch-InlineCompanyRating', '[data-testid="inlineHeader-companyName"]',
        '[data-test="employer-name"]', '.company-name', '[class*="company"]', 'h1 + div', 'title'
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
  
      const roleSelectors = [
        '.jobs-details-top-card__job-title', '[data-testid="jobTitle"]',
        '.jobsearch-JobInfoHeader-title', 'h1', '.job-title', '[class*="title"]',
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
  
      if (extractedJobDescription) {
        extractedJobDescription = extractedJobDescription.replace(/\s+/g, ' ').replace(/\n\s*\n/g, '\n').trim();
      }
  
      if (extractedJobDescription && extractedJobDescription.length > 100) {
          setJobDescription(extractedJobDescription);
          if (!setCompanyName && extractedCompany) setCompanyName(extractedCompany);
          if (!setRole && extractedRole) setRole(extractedRole);
          setError('');
          setIsScrapingJob(false);
          return { jobDescription: extractedJobDescription, companyName: extractedCompany, role: extractedRole };
      } else {
        const titleElement = doc.querySelector('title');
        const pageTitle = titleElement ? titleElement.textContent : '';
        
        if (pageTitle) {
          if (!setCompanyName) {
            const companyMatch = pageTitle.match(/at\s+([^|,-]+)/i);
            if (companyMatch) setCompanyName(companyMatch[1].trim());
          }
          if (!setRole) {
            const roleMatch = pageTitle.match(/^([^|,-]+)/);
            if (roleMatch) setRole(roleMatch[1].trim());
          }
        }
        setError('Could not extract detailed job description. Please paste manually.');
        setIsScrapingJob(false);
        return null;
      }
    } catch (err) {
      console.error('Scraping error:', err);
      setError(`Failed to scrape job details: ${err.message}`);
      setIsScrapingJob(false);
      return null;
    }
  };
  