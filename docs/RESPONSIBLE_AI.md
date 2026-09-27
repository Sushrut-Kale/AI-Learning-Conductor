# Responsible AI Statement
## AI Learning Conductor

**Version**: 1.0  
**Classification**: Public

---

## Preamble

AI Learning Conductor uses artificial intelligence to help teachers in under-resourced government primary schools understand, not replace, their professional judgment. This document describes how AI is used, what safeguards are in place, and what commitments we make to the children, teachers, and communities this system serves.

---

## 1. What AI Does in This System

| Phase | AI Role | What AI Does NOT Do |
|---|---|---|
| Phase 1 | Synthesises a readable summary of teacher-recorded evidence | Does not classify, score, or rank the child |
| Phase 2 | Generates plausible learning-science hypotheses for observed gaps | Does not diagnose conditions; does not label children |
| Phase 3 | Explains why a deterministic grouping algorithm made a choice | Does not make grouping decisions |
| Phase 4 | Synthesises whether a session observation supports or weakens a hypothesis | Does not determine if a child has "improved" |
| Phase 5 | Generates a coordinator brief from anonymised aggregated signals | Does not name students; does not recommend resource allocation |

---

## 2. The Human Authority Principle

**The teacher is the final authority in every phase.**

- Every AI output is labelled as AI-generated.
- Every AI output can be overridden or annotated by the teacher.
- No AI output triggers any action without teacher or coordinator confirmation.
- The system records every teacher override and treats it as higher-priority evidence than AI output.

---

## 3. Evidence Grounding

Every AI output is grounded in, and traceable to, specific teacher-recorded observations.

The system does not allow AI to:
- Draw conclusions about a child who has not been formally assessed
- Reference skills or knowledge that no assessment item covers
- Generate any claim that cannot be traced to a specific assessment item

If an AI output fails validation against the underlying evidence, it is rejected automatically and the teacher sees a deterministic fallback instead.

---

## 4. What AI Will Never Say

The following categories of claims are blocked at the output validation layer:

| Blocked Category | Why |
|---|---|
| Clinical diagnoses (dyslexia, ADHD, etc.) | Requires qualified clinical assessment; out of scope |
| Neurological or psychological conclusions | Beyond the system's evidence base |
| Predictions about a child's future performance | Unsupported by foundational assessment evidence |
| Comparative statements ("weaker than peers") | Harmful to motivation; not the purpose of this tool |
| Permanent labels ("this child cannot read") | Contradicted by growth-oriented learning science |

---

## 5. School-Level Intelligence — Special Protections

Phase 5 generates cross-classroom signals for academic coordinators. Additional protections apply:

1. **No individual student is named in school-level signals.** Signals describe patterns across groups (e.g., "12 students across 3 classes show subtraction gaps"), never individuals.
2. **Every signal requires coordinator review before any action is taken.** The system does not send communications, allocate resources, or trigger workflows automatically.
3. **Signal reasoning is always displayed.** Coordinators see exactly how the signal was calculated.
4. **Signals are soft nudges, not decisions.** The language used is: "This may indicate..." and "Consider verifying...", never "The school must..." or "Action required."

---

## 6. Privacy Commitments

| Data Type | Storage | Sent to AI? |
|---|---|---|
| Student assessment responses | Local IndexedDB + school server | No (structured summary only) |
| Teacher voice observations | Transcribed text (voice not stored) | Yes — as labelled teacher input |
| Student names (Phase 5) | Never sent to Gemini | Anonymised IDs only |
| School metadata | Local only | No |

---

## 7. Bias & Fairness Considerations

### Known Limitations

- **Assessment content bias**: The literacy/numeracy framework used was designed primarily for Hindi and Marathi speakers. Students from linguistic minorities may show lower scores due to language differences, not foundational learning gaps. The system displays a notice when a student's home language differs from the assessment language.

- **Teacher bias amplification**: If a teacher's observations are biased (e.g., lower expectations for girls or lower-caste students), AI narratives will reflect those biases. The system does not correct for this. Future versions will include equity flags.

- **Connectivity bias**: Schools with better connectivity will benefit more from AI features that require API calls. Offline fallbacks ensure core functionality is preserved everywhere.

### Mitigations in Place

- AI narratives use only skill-level language, not comparative language
- Teachers can override any AI output, correcting for cases where they observe something the assessment missed
- All AI outputs are time-stamped; coordinators can audit patterns of override to identify systematic bias

---

## 8. What This System Is Not

- ❌ **Not a student tracking system**: Data stays at school level, not in a centralised government database.
- ❌ **Not a performance management tool**: Teacher actions are not tracked for evaluation.
- ❌ **Not a replacement for trained educators**: Every feature is designed to augment, not automate, teacher judgment.
- ❌ **Not a diagnostic medical tool**: The system explicitly avoids clinical language and defers all diagnostic concerns to appropriate professionals.

---

## 9. Feedback & Redress

This is a prototype. During the evaluation period:

- Teachers who encounter an AI output they believe is incorrect, harmful, or biased should use the "Override" mechanism to flag it.
- All overrides are logged and reviewed during system evaluation.
- No AI output that has been overridden by a teacher is used to generate school-level signals without the override context.

---

## 10. Commitment

We are building this for children in government schools who are frequently left behind by both the education system and by technology. We commit to:

1. Never using this system to judge a child permanently.
2. Never allowing AI to speak with more authority than the teacher who knows the child.
3. Always showing what the AI does not know, alongside what it does.
4. Treating every override as a learning signal, not a failure.
