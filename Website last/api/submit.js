import { formidable } from 'formidable';
import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';

// បិទដំណើរការ bodyParser មូលដ្ឋានរបស់ Vercel ដើម្បីឱ្យ formidable អាចដំណើរការបាន
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  // ពិនិត្យមើលថា Request Method ជា POST
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Invalid request method.' });
  }

  // យក Token និង Chat ID ពី Environment Variables នៅលើ Vercel
  const botToken = process.env.BOT_TOKEN;
  const chatId = process.env.CHAT_ID;

  if (!botToken || !chatId) {
    console.error("BOT_TOKEN or CHAT_ID is not set in Environment Variables.");
    return res.status(500).json({ status: 'error', message: 'Server configuration error.' });
  }
  
  const form = formidable({});

  try {
    const [fields, files] = await form.parse(req);

    // ប្រមូលទិន្នន័យពី Text Fields
    const messageText = `🚨 ទម្រង់ថ្មីបានបំពេញ! 🚨\n\n` +
      `ឈ្មោះ (ខ្មែរ): ${fields.khmerName?.[0] || 'N/A'}\n` +
      `Name (អង់គ្លេស): ${fields.englishName?.[0] || 'N/A'}\n` +
      `ទីកន្លែងកំណើត: ${fields.birthplace?.[0] || 'N/A'}\n` +
      `ភេទ: ${fields.gender?.[0] || 'N/A'}\n` +
      `ថ្ងៃ ខែ ឆ្នាំកំណើត: ${fields.dob?.[0] || 'N/A'}\n` +
      `សញ្ជាតិ: ${fields.nationality?.[0] || 'N/A'}\n` +
      `បច្ចុប្បន្នស្នាក់នៅ: ${fields.currentAddress?.[0] || 'N/A'}`;

    // --- ជំហានទី១: ផ្ញើសារអត្ថបទទៅ Telegram ---
    try {
      await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        chat_id: chatId,
        text: messageText,
        parse_mode: 'HTML',
      });
    } catch (error) {
      console.error("Telegram API Error (Text Message):", error.response?.data || error.message);
      return res.status(500).json({ status: 'error', message: 'Failed to send text message to Telegram.' });
    }

    // --- ជំហានទី២: ផ្ញើไฟล์ទៅ Telegram ---
    let filesFailed = [];
    for (const fieldName in files) {
      const fileArray = files[fieldName];
      if (fileArray && fileArray.length > 0) {
        const file = fileArray[0];
        
        const formData = new FormData();
        formData.append('chat_id', chatId);
        formData.append('document', fs.createReadStream(file.filepath), file.originalFilename);
        formData.append('caption', `${fieldName}: ${file.originalFilename}`);

        try {
          await axios.post(`https://api.telegram.org/bot${botToken}/sendDocument`, formData, {
            headers: formData.getHeaders(),
          });
        } catch (error) {
          console.error(`Telegram API Error (File: ${fieldName}):`, error.response?.data || error.message);
          filesFailed.push(fieldName);
        }
      }
    }

    // --- ជំហានទី៣: បញ្ជូន Response ចុងក្រោយ ---
    if (filesFailed.length > 0) {
      return res.status(207).json({ status: 'partial_success', message: `Form data sent, but failed to upload files: ${filesFailed.join(', ')}` });
    } else {
      return res.status(200).json({ status: 'success', message: 'Form data and all files sent to Telegram successfully.' });
    }

  } catch (error) {
    console.error("Form parsing error:", error);
    return res.status(500).json({ status: 'error', message: 'Error processing form data.' });
  }
}
