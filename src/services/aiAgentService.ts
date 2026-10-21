import { Transaction, HealthRecord, Budget, Account, Category, AppSettings, AIMessage, isCoupleTransaction } from '../types';

export class AIAgentService {
  /**
   * Tool: getCoupleBalance (Filtered for couple transactions in current month)
   */
  static getCoupleBalance(transactions: Transaction[]) {
    // Only couple transactions (exclude personal)
    const coupleTx = transactions.filter(isCoupleTransaction);
    const now = new Date();
    const currentMonthTx = coupleTx.filter(t => {
      const d = new Date(t.transaction_date);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    });

    const targetTx = currentMonthTx.length > 0 ? currentMonthTx : coupleTx;

    const totalIncome = targetTx
      .filter(t => t.transaction_type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = targetTx
      .filter(t => t.transaction_type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    // Spending by member
    const joExpense = targetTx
      .filter(t => t.transaction_type === 'expense' && t.user_name === 'โจ')
      .reduce((sum, t) => sum + t.amount, 0);

    const tanzExpense = targetTx
      .filter(t => t.transaction_type === 'expense' && t.user_name === 'ตาล')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      joExpense,
      tanzExpense,
      isCurrentMonth: currentMonthTx.length > 0
    };
  }

  /**
   * Tool: getExpenseSummary by category
   */
  static getExpenseSummary(transactions: Transaction[], startDate?: string, endDate?: string) {
    let filtered = transactions.filter(t => t.transaction_type === 'expense');
    if (startDate) {
      filtered = filtered.filter(t => t.transaction_date >= startDate);
    }
    if (endDate) {
      filtered = filtered.filter(t => t.transaction_date <= endDate);
    }

    const categoryMap: { [cat: string]: number } = {};
    let total = 0;

    for (const t of filtered) {
      categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
      total += t.amount;
    }

    const sortedCategories = Object.entries(categoryMap)
      .map(([name, amount]) => ({ name, amount, percentage: total > 0 ? (amount / total) * 100 : 0 }))
      .sort((a, b) => b.amount - a.amount);

    return {
      totalExpense: total,
      topCategories: sortedCategories
    };
  }

  /**
   * Tool: getBudgetStatus
   */
  static getBudgetStatus(budgets: Budget[], transactions: Transaction[]) {
    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthlyExpenses = transactions.filter(t => 
      t.transaction_type === 'expense' && t.transaction_date.startsWith(currentMonthStr)
    );

    return budgets.map(b => {
      let spent = 0;
      if (b.category_id === 'all') {
        spent = monthlyExpenses.reduce((sum, t) => sum + t.amount, 0);
      } else {
        spent = monthlyExpenses
          .filter(t => t.category === b.category_name)
          .reduce((sum, t) => sum + t.amount, 0);
      }

      const percentage = b.budget_amount > 0 ? Math.round((spent / b.budget_amount) * 100) : 0;
      const remaining = b.budget_amount - spent;
      const isNear = percentage >= b.alert_percentage && percentage < 100;
      const isOver = percentage >= 100;

      return {
        ...b,
        spent,
        remaining,
        percentage,
        isNear,
        isOver
      };
    });
  }

  /**
   * Tool: getHealthHistory
   */
  static getHealthHistory(healthRecords: HealthRecord[], userName?: string) {
    let list = [...healthRecords];
    if (userName) {
      list = list.filter(r => r.user_name === userName);
    }
    list.sort((a, b) => new Date(b.record_date).getTime() - new Date(a.record_date).getTime());

    const latest = list[0];
    const previous = list[1];
    let diff = 0;
    if (latest && previous) {
      diff = parseFloat((latest.weight_kg - previous.weight_kg).toFixed(2));
    }

    return {
      latest,
      previous,
      diff,
      historyCount: list.length
    };
  }

  /**
   * Tool: getAccountsSummary
   */
  static getAccountsSummary(accounts: Account[] = []) {
    const totalBalance = accounts.reduce((sum, a) => sum + (a.display_balance || 0), 0);
    return {
      totalBalance,
      accounts: accounts.map(a => ({
        name: a.account_name,
        balance: a.display_balance || 0,
        type: a.account_type,
        status: a.connection_status
      }))
    };
  }

  /**
   * Process Chat Message with น้องจด (Full System Capabilities)
   */
  static async processChatMessage(
    userText: string,
    transactions: Transaction[],
    healthRecords: HealthRecord[],
    budgets: Budget[],
    currentUser: string,
    accounts: Account[] = [],
    settings?: AppSettings,
    geminiApiKey?: string
  ): Promise<AIMessage> {
    const text = userText.trim().toLowerCase();
    const timeNow = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

    // 1. Gather all analytical data from system
    const balanceInfo = this.getCoupleBalance(transactions);
    const expenseInfo = this.getExpenseSummary(transactions);
    const budgetStatus = this.getBudgetStatus(budgets, transactions);
    const joHealth = this.getHealthHistory(healthRecords, 'โจ');
    const tanzHealth = this.getHealthHistory(healthRecords, 'ตาล');
    const accountsInfo = this.getAccountsSummary(accounts);

    // 2. If Gemini API Key is configured, use Gemini API for open-ended conversation
    if (geminiApiKey) {
      try {
        const systemPrompt = `คุณคือ "น้องจด" ผู้ช่วย AI เมฆน้อยสีฟ้าขาวที่น่ารัก สดใส และชาญฉลาด ประจำแอปพลิเคชัน "จดให้ไว" 
ผู้ใช้งานปัจจุบันคือคุณ "${currentUser}" (คู่รักคือคุณโจและคุณตาล)
ข้อมูลสรุปปัจจุบันในระบบ:
- ยอดเงินคู่คงเหลือ: ${balanceInfo.balance.toLocaleString()} บาท (รายรับ: +${balanceInfo.totalIncome.toLocaleString()} บาท, รายจ่าย: -${balanceInfo.totalExpense.toLocaleString()} บาท)
- รายจ่ายของโจ: ${balanceInfo.joExpense.toLocaleString()} บาท, ของตาล: ${balanceInfo.tanzExpense.toLocaleString()} บาท
- หมวดหมู่ที่จ่ายเยอะสุด: ${expenseInfo.topCategories.slice(0, 3).map(c => `${c.name} (${c.amount.toLocaleString()} บาท)`).join(', ')}
- งบประมาณ: ${budgetStatus.map(b => `${b.category_name}: ${b.spent.toLocaleString()}/${b.budget_amount.toLocaleString()} (${b.percentage}%)`).join(', ')}
- บัญชีเงิน: รวม ${accountsInfo.totalBalance.toLocaleString()} บาท จาก ${accountsInfo.accounts.length} บัญชี
- สุขภาพโจล่าสุด: ${joHealth.latest ? `${joHealth.latest.weight_kg} กก. (BMI ${joHealth.latest.bmi})` : 'ยังไม่มีข้อมูล'}
- สุขภาพตาลล่าสุด: ${tanzHealth.latest ? `${tanzHealth.latest.weight_kg} กก. (BMI ${tanzHealth.latest.bmi})` : 'ยังไม่มีข้อมูล'}
โปรดตอบคำถามภาษาไทยด้วยน้ำเสียงน่ารัก อ่อนน้อม ใส่ emoji เหมาะสม กระชับ ได้ข้อมูลที่ถูกต้อง`;

        const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              { role: 'user', parts: [{ text: `${systemPrompt}\n\nคำถามจากผู้ใช้: ${userText}` }] }
            ]
          })
        });

        if (resp.ok) {
          const json = await resp.json();
          const replyText = json?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (replyText) {
            return {
              id: `ai-${Date.now()}`,
              sender: 'nong-jod',
              text: replyText,
              timestamp: timeNow
            };
          }
        }
      } catch (err) {
        console.warn('Gemini API call error, falling back to local engine:', err);
      }
    }

    // 3. Comprehensive Rule-Based & Semantic Matching covering EVERY part of the system

    // --- Part A: ยอดเงินคู่คงเหลือ & การเงินภาพรวม ---
    if (text.includes('เหลือเท่าไหร่') || text.includes('ยอดเงินคู่') || text.includes('เงินคงเหลือ') || text.includes('สรุปยอดเงิน')) {
      const balanceStr = balanceInfo.balance.toLocaleString('th-TH', { minimumFractionDigits: 2 });
      return {
        id: `ai-${Date.now()}`,
        sender: 'nong-jod',
        text: `💰 **สถานะยอดเงินคู่คงเหลือ (เดือนปัจจุบัน):**\n\n- ยอดคงเหลือเงินคู่: **${balanceStr} บาท** 💕\n- รายรับเงินคู่: **+${balanceInfo.totalIncome.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท**\n- รายจ่ายเงินคู่: **-${balanceInfo.totalExpense.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท**\n\n*(กรองเฉพาะบัญชีเงินคู่ Jo-Tanz / เงินคู่รายเดือน ไม่รวมบัญชีส่วนตัวค่ะ)*`,
        timestamp: timeNow,
        actionLink: { action: 'summary', label: '📊 ดูภาพรวมรายรับ-จ่าย' }
      };
    }

    // --- Part B: รายจ่าย & ใครจ่ายเยอะกว่า / สถิติโจ-ตาล ---
    if (text.includes('ใครจ่าย') || text.includes('ใครใช้เยอะ') || text.includes('โจจ่าย') || text.includes('ตาลจ่าย') || text.includes('คนไหน')) {
      const jo = balanceInfo.joExpense;
      const tanz = balanceInfo.tanzExpense;
      let diffMsg = '';
      if (jo > tanz) {
        diffMsg = `👦 คุณโจจ่ายเยอะกว่าคุณตาล **${(jo - tanz).toLocaleString()} บาท** ค่ะ`;
      } else if (tanz > jo) {
        diffMsg = `👧 คุณตาลจ่ายเยอะกว่าคุณโจ **${(tanz - jo).toLocaleString()} บาท** ค่ะ`;
      } else {
        diffMsg = `👏 ทั้งสองคนช่วยกันจ่ายเท่ากันพอดีเลยค่ะ (${jo.toLocaleString()} บาท)`;
      }

      return {
        id: `ai-${Date.now()}`,
        sender: 'nong-jod',
        text: `📊 **สรุปการใช้จ่ายแยกตามคู่รัก:**\n\n- 👦 **คุณโจ:** ${jo.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท\n- 👧 **คุณตาล:** ${tanz.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท\n\n${diffMsg} 💕`,
        timestamp: timeNow,
        actionLink: { action: 'summary', label: '📊 ดูกราฟวิเคราะห์การใช้จ่าย' }
      };
    }

    // --- Part C: รายจ่ายตามหมวดหมู่ (อาหาร, น้ำมัน, 7-11, ช้อปปิ้ง) ---
    if (text.includes('ใช้เงินเท่าไหร่') || text.includes('รายจ่าย') || text.includes('หมดไปเท่าไหร่') || text.includes('หมวด')) {
      // Check if specific category mentioned
      const matchedCat = expenseInfo.topCategories.find(c => text.includes(c.name.toLowerCase()));
      if (matchedCat) {
        return {
          id: `ai-${Date.now()}`,
          sender: 'nong-jod',
          text: `🛒 **หมวด ${matchedCat.name}:**\nมียอดใช้จ่ายรวมอยู่ที่ **${matchedCat.amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท** (คิดเป็น ${matchedCat.percentage.toFixed(1)}% ของรายจ่ายทั้งหมด) ค่ะ`,
          timestamp: timeNow,
          actionLink: { action: 'summary', label: '📊 ดูสรุปหมวดหมู่อื่นๆ' }
        };
      }

      const topCat = expenseInfo.topCategories[0];
      const secondCat = expenseInfo.topCategories[1];
      const thirdCat = expenseInfo.topCategories[2];

      let topList = '';
      if (topCat) topList += `1. **${topCat.name}:** ${topCat.amount.toLocaleString()} บาท (${topCat.percentage.toFixed(1)}%)\n`;
      if (secondCat) topList += `2. **${secondCat.name}:** ${secondCat.amount.toLocaleString()} บาท (${secondCat.percentage.toFixed(1)}%)\n`;
      if (thirdCat) topList += `3. **${thirdCat.name}:** ${thirdCat.amount.toLocaleString()} บาท (${thirdCat.percentage.toFixed(1)}%)\n`;

      return {
        id: `ai-${Date.now()}`,
        sender: 'nong-jod',
        text: `💸 **สรุปรายจ่ายทั้งหมดในระบบ:**\nยอดรายจ่ายรวมอยู่ที่ **${expenseInfo.totalExpense.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท**\n\n🏆 **3 หมวดที่จ่ายเยอะที่สุด:**\n${topList}`,
        timestamp: timeNow,
        actionLink: { action: 'record', label: '➕ บันทึกรายจ่ายใหม่' }
      };
    }

    // --- Part D: รายการล่าสุด (Recent Transactions) ---
    if (text.includes('รายการล่าสุด') || text.includes('เพิ่งบันทึก') || text.includes('ประวัติล่าสุด') || text.includes('ซื้ออะไรไปบ้าง')) {
      const recent = transactions.slice(0, 5);
      if (recent.length === 0) {
        return {
          id: `ai-${Date.now()}`,
          sender: 'nong-jod',
          text: `ยังไม่มีประวัติรายการในระบบเลยค่ะ คุณ${currentUser}สามารถกดปุ่ม "บันทึกเงินคู่" หรือบอกน้องจดให้ช่วยบันทึกได้เลยนะคะ 🌱`,
          timestamp: timeNow,
          actionLink: { action: 'record', label: '➕ บันทึกรายการแรก' }
        };
      }

      let txList = recent.map((t, idx) => {
        const sign = t.transaction_type === 'income' ? '+' : '-';
        return `${idx + 1}. **${t.category}** (${t.description || t.account_id || 'ไม่ระบุ'}): ${sign}${t.amount.toLocaleString()} บาท [${t.user_name || 'คู่รัก'}]`;
      }).join('\n');

      return {
        id: `ai-${Date.now()}`,
        sender: 'nong-jod',
        text: `📑 **5 รายการล่าสุดในระบบ:**\n\n${txList}`,
        timestamp: timeNow,
        actionLink: { action: 'summary', label: '📜 ดูรายการทั้งหมด' }
      };
    }

    // --- Part E: งบประมาณ (Budgets) ---
    if (text.includes('งบ') || text.includes('งบประมาณ') || text.includes('เกินงบ') || text.includes('ใกล้เต็ม')) {
      const totalBudget = budgetStatus.find(b => b.category_id === 'all');
      const overBudgets = budgetStatus.filter(b => b.isOver);
      const nearBudgets = budgetStatus.filter(b => b.isNear);

      let msg = '';
      if (totalBudget) {
        msg += `🎯 **งบประมาณรวมรายเดือน:** ใช้ไปแล้ว ${totalBudget.spent.toLocaleString()} / ${totalBudget.budget_amount.toLocaleString()} บาท (${totalBudget.percentage}%)\n👉 คงเหลือใช้ได้อีก **${totalBudget.remaining.toLocaleString()} บาท** ค่ะ\n\n`;
      }
      if (overBudgets.length > 0) {
        msg += `🚨 **หมวดที่เกินงบแล้ว:**\n${overBudgets.map(b => `- ${b.category_name}: ใช้ไป ${b.spent.toLocaleString()} / ${b.budget_amount.toLocaleString()} บาท (${b.percentage}%)`).join('\n')}\n\n`;
      }
      if (nearBudgets.length > 0) {
        msg += `🔔 **หมวดที่ใกล้เต็ม (>80%):**\n${nearBudgets.map(b => `- ${b.category_name}: ${b.percentage}% (เหลือ ${b.remaining.toLocaleString()} บ.)`).join('\n')}\n\n`;
      }
      if (overBudgets.length === 0 && nearBudgets.length === 0) {
        msg += `✨ การใช้จ่ายเดือนนี้ยอดเยี่ยมมาก ยังไม่มีหมวดไหนเกินงบเลยค่ะ น่ารักมากๆ ทั้งคู่เลย 💕`;
      }

      return {
        id: `ai-${Date.now()}`,
        sender: 'nong-jod',
        text: msg,
        timestamp: timeNow,
        actionLink: { action: 'budget', label: '🎯 จัดการงบประมาณ' }
      };
    }

    // --- Part F: กระเป๋าเงิน & บัญชีธนาคาร (Wallets & Accounts) ---
    if (text.includes('กระเป๋า') || text.includes('บัญชี') || text.includes('ธนาคาร') || text.includes('เงินออม') || text.includes('เงินสด')) {
      let accList = accountsInfo.accounts.map(a => `- **${a.name}:** ${a.balance.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท`).join('\n');
      return {
        id: `ai-${Date.now()}`,
        sender: 'nong-jod',
        text: `👛 **สรุปกระเป๋าเงินและบัญชีทั้งหมด:**\n\n- ยอดรวมทุกบัญชี: **${accountsInfo.totalBalance.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท**\n\n${accList}\n\n*(หมายเหตุ: ระบบเชื่อมต่อเพื่อตรวจสอบยอดเงินรวมเท่านั้น ไม่สามารถโอนเงินหรือทำธุรกรรมได้ ปลอดภัย 100% ค่ะ)*`,
        timestamp: timeNow,
        actionLink: { action: 'wallet', label: '👛 เปิดกระเป๋าเงิน' }
      };
    }

    // --- Part G: สุขภาพ & น้ำหนัก & BMI (Health & BMI) ---
    if (text.includes('น้ำหนัก') || text.includes('สุขภาพ') || text.includes('bmi') || text.includes('ส่วนสูง') || text.includes('อ้วน') || text.includes('ผอม')) {
      // Determine whose health to report
      const targetUser = text.includes('โจ') ? 'โจ' : text.includes('ตาล') ? 'ตาล' : currentUser;
      const targetHealth = targetUser === 'โจ' ? joHealth : tanzHealth;

      if (!targetHealth.latest) {
        return {
          id: `ai-${Date.now()}`,
          sender: 'nong-jod',
          text: `ยังไม่พบข้อมูลน้ำหนักของคุณ${targetUser}เลยค่ะ ลองกดปุ่ม "บันทึกสุขภาพ" ด้านล่างเพื่อเริ่มบันทึกครั้งแรกดูนะคะ น้องจดพร้อมช่วยคำนวณ BMI ให้ทันทีเลยค่ะ ⚖️`,
          timestamp: timeNow,
          actionLink: { action: 'health', label: '⚖️ บันทึกสุขภาพ' }
        };
      }

      let diffText = 'เท่าเดิมกับครั้งก่อน';
      if (targetHealth.diff !== 0) {
        diffText = targetHealth.diff > 0 
          ? `เพิ่มขึ้น +${targetHealth.diff} กก.` 
          : `ลดลง ${Math.abs(targetHealth.diff)} กก. 👏`;
      }

      let bmiAdvice = '';
      if (targetHealth.latest.bmi < 18.5) bmiAdvice = 'ค่อนข้างผอม ควรทานโปรตีนและอาหารให้ครบ 5 หมู่เพิ่มพลังงานนะคะ';
      else if (targetHealth.latest.bmi < 23) bmiAdvice = 'น้ำหนักสมส่วน สุขภาพดีมาก รักษาเกณฑ์นี้ไว้นะคะ!';
      else if (targetHealth.latest.bmi < 25) bmiAdvice = 'น้ำหนักเกินเกณฑ์เล็กน้อย ดื่มน้ำเยอะๆ และขยับร่างกายบ่อยๆ นะคะ';
      else bmiAdvice = 'อยู่ในเกณฑ์ท้วม/อ้วน ลองชวนกันไปเดินเล่นหรือออกกำลังกายด้วยกันดูนะคะ 💕';

      return {
        id: `ai-${Date.now()}`,
        sender: 'nong-jod',
        text: `⚖️ **ข้อมูลสุขภาพของคุณ${targetUser} (${targetHealth.latest.record_date}):**\n\n- น้ำหนัก: **${targetHealth.latest.weight_kg} กก.** (${diffText})\n- ส่วนสูง: **${targetHealth.latest.height_cm} ซม.**\n- ค่า BMI: **${targetHealth.latest.bmi}**\n\n💡 **คำแนะนำจากน้องจด:** ${bmiAdvice}\n*(ข้อมูลสุขภาพเป็นข้อมูลส่วนตัว แยกสิทธิ์จากเงินคู่ค่ะ)*`,
        timestamp: timeNow,
        actionLink: { action: 'health', label: '⚖️ ดูประวัติสุขภาพ' }
      };
    }

    // --- Part H: สแกนสลิป (Slip Scanner OCR) ---
    if (text.includes('สลิป') || text.includes('สแกน') || text.includes('ocr') || text.includes('ใบเสร็จ')) {
      return {
        id: `ai-${Date.now()}`,
        sender: 'nong-jod',
        text: `📸 **ระบบสแกนสลิปอัตโนมัติ (OCR):**\n\n- รองรับสลิปโอนเงินทุกธนาคาร (KBank, SCB, PromptPay ฯลฯ)\n- ระบบจะอ่านยอดเงิน วันที่ และเลขอ้างอิงให้อัตโนมัติ\n- **มีระบบตรวจสลิปซ้ำ (Duplicate Detection)** ป้องกันการลงรายการซ้ำ\n- ผู้ใช้จะได้ตรวจสอบยอดเงินก่อนกดบันทึกจริงเสมอค่ะ!`,
        timestamp: timeNow,
        actionLink: { action: 'ocr', label: '📸 สแกนสลิปทันที' }
      };
    }

    // --- Part I: จดด้วยเสียง (Voice Recording) ---
    if (text.includes('เสียง') || text.includes('พูด') || text.includes('ไมค์') || text.includes('สั่ง')) {
      return {
        id: `ai-${Date.now()}`,
        sender: 'nong-jod',
        text: `🎤 **วิธีจดด้วยเสียงภาษาไทย:**\n\nคุณ${currentUser}กดปุ่ม "จดด้วยเสียง" แล้วพูดได้เลย เช่น:\n- *"วันนี้ซื้อข้าว 120 บาท"*\n- *"เติมน้ำมัน 800 บาท โจจ่าย"*\n- *"วันนี้น้ำหนัก 68 กิโลกรัม"*\n\nระบบจะแยกประเภทและกรอกฟอร์มให้อัตโนมัติ สะดวกมากๆ เลยค่ะ!`,
        timestamp: timeNow,
        actionLink: { action: 'voice', label: '🎤 ลองจดด้วยเสียง' }
      };
    }

    // --- Part J: ธีมสี (Theme) ---
    if (text.includes('ธีม') || text.includes('สี') || text.includes('เปลี่ยนธีม') || text.includes('theme')) {
      return {
        id: `ai-${Date.now()}`,
        sender: 'nong-jod',
        text: `🎨 **ระบบธีมพาสเทล 6 สไตล์:**\n\n1. ☁️ **Sky Day:** ท้องฟ้าสีฟ้าสว่าง สดชื่น\n2. 💖 **Pink Love:** ชมพูพาสเทล อบอุ่นหัวใจ\n3. 💜 **Lavender Dream:** ม่วงอ่อนละมุน ฝันหวาน\n4. 🌿 **Mint Fresh:** เขียวมิ้นต์ สบายตา\n5. ☀️ **Sunshine:** เหลืองสดใส แดดอุ่น\n6. 🌙 **Night Sky:** ค่ำคืนกรมท่า ลุ่มลึกดาวพราว\n\nกดปุ่มด้านล่างเพื่อเปลี่ยนธีมได้ทันทีค่ะ!`,
        timestamp: timeNow,
        actionLink: { action: 'theme', label: '🎨 เลือกธีมสีใหม่' }
      };
    }

    // --- Part K: Google Sheets & ความปลอดภัย ---
    if (text.includes('ชีต') || text.includes('sheets') || text.includes('ซิงก์') || text.includes('sync') || text.includes('ปลอดภัย')) {
      return {
        id: `ai-${Date.now()}`,
        sender: 'nong-jod',
        text: `📊 **การเชื่อมต่อ Google Sheets:**\n\n- เชื่อมต่อกับ Spreadsheet ID ที่กำหนดอย่างปลอดภัย\n- อ่านและบันทึกข้อมูลสองทาง ไม่ลบหรือเขียนทับข้อมูลเดิม\n- มีระบบป้องกันสูตรอันตราย (Formula Injection Protection)\n- ทำงานแบบ Offline-First ได้ เมื่อต่อเน็ตจะซิงก์ขึ้นชีตให้อัตโนมัติค่ะ ☁️`,
        timestamp: timeNow
      };
    }

    // --- Part L: คำแนะนำวางแผนการเงินคู่ & การออม ---
    if (text.includes('วางแผน') || text.includes('ประหยัด') || text.includes('ออม') || text.includes('เก็บเงิน')) {
      return {
        id: `ai-${Date.now()}`,
        sender: 'nong-jod',
        text: `💡 **เคล็ดลับการเงินคู่รัก 50/30/20 จากน้องจด:**\n\n1. **50% รายจ่ายจำเป็น:** ค่ากินอยู่ ค่าน้ำมัน ค่าห้อง จัดการด้วยงบประจำเดือน\n2. **30% ความสุขคู่รัก:** ดูหนัง ท่องเที่ยว กินข้าวนอกบ้านแบบพอดีๆ\n3. **20% เงินออมคู่:** โอนเข้า "เงินออมคู่เพื่ออนาคต" ทันทีที่เงินเดือนออก\n\n💕 ชวนกันบันทึกทุกวัน ช่วยให้รู้ยอดไวและไปถึงเป้าหมายด้วยกันได้เร็วขึ้นค่ะ!`,
        timestamp: timeNow,
        actionLink: { action: 'budget', label: '🎯 ตั้งเป้าหมายงบประมาณ' }
      };
    }

    // --- Default: ทักทาย & นำทางทุกส่วน ---
    return {
      id: `ai-${Date.now()}`,
      sender: 'nong-jod',
      text: `สวัสดีค่ะคุณ${currentUser}! น้องจดพร้อมช่วยดูแลทุกส่วนของระบบเลยค่ะ 💕\n\nลองถามน้องจดเรื่องเหล่านี้ได้เลยนะคะ:\n- 💰 "เงินคู่เหลือเท่าไหร่?" หรือ "สรุปยอดเงิน"\n- 📊 "ใครใช้เงินเยอะกว่ากัน?"\n- 🎯 "งบประมาณเดือนนี้เป็นยังไง?"\n- 👛 "กระเป๋าเงินมีบัญชีอะไรบ้าง?"\n- ⚖️ "เช็คน้ำหนักและค่า BMI ล่าสุด"\n- 📸 "สแกนสลิปทำยังไง?"\n- 🎤 "จดด้วยเสียงพูดยังไง?"\n- 🎨 "มีธีมสีอะไรบ้าง?"`,
      timestamp: timeNow
    };
  }
}
