## Design Context

### Users
VocabForge serves language learners across all levels, with a primary focus on **serious self-study learners** — people preparing for proficiency exams (JLPT, HSK, DELE), studying daily, and optimizing for retention and efficiency. The tool must also be welcoming to beginners exploring their first language. Users arrive with intent: they want to study, not be entertained. Respect their time.

### Brand Personality
**Elegant, Refined, Premium** — VocabForge should feel like a beautifully crafted instrument for learning. Not flashy or gamified, but quietly impressive. Every detail signals quality and care. The UI should disappear when studying and impress when noticed.

### Aesthetic Direction
- **Visual tone:** Dark, polished, and precise — inspired by **Linear** and **Raycast** (developer-grade craft and subtle details) crossed with the study-focused utility of **Anki** (but beautiful). Think "premium dark tool" not "fun app."
- **Theme:** Dark mode only. Navy backgrounds (#0f172a), indigo/violet accent gradients (#6366f1 → #8b5cf6), high-contrast off-white text (#f1f5f9).
- **Surface treatment:** Glassmorphism with restraint — subtle backdrop blur, translucent cards with fine borders (rgba(255,255,255,0.06)). No heavy shadows.
- **Typography:** System font stack, clear hierarchy. Uppercase micro-labels with letter-spacing for structure. Large, bold headings for impact.
- **Color:** Indigo/violet as the signature. Semantic colors for SRS grades (red/orange/green/blue). Avoid bright or saturated colors outside of intentional accents.
- **Motion:** Smooth, purposeful transitions (0.15s–0.5s). Float animations for visual interest on landing page. No gratuitous motion.
- **Anti-references:** Duolingo (too playful/gamified), generic SaaS landing pages, Material Design defaults, anything that feels "template."

### Design Principles
1. **Substance over spectacle** — Every visual choice should serve learning. Decoration is fine when it builds atmosphere; never when it distracts from content.
2. **Quiet confidence** — Premium doesn't mean loud. Use restraint in color, motion, and density. Let whitespace and typography do the work.
3. **Study-first hierarchy** — When a user is reviewing flashcards or reading a story, the UI should nearly vanish. Chrome and navigation recede; content dominates.
4. **Craft in the details** — Consistent spacing, pixel-perfect alignment, smooth transitions, thoughtful hover states. The kind of polish that makes people say "this feels nice" without knowing why.
5. **Accessible by default** — WCAG AA contrast ratios, visible focus indicators (#6366f1 outline), keyboard navigable. Good design is inclusive design.

### Design Tokens (Quick Reference)
| Token | Value |
|---|---|
| Background | `#0f172a` |
| Surface | `rgba(255,255,255,0.02)` with `1px solid rgba(255,255,255,0.06)` |
| Text primary | `#f1f5f9` |
| Text secondary | `#94a3b8` |
| Text muted | `#64748b` |
| Accent primary | `#6366f1` |
| Accent secondary | `#8b5cf6` |
| Accent gradient | `linear-gradient(135deg, #6366f1, #8b5cf6)` |
| Success | `#22c55e` |
| Danger | `#ef4444` |
| Warning | `#f59e0b` |
| Border radius (sm) | `8px` |
| Border radius (lg) | `16px` |
| Font stack | `-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif` |
