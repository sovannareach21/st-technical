// File: /api/submit.js
// --- FINAL VERSION ---

import { formidable } from 'formidable';
import fs from 'fs';
import FormData from 'form-data';

// Vercel-specific config to allow file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ message: 'Only POST requests allowed' });
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    return response.status(500).json({ message: 'Server configuration error.' });
  }

  try {
    const form = formidable({});
    const [fields, files] = await form.parse(request);

    // Part 1: Send the text data
    let textMessage = `🔔 **New Student Registration**\n\n`;
    textMessage += `**Khmer Name:** ${fields.name_kh?.[0] || 'N/A'}\n`;
    textMessage += `**English Name:** ${fields.name_en?.[0] || 'N/A'}\n`;
    textMessage += `**Gender:** ${fields.gender?.[0] || 'N/A'}\n`;
    textMessage += `**Date of Birth:** ${fields.dob?.[0] || 'N/A'}\n`;
    // ... add other text fields as needed

    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: textMessage,
        parse_mode: 'Markdown',
      }),
    });

    // Part 2: Loop through and send each file
    for (const fileField in files) {
      const fileArray = files[fileField];
      if (fileArray && fileArray.length > 0) {
        const file = fileArray[0];

        const fileFormData = new FormData();
        fileFormData.append('chat_id', chatId);
        fileFormData.append('document', fs.createReadStream(file.filepath), file.originalFilename);
        fileFormData.append('caption', `📄 File uploaded: ${file.originalFilename}`);

        await fetch(`https://api.telegram.org/bot${botToken}/sendDocument`, {
          method: 'POST',
          body: fileFormData,
        });
      }
    }

    // Optionally, redirect the user to a "Thank you" page upon successful submission
    return response.status(200).json({ message: 'Form and files submitted successfully!' });

  } catch (error) {
    console.error('Server Error:', error);
    return response.status(500).json({ message: 'An internal server error occurred while processing the form.' });
  }
}