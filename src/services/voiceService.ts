import { TransactionType } from '../types';

export interface VoiceParsedResult {
  intent: 'transaction' | 'health' | 'unknown';
  type?: TransactionType;
  amount?: number;
  weight_kg?: number;
  height_cm?: number;
  category?: string;
  description: string;
  date: string; // YYYY-MM-DD
  rawTranscript: string;
  confidence: number;
  needsConfirmation?: boolean;
}

export class VoiceService {
  /**
   * Check if SpeechRecognition is supported by the browser
   */
  static isSupported(): boolean {
    return typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
  }

  /**
   * Parse Thai transcript into structured transaction or health record
   */
  static parseThaiTranscript(transcript: string): VoiceParsedResult {
    const text = transcript.trim();
    const now = new Date();
    let targetDate = new Date();

    // 1. Detect Date
    if (text.includes('เมื่อวานซืน') || text.includes('วันก่อน')) {
      targetDate.setDate(now.getDate() - 2);
    } else if (text.includes('เมื่อวาน')) {
      targetDate.setDate(now.getDate() - 1);
    }
    const dateStr = targetDate.toISOString().split('T')[0];

    // 2. Check for Health Intent (Weight or Height)
    const weightMatch = text.match(/(?:น้ำหนัก|หนัก)\s*(\d+(?:\.\d+)?)\s*(?:กิโล|กิโลกรัม|โล|kg)?/i) ||
                        text.match(/(\d+(?:\.\d+)?)\s*(?:กิโลกรัม|กิโล|โล)/i);
    const heightMatch = text.match(/(?:ส่วนสูง|สูง)\s*(\d+(?:\.\d+)?)\s*(?:เซน|เซนติเมตร|ซม|cm)?/i);

    if (weightMatch || heightMatch) {
      const weight = weightMatch ? parseFloat(weightMatch[1]) : undefined;
      const height = heightMatch ? parseFloat(heightMatch[1]) : undefined;
      return {
        intent: 'health',
        weight_kg: weight,
        height_cm: height,
        description: text,
        date: dateStr,
        rawTranscript: text,
        confidence: 0.95
      };
    }

    // 3. Finance Intent (Income vs Expense)
    const isIncome = /ได้เงิน|เงินเดือน|รับเงิน|ได้โบนัส|ขายของ|รายรับ|รับโอน/.test(text);
    const txType: TransactionType = isIncome ? 'income' : 'expense';

    // 4. Extract Amount
    // Matches patterns like "120 บาท", "25,000", "500", etc.
    const amountMatch = text.match(/([0-9,]+(?:\.[0-9]{1,2})?)\s*(?:บาท|บ\.)?/);
    let amount: number | undefined = undefined;
    if (amountMatch) {
      const cleanNum = amountMatch[1].replace(/,/g, '');
      const parsed = parseFloat(cleanNum);
      if (!isNaN(parsed) && parsed > 0) {
        amount = parsed;
      }
    }

    // 5. Categorize based on Thai keywords
    let category = isIncome ? 'รายรับอื่นๆ' : 'รายจ่ายอื่นๆ';
    if (/ประกันรถ|ต่อประกัน|ประกันภัยรถ|พรบ|พ\.ร\.บ|วิริยะ|ทิพย|สินมั่นคง|รู้ใจ|ไดเร็คเอเชีย/.test(text)) {
      category = 'ค่าประกันรถยนต์';
    } else if (/ค่าสุขภาพ|สุขภาพ|ตรวจสุขภาพ|ตรวจร่างกาย|ฟิตเนส|ยิม|วิตามิน|อาหารเสริม|ทำฟัน|ขูดหินปูน|นวดเพื่อสุขภาพ/.test(text)) {
      category = 'ค่าสุขภาพ';
    } else if (/ข้าว|อาหาร|ก๋วยเตี๋ยว|หมูกระทะ|ส้มตำ|เที่ยง|เย็น|เช้า|กิน|ชาบู|สุกี้/.test(text)) {
      category = 'อาหารและเครื่องดื่ม';
    } else if (/เซเว่น|7-11|seven|cj|ซีเจ/.test(text)) {
      category = '7-Eleven / CJ';
    } else if (/ของเข้าบ้าน|ตลาด|โลตัส|บิ๊กซี|ของใช้/.test(text)) {
      category = 'ซื้อของเข้าบ้าน / ตลาด';
    } else if (/น้ำมัน|ปตท|บางจาก|ทางด่วน|bts|mrt|รถ|แท็กซี่/.test(text)) {
      category = 'เติมน้ำมัน / เดินทาง';
    } else if (/ซักผ้า|อบผ้า|เครื่องซักผ้า/.test(text)) {
      category = 'ค่าซัก-อบผ้า / งานบ้าน';
    } else if (/กาแฟ|อเมซอน|สตาบัค|คาเฟ่|ชาเขียว|ขนม|เค้ก/.test(text)) {
      category = 'คาเฟ่ & ขนม';
    } else if (/ค่าน้ำ|ค่าไฟ|เน็ต|ค่าเน็ต|โทรศัพท์/.test(text)) {
      category = 'ค่าน้ำ-ไฟ-อินเทอร์เน็ต';
    } else if (/ยา|หมอ|คลินิก|โรงพยาบาล/.test(text)) {
      category = 'ยา & รักษาพยาบาล';
    } else if (/เงินเดือน|ค่าจ้าง|เงินประจำ/.test(text)) {
      category = 'เงินเดือน / ค่าจ้าง';
    } else if (/รับเงินคู่|ฝากเงินคู่|เติมเงินคู่/.test(text)) {
      category = 'รับเงินคู่รายเดือน';
    }

    // Clean description (remove filler words)
    let desc = text
      .replace(/วันนี้|เมื่อวานนี้|เมื่อวาน|วันก่อน/g, '')
      .replace(/จำนวน|ยอดเงิน/g, '')
      .trim();

    return {
      intent: 'transaction',
      type: txType,
      amount: amount,
      category: category,
      description: desc || text,
      date: dateStr,
      rawTranscript: text,
      confidence: amount ? 0.9 : 0.6,
      needsConfirmation: !amount
    };
  }
}
