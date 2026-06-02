// lib/samples.ts — evocative preset texts for the composer (PLAN §16).
// Four short, distinct, emotionally-loaded passages so a visitor can feel the engine
// instantly without writing anything.
export type Sample = { id: string; label: string; text: string };

export const SAMPLES: Sample[] = [
  {
    id: "wistful",
    label: "A wistful journal",
    text: "I found the old ticket stub in my coat pocket today. For a second I was back on that platform, certain everything was ahead of us. The train's long gone now. I'm not sad, exactly — just aware of how much quiet a year can hold.",
  },
  {
    id: "anxious",
    label: "An anxious message",
    text: "Hey, sorry to keep texting. I know you're busy. I just haven't heard back since this morning and my head's been doing that thing where it invents disasters. Tell me you're okay? Even just a thumbs up. I'd feel so much better.",
  },
  {
    id: "elated",
    label: "An elated announcement",
    text: "WE GOT IT. After eight months of rejections and rewrites, they said yes — they actually said yes. I'm shaking. I want to call everyone I've ever met. This is the best news I've had all year and I can't stop grinning.",
  },
  {
    id: "even",
    label: "A calm paragraph",
    text: "The report covers the third quarter. Revenue held steady against the prior period, and headcount remained flat. No material changes to the forecast are recommended at this time. A full breakdown by region follows in the appendix.",
  },
];
