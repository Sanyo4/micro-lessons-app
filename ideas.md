# Tab 1

* **Cactus AI (Cactus Compute):** An on-device AI inference engine for mobile. Enables private, offline-ready, low-latency AI apps via Flutter, React Native, or Kotlin. Supports tool calls, auto RAG, and cloud handoff for complex tasks.  
  [https://www.cactuscompute.com/](https://www.cactuscompute.com/)  
* **FunctionGemma:** Google's ultra-lightweight Gemma 3 270M model fine-tuned for function calling. Translates natural language into executable API actions on-device. Designed to be further fine-tuned for specific domains.  
  [https://blog.google/innovation-and-ai/technology/developers-tools/functiongemma/](https://blog.google/innovation-and-ai/technology/developers-tools/functiongemma/) 

Together they enable **on-device, private, real-time AI agents** — which opens up powerful possibilities for each theme.

Front end: [https://stitch.withgoogle.com/](https://stitch.withgoogle.com/) \- creates wireframes and front end code

Ideating: [https://labs.google.com/mixboard/welcome](https://labs.google.com/mixboard/welcome) \- helps ideate the path we pick

## **Theme 5: Financial Technologies for Social Impact**

1. **Fintech \+ NLP-ML (FunctionGemma on Cactus) \+ Games/Accessibility** A gamified financial literacy app for young adults that runs fully offline. Users speak or type financial queries ("How much can I spend on eating out this week?"). FunctionGemma, running on Cactus, translates this into budgeting function calls (`calculate_remaining("food", "weekly")`, `suggest_savings("£20")`). Game mechanics reward consistent budgeting. All financial data stays on-device for privacy.

* Onboarding Flow  
* Card Swiping Feature  
- To determine their motivation for using the app   
- Budgeting/Emergency Fund/ Financial Literacy  
* If users choose voice:  
- Ask in conversational way   
- AI: "What's your monthly income? Don't worry, rough estimate is fine."  
- AI: "Got it, £1,500. What are your biggest expenses?"  
* If users choose text:   
- Progress bar with choices   
* Generate plan (?) based on their behaviors and input **OR** generate plan and allow user to tweak it  
* Based on their biggest expense, gamify a quest  
* Notification features

**General Alerts**

- Budget remaining notifications e.g. ‘you spent £50 on food, you have £50 left for the week’ \- Users can track and be aware of their weekly/monthly budgets  
- Saving suggestions (?) \- ‘Remember to transfer £25 to your savings’

**Time-Based alerts**

- Daily budget allowance (At the start of the day)?   
- Payday prompts \- ‘Payday is approaching, let’s plan your budget before you start spending’  
- Weekend reminder \- ‘You’ve got £25 left in your budget for food this weekend’  
- Evening Alerts \- ‘You tend to make impulsive purchases at this time’

**Tone & Cognitive Load Customisation**

- Users can choose notification style : Calm/ Direct/ Encouraging etc..   
- Options for daily summary instead of frequent alerts → supports neurodivergent users who have high anxiety and get overstimulated easily. 

**Impulse Intervention**

- When logging a purchase that seems impulsive ( track this by seeing unusually high costs compared to user’s normal spending in that category, spending outside normal time patterns e.g. late night , purchases exceeding weekly budget).   
    
* **Gamification features** 

\- Progressive Leveling System: Users advance through 5 levels (Budget Beginner → Fiscal Master) by earning XP from actions like logging transactions (+5) or completing daily challenges (+10). Each level unlocks new features (e.g., voice input at Level 2, savings goals at Level 3), preventing new users from being overwhelmed.

\- Badges & Streaks: 10-12 achievement badges reward specific milestones (e.g., "First Transaction," "90-Day Streak"). A prominent streak counter with a "Streak Freeze" mechanic (one per month, costing 100 XP) encourages daily engagement without punishing occasional missed days.

\- Daily Challenges & Immediate Feedback: Three rotating daily challenges (e.g., "Log 3 transactions") provide focused tasks. Every action triggers visual feedback (+XP pop-ups, confetti on level-ups), and Gemma adapts her tone (Hype/Coach/Encouragement) based on user context to reinforce behavior.

\- Strategic Feature Gating: Core functionality is deliberately locked behind level progression. This serves as both a reward mechanism and a UX tool, letting users master basic budgeting before introducing advanced features like custom categories or data exports.

* MVP features   
- Create a mini app (Claude, AI stuff, Gemini CLI) with these features and then we share the features and discuss and after that combine   
- FunctionGemma and Cactus   
- Everyone fill up the requirement sheet as you do this  
- **GET IT DONE BY MONDAY**  
* Voice or Text interface **(Deborah and Eric)**  
- Users can choose to operate the app with either their voice or normal touch commands.   
- This caters for multiple excluded populations simultaneously such as the visually impaired.   
- **Accessibility** feature   
* Time-based Impulse Prevention **(Zahirah and Piyumi)**  
- Based on the user's behaviour and patterns, AI will intervene at ‘high-risk’ times.   
- Example: Friday alerts after 5pm   
- Week 3 warnings  
- Payday interventions   
* Contextual Micro-Lessons/Proactive Coaching **(Sanay)**  
- Financial lessons when triggered by specific events   
- Example: When a user exceeds coffee budget → give a short insight as to how it affects their savings → challenge   
* Data Entry for the dashboard **(Zach and Greta)**


* Based on user behaviour our on-device AI will   
* Generate a budget plan which users can tweak or customise   
* Generate coaching lessons for financial literacy   
* Push notifications for intervention   
* On-Device AI   
- All AI processing happens locally on user’s device   
- We avoid sending data to cloud for processing   
- **Privacy** feature  
* Zero Bank Connection Required   
- Users manually log transactions via voice or text onto the dashboard   
- **Privacy** feature 

To do: 

- Onboarding flow \- zach (Tab 4\)  
- Notification features \- deborah and piyumi   
- Gamification features \- eric(Tab 3\)  
- MVP features \- z    
- Create git \- sanay  
- Create requirements document, mostly functional for now \- greta

# Tab 2

# **🎯 Refined UVP & MVP: Accessibility, Ethics, Societal Values**

Based on Theme 5 (Financial Technologies for Social Impact) and the research findings, here's your tailored approach:

---

## **📢 Unique Value Proposition (Social Impact-Focused)**

### **Primary UVP:**

**"Financial freedom shouldn't require wealth, privacy shouldn't cost extra, and learning shouldn't need a finance degree. We're democratizing financial literacy through AI that lives on your phone—not in the cloud—making smart money decisions accessible to everyone, regardless of income, ability, or background."**

### **Secondary UVP (User-Facing):**

**"Your money coach that works offline, protects your privacy, and meets you where you are—whether you're visually impaired, financially anxious, or just getting started."**

---

## **🌍 Core Societal Values Framework**

### **1\. ACCESSIBILITY (Universal Design)**

**Problem Statement:**

* 45% of Gen Z receive NO financial education until adulthood  
* Visually impaired users excluded from most finance apps  
* Low-income users can't afford financial advisors (33% want one, only 15% have one)  
* Financial anxiety causes 46% to avoid dealing with finances

**Your Solution:**

| Accessibility Feature | Who It Helps | How |
| ----- | ----- | ----- |
| **Voice-first interface** | Vision impaired, dyslexic, anxiety-prone | Entire app usable without screen |
| **No bank connection required** | Unbanked, students, low-income | No barriers to entry |
| **Offline-capable AI** | Rural users, data-limited plans | Works without internet |
| **Simple language (no jargon)** | Low financial literacy users | Plain English, not "amortization schedules" |
| **Anxiety-aware UX** | Financially stressed users (62%) | Low-pressure, non-judgmental tone |

---

### **2\. ETHICS (Privacy-First, Non-Exploitative)**

**Problem Statement:**

* 84% of Gen Z distrust large institutions  
* Financial apps sell data to advertisers  
* Predatory BNPL products target Gen Z (40% make late payments)  
* Social media exploits FOMO for profit (60% impulse buy)

**Your Solution:**

| Ethical Feature | What It Prevents | How |
| ----- | ----- | ----- |
| **On-device AI (no cloud)** | Data harvesting, surveillance capitalism | 100% local processing via Cactus AI |
| **No ads, no data sales** | Exploitation, privacy violations | Freemium model, not ad-based |
| **Transparent AI decisions** | "Black box" manipulation | Show WHY AI recommends something |
| **Anti-FOMO design** | Impulse spending exploitation | "Wait 24hrs" challenges, not urgency tactics |
| **No dark patterns** | Manipulation into spending | No "limited time\!" or "only 2 left\!" |

---

### **3\. SOCIETAL VALUES (Financial Inclusion & Empowerment)**

**Problem Statement:**

* 55% of Gen Z lack 3-month emergency fund (consistent 2022-2025)  
* 53% don't make enough to live life they want  
* Financial stress causes mental health crisis (47% excessive anxiety)  
* Education gap: parents can't teach modern finance (84% rely on them)

**Your Solution:**

| Societal Impact Feature | Problem Addressed | Measurement |
| ----- | ----- | ----- |
| **Financial literacy for all** | Only 24% understand basic concepts | % completing micro-lessons |
| **Mental health integration** | 69% feel anxious/depressed about money | Anxiety reduction tracking |
| **Breaking paycheck-to-paycheck cycle** | 55% no emergency fund | Users building £100+ buffer |
| **Intergenerational equity** | Parents can't teach modern finance | Knowledge transfer to peers/family |
| **Social transparency ("Loud Budgeting")** | 68% embarrassed about inability to save | Community challenges, shared goals |

---

## **🚀 MVP Features (Accessibility, Ethics, Society-Aligned)**

### **Tier 1: Core Social Impact Features (Must-Have for Demo)**

#### **1\. Voice-First Accessibility 🎤**

**Societal Value:** Financial inclusion for vision-impaired, dyslexic, low-literacy users

**Features:**

* ✅ **Voice-only mode toggle** (entire app usable without screen)  
* ✅ **Natural language input** ("I spent twelve pounds on coffee")  
* ✅ **Audio feedback** for all actions (budgets, alerts, achievements)  
* ✅ **Voice-driven challenges** (trivia, budget check-ins)

**Demo Showcase:**

* User completes entire onboarding with eyes closed  
* Logs transaction while driving (hands-free)  
* Receives budget alert via voice notification

**Assessment Criteria Alignment:**

* ✅ **Accessibility:** Universal design principle  
* ✅ **Technical Quality:** FunctionGemma voice integration  
* ✅ **Social Impact:** Serves visually impaired community

  ---

  #### **2\. On-Device AI (Privacy-First Architecture) 🔒**

**Societal Value:** Ethical AI that doesn't exploit user data

**Features:**

* ✅ **100% local processing** (Cactus AI \+ FunctionGemma)  
* ✅ **Offline-capable** (works without internet)  
* ✅ **Privacy dashboard** ("Your data has never left this phone: 47 days, 0 uploads")  
* ✅ **Transparent AI reasoning** (show WHY decisions are made)

**Demo Showcase:**

* Turn off WiFi, show app fully functional  
* Real-time privacy counter ("0 cloud requests")  
* AI explains budget recommendation in plain language

**Assessment Criteria Alignment:**

* ✅ **Ethical Considerations:** Privacy-first design  
* ✅ **Emerging Tech:** On-device AI (novel in fintech)  
* ✅ **Social Impact:** Protects vulnerable users from data exploitation

  ---

  #### **3\. Proactive Mental Health-Aware Coaching 🧠**

**Societal Value:** Reduces financial anxiety, breaks avoidance cycle

**Features:**

* ✅ **Week 3 anxiety intervention** (proactive check-in when stress spikes)  
* ✅ **Stress-reducing language** ("Let's figure this out together" not "You're overspending")  
* ✅ **Avoidance detection** ("Haven't checked in 3 days \- everything OK?")  
* ✅ **Alternative coping mechanisms** (breathing exercises, not shopping)  
* ✅ **Gentle progress tracking** (focus on wins, not failures)

**Demo Showcase:**

* Simulate week 3 scenario → AI proactively offers help  
* Show "stress mode" vs "normal mode" UI differences  
* Demonstrate non-judgmental tone in overdraft scenario

**Assessment Criteria Alignment:**

* ✅ **Social Impact:** Addresses mental health crisis (47% excessive anxiety)  
* ✅ **User-Centered Design:** Empathetic, trauma-informed UX  
* ✅ **Innovation:** Mental health integration in budgeting (novel)

  ---

  #### **4\. No Bank Connection Required (Low Barrier Entry) 🚪**

**Societal Value:** Financial inclusion for unbanked, students, low-income users

**Features:**

* ✅ **Manual transaction entry** (voice or text)  
* ✅ **No account linking needed**  
* ✅ **Works for cash-based users**  
* ✅ **No credit checks, no age restrictions (13+)**

**Demo Showcase:**

* Show 60-second setup (no bank credentials)  
* Demonstrate cash transaction logging  
* Highlight "works for everyone" messaging

**Assessment Criteria Alignment:**

* ✅ **Accessibility:** Removes financial barriers  
* ✅ **Social Impact:** Serves underbanked populations  
* ✅ **Ethical Design:** No gatekeeping by financial status

  ---

  #### **5\. Anti-FOMO Behavioral Interventions 🛑**

**Societal Value:** Protects users from exploitative marketing, reduces impulse spending

**Features:**

* ✅ **Social media spending alerts** (location-aware warnings)  
* ✅ **24-hour waiting challenges** ("Wait before you buy")  
* ✅ **FOMO counter-messaging** ("This won't sell out. You have time.")  
* ✅ **Need vs. Want questionnaire** (3 questions before purchase)  
* ✅ **Impulse spending tracker** (visualize regret patterns)

**Demo Showcase:**

* User near coffee shop → voice alert "You've hit your coffee limit"  
* Show "24-hour challenge accepted" notification  
* Display impulse spending reduction over time

**Assessment Criteria Alignment:**

* ✅ **Ethical Considerations:** Anti-exploitation design  
* ✅ **Social Impact:** Addresses $844/year impulse spending problem  
* ✅ **Behavioral Design:** Evidence-based interventions

  ---

  #### **6\. Micro-Lessons (Bite-Sized Financial Literacy) 📚**

**Societal Value:** Free financial education for those who can't afford advisors

**Features:**

* ✅ **30-second lessons** unlocked through usage  
* ✅ **Context-aware teaching** (learn about interest when you get charged)  
* ✅ **Audio narration** for accessibility  
* ✅ **Real-world application** (not abstract theory)  
* ✅ **Progressive difficulty** (scaffolded learning)

**Demo Showcase:**

* User overspends → unlocks "Why impulse buying happens" lesson  
* Show lesson completion → badge earned  
* Demonstrate knowledge retention quiz

**Assessment Criteria Alignment:**

* ✅ **Social Impact:** Democratizes financial education (45% get none)  
* ✅ **Accessibility:** Audio \+ visual \+ text formats  
* ✅ **Gamification:** Learning through play

  ---

  ### **Tier 2: Enhanced Social Impact Features (Nice-to-Have)**

  #### **7\. Community Challenges ("Loud Budgeting") 👥**

**Societal Value:** Reduces shame, builds peer support

**Features:**

* ✅ **Opt-in shared challenges** ("No takeout week" with friends)  
* ✅ **Anonymous leaderboards** (privacy-preserving competition)  
* ✅ **Peer encouragement** (celebrate others' wins)  
* ⚠️ **NO social comparison** (no "look how much X saved")

**Why Tier 2:**

* Requires backend infrastructure (not fully on-device)  
* More complex to build in 10 weeks

  ---

  #### **8\. Family Mode (Intergenerational Learning) 👨‍👩‍👧**

**Societal Value:** Knowledge transfer when parents can't teach

**Features:**

* ✅ **Parent-child budget sharing** (transparency without control)  
* ✅ **Allowance management** (teaches budgeting early)  
* ✅ **Role reversal mode** (kids teach parents about apps)

**Why Tier 2:**

* Requires user management system  
* Scope creep risk

  ---

  #### **9\. Simple Mode vs. Advanced Mode 🔄**

**Societal Value:** Meets users at their level

**Features:**

* ✅ **Beginner mode** (3 budget categories, basic tracking)  
* ✅ **Advanced mode** (detailed analytics, investment tracking)  
* ✅ **Adaptive difficulty** (AI suggests when to upgrade)

**Why Tier 2:**

* Doubles UI development work  
* Can demonstrate with single mode for MVP

  ---

  ## **🎨 Accessibility-First Design Principles**

  ### **WCAG 2.1 AA Compliance (Minimum Standard):**

| Criterion | Implementation | Why It Matters |
| ----- | ----- | ----- |
| **Perceivable** | High contrast (4.5:1), screen reader support, audio alternatives | 15% of users have vision impairments |
| **Operable** | Voice-first, large touch targets (44px min), no time limits on actions | 62% financially anxious → reduce friction |
| **Understandable** | Plain language (6th-grade reading level), consistent navigation | Only 24% understand basic finance |
| **Robust** | Works across devices, offline-capable, graceful degradation | Low-income users have older phones |

  ---

  ### **Inclusive Design Checklist:**

  #### **Visual Accessibility:**

* ✅ Font size: Minimum 16px, scalable to 24px  
* ✅ Color: Never sole indicator (use icons \+ text)  
* ✅ Contrast: AAA standard (7:1) for critical elements  
* ✅ Screen reader: Full VoiceOver/TalkBack support

  #### **Cognitive Accessibility:**

* ✅ Simple language: "money left" not "discretionary income"  
* ✅ Progress indicators: "2 of 5 steps" not just loading bars  
* ✅ Undo actions: Forgive mistakes easily  
* ✅ Chunking: Max 3 items per screen

  #### **Motor Accessibility:**

* ✅ Voice control: Full voice navigation  
* ✅ Large targets: 44px minimum touch zones  
* ✅ Shake-to-undo: Alternative to precise taps  
* ✅ One-handed mode: All features reachable with thumb

  #### **Neurodiversity Support:**

* ✅ No flashing animations (seizure risk)  
* ✅ Reduce motion option (vestibular disorders)  
* ✅ Focus mode: Hide distractions  
* ✅ Predictable patterns: Consistent UI

  ---

  ## **⚖️ Ethical AI Framework**

  ### **Transparency Requirements:**

| AI Decision | Must Explain | Example |
| ----- | ----- | ----- |
| **Budget recommendation** | Why this amount, what data used | "Based on your last 4 weeks, you spend £15/day on average" |
| **Challenge generation** | Why this challenge, personalization | "You skip lunch 2x/week, so I suggest meal prep" |
| **Spending alert** | What triggered it, how to fix | "Coffee limit hit because you're at £25/mo (your goal: £20)" |
| **Pattern detection** | What pattern, confidence level | "You tend to overspend on Fridays (seen 3 of 4 weeks)" |

  ---

  ### **Bias Mitigation:**

| Potential Bias | Mitigation Strategy | Testing |
| ----- | ----- | ----- |
| **Income assumptions** | Never assume "normal" income level | Test with £800/mo and £3000/mo users |
| **Cultural spending** | No judgment on "necessary" categories | Allow custom categories |
| **Gender stereotypes** | Gender-neutral language, equal representation | A/B test messaging |
| **Ability assumptions** | Design for diverse abilities first | User testing with disabled users |

  ---

  ### **Consent & Control:**

| User Right | Implementation |
| ----- | ----- |
| **Right to understand** | Plain language AI explanations |
| **Right to control** | Turn off any AI feature |
| **Right to delete** | One-tap data deletion |
| **Right to export** | CSV export of all data |
| **Right to offline** | Full functionality without cloud |

  ---

  ## **📊 Social Impact Metrics (For Report)**

  ### **Primary Impact Indicators:**

| Metric | Target | Why It Matters |
| ----- | ----- | ----- |
| **Emergency fund growth** | 30% of users build £100+ buffer in 3 months | Addresses 55% lacking emergency savings |
| **Anxiety reduction** | 25% reduction in self-reported money stress | Addresses 62% stressed 3+ days/week |
| **Impulse spending decrease** | 20% reduction in social media purchases | Addresses $844/year average impulse spend |
| **Financial literacy gain** | 40% increase in quiz scores over 6 weeks | Addresses only 24% understanding basics |
| **Accessibility adoption** | 15% use voice-only mode regularly | Demonstrates inclusive design success |

  ---

  ### **Equity Indicators:**

| Population | Success Metric | Baseline Problem |
| ----- | ----- | ----- |
| **Low-income users** | Equal engagement rate vs high-income | 53% feel they don't make enough |
| **Vision-impaired users** | Complete onboarding via voice-only | Excluded from most finance apps |
| **Unbanked users** | Track spending without bank connection | 15% have advisor, 33% want one |
| **High-anxiety users** | Lower dropout rate than other apps | 46% avoid finances for mental health |

  ---

  ## **🎯 MVP Feature Priority Matrix**

  ### **Must-Have (Week 1-6):**

| Feature | Accessibility | Ethics | Society | Technical Complexity |
| ----- | ----- | ----- | ----- | ----- |
| **Voice-first interface** | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ | 🔧🔧🔧 Medium |
| **On-device AI** | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | 🔧🔧🔧🔧 High |
| **No bank connection** | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ | 🔧 Low |
| **Mental health coaching** | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | 🔧🔧 Low-Med |
| **Anti-FOMO interventions** | ⭐ | ⭐⭐⭐ | ⭐⭐⭐ | 🔧🔧 Medium |
| **Micro-lessons** | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ | 🔧🔧 Medium |

**Total Development Time: 6 weeks**

---

### **Should-Have (Week 7-9):**

| Feature | Value | Complexity |
| ----- | ----- | ----- |
| **Privacy dashboard** | ⭐⭐⭐ | 🔧 Low |
| **Transparent AI explanations** | ⭐⭐⭐ | 🔧🔧 Medium |
| **Impulse spending tracker** | ⭐⭐ | 🔧🔧 Medium |
| **Accessibility settings** | ⭐⭐⭐ | 🔧 Low |

---

### **Could-Have (Week 10+):**

* Community challenges  
* Family mode  
* Simple/Advanced mode toggle  
* Multi-language support

  ---

  ## **🎤 Revised Elevator Pitch (Social Impact-Focused)**

**"1 in 2 Gen Z lack emergency savings. 62% are stressed about money weekly. And most finance apps? They sell your data, require bank accounts, and ignore people with disabilities.**

**We're building the first truly accessible financial literacy app: on-device AI that protects privacy, voice-first design for everyone, and proactive coaching that reduces anxiety—not just tracks spending.**

**No bank account needed. No data harvesting. No barriers. Just financial freedom for everyone, regardless of income, ability, or background."**

---

## **📝 For Your Individual Report (1500 words)**

### **Impact Section Structure:**

#### **Accessibility Impact (300 words):**

* WCAG compliance demonstration  
* Voice-only mode user testing results  
* Comparison to industry (most apps fail basic accessibility)  
* Quote research: "45% receive no financial education"

  #### **Ethical Impact (300 words):**

* On-device AI vs cloud-based competitors  
* Privacy dashboard screenshots  
* Transparent AI decision-making examples  
* Quote research: "84% distrust institutions"

  #### **Societal Impact (300 words):**

* Emergency fund success metrics  
* Anxiety reduction data  
* Financial literacy improvement  
* Quote research: "55% lack 3-month savings"

  ---

**Total Word Count for Impact Section: \~900 words** (leaving 600 for intro, technical, reflection, conclusion)

---

### **5\. Anti-FOMO Behavioral Interventions 🛑**

**REVISED: Pattern-Based Impulse Prevention**

**Societal Value:** Protects users from impulse spending without invasive tracking

#### **NEW Features (Privacy-First):**

##### **A. Time-Based Pattern Interventions**

Instead of GPS location tracking, use **temporal patterns from research**:

**Features:**

* ✅ **Friday Alert** ("Fridays are when you usually overspend \- got £X left for weekend")  
  * Research: Pattern studies show Friday spending spikes  
* ✅ **Payday Warning** ("Payday tomorrow \- here's your plan for the month")  
  * Research: 68% anxious in days before payday  
* ✅ **Week 3 Check-in** ("You're in week 3 \- most people feel stretched now")  
  * Research: 56% stressed by week 3  
* ✅ **Evening Impulse Prevention** ("Late night shopping? Let's talk about it")  
  * Research: Impulse purchases spike 8pm-11pm  
* ✅ **Weekend Budget Reminder** (Saturday morning: "You have £X for fun this weekend")

**Demo Showcase:**

\[Saturday 10am\]  
AI: "Morning\! It's the weekend. You've got £35 budgeted for fun.   
     Last 3 Saturdays, you spent £40-50. Want to set a challenge?"  
User: "Yeah, what challenge?"  
AI: "Keep it under £30 this weekend, earn 100 points. Deal?"  
---

##### **B. Self-Reported Impulse Tracking**

Instead of social media API integration, use **user-initiated logging**:

**Features:**

* ✅ **"I just impulse bought" button** (quick tap after purchase)  
* ✅ **Impulse Purchase Diary** (voice: "Bought coffee because I was stressed")  
* ✅ **Trigger Tracking** ("What made you buy? Bored/Stressed/Social/Saw ad")  
* ✅ **Pattern Visualization** (chart showing impulse triggers over time)  
* ✅ **Cooling-Off Reminders** ("You've impulse-bought 3x this week \- let's check in")

**Demo Showcase:**

User: \[After buying £4 coffee\]  
User: \*taps "Impulse buy" button\*  
AI: "What triggered it?"  
User: \[selects "Saw someone with fancy coffee"\]  
AI: "That's social comparison \- happens a lot. You've done this 4 times   
     this month, always with coffee. Want to try the '24-hour challenge'?"

**Why This Works:**

* ✅ User is in control (they report, not tracked)  
* ✅ Builds self-awareness through reflection  
* ✅ Pattern detection without surveillance  
* ✅ Research shows self-monitoring reduces behavior by 20%

---

##### **C. Pre-Purchase Questionnaire (AI-Powered)**

Instead of detecting social media exposure, use **intention clarification**:

**Features:**

* ✅ **"About to buy?" quick check** (3 questions via voice or text)  
* ✅ **Need vs. Want classifier** (AI helps user decide)  
* ✅ **Alternative suggestion** ("You have coffee at home \- save £4?")  
* ✅ **Delay rewards** ("Wait 24hrs, earn 50 points")

**The 3 Questions:**

1\. "Do you NEED this or WANT this?"  
2\. "Will you still care about this in 3 days?"  
3\. "Is this in your budget this week?"

**Demo Showcase:**

User: \*Opens app before buying £15 lunch\*  
User: "I'm about to spend £15 on lunch"  
AI: "Let's check: Do you NEED this or WANT this?"  
User: "Want"  
AI: "Will you still care about this in 3 days?"  
User: "...probably not"  
AI: "You've got sandwich stuff at home. Save £15, earn 75 points?"  
User: "Okay fine"  
AI: "YES\! That's £15 back in your budget. You're crushing it."  
---

##### **D. Time-Locked Spending (The Waiting Game)**

**Features:**

* ✅ **24-Hour Challenge** ("Add to wishlist, wait 24hrs")  
* ✅ **Countdown timer** (shows time remaining)  
* ✅ **Alternative activity suggestions** (while waiting)  
* ✅ **Success celebration** (if you make it 24hrs without buying)

**Implementation:**

javascript  
// FunctionGemma function call  
add\_to\_wishlist(item: "fancy headphones", price: 89, wait\_hours: 24)

// 24 hours later  
if (\!purchased) {  
  celebrate\_willpower(points: 100, message: "You saved £89\!")  
} else {  
  log\_impulse\_purchase(item, trigger: "couldn't wait")  
}  
---

##### **E. FOMO Counter-Messaging**

Instead of detecting social media ads, **educate about marketing tactics**:

**Features:**

* ✅ **FOMO Decoder** (micro-lessons on urgency tactics)  
* ✅ **Marketing myth-busting** ("'Limited time' usually isn't")  
* ✅ **Scarcity reality check** ("This will be on sale again")  
* ✅ **AI detects FOMO language** in user's own descriptions

# Tab 3

## **Gamification features**

## **The Level System**

**We've got 5 levels that users progress through as they use the app. It's pretty straightforward \- you earn XP for doing stuff, level up, and unlock new features as you go.**

**Level 1: Budget Beginner (0-100 XP) This is where everyone starts. You can do basic budgeting and log transactions. That's it. We don't want to overwhelm new users with too many features right away.**

**Level 2: Money Manager (100-300 XP) Once you hit 100 XP, you unlock voice input and can create multiple budget categories. So now you can have separate budgets for food, transport, entertainment, etc. instead of just one general budget.**

**Level 3: Savings Starter (300-600 XP) At this level you unlock savings goals and spending insights. The app can now show you patterns in your spending and let you set actual goals like "save £200 by June".**

**Level 4: Financial Navigator (600-1000 XP) Now you're getting serious. You unlock custom categories (because maybe you want to track spending on your specific hobbies) and can customize the app's theme.**

**Level 5: Fiscal Master (1000+ XP) You've basically mastered the app at this point. Everything's unlocked including the ability to export your data as reports. This is the endgame.**

## **How You Actually Earn XP**

**We need to make sure people can actually progress without grinding for hours, so here's the breakdown:**

**Daily stuff:**

* **Log a transaction: \+5 XP (this is the most basic action, happens multiple times a day)**  
* **Check your budget status: \+2 XP (quick check-in)**  
* **Complete the daily challenge: \+10 XP (more on this later)**

**Weekly stuff:**

* **Stay under budget all week: \+25 XP (this is a big one)**  
* **Complete the weekly review with Gemma: \+15 XP (encourages reflection)**

**Monthly achievements:**

* **Actually achieve a savings goal: \+50 XP (massive reward for real progress)**

**If you do the bare minimum (log a couple transactions a day, check your budget), you can probably level up from 1 to 2 in about 2 weeks. That feels reasonable.**

## **Badges**

**We're keeping this simple with about 10-12 badges total. Each one has a specific unlock condition.**

**Starting out:**

* **First Budget: Set your first budget category**  
* **First Transaction: Log your first transaction**  
* **Voice Activated: Use voice input for the first time**  
* **Offline First Use: Use the app offline (shows off our privacy feature)**

**Consistency badges:**

* **7-Day Streak: Use the app 7 days in a row**  
* **30-Day Streak: Use it 30 days in a row**  
* **90-Day Streak: Three months straight (this one's tough)**

**Financial discipline:**

* **Budget Champion: Stay under budget for a full week**  
* **First Savings Goal: Pretty self-explanatory**  
* **Budget Master: Stay under budget for 4 consecutive weeks (hard mode)**

**Category-specific ones:**

* **Coffee Saver: Reduce coffee spending by 20% (because everyone spends too much on coffee)**  
* **Smart Shopper: Stay under grocery budget for 4 weeks straight**

**The badges are mostly for show but people like collecting them, and they give you a bit of XP when you unlock them.**

## **Daily Challenges**

**Instead of having loads of complicated quests, we're just doing simple daily challenges that rotate. One challenge per day keeps it manageable.**

**The three challenges are:**

* **"Log 3 transactions today" (+10 XP)**  
* **"Check your budget before spending" (+10 XP)**  
* **"Use voice input once" (+10 XP)**

**They just cycle through in order. So Monday might be log transactions, Tuesday is check budget, Wednesday is voice input, then it repeats. Simple pattern, easy to implement, still gives people a reason to open the app daily.**

## **The Streak System**

**This is probably the most addictive part. There's one main streak: how many days in a row you've opened the app.**

**You get a flame icon that grows bigger as your streak increases. Milestones at 7, 30, and 90 days give you bonus XP and a sense of achievement.**

**Streak Freeze: Here's the thing \- we don't want people to feel terrible if they miss one day and lose a 50-day streak. So everyone gets ONE streak freeze per month. It costs 100 XP to activate, but it protects your streak if you forget to open the app one day. You can only use it once per month though, so you can't just spam it.**

**The streak counter is displayed prominently on the home screen because that's what keeps people coming back.**

## **Visual Feedback**

**This is crucial for making the gamification feel good. Every action needs immediate feedback.**

**When you log a transaction:**

* **A "+5 XP" animation pops up**  
* **Maybe a little encouraging message like "Nice work\!" or "You're on track\!"**

**When you complete a challenge:**

* **Bigger animation, maybe some confetti effect**  
* **"+10 XP" popup**  
* **Brief celebration message**

**When you level up:**

* **Full screen animation (can't miss it)**  
* **"You've reached Level 2\!" message**  
* **Shows what you just unlocked ("Voice input now available")**  
* **Shows progress to next level to keep you motivated**

**When you earn a badge:**

* **Badge popup with the icon and name**  
* **Brief description of what you did to earn it**  
* **A bit of XP as a bonus**

**None of this needs to be fancy graphics \- even simple animations work as long as they're noticeable and feel rewarding.**

## **Gemma's Personality Responses**

**Since we're already using FunctionGemma for natural language queries, we might as well make it more engaging with different response styles. We're thinking three modes:**

**Hype Mode (celebratory):**

* **"Great work\! You're on a 5-day streak "**  
* **"Under budget again\! You're crushing it "**  
* **"That's three weeks in a row under budget. Financial wizard status unlocked "**

**Coach Mode (constructive feedback):**

* **"Coffee spending is up 30% this week compared to last week"**  
* **"Your grocery budget is 80% gone and it's only Monday"**  
* **"You're about to break your 14-day streak, just checking in"**

**Encouragement Mode (supportive):**

* **"Tough week, but you're still tracking. That's what matters"**  
* **"Small steps add up"**  
* **"Everyone overspends sometimes \- you noticed, that's growth"**

**The app can detect which mode to use based on context. If you just achieved something, use hype mode. If there's a concerning pattern, use coach mode. If you're falling behind on goals, use encouragement mode.**

## **Progressive Feature Unlocking**

**Instead of overwhelming users with everything at once, features unlock as you level up. This is actually better UX anyway \- it lets people learn the app gradually.**

**Level 1: Just basic stuff \- log transactions, set one budget category, ask Gemma simple questions Level 2: Voice input unlocked, can create multiple categories, get weekly reviews Level 3: Savings goals available, spending insights and predictions Level 4: Custom categories, theme customization, challenge creator Level 5: Everything \- export reports, advanced analytics, full customization**

**This means the demo can show progression really clearly. We can show a Level 1 user's basic interface, then show what unlocks at Level 2, etc.**

## **Technical Implementation**

**From a coding perspective, this is all pretty doable. We need to track:**

**User Progress Data:**  
**\- Current XP (integer)**  
**\- Current level (1-5)**  
**\- List of earned badges (array of strings)**  
**\- Streak count (integer)**  
**\- Last login date (to calculate streak)**  
**\- Streak freezes available (0 or 1\)**  
**\- Current daily challenge (string)**  
**\- Challenge progress (e.g., "2/3 transactions logged")**

**All of this gets stored locally in the database (SQLite probably). No cloud sync needed since everything's offline.**

**The XP calculation logic is straightforward \- just adding integers based on actions. Level up triggers when XP crosses thresholds (100, 300, 600, 1000).**

**Badge unlocking is just checking conditions and updating the badges array if they're met. We can check these conditions whenever relevant actions happen (e.g., check for streak badges after successful login, check spending badges after logging transactions).**

**The challenge system can be date-based. Like challenge\_type \= (day\_of\_year % 3), which cycles through the three challenge types. Progress resets each day at midnight.**

# Tab 4

# **Onboarding Flow**

Current onboarding flow idea is to utilize a card swiping mechanic, instead of a traditional survey to build a financial persona of the user. After this the user is asked questions to obtain information on financial income and expenses. This can be done either through voice prompts or traditional on-screen elements.

For onboarding, users can choose whether to interact via touch or use their voice. This app will not require the user to link a bank account or ask any details about their bank to ensure privacy.

# Onboarding Flow Structure

## 1\. Motivation

The first part builds a financial persona of the user to try and understand their motivations for using the app and their money.

Interface \- vibrant cards with minimal text

Actions \- Simple swipe right or left (right \= High priority, left \= Not a priority)

Card Questions:

* **Card 1:** "I want to stop living paycheck to paycheck." (Focus: **Budgeting**)  
* **Card 2:** "I want a 'Rainy Day' fund that actually exists." (Focus: **Emergency Fund**)  
* **Card 3:** "I want to understand what my bank statement is actually telling me." (Focus: **Literacy**)  
* **Card 4:** "I'm saving for a big life milestone (Home, Travel, Wedding)." (Focus: **Goal Setting**)  
* **Card 5:** "I want to know if I'm spending too much on stuff I don't need." (Focus: **Expense Tracking**)

## 2\. Data Entry

The next part is getting the financial information from the user in regards to their income, and spending habits. This part can be completed either using voice prompts or an on-screen format depending on the user’s choice.

Initial Question: “We’re almost done. How do you want to finish the setup?”

* **Option A \- Voice**  
  * Button Text: “Talk it through”  
  * Description: "Just like a voice note. Fast, hands-free, and casual."  
* **Option B \- On-Screen**  
  * Button Text: “Type it out”  
  * Description: "Visual and precise. Use sliders and taps to build your view."

Proceeding Question Structure:

*Focus: Establishing the monthly baseline.*

* **Voice Prompt:** "First things first, what’s your total take-home pay each month? Don't worry, a rough estimate is perfectly fine\!"  
* **Text/On-Screen Format:**    
  * **Header:** "What's your monthly income?"  
  * **Input Field:** Numeric keypad entry  
  * **Toggle Switch:** \[ Weekly | Monthly | Yearly \]  
  * **Description:** "Enter your post-tax amount (what actually hits your bank account)."

*Focus: Identifying fixed expenses / non-negotiable costs (Rent, Utilities, Insurance).*

* **Voice Prompt:** "Got it. Now, think about the 'bills'—rent, mortgage, council tax, and utilities. Roughly how much goes toward those essentials?"  
* **Text/On-Screen Format:**   
  * **Header:** "The Essential Expenses."  
  * **UI Element:** A vertical list of "Common Fixed Costs" with checkboxes (Rent, Energy, Internet).  
  * **Input Field:** A single total amount box that updates as they check items.

*Focus: Identifying the variable expenses / "leaks" (Groceries, Dining, Shopping).*

* **Voice Prompt:** "And what about the 'flexible' stuff? Groceries, transport, and a bit of fun. How much do you usually spend there?"  
* **Text/On-Screen Format:**  
  *  **Header:** "Daily Spending."  
  * **UI Element:** A horizontal **Slider Bar**.  
  * **Slider Range:** £0 — £1,000+.  
  * **Dynamic Label:** As the slider moves, text changes from *"Thrifty"* to *"Balanced"* to *"High Spender."*

*Focus: Identifying user’s current financial knowledge level to calibrate the AI’s terminology and advice.*

* **Voice Prompt:** "Last thing\! How confident do you feel with financial terms? Are you a total beginner, or do you know your way around an ISA and APR?"  
* **Text/On-Screen Format:**   
  * **Header:** "How should I talk to you?"  
  * **UI Element:** Three large selectable "Persona" tiles:  
    1. **Beginner:** "Keep it simple. No jargon, please."  
    2. **Learner:** "I know the basics, but explain the 'why'."  
    3. **Pro:** "Give me the raw data."