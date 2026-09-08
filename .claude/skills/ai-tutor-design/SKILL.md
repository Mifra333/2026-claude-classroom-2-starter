---
name: ai-tutor-design
description: The visual design language for this ai-tutor app — a heise-derived palette, type scale, and component vocabulary for a chat surface sitting next to data panels. Use this skill whenever you touch anything the user sees in this repo: adding or restyling a component, writing Tailwind classes, editing app/globals.css, choosing a colour, a font, a spacing or a border, building a new page or panel, or reviewing a diff that changes the UI. Use it even when the request sounds purely functional ("add a button", "show the count", "make the sidebar wider") — those are the changes that quietly erode a design language.
---

# ai-tutor design language

## Start here: this is not a news page

The palette and the typeface come from heise.de. The *layout thinking* must not.

heise.de is a newsstand. Its job is to make a reader choose among two hundred
competing items they have never seen before, so it is built from teaser cards in
a scannable grid: image, kicker, headline, dateline, comment count, repeated down
the page. Every device there exists to help someone standing *above* the content
pick one thing out of it.

ai-tutor has no choosing. It has exactly two surfaces, and neither is a grid:

1. **Conversation** — a linear transcript that grows downward and is read *in
   order*, not scanned. The reader is inside it. There is no ranking, no
   competition between messages, and no image.
2. **Record** — the to-do list today, more data panels later. The same few fields
   repeat down a column. The reader scans one column and compares rows against
   each other rather than choosing between them.

So the brand gives us colour, type and a certain sober density. The app has to
invent its own structure. Keep the two straight and the result looks like heise
built a tool; confuse them and it looks like a news site with a chat bolted on.

## What carries over, and what does not

**Carries over — use these deliberately:**

- **The palette**, exactly (below). Deep institutional blue, soft-black ink, a
  cool blue-grey ground.
- **Blue is identity, not action.** heise's own buttons are dark grey
  (`#464646`), never the brand blue; blue is reserved for links, marks and the
  logo. Keep this. A blue primary button is the reflex answer and it is not this
  brand's.
- **The page is never white.** Content sits on a tinted ground in white panels.
  On heise the separation between panels *is* the ground showing through — a gap,
  not a drawn line. Prefer that to borders.
- **Source Sans, and only Source Sans.** heise runs one family across the whole
  site and takes its hierarchy from weight (400/600/700/900), not from a second
  face. Do not pair a display serif with it; that is the generic move and it is
  not this brand's either.
- **The uppercase kicker.** Small, 700, wide tracking (`.08em`), used as a
  structural label above or beside content. On heise it names a section; here it
  names a *role*.
- **Density and restraint.** Small radii (3–6px), hairline rules, no shadows, no
  gradients, metadata small and grey and never decorated.

**Does not carry over — resist these:**

- **Teaser cards.** A chat message is not a teaser. Never give a message a
  kicker + headline + timestamp stack, a border box, or an image slot.
- **Competitive density.** heise's whitespace and rules exist to hold *unrelated*
  items apart. Our rows are related, so align them on a shared grid and let them
  read as one set. Boxing each row is the wrong instinct.
- **Deep heading hierarchy.** A news page needs four heading levels because
  importance is its axis. This app has one page title and one panel title. Spend
  the type scale on **roles** — who is speaking, what is data, what the machine
  did — not on levels of importance.
- **The dateline.** On heise the timestamp is load-bearing because news decays. A
  to-do item's age is not the point; its **state** is. Show state, not time,
  unless the user asked for time.
- **Image-first thinking.** There are no images in this app. Do not invent
  placeholders, avatars or illustrations to fill the space a news layout would
  have given to a photo.

## Tokens

Declare these in the `@theme inline` block of `app/globals.css` (Tailwind v4 has
no config file) and reach them through Tailwind utilities. Never hardcode a hex
in a component.

```
--color-brand:        #0056A4   /* heise online blue: identity, links, marks  */
--color-brand-dark:   #00407A   /* link hover, focus ring                     */
--color-ink:          #323232   /* all body text — never #000                 */
--color-ink-muted:    #4F6069   /* metadata, secondary text                   */
--color-ground:       #E8EDF0   /* the page itself                            */
--color-surface:      #FFFFFF   /* panels sitting on the ground               */
--color-sunken:       #F2F2F2   /* inset areas: composer, row hover           */
--color-rule:         #ACBBC8   /* decorative hairline                        */
--color-rule-strong:  #7D8F9B   /* input borders, any perceivable boundary    */
--color-action:       #464646   /* buttons                                    */
--color-action-hover: #323232
--color-alert:        #E2001A   /* errors; heise's own red                    */
--color-alert-tint:   #FDECEE
```

