import { JournalMode } from '../types';

export const JOURNAL_MODES: JournalMode[] = [
  {
    id: 'freeform',
    title: 'Freeform Reflection',
    description: 'Open conversational space to unpack whatever is on your mind right now.',
    icon: 'Sparkles',
    starterPrompt: 'What has been on your mind lately that you would love to unpack or explore?',
    systemPromptAddition: 'Act as an attentive, reflective companion. Ask open-ended questions that help the user discover their own deeper insights.',
  },
  {
    id: 'morning_intentions',
    title: 'Morning Intentions',
    description: 'Frame your day with clarity, emotional readiness, priorities, and purpose.',
    icon: 'Sun',
    starterPrompt: 'Good morning! How are you feeling as you begin today, and what is your top intention or priority?',
    systemPromptAddition: 'Focus on energizing clarity, realistic prioritization, mindset alignment, and proactive intention setting.',
  },
  {
    id: 'evening_unwind',
    title: 'Evening Unwind & Review',
    description: 'Decompress, reflect on what went well, acknowledge hurdles, and let go of the day.',
    icon: 'Moon',
    starterPrompt: 'How did your day unfold? What was one highlight, and what is something you want to release before sleep?',
    systemPromptAddition: 'Adopt a calming, grounded tone. Help the user find closure, celebrate micro-wins, and practice mindful letting go.',
  },
  {
    id: 'decision_lab',
    title: 'Decision & Dilemma Lab',
    description: 'Brainstorm options, unearth hidden assumptions, and align choices with your values.',
    icon: 'Compass',
    starterPrompt: 'What decision or challenge are you currently weighing? Tell me the dilemma and what is at stake.',
    systemPromptAddition: 'Use structured Socratic probing. Challenge assumptions, explore second-order consequences, and help balance logic with intuition.',
  },
  {
    id: 'emotional_clarity',
    title: 'Emotional Clarity',
    description: 'Gently explore complicated feelings, stress, or anxiety with compassion.',
    icon: 'Heart',
    starterPrompt: 'Take a deep breath. What feeling or sensation is most prominent for you in this moment?',
    systemPromptAddition: 'Provide high psychological safety, gentle validation, cognitive reframing, and somatic awareness questions.',
  },
  {
    id: 'gratitude_anchor',
    title: 'Gratitude & Joy Anchor',
    description: 'Shift perspective by savoring meaningful moments, people, and accomplishments.',
    icon: 'Smile',
    starterPrompt: 'What is something simple or unexpected that brought you a moment of genuine appreciation recently?',
    systemPromptAddition: 'Help the user deepen their experience of gratitude with sensory details and recognition of personal resilience.',
  },
];
