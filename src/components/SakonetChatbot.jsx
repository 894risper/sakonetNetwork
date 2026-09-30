import { useEffect, useRef, useState } from "react";
import {
  Bot,
  X,
  Send,
  User,
  Sparkles,
  ChevronRight,
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
  danger: "#B8452F",
  success: "#2E7D4F",
  sakonet: "#2F5D8A",
  sakonetBg: "#E9EFF6",
  sakonetBorder: "#C7D6E8",
};

export default function SakonetChatbot({ sacco = "Beauty SACCO", onClose }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "bot",
      text: `Hello 👋. I'm the SAKONET Assistant for ${sacco}.\n\nI can help you understand guarantor requests, guarantee exposure, float, defaults, claims, settlement and the SAKONET process.`,
    },
  ]);

  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  // Incrementing id counter (pure alternative to Date.now()).
  // Message 1 is the greeting, so new messages start at 2.
  const nextIdRef = useRef(2);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  // =========================================================
  // HARD-CODED QUESTIONS AND ANSWERS
  // =========================================================

  const getBotResponse = (question) => {
    // Hyphens become spaces so "cross-SACCO" matches "cross sacco".
    const text = question.toLowerCase().replace(/-/g, " ").trim();

    // 1. WHAT DOES SAKONET DO?
    if (
      text.includes("what does sakonet do") ||
      text.includes("what is sakonet") ||
      text.includes("how does sakonet work") ||
      text.includes("purpose of sakonet")
    ) {
      return `SAKONET is an inter-SACCO communication and guarantee-switching layer.

It connects participating SACCOs so they can securely communicate, verify, track and settle cross-SACCO guarantees.

Members continue to interact with their own SACCO. SAKONET facilitates communication and guarantee processing between the SACCOs.`;
    }

    // 2. HOW DOES ANOTHER SACCO MEMBER GUARANTEE OUR MEMBER?
    if (
      text.includes("another sacco") ||
      text.includes("external guarantor") ||
      text.includes("member from another") ||
      text.includes("guarantee our member") ||
      text.includes("cross sacco guarantee")
    ) {
      return `A member from another SACCO can guarantee a borrower through SAKONET.

The process is:

1. The borrower's SACCO submits the guarantor request.
2. SAKONET routes the request to the guarantor's SACCO.
3. The guarantor SACCO reviews the request and verifies eligibility.
4. The guarantor is notified by their own SACCO.
5. The guarantor accepts or declines.
6. The guarantor SACCO confirms the decision.
7. SAKONET sends the confirmation back to the borrower's SACCO.
8. The guarantee is recorded and the applicable amount is reserved against the guarantor SACCO's guarantee float.`;
    }

    // 3. WHAT HAPPENS IF A BEAUTY MEMBER DEFAULTS?
    if (
      text.includes("beauty member defaults") ||
      text.includes("beauty member default") ||
      text.includes("member defaults") ||
      text.includes("guarantor defaults") ||
      text.includes("guarantor default")
    ) {
      return `If a Beauty SACCO member defaults on a loan they guaranteed for a member of another SACCO, the guarantee obligation is handled between the SACCOs through SAKONET.

The applicable guarantee amount can be settled from the guarantor SACCO's reserved guarantee float according to the agreed settlement rules.

SAKONET records the claim, settlement and related transactions in the audit trail.`;
    }

    // 4. WHAT HAPPENS WHEN A BORROWER DEFAULTS?
    if (
      text.includes("borrower defaults") ||
      text.includes("borrower default") ||
      text.includes("loan default") ||
      text.includes("when a borrower")
    ) {
      return `When a borrower defaults, the borrower's SACCO begins the applicable recovery and guarantee claim process.

If a cross-SACCO guarantee is involved:

1. The borrowing SACCO initiates the claim.
2. The claim is submitted through SAKONET.
3. The guarantor SACCO receives and reviews the claim.
4. The applicable guaranteed amount is settled according to the agreed rules.
5. The settlement is recorded in SAKONET's audit trail.

SAKONET provides the communication and tracking layer between the SACCOs.`;
    }

    // 5. HOW MUCH FLOAT IS AVAILABLE?
    if (
      text.includes("float") &&
      (
        text.includes("available") ||
        text.includes("remaining") ||
        text.includes("left")
      )
    ) {
      return `Beauty SACCO has a KES 1,000,000 guarantee float.

Current position:

Total float: KES 1,000,000
Reserved against guarantees: KES 90,000
Available guarantee float: KES 910,000

The reserved amount represents active guarantee commitments.`;
    }

    // 6. HOW MUCH ARE WE GUARANTEEING?
    if (
      text.includes("how much") &&
      (
        text.includes("guaranteeing") ||
        text.includes("guarantee exposure") ||
        text.includes("external guarantees")
      )
    ) {
      return `Beauty SACCO currently has KES 90,000 committed to active cross-SACCO guarantees.

This amount is tracked by SAKONET and is reflected in the SACCO's available guarantee capacity.`;
    }

    // 7. GUARANTEE EXPOSURE
    if (
      text.includes("guarantee exposure") ||
      text.includes("our exposure") ||
      text.includes("external exposure")
    ) {
      return `Beauty SACCO's current cross-SACCO guarantee exposure is KES 90,000.

This represents active guarantee commitments made for members borrowing from other participating SACCOs.`;
    }

    // 8. PENDING REQUESTS
    if (
      text.includes("pending request") ||
      text.includes("pending guarantor") ||
      text.includes("incoming request") ||
      text.includes("requests waiting")
    ) {
      return `Beauty SACCO currently has 1 pending cross-SACCO guarantor request.

Request details:

Borrower SACCO: Mkulima SACCO
Guarantee amount: KES 90,000
Status: Awaiting Beauty SACCO review

The request must be reviewed before the proposed guarantor is notified.`;
    }

    // 9. REQUEST STATUS
    if (
      text.includes("request status") ||
      text.includes("status of the request") ||
      text.includes("where is this request") ||
      (text.includes("request") && text.includes("status"))
    ) {
      return `The KES 90,000 guarantee request from Mkulima SACCO has been received by Beauty SACCO.

Current stage:
Beauty SACCO review

Next step:
Verify the proposed guarantor and proceed with the member notification process if approved.`;
    }

    // 10. GUARANTOR ELIGIBILITY
    if (
      text.includes("guarantor eligible") ||
      text.includes("is the guarantor eligible") ||
      text.includes("eligibility") ||
      text.includes("eligible to guarantee") ||
      text.includes("guarantee capacity")
    ) {
      return `The proposed guarantor is eligible based on the configured SACCO requirements.

The guarantor has sufficient available guarantee capacity for the requested KES 90,000.

Beauty SACCO must still complete its internal review before the guarantee is confirmed.`;
    }

    // 11. AFTER GUARANTOR ACCEPTS
    if (
      text.includes("after the guarantor accepts") ||
      text.includes("guarantor accepts") ||
      text.includes("guarantor accepted") ||
      text.includes("what happens after acceptance")
    ) {
      return `After the guarantor accepts using their PIN:

1. Beauty SACCO records the member's decision.
2. Beauty SACCO confirms the acceptance.
3. The confirmation is sent through SAKONET.
4. Mkulima SACCO receives the confirmation.
5. The guarantee is recorded.
6. The applicable amount is reserved against Beauty SACCO's guarantee float.

The entire process is recorded in the SAKONET audit trail.`;
    }

    // 12. IF GUARANTOR DECLINES
    if (
      text.includes("guarantor declines") ||
      text.includes("guarantor declined") ||
      text.includes("if the guarantor declines") ||
      text.includes("decline the guarantee")
    ) {
      return `If the guarantor declines:

1. Beauty SACCO records the decision.
2. The decline confirmation is sent through SAKONET.
3. Mkulima SACCO receives the confirmation.
4. The borrower is informed by Mkulima SACCO.
5. The borrower can proceed according to the SACCO's configured replacement-guarantor process.

No guarantee commitment is created from the declined request.`;
    }

    // 13. AFTER LOAN IS REPAID
    if (
      text.includes("loan is fully repaid") ||
      text.includes("loan fully repaid") ||
      text.includes("after repayment") ||
      text.includes("guaranteed loan is repaid") ||
      text.includes("guarantee released")
    ) {
      return `Once the guaranteed loan is fully repaid, the guarantee obligation is released according to the agreed rules.

The reserved guarantee amount is released and the guarantor SACCO's available guarantee capacity increases.

SAKONET records the release in the audit trail.`;
    }

    // 14. HOW DOES SAKONET HANDLE A CLAIM? (checked before the
    //     generic "claims" match so process questions land here)
    if (
      text.includes("how does sakonet handle a claim") ||
      text.includes("how is a claim handled") ||
      text.includes("claim process") ||
      text.includes("settlement process")
    ) {
      return `The SAKONET claim process is:

1. The borrowing SACCO submits a guarantee claim.
2. SAKONET routes the claim to the guarantor SACCO.
3. The guarantor SACCO reviews the claim.
4. The claim is approved or rejected according to the agreed rules.
5. An approved claim proceeds to settlement.
6. The applicable guaranteed amount is settled.
7. SAKONET records the settlement and updates the audit trail.`;
    }

    // 15. CLAIMS
    if (
      text.includes("pending claim") ||
      text.includes("pending claims") ||
      text.includes("guarantee claim") ||
      text.includes("claims")
    ) {
      return `Beauty SACCO currently has 1 pending cross-SACCO claim involving KES 90,000.

The claim is awaiting settlement review.

SAKONET tracks the claim from submission through review and settlement.`;
    }

    // 16. SETTLEMENT
    if (
      text.includes("settlement") ||
      text.includes("settled") ||
      text.includes("how is the guarantee paid")
    ) {
      return `For an approved guarantee claim, the applicable guaranteed amount is settled according to the participating SACCOs' agreed settlement rules.

The settlement is recorded by SAKONET so both SACCOs have a traceable record of the transaction.

The guarantor SACCO's reserved guarantee amount is used for the applicable settlement.`;
    }

    // 17. COMMUNICATION
    if (
      text.includes("communication history") ||
      text.includes("communication") ||
      text.includes("has the other sacco responded") ||
      text.includes("did they receive")
    ) {
      return `SAKONET maintains the communication trail between participating SACCOs.

For a guarantee request, the trail can show:

• Request submission
• Network routing
• SACCO review
• Member notification
• Member acceptance or decline
• SACCO confirmation
• Confirmation received by the borrowing SACCO

This provides both SACCOs with a traceable record of the request.`;
    }

    // 18. AUDIT TRAIL
    if (
      text.includes("audit trail") ||
      text.includes("audit") ||
      text.includes("history of this guarantee") ||
      text.includes("who approved")
    ) {
      return `SAKONET keeps an audit trail of important actions.

For example:

09:41 — Request received from Mkulima SACCO
09:43 — Beauty SACCO review started
09:46 — Guarantor notified
09:48 — Guarantor accepted using PIN
09:49 — Beauty SACCO confirmed acceptance
09:50 — Confirmation delivered to Mkulima SACCO

The audit trail helps SACCOs track what happened and when.`;
    }

    // 19. CONNECTED SACCOS
    if (
      text.includes("connected sacco") ||
      text.includes("connected saccos") ||
      text.includes("which saccos") ||
      text.includes("network members")
    ) {
      return `The current SAKONET prototype has two participating SACCOs:

• Beauty SACCO
• Mkulima SACCO

These SACCOs can exchange cross-SACCO guarantor requests and confirmations through SAKONET.`;
    }

    // 20. REQUIREMENTS
    if (
      text.includes("requirements") ||
      text.includes("requirement for a guarantee") ||
      text.includes("guarantee requirements") ||
      text.includes("what is required")
    ) {
      return `For a cross-SACCO guarantee, the proposed guarantor must satisfy the configured eligibility requirements of their SACCO.

The review can consider:

• Active SACCO membership
• Savings requirements
• Membership duration
• Existing guarantee commitments
• Available guarantee capacity

The guarantor SACCO performs the final verification before confirmation.`;
    }

    // 21. FLOAT MODEL
    if (
      text.includes("how does the float work") ||
      text.includes("float model") ||
      text.includes("guarantee float")
    ) {
      return `Each participating SACCO contributes a guarantee float to support cross-SACCO guarantees.

For the prototype, Beauty SACCO has a KES 1,000,000 float.

When Beauty SACCO guarantees a member borrowing from another SACCO, the applicable amount is reserved against Beauty SACCO's available float.

If a qualifying default results in a guarantee claim, the applicable amount can be settled according to the agreed rules.

When the guarantee obligation is released, the reserved amount becomes available again.`;
    }

    // 22. GENERAL GREETING
    if (
      text === "hi" ||
      text === "hello" ||
      text === "hey" ||
      text.includes("good morning") ||
      text.includes("good afternoon")
    ) {
      return `Hello 👋.

I'm the SAKONET Assistant for ${sacco}.

You can ask me about:

• Guarantor requests
• Guarantee exposure
• Float
• Defaults
• Claims
• Settlement
• Request status
• Audit trails
• How SAKONET works`;
    }

    // 23. HELP
    if (
      text.includes("help") ||
      text.includes("what can you ask") ||
      text.includes("what can i ask") ||
      text.includes("what can you do")
    ) {
      return `You can ask questions such as:

"How much of our float is available?"

"Do we have any pending guarantor requests?"

"What happens if a Beauty member defaults?"

"How does a member from another SACCO guarantee our member?"

"What happens after a guarantor accepts?"

"What happens if the guarantor declines?"

"How does SAKONET handle a claim?"

"Show me the audit trail."

"What does SAKONET do?"`;
    }

    // DEFAULT RESPONSE
    return `I can help with SAKONET operations.

Try asking:

• "How much of our float is available?"
• "Do we have pending requests?"
• "What happens if a Beauty member defaults?"
• "How does a cross-SACCO guarantee work?"
• "What happens after a guarantor accepts?"
• "How are claims settled?"
• "Show me the audit trail."
• "What does SAKONET do?"`;
  };

  // =========================================================
  // SEND MESSAGE
  // =========================================================

  const sendMessage = (question = input) => {
    const cleanQuestion = question.trim();

    if (!cleanQuestion) return;

    const userId = nextIdRef.current++;
    const botId = nextIdRef.current++;

    const userMessage = {
      id: userId,
      sender: "user",
      text: cleanQuestion,
    };

    const botMessage = {
      id: botId,
      sender: "bot",
      text: getBotResponse(cleanQuestion),
    };

    setMessages((previous) => [
      ...previous,
      userMessage,
      botMessage,
    ]);

    setInput("");
  };

  // =========================================================
  // QUICK QUESTIONS
  // =========================================================

  const quickQuestions = [
    "How much of our float is available?",
    "What happens if a Beauty member defaults?",
    "Do we have pending requests?",
    "How does a cross-SACCO guarantee work?",
    "How does SAKONET handle a claim?",
    "Show me the audit trail.",
  ];

  return (
    // Full screen on small screens; floating panel bottom-right on
    // larger screens. "fixed" means it does not depend on the parent
    // having position: relative.
    <div
      className="fixed inset-0 sm:inset-auto sm:bottom-4 sm:right-4 sm:w-[400px] sm:h-[600px] sm:rounded-2xl sm:shadow-2xl sm:border overflow-hidden z-50 flex flex-col"
      style={{
        background: c.bg,
        fontFamily: "Inter, sans-serif",
        borderColor: c.border,
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
              SAKONET Assistant
              <Sparkles size={13} color={c.gold} />
            </div>

            <div
              style={{
                fontSize: 11,
                opacity: 0.75,
                marginTop: 2,
              }}
            >
              {sacco}
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
      <div className="flex-1 overflow-y-auto px-4 py-4">
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
                  maxWidth: "90%",
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
          className="mb-2"
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: c.muted,
          }}
        >
          Suggested questions
        </div>

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
              className="flex-shrink-0 flex items-center gap-1 rounded-full px-3 py-2"
              style={{
                background: c.card,
                border: `1px solid ${c.border}`,
                color: c.green,
                fontSize: 10,
                fontWeight: 600,
              }}
            >
              {question}

              <ChevronRight size={11} />
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
            placeholder="Ask SAKONET..."
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
          className="text-center mt-2"
          style={{
            fontSize: 9,
            color: c.muted,
          }}
        >
          Prototype assistant — responses are predefined
        </div>
      </div>
    </div>
  );
}