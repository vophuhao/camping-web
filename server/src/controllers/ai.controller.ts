import { catchErrors } from "@/errors";
import axios from "axios";

// Curated list of high-quality Unsplash camping images as fallback
const FALLBACK_CAMPING_IMAGES = [
  {
    id: "camp-1",
    url: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=1200&q=80",
    thumb: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=400&q=80",
    full: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=1600&q=80",
    download: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=1600&q=80",
    description: "Cắm trại dưới bầu trời sao đêm tuyệt đẹp",
    author: {
      name: "Clint McKoy",
      username: "clintmckoy",
      profile: "https://unsplash.com/@clintmckoy"
    },
    unsplashUrl: "https://unsplash.com/photos/g1943081",
    width: 1200,
    height: 800
  },
  {
    id: "camp-2",
    url: "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?auto=format&fit=crop&w=1200&q=80",
    thumb: "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?auto=format&fit=crop&w=400&q=80",
    full: "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?auto=format&fit=crop&w=1600&q=80",
    download: "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?auto=format&fit=crop&w=1600&q=80",
    description: "Lều trại bên hồ nước buổi sáng bình minh",
    author: {
      name: "Tegan Mierle",
      username: "teganmierle",
      profile: "https://unsplash.com/@teganmierle"
    },
    unsplashUrl: "https://unsplash.com/photos/tg1143081",
    width: 1200,
    height: 800
  },
  {
    id: "camp-3",
    url: "https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?auto=format&fit=crop&w=1200&q=80",
    thumb: "https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?auto=format&fit=crop&w=400&q=80",
    full: "https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?auto=format&fit=crop&w=1600&q=80",
    download: "https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?auto=format&fit=crop&w=1600&q=80",
    description: "Xe cắm trại RV đỗ giữa rừng thông mộng mơ",
    author: {
      name: "Kevin Schmid",
      username: "kevinschmid",
      profile: "https://unsplash.com/@kevinschmid"
    },
    unsplashUrl: "https://unsplash.com/photos/kv735552",
    width: 1200,
    height: 800
  },
  {
    id: "camp-4",
    url: "https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=1200&q=80",
    thumb: "https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=400&q=80",
    full: "https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=1600&q=80",
    download: "https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=1600&q=80",
    description: "Khu lều cắm trại glamping sang trọng ban đêm",
    author: {
      name: "Patrick Hendry",
      username: "pedroandrade",
      profile: "https://unsplash.com/@pedroandrade"
    },
    unsplashUrl: "https://unsplash.com/photos/ph123056",
    width: 1200,
    height: 800
  },
  {
    id: "camp-5",
    url: "https://images.unsplash.com/photo-1497906539254-2736f89a2441?auto=format&fit=crop&w=1200&q=80",
    thumb: "https://images.unsplash.com/photo-1497906539254-2736f89a2441?auto=format&fit=crop&w=400&q=80",
    full: "https://images.unsplash.com/photo-1497906539254-2736f89a2441?auto=format&fit=crop&w=1600&q=80",
    download: "https://images.unsplash.com/photo-1497906539254-2736f89a2441?auto=format&fit=crop&w=1600&q=80",
    description: "Đốt lửa trại ấm cúng trong rừng sâu",
    author: {
      name: "Clarisse Meyer",
      username: "clarissemeyer",
      profile: "https://unsplash.com/@clarissemeyer"
    },
    unsplashUrl: "https://unsplash.com/photos/cm906539",
    width: 1200,
    height: 800
  }
];

class AIController {
  private getApiKey() {
    return process.env.GOOGLE_GENERATIVE_AI_API_KEY || "AIzaSyBy_EK5R9OL0LwVzA8c3ZrLcO-PdVg_NZs";
  }

  private async generateContentWithGemini(prompt: string): Promise<string> {
    const apiKey = this.getApiKey();
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const response = await axios.post(url, {
      contents: [{
        parts: [{
          text: prompt
        }]
      }]
    });

    return response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  }

  generateContent = catchErrors(async (req, res) => {
    const { title, subject, summary } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, error: "Tiêu đề không được để trống" });
    }

    const prompt = `Bạn là một chuyên gia viết lách và camping. Hãy viết một bài chia sẻ/bài đăng diễn đàn chi tiết, hấp dẫn và hữu ích bằng tiếng Việt dành cho cộng đồng camping/du lịch.
Tiêu đề: "${title}"
Chủ đề: "${subject || "Kinh nghiệm cắm trại"}"
${summary ? `Mô tả ngắn/Ý tưởng: "${summary}"` : ""}

Yêu cầu định dạng bài viết:
- Viết bằng định dạng HTML chuẩn (chỉ dùng các thẻ <p>, <h3>, <h4>, <ul>, <li>, <strong>, <em>, <br>). Không bọc trong thẻ <html>, <body> hay Markdown.
- Bài viết nên có phần mở đầu lôi cuốn, các phần nội dung chính với tiêu đề rõ ràng (h3/h4) và phần kết luận tóm tắt hoặc lời khuyên.
- Nội dung chất lượng, thực tế, lồng ghép các từ ngữ liên quan đến trải nghiệm thiên nhiên, cắm trại, dã ngoại.
- Độ dài khoảng 400 - 700 từ.`;

    try {
      const generatedText = await this.generateContentWithGemini(prompt);

      // Clean up markdown block wraps if any
      let cleanedText = generatedText.trim();
      if (cleanedText.startsWith("```html")) {
        cleanedText = cleanedText.slice(7);
      }
      if (cleanedText.startsWith("```")) {
        cleanedText = cleanedText.slice(3);
      }
      if (cleanedText.endsWith("```")) {
        cleanedText = cleanedText.slice(0, -3);
      }
      cleanedText = cleanedText.trim();

      console.log("=== [AI CONTROLLER] Content generation success ===");
      return res.json({ success: true, content: cleanedText });
    } catch (error: any) {
      console.error("=== [AI CONTROLLER] Content generation error ===");
      if (error.response) {
        console.error("Status:", error.response.status);
        console.error("Data:", JSON.stringify(error.response.data, null, 2));
      } else {
        console.error("Error Message:", error.message || error);
      }
      return res.status(500).json({ success: false, error: "Lỗi kết nối AI để tạo nội dung" });
    }
  });

  generateSummary = catchErrors(async (req, res) => {
    const { title, subject } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, error: "Tiêu đề không được để trống" });
    }

    const prompt = `Viết một câu tóm tắt (hoặc mô tả ngắn) cực kỳ ngắn gọn, súc tích (tối đa 2 câu) và hấp dẫn bằng tiếng Việt cho bài đăng diễn đàn sau:
Tiêu đề: "${title}"
Chủ đề: "${subject || "Kinh nghiệm cắm trại"}"

Yêu cầu:
- Tóm tắt phải lôi cuốn người đọc.
- Không dùng HTML, chỉ viết text thường thuần túy.`;

    try {
      const summaryText = await this.generateContentWithGemini(prompt);
      return res.json({ success: true, summary: summaryText.trim() });
    } catch (error: any) {
      console.error("Gemini Summary Generation Error:", error.message || error);
      return res.status(500).json({ success: false, error: "Lỗi kết nối AI để tạo mô tả" });
    }
  });

  imageSuggestions = catchErrors(async (_req, res) => {
    return res.json({ success: true, images: FALLBACK_CAMPING_IMAGES });
  });

  searchImages = catchErrors(async (_req, res) => {
    return res.json({ success: true, images: FALLBACK_CAMPING_IMAGES });
  });

  generateImagePrompt = catchErrors(async (req, res) => {
    const { title, subject } = req.body;
    const prompt = `Generate a detailed visual prompt for DALL-E image generator to create a beautiful banner matching:
Title: "${title}"
Subject: "${subject}"
Output ONLY the DALL-E prompt string.`;

    try {
      const promptText = await this.generateContentWithGemini(prompt);
      return res.json({ success: true, prompt: promptText.trim() });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: "Lỗi kết nối AI tạo prompt" });
    }
  });

  generateImage = catchErrors(async (_req, res) => {
    return res.status(404).json({ success: false, error: "DALL-E 3 image generation API is not configured on the server." });
  });
}

export const aiController = new AIController();
