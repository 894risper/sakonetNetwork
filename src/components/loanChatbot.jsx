import { useEffect, useRef, useState } from "react";
import {
  Bot,
  X,
  Send,
  User,
  Sparkles,
  ChevronDown,
} from "lucide-react";

const c = {
  green: "#0E4432",
  greenLight: "#1B6B4C",
  gold: "#C9A227",
  bg: "#F6F4EF",
  card: "#FFFFFF",
  sage: "#EEF1EA",
  text: "#16201B",
  muted: "#6B7368",
  border: "#E3E0D6",
  sakonet: "#2F5D8A",
  sakonetBg: "#E9EFF6",
  sakonetBorder: "#C7D6E8",
};

export default function LoanChatbot({ member, onClose }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "bot",
      text: `Hello ${member.name.split(" ")[0]} 👋. I'm your SAKONET Loan Assistant. How can I help you today?`,
    },
  ]);

  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  // Simple incrementing id counter (pure alternative to Date.now()).
  // Message 1 is the greeting, so new messages start at 2.
  const nextIdRef = useRef(2);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  // --------------------------------------------------
  // HARD-CODED CHATBOT RESPONSES
  // --------------------------------------------------

  const getBotResponse = (message) => {
    const text = message.toLowerCase().trim();

    // 1. BORROWING CAPACITY
    if (
      text.includes("how much can i borrow") ||
      text.includes("how much can i get") ||
      text.includes("borrowing capacity") ||
      text.includes("borrowing limit") ||
      text.includes("eligible") ||
      text.includes("qualify") ||
      text.includes("50,000") ||
      text.includes("50000")
    ) {
      const maximum = member.savings * member.eligibility;

      return `Based on your current savings of KES ${member.savings.toLocaleString()} and the ${member.eligibility}× savings rule, you are eligible to borrow up to KES ${maximum.toLocaleString()}.

This is your maximum borrowing capacity before considering any other loan or guarantee obligations.`;
    }

    // 2. GUARANTEE EXPOSURE
    if (
      text.includes("guarantee") ||
      text.includes("guarantor") ||
      text.includes("guaranteeing") ||
      text.includes("exposure")
    ) {
      return `Your current guarantee exposure is KES 90,000.

You are currently guaranteeing a loan for Kiplagat Ruto.

The guaranteed amount is KES 90,000 and the loan currently has 62% cleared.`;
    }

    // 3. LOAN PRODUCTS
    if (
      text.includes("loan product") ||
      text.includes("loan products") ||
      text.includes("interest") ||
      text.includes("interest rate") ||
      text.includes("rate") ||
      text.includes("repayment period") ||
      text.includes("loan types") ||
      text.includes("what loans")
    ) {
      return `Here are the available loan products:

• Emergency Loan — 1.0%/month, up to 12 months
• School Fees Loan — 1.0%/month, up to 24 months
• Development Loan — 1.0%/month, up to 48 months
• Salary Advance — 1.0%/month, up to 3 months
• Sakonet Boresha — 1.0%/month, up to 36 months

The Development Loan can be used for land, construction, or business capital.`;
    }

    // 4. DEVELOPMENT LOAN / APPLICATION STATUS
    if (
      text.includes("development loan") ||
      text.includes("application status") ||
      text.includes("application") ||
      text.includes("approved") ||
      text.includes("disbursed") ||
      text.includes("loan status")
    ) {
      return `Your Development Loan application is currently under review by Mkulima SACCO.

Status:
• Application: Submitted
• SACCO review: In progress
• Approval: Pending
• Disbursement: Not yet made

You will receive a notification once the SACCO completes the review.`;
    }

    // 5. REPAYMENT / BALANCE
    if (
      text.includes("repayment") ||
      text.includes("repay") ||
      text.includes("payment") ||
      text.includes("balance") ||
      text.includes("outstanding") ||
      text.includes("due")
    ) {
      return `Your next loan repayment is KES 25,000.

Payment date: 1st of each month.

For this prototype, your repayment schedule is based on the active loan record shown in the member application.`;
    }

    // 6. STATEMENT
    if (
      text.includes("statement") ||
      text.includes("transaction") ||
      text.includes("transactions") ||
      text.includes("email")
    ) {
      return `Your latest member statement contains your savings, loan repayments, and other account transactions.

In this prototype, you can use the "Statement" option from the home screen to access your statement.

Email statement functionality can be connected to the SACCO's email service later.`;
    }

    // 7. SAVINGS
    if (
      text.includes("savings") ||
      text.includes("deposit") ||
      text.includes("deposits")
    ) {
      return `Your current savings balance is KES ${member.savings.toLocaleString()}.

Your shares balance is KES ${member.shares.toLocaleString()}.

Your current borrowing eligibility is based on ${member.eligibility}× your savings.`;
    }

    // 8. HELLO
    if (
      text === "hi" ||
      text === "hello" ||
      text === "hey" ||
      text.includes("good morning") ||
      text.includes("good afternoon")
    ) {
      return `Hello ${member.name.split(" ")[0]} 👋. I can help you with:

• Borrowing capacity
• Guarantee exposure
• Loan products
• Application status
• Repayments
• Statements

What would you like to know?`;
    }

    // 9. HELP
    if (
      text.includes("help") ||
      text.includes("what can you do") ||
      text.includes("what can i ask")
    ) {
      return `You can ask me things like:

"How much can I borrow?"

"How much of my deposits have I used to guarantee others?"

"What loan products are available?"

"What's the interest rate for the Development Loan?"

"Has my Development Loan been approved?"

"When is my next repayment?"

"Can I get my latest statement?"`;
    }

    // 10. DEFAULT RESPONSE
    return `I can help you with your SACCO loans and account information.

Try asking:

• "How much can I borrow?"
• "How much am I guaranteeing?"
• "What loan products are available?"
• "What's my Development Loan status?"
• "When is my next repayment?"
• "Show me my statement."`;
  };

  // --------------------------------------------------
  // SEND MESSAGE
  // --------------------------------------------------

  const sendMessage = (text = input) => {
    const cleanText = text.trim();

    if (!cleanText) return;

    const userId = nextIdRef.current++;
    const botId = nextIdRef.current++;

    const userMessage = {
      id: userId,
      sender: "user",
      text: cleanText,
    };

    const botMessage = {
      id: botId,
      sender: "bot",
      text: getBotResponse(cleanText),
    };

    setMessages((previous) => [
      ...previous,
      userMessage,
      botMessage,
    ]);

    setInput("");
  };

  // --------------------------------------------------
  // QUICK QUESTIONS
  // --------------------------------------------------

  const quickQuestions = [
    "How much can I borrow?",
    "My guarantee exposure",
    "What loan products are available?",
    "What's my loan status?",
  ];

  return (
    <div
      className="absolute inset-0 z-50 flex flex-col"
      style={{
        background: c.bg,
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* HEADER */}
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{
          background: c.green,
          color: "white",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center rounded-full"
            style={{
              width: 42,
              height: 42,
              background: "rgba(255,255,255,0.14)",
            }}
          >
            <Bot size={23} />
          </div>

          <div>
            <div
              className="flex items-center gap-2"
              style={{
                fontSize: 15,
                fontWeight: 700,
              }}
            >
              SAKONET Loan Assistant
              <Sparkles size={13} color={c.gold} />
            </div>

            <div
              style={{
                fontSize: 11,
                opacity: 0.75,
                marginTop: 2,
              }}
            >
              Mkulima SACCO
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="flex items-center justify-center rounded-full"
          style={{
            width: 34,
            height: 34,
            background: "rgba(255,255,255,0.1)",
          }}
        >
          <X size={19} />
        </button>
      </div>

      {/* CHAT AREA */}
      <div
        className="flex-1 overflow-y-auto px-4 py-4"
        style={{
          paddingBottom: 10,
        }}
      >
        {/* INTRO CARD */}
        <div
          className="mb-4 rounded-2xl p-4"
          style={{
            background: c.sakonetBg,
            border: `1px solid ${c.sakonetBorder}`,
          }}
        >
          <div
            className="flex items-center gap-2 mb-2"
            style={{
              color: c.sakonet,
              fontWeight: 700,
              fontSize: 13,
            }}
          >
            <Bot size={16} />
            Loan Assistant
          </div>

          <p
            style={{
              color: c.text,
              fontSize: 12,
              lineHeight: 1.5,
              margin: 0,
            }}
          >
            Ask about your borrowing capacity, guarantees,
            loan products, application status, repayments or
            statements.
          </p>
        </div>

        {/* MESSAGES */}
        <div className="flex flex-col gap-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.sender === "user"
                  ? "justify-end"
                  : "justify-start"
              }`}
            >
              <div
                className="flex gap-2"
                style={{
                  maxWidth: "88%",
                  flexDirection:
                    message.sender === "user"
                      ? "row-reverse"
                      : "row",
                }}
              >
                {/* AVATAR */}
                <div
                  className="flex-shrink-0 flex items-center justify-center rounded-full"
                  style={{
                    width: 28,
                    height: 28,
                    background:
                      message.sender === "user"
                        ? c.sage
                        : c.green,
                    color:
                      message.sender === "user"
                        ? c.green
                        : "white",
                  }}
                >
                  {message.sender === "user" ? (
                    <User size={14} />
                  ) : (
                    <Bot size={14} />
                  )}
                </div>

                {/* MESSAGE */}
                <div
                  className="rounded-2xl px-4 py-3"
                  style={{
                    background:
                      message.sender === "user"
                        ? c.green
                        : c.card,
                    color:
                      message.sender === "user"
                        ? "white"
                        : c.text,
                    border:
                      message.sender === "user"
                        ? "none"
                        : `1px solid ${c.border}`,
                    fontSize: 12,
                    lineHeight: 1.55,
                    whiteSpace: "pre-line",
                    borderTopRightRadius:
                      message.sender === "user"
                        ? 5
                        : 18,
                    borderTopLeftRadius:
                      message.sender === "bot"
                        ? 5
                        : 18,
                  }}
                >
                  {message.text}
                </div>
              </div>
            </div>
          ))}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* QUICK QUESTIONS */}
      <div
        className="px-4 pb-2"
        style={{
          background: c.bg,
        }}
      >
        <div
          className="flex gap-2 overflow-x-auto"
          style={{
            scrollbarWidth: "none",
          }}
        >
          {quickQuestions.map((question) => (
            <button
              key={question}
              onClick={() => sendMessage(question)}
              className="flex-shrink-0 rounded-full px-3 py-2"
              style={{
                background: c.card,
                border: `1px solid ${c.border}`,
                color: c.green,
                fontSize: 10,
                fontWeight: 600,
              }}
            >
              {question}
            </button>
          ))}
        </div>
      </div>

      {/* INPUT */}
      <div
        className="px-4 py-3"
        style={{
          background: c.card,
          borderTop: `1px solid ${c.border}`,
        }}
      >
        <div
          className="flex items-center gap-2 rounded-2xl px-3 py-2"
          style={{
            background: c.bg,
            border: `1px solid ${c.border}`,
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                sendMessage();
              }
            }}
            placeholder="Ask about your loan..."
            className="flex-1 outline-none bg-transparent"
            style={{
              fontSize: 12,
              color: c.text,
            }}
          />

          <button
            onClick={() => sendMessage()}
            disabled={!input.trim()}
            className="flex items-center justify-center rounded-full"
            style={{
              width: 34,
              height: 34,
              background: input.trim()
                ? c.green
                : c.border,
              color: "white",
            }}
          >
            <Send size={15} />
          </button>
        </div>

        <div
          className="flex justify-center items-center gap-1 mt-2"
          style={{
            fontSize: 9,
            color: c.muted,
          }}
        >
          <ChevronDown size={10} />
          Prototype assistant — responses are predefined
        </div>
      </div>
    </div>
  );
}