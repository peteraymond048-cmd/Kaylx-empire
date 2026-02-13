// Vercel Serverless Function - api/chat.js
// This handles AI requests securely (API key hidden from users)

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, conversationHistory = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get Groq API key from environment variable (secure!)
    const GROQ_API_KEY = process.env.GROQ_API_KEY;

    if (!GROQ_API_KEY) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    // Build conversation context for AI
    const systemPrompt = `You are KAI (Kaylx Artificial Intelligence), a friendly and knowledgeable brand assistant for Kaylx Empire, a premium Nigerian branding agency.

KAYLX SERVICES & PRICING:
• Logo Design: ₦5,000 (3 concepts, unlimited revisions, all formats, 5-7 days)
• Brand Identity (Starter): ₦15,000 (logo + colors + fonts + guidelines + templates, 7 days)
• Professional Package: ₦40,000 (BESTSELLER! Complete branding + marketing strategy + ad campaigns + social media, 14 days)
• Enterprise: Custom pricing (full VIP treatment, dedicated strategist, ongoing support)

KEY POINTS TO EMPHASIZE:
• Premium quality at affordable prices (60% cheaper than competitors)
• 162+ satisfied clients, 100% satisfaction rate
• Fast delivery (logo in 5-7 days, full package in 14 days)
• Unlimited revisions until perfect
• Real testimonials from Loveth, Jennifer, Samson, Kenaniah, Nmesoma
• Portfolio includes: The Jeweller, Shell, Royalty Cakes, Loveth's Bakery, book covers, etc.

PAYMENT: Bank transfer, mobile money, online payment. Payment plans for ₦40K+ packages (50/50 split)

CONTACT: WhatsApp is primary contact method

YOUR PERSONALITY:
• Friendly, enthusiastic, and helpful (use emojis appropriately)
• Professional but approachable
• Honest about capabilities and pricing
• Supportive of entrepreneurs
• Use Nigerian context (naira, local references)
• Can use light Pidgin when appropriate
• Always encourage action (book via WhatsApp)

IMPORTANT:
• Keep responses concise (2-4 sentences usually)
• Always end with a question or call-to-action
• If asked about something you don't know, be honest and redirect to WhatsApp team
• Never make up prices or services not listed above
• Focus on value, quality, and results`;

    // Prepare messages for AI
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-6).map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text
      })),
      { role: 'user', content: message }
    ];

    // Call Groq API (using Llama 3 - fast and free!)
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile', // Fast, smart, free!
        messages: messages,
        temperature: 0.7,
        max_tokens: 500,
        top_p: 0.9
      })
    });

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      console.error('Groq API Error:', errorText);
      throw new Error('AI service temporarily unavailable');
    }

    const data = await groqResponse.json();
    const aiResponse = data.choices[0]?.message?.content || 'I apologize, I had trouble processing that. Could you rephrase?';

    // Return response
    return res.status(200).json({
      response: aiResponse,
      success: true
    });

  } catch (error) {
    console.error('Error in chat handler:', error);
    return res.status(500).json({
      error: 'Failed to get AI response',
      fallback: true,
      message: error.message
    });
  }
}

// Enable CORS for your domain
export const config = {
  api: {
    bodyParser: true,
  },
};
