# OPSEC PROTOCOL
## Identity Protection & Anonymity Operations

---

## CLASSIFICATION: MAXIMUM PRIORITY

**The anonymity is not optional. It is strategic.**

If they know it's one person:
- They throw 10 engineers at the problem
- They try to acquire/hire you directly
- They can out-resource your timeline
- The mystery evaporates
- The intimidation factor dies

**Protect the identity until YOU choose to reveal.**

---

## THREAT MODEL

### Primary Threats

| Threat | Vector | Severity |
|--------|--------|----------|
| Doxxing | Social engineering, OSINT | CRITICAL |
| Pattern recognition | Writing style analysis | HIGH |
| Financial trails | Payment processing, business filings | HIGH |
| Social graph | Friends, family, associates | MEDIUM |
| Technical fingerprinting | Code patterns, deployment traces | MEDIUM |
| Direct investigation | Journalists, competitors | MEDIUM |

### Who Might Try

- Competitors wanting to acquire/neutralize
- Journalists wanting the story
- VCs wanting deal flow
- Trolls wanting clout
- Bad actors wanting leverage

---

## IDENTITY LAYERS

```
+----------------------------------------------------------+
| LAYER 1: JB (TRUE IDENTITY)                              |
| Known only to: JB                                        |
| Exposure: NEVER (until strategic reveal)                 |
+----------------------------------------------------------+
                          |
                    [FIREWALL]
                          v
+----------------------------------------------------------+
| LAYER 2: BUSINESS ENTITY                                 |
| LLC with registered agent for privacy                    |
| Exposure: Legal filings only (obscured)                  |
+----------------------------------------------------------+
                          |
                    [FIREWALL]
                          v
+----------------------------------------------------------+
| LAYER 3: OPERATIONAL IDENTITIES                          |
| Separate emails, accounts, personas                      |
| Exposure: Platform-level only                            |
+----------------------------------------------------------+
                          |
                    [FIREWALL]
                          v
+----------------------------------------------------------+
| LAYER 4: PUBLIC PERSONAS                                 |
| Apollo, Hephaestus, Hermes, Ares                         |
| Exposure: Fully public                                   |
+----------------------------------------------------------+
```

---

## OPERATIONAL SECURITY RULES

### Communication

```yaml
email:
  - Separate domain for each persona
  - No personal email ever used for 0RB
  - ProtonMail or equivalent for sensitive
  - Never reply from wrong account

social:
  - Dedicated devices/browsers for each persona
  - Never cross-login
  - Different profile pictures (AI-generated or abstract)
  - No personal social connected to 0RB

messaging:
  - Signal for sensitive discussions
  - No real name in any chat
  - Assume all messages could leak
```

### Technical

```yaml
code:
  - Pseudonymous GitHub accounts
  - Strip all metadata from files
  - No personal identifiers in comments
  - Vary coding style slightly between personas

infrastructure:
  - VPN for all 0RB-related browsing
  - Separate machine or VM for operations
  - No geolocation in any posts
  - Timezone-neutral posting schedule

deployment:
  - Generic cloud accounts
  - No personal credit card on file
  - Business entity handles all payments
```

### Business

```yaml
entity:
  - LLC in privacy-friendly state (WY, NV, DE)
  - Registered agent service (no personal address)
  - Virtual office for mail
  - Separate business bank account

payments:
  - Stripe/payment processing through entity
  - No personal PayPal or Venmo connected
  - Crypto for any sensitive transactions
```

### Social

```yaml
personal_network:
  - Only 3-4 trusted friends know
  - They do NOT know the personas
  - They do NOT know the scale
  - "Working on some tech stuff" is enough

family:
  - Need-to-know basis
  - Protect them by limiting their knowledge
```

---

## CONTENT SECURITY

### Writing Style Protection

Your writing style is a fingerprint. Mitigate:

```yaml
style_protection:
  vary_sentence_length: true
  rotate_vocabulary: true
  use_ai_to_modulate: true
  different_persona_different_patterns: true

  never_use_across_personas:
    - signature_phrases
    - unique_slang
    - distinctive_punctuation_patterns
    - personal_anecdotes
```

### Metadata Scrubbing

Before any file goes public:

```bash
# Images
exiftool -all= image.jpg

# Documents - Use clean export, not native save

# Code - Remove all comments with personal info
# Check git history for leaks
```

---

## INCIDENT RESPONSE

### Level 1: Suspicious Activity
**Response:** Do not engage. Log. Monitor. Continue normal operations.

### Level 2: Active Investigation
**Response:** Alert JB. Pause high-risk content. DO NOT confirm or deny.

### Level 3: Partial Exposure
**Response:** HALT all posting. Assess accuracy. Evaluate reveal strategy.

### Level 4: Full Exposure
**Response:** HALT operations. Control narrative within 4 hours. Rally community.

---

## THE REVEAL PROTOCOL

When you CHOOSE to reveal:

### Pre-Reveal Checklist
- Community at critical mass
- Revenue established
- Legal protections in place
- Narrative fully prepared
- Media strategy ready

### Reveal Options

**Option A: Media Moment** - Exclusive interview, documentary
**Option B: Community Reveal** - Announce to your community first
**Option C: Product Moment** - Tie reveal to major launch
**Option D: Forced Hand** - If exposed, own it immediately

---

## DAILY OPSEC CHECKLIST

```
[ ] Posted from correct accounts only
[ ] No cross-contamination of identities
[ ] VPN active for all 0RB activity
[ ] No personal info in any content
[ ] Metadata scrubbed from any files shared
[ ] No timezone reveals in posting
[ ] No location reveals in content
[ ] Engagement from correct persona accounts
```

---

## REMEMBER

**The mystery is a feature, not a bug.**

Every day they don't know who you are:
- Is a day they can't counter you
- Is a day the legend grows
- Is a day you're building while they're guessing

**Stay ghost. Stay building. Stay dangerous.**