`--color-ink-muted` is heise's `#5C707A` darkened: the original clears 4.5:1 on
white but only 4.34:1 on the tinted ground, and muted text lands on both here.
The rest are heise's values unchanged. Contrast on white: brand 7.2:1, ink
12.6:1, muted 6.4:1, action 9.5:1, alert 4.9:1, rule-strong 3.4:1.

The app is light-only — `app/globals.css` deliberately detaches the `dark:`
variant from `prefers-color-scheme` — so do not add `dark:` utilities to new
code; they would be dead weight.

## Type

One family: **Source Sans 3** via `next/font/google`, plus the system monospace
stack for machine text. heise uses `ui-monospace, SFMono-Regular, Menlo, …` for
exactly that job, and matching it costs one fewer webfont.

| Role | Size | Weight | Notes |
| --- | --- | --- | --- |
| Kicker | 11px | 700 | uppercase, `.08em` tracking. Role labels only. |
| Meta | 13px | 400 | timestamps, counts, helper text — in `ink-muted`. |
| UI | 14px | 400/600 | chrome, labels, buttons, rows. The default. |
| Body | 16px | 400 | conversation prose only. Nothing else earns 16px. |
| Title | 18px | 700 | page and panel titles, `-0.01em`. |
| Display | 28px | 900 | the auth screens' one headline, `-0.02em`. |

Machine text — tool names, ids, counts in a column — is monospace at 11–13px in
`ink-muted`. Numbers that stack in a column always get `tabular-nums`.

Line height 1.5 for prose, 1.3 for titles and rows.

## The signature: the ledger rule

The app's real subject is the seam between **what was said** and **what was
done**. heise has no analogue for that, so it is where this design should be
memorable.

**A 2px vertical rule in `brand` down the left edge marks anything the system did
rather than said.** Each tool-call row in the transcript carries its own. The
record panel carries one continuous rule down its whole left edge rather than one
per row — striping every row would fight the alignment that already holds the
rows together. Prose — the user's messages, the assistant's replies — never
carries it.

The payoff: a reader can run their eye down the blue marks and see everything
that actually happened to their list, ignoring the talk around it. It uses the
brand colour for meaning instead of decoration, it costs one border declaration,
and it ties the chat surface to the data surface with a single device.

Spend the boldness here and keep everything else quiet. If a new element is
tempting you toward a second signature, it probably wants the ledger rule.

## Component vocabulary

**Panels.** White on the ground, `6px` radius, no shadow, no border. Separate
panels with a 1–2px gap of ground rather than a drawn line. A panel title is
Title size over a `rule` hairline.

**Buttons.** Filled `action`, white text, `3px` radius, 14px/600, generous
horizontal padding, hover `action-hover`. Focus is a 2px `brand-dark` outline at
2px offset — the one place blue touches a control. Disabled drops opacity and the
pointer, never the colour. There is one button look; a second needs a better
reason than "this one is less important".

**Inputs.** White, `rule-strong` border, `3px` radius, 14px. Focus swaps the
border to `brand` and adds the same outline. The label is UI/600 in `ink`, sits
above the field, and is never replaced by a placeholder.

**Record rows.** Fixed height (32px), state marker in a 16px gutter, label in UI
size, any secondary value right-aligned in `tabular-nums` `ink-muted`. Rows are
separated by nothing at all — alignment does the work. State is never carried by
colour alone: a completed item is muted **and** struck through.

**Kickers.** One wherever an element needs to announce its role — a panel header,
a tool-call label, an empty state. Never more than one per block.

**Errors.** `alert` text on `alert-tint`, `3px` radius, no icon, no border.

## Writing

The interface speaks like the butler it fronts: plain, short, unapologetic.

- Name things by what the person controls: "Your list", not "Todos table".
- An action keeps its name through the whole flow. A button that says "Sign out"
  produces a state that says "Signing out…".
- Empty states are invitations with a next step, not statements of absence.
  "Nothing on it yet. Ask Bartholomew to add something." — not "No items."
- Errors say what happened and what to do. They never say sorry.
- Sentence case everywhere except kickers.

## Before you call it done

- Every colour came from a token; no raw hex, no `zinc-*`, no `slate-*`.
- Blue appears only as identity, link, focus or ledger rule — never as a button.
- The ground is visible somewhere; nothing is white-on-white.
- One typeface, and 16px is used only for conversation prose.
- Text on the ground clears 4.5:1; boundaries clear 3:1.
- Keyboard focus is visible on every interactive element.
- Nothing in the transcript looks like a news teaser.
- You removed one thing before shipping.

`references/heise-tokens.md` records where these values came from and how to
re-derive them if the brand moves.
