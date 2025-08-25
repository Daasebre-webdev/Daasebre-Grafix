// app/api/gemini/route.ts
import { GoogleGenAI } from "@google/genai";
import { NextRequest } from "next/server";

interface ChatRequest {
  message: string;
  history: string[];
  model: string;
  temperature: number;
}

export async function POST(request: NextRequest) {
  const { message, history, model, temperature }: ChatRequest = await request.json();

  try {
    // Check if this is a project request or normal chat
    const isProjectRequest = isRequestingProjects(message);
    
    let prompt: string;
    
    if (isProjectRequest) {
      // Extract project parameters from the message
      const projectParams = extractProjectParameters(message);
      
      prompt = `
Generate 5 realistic, creative, and educational project ideas based on:
- Field of Study: ${projectParams.field || "Not specified"}
- Skills: ${projectParams.skills || "Not specified"}
- Interests: ${projectParams.interests || "Not specified"}
- Complexity Level: ${projectParams.complexity || "Not specified"}
- Preferred Technologies: ${projectParams.technologies || "Not specified"}

Format the response as clear, readable text with emojis for better visual presentation.
Do not return JSON format. Instead, present each project idea with:
- A title with emoji
- A brief description
- Learning objectives as bullet points with bullet emojis
- Estimated duration with clock emoji
- Difficulty level with chart emoji

Make it engaging and easy to read in a chat interface.
`;
    } else {
      // Normal chat prompt
      prompt = `
You are a helpful AI assistant for Project Pulse. Respond to the user's message in a friendly, conversational tone.

User's message: ${message}

Previous conversation context: ${history.join("\n")}

Provide a helpful response that continues the conversation naturally.
`;
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "AIzaSyAOsRGq9g4jU5C23A_ELNpZMOxOfXa9rw0" });
    const response = await ai.models.generateContent({ 
      model: model || "gemini-2.5-flash", 
      contents: prompt,
      config: {
        temperature: temperature || 0.7,
        maxOutputTokens: 1024,
      }
    });
    
    const text = response.text;
    
    return Response.json({ text });
  } catch (error: unknown) {
    console.error("Gemini error:", error);
    
    let errorMessage = "Failed to generate response";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return Response.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// Helper function to detect project requests
function isRequestingProjects(message: string): boolean {
  const projectKeywords = [
    'project', 'ideas', 'suggest', 'recommend', 'build', 'create',
    'develop', 'make', 'generate', 'propose', 'concept', 'portfolio',
    'side project', 'hackathon', 'learning project'
  ];
  
  const negativeKeywords = [
    'how are you', 'hello', 'hi', 'hey', 'what\'s up', 'good morning',
    'good afternoon', 'good evening', 'help', 'support', 'question'
  ];
  
  const lowerMessage = message.toLowerCase();
  
  // Check for negative matches first
  if (negativeKeywords.some(keyword => lowerMessage.includes(keyword))) {
    return false;
  }
  
  // Then check for project keywords
  return projectKeywords.some(keyword => lowerMessage.includes(keyword));
}
// Helper function to extract project parameters from message
function extractProjectParameters(message: string): {
  field: string;
  skills: string;
  interests: string;
  complexity: string;
  technologies: string;
} {
  const lowerMessage = message.toLowerCase();
  
  return {
    field: extractParameterEnhanced(lowerMessage, ['field', 'study', 'subject', 'domain', 'area', 'discipline', 'topic']),
    skills: extractParameterEnhanced(lowerMessage, ['skill', 'know', 'experience', 'proficient', 'expert', 'familiar', 'background']),
    interests: extractParameterEnhanced(lowerMessage, ['interest', 'like', 'enjoy', 'passion', 'hobby', 'curious', 'fascinated']),
    complexity: extractParameterEnhanced(lowerMessage, ['complex', 'level', 'difficult', 'challenge', 'easy', 'simple', 'beginner', 'advanced', 'intermediate']),
    technologies: extractParameterEnhanced(lowerMessage, ['tech', 'framework', 'language', 'tool', 'platform', 'library', 'stack', 'technology'])
  };
}

function extractParameterEnhanced(message: string, keywords: string[]): string {
  // Common field values for better matching
  const fieldValues = ['web', 'mobile', 'ai', 'machine learning', 'data science', 'game', 'desktop', 'cloud', 'iot', 'blockchain', 'cybersecurity'];
  const complexityValues = ['easy', 'simple', 'beginner', 'medium', 'intermediate', 'hard', 'difficult', 'complex', 'advanced', 'expert'];
  const techValues = ['javascript', 'python', 'java', 'react', 'node', 'vue', 'angular', 'flutter', 'django', 'spring', 'express', 'mongodb', 'sql', 'html', 'css', 'typescript'];
  
  for (const keyword of keywords) {
    if (message.includes(keyword)) {
      // Pattern 1: Look for "keyword: value" or "keyword is value" patterns
      const regexPatterns = [
        new RegExp(`${keyword}[\\s:]+([^.,!?]+)`, 'i'), // "field: web development"
        new RegExp(`${keyword}\\s+is\\s+([^.,!?]+)`, 'i'), // "field is web development"
        new RegExp(`${keyword}\\s+of\\s+([^.,!?]+)`, 'i'), // "field of web development"
        new RegExp(`${keyword}\\s+should\\s+be\\s+([^.,!?]+)`, 'i'), // "field should be web"
        new RegExp(`with\\s+${keyword}\\s+([^.,!?]+)`, 'i'), // "with field web development"
        new RegExp(`for\\s+${keyword}\\s+([^.,!?]+)`, 'i'), // "for field web development"
      ];
      
      for (const regex of regexPatterns) {
        const match = message.match(regex);
        if (match && match[1]) {
          const extracted = match[1].trim();
          if (extracted && !extracted.match(/^(a|an|the|my|our|your|some|any)$/i)) {
            return cleanExtractedValue(extracted, keyword);
          }
        }
      }
      
      // Pattern 2: Look for values near the keyword (within 5 words)
      const words = message.split(/\s+/);
      const keywordIndex = words.findIndex(word => word.includes(keyword));
      
      if (keywordIndex !== -1) {
        // Check words before the keyword
        for (let i = Math.max(0, keywordIndex - 5); i < keywordIndex; i++) {
          const candidate = words.slice(i, keywordIndex).join(' ');
          if (isValidValue(candidate, keyword)) {
            return cleanExtractedValue(candidate, keyword);
          }
        }
        
        // Check words after the keyword
        for (let i = keywordIndex + 1; i < Math.min(words.length, keywordIndex + 6); i++) {
          const candidate = words.slice(keywordIndex + 1, i + 1).join(' ');
          if (isValidValue(candidate, keyword)) {
            return cleanExtractedValue(candidate, keyword);
          }
        }
      }
    }
  }
  
  // Pattern 3: Direct value matching for specific parameter types
  if (keywords.includes('field') || keywords.includes('study') || keywords.includes('subject')) {
    for (const value of fieldValues) {
      if (message.includes(value)) {
        return value;
      }
    }
  }
  
  if (keywords.includes('complex') || keywords.includes('level') || keywords.includes('difficult')) {
    for (const value of complexityValues) {
      if (message.includes(value)) {
        return value;
      }
    }
  }
  
  if (keywords.includes('tech') || keywords.includes('framework') || keywords.includes('language')) {
    for (const value of techValues) {
      if (message.includes(value)) {
        return value;
      }
    }
    
    // Extract technologies mentioned with common patterns
    const techPatterns = [
      /(?:using|with|in)\s+([a-z]+(?:\s+[a-z]+)?)\s+(?:framework|library|language|technology)/i,
      /(?:build|create|develop)\s+(?:a|an)\s+([a-z]+(?:\s+[a-z]+)?)\s+(?:app|application|project)/i,
      /(?:based on|built with)\s+([a-z]+(?:\s+[a-z]+)?)/i
    ];
    
    for (const pattern of techPatterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
  }
  
  return "";
}

function cleanExtractedValue(value: string, keyword: string): string {
  // Remove common stop words and punctuation
  let cleaned = value
    .replace(/^(a|an|the|my|our|your|some|any|using|with|for|in|on|at|to)\s+/i, '')
    .replace(/\s+(please|thanks|thank you|pls|plz|project|idea)$/i, '')
    .replace(/[.,!?;:()\[\]{}'"`~]/, '')
    .trim();
  
  // Special cleaning for specific keywords
  if (keyword === 'complexity' || keyword === 'level') {
    cleaned = cleaned.replace(/\s+level$/, '').replace(/^difficulty\s+/, '');
  }
  
  return cleaned;
}

function isValidValue(value: string, keyword: string): boolean {
  if (!value || value.length < 2) return false;
  
  // Common words that shouldn't be extracted as values
  const stopWords = ['a', 'an', 'the', 'my', 'our', 'your', 'some', 'any', 'this', 'that', 'these', 'those', 'is', 'are', 'was', 'were', 'be', 'being', 'been'];
  
  if (stopWords.includes(value.toLowerCase())) return false;
  
  // Check if it's a question word
  if (value.match(/^(what|which|who|whom|whose|where|when|why|how)$/i)) return false;
  
  // For complexity, check if it matches known values
  if (keyword === 'complexity' || keyword === 'level') {
    const complexityWords = ['easy', 'simple', 'beginner', 'medium', 'intermediate', 'hard', 'difficult', 'complex', 'advanced', 'expert'];
    return complexityWords.some(word => value.toLowerCase().includes(word));
  }
  
  return true;
}