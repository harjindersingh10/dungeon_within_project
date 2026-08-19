/* STEP 1: Frontend-only mock data.
   Hidden scoring lives here and is NEVER rendered into the UI. */

const DIMENSIONS = [
  "courage", "logic", "empathy", "leadership",
  "risk", "creativity", "loyalty", "chaos"
];

const SCENARIOS = [
  {
    id: 1, chapter: "CHAPTER I", title: "THE SUSPICIOUS GOAT",
    kicker: "THE DUNGEON SPEAKS",
    text: "Three doors stand before you. One holds treasure, one holds a monster, and one has an extremely suspicious goat.",
    hint: "The goat is staring directly at you.",
    options: [
      { id: "1A", text: "Open the treasure door. Fortune favors the bold.", score: { courage: 2, risk: 3 } },
      { id: "1B", text: "Study the doors for clues before touching anything.", score: { logic: 3, creativity: 1 } },
      { id: "1C", text: "Walk toward the goat. It clearly knows something.", score: { empathy: 2, creativity: 3, chaos: 1 } },
      { id: "1D", text: "Ask the goat which door has Wi-Fi.", score: { chaos: 4, creativity: 2, risk: 1 } }
    ]
  },
  {
    id: 2, chapter: "CHAPTER I", title: "THE DRAGON'S DEADLINE",
    kicker: "THE ANCIENT TRIAL",
    text: "A dragon slowly opens one eye. “You have five seconds to explain why you're here.”",
    hint: "The dragon looks like it has heard every excuse.",
    options: [
      { id: "2A", text: "Tell the complete truth, even if it sounds ridiculous.", score: { empathy: 3, loyalty: 2, courage: 1 } },
      { id: "2B", text: "Challenge the dragon. Confidence is basically diplomacy.", score: { courage: 4, risk: 2, chaos: 1 } },
      { id: "2C", text: "Give a perfectly logical explanation with evidence.", score: { logic: 4, leadership: 1 } },
      { id: "2D", text: "Ask whether the dragon has considered a career in therapy.", score: { creativity: 3, chaos: 4 } }
    ]
  },
  {
    id: 3, chapter: "CHAPTER I", title: "THE THIEF'S SECRET",
    kicker: "A MORAL CROSSROAD",
    text: "Your teammate secretly stole an ancient artifact. Nobody else knows. The artifact is glowing in their backpack.",
    hint: "The dungeon has a long memory.",
    options: [
      { id: "3A", text: "Confront them privately and ask them to return it.", score: { empathy: 3, loyalty: 3, leadership: 1 } },
      { id: "3B", text: "Report them immediately. Rules exist for a reason.", score: { logic: 3, leadership: 3, loyalty: -1 } },
      { id: "3C", text: "Help hide it until you understand what it does.", score: { loyalty: 4, risk: 2, chaos: 2 } },
      { id: "3D", text: "Steal it from them and claim you found it.", score: { risk: 3, creativity: 2, chaos: 3 } }
    ]
  },
  {
    id: 4, chapter: "CHAPTER II", title: "THE COLLAPSING BRIDGE",
    kicker: "SECONDS REMAIN",
    text: "The bridge is collapsing. Your companion is trapped behind you, but the ancient treasure is already within reach.",
    hint: "You can save only one thing before the bridge gives way.",
    options: [
      { id: "4A", text: "Forget the treasure. Save your companion.", score: { empathy: 4, loyalty: 4, courage: 2 } },
      { id: "4B", text: "Grab the treasure and leap. They can probably make it.", score: { risk: 4, chaos: 2, courage: 2 } },
      { id: "4C", text: "Calculate the safest route to save both.", score: { logic: 4, creativity: 2 } },
      { id: "4D", text: "Shout “EVERYONE PANIC!” and improvise.", score: { chaos: 5, creativity: 3, courage: 1 } }
    ]
  },
  {
    id: 5, chapter: "CHAPTER II", title: "THE CREDIT THIEF",
    kicker: "THE HALL OF ECHOES",
    text: "Your teammate takes credit for your brilliant plan in front of the dungeon council.",
    hint: "Everyone is looking at you.",
    options: [
      { id: "5A", text: "Calmly correct the record with the facts.", score: { logic: 3, leadership: 3 } },
      { id: "5B", text: "Let it go. The mission matters more than applause.", score: { empathy: 3, loyalty: 2 } },
      { id: "5C", text: "Smile and wait for the perfect moment to expose them.", score: { creativity: 3, logic: 2, chaos: 2 } },
      { id: "5D", text: "Take a bow anyway. Apparently we're all pretending.", score: { courage: 2, chaos: 4, creativity: 2 } }
    ]
  },
  {
    id: 6, chapter: "CHAPTER II", title: "THE CURSED BUTTON",
    kicker: "DO NOT PRESS",
    text: "A giant red button reads: DO NOT PRESS. Behind it, a tiny goblin whispers, “You wouldn't dare.”",
    hint: "The goblin is smiling.",
    options: [
      { id: "6A", text: "Press it. Obviously.", score: { risk: 4, chaos: 5, courage: 1 } },
      { id: "6B", text: "Inspect the mechanism first.", score: { logic: 4, creativity: 1 } },
      { id: "6C", text: "Ask the goblin what happens when someone presses it.", score: { empathy: 2, logic: 2, loyalty: 1 } },
      { id: "6D", text: "Tell the goblin to press it. Leadership.", score: { leadership: 3, chaos: 3, risk: 2 } }
    ]
  },
  {
    id: 7, chapter: "CHAPTER III", title: "THE LONELY BEAST",
    kicker: "BENEATH THE STONE",
    text: "A massive shadow creature blocks the corridor. Instead of attacking, it quietly asks if anyone has ever listened to it.",
    hint: "Its claws are enormous. Its voice is strangely gentle.",
    options: [
      { id: "7A", text: "Sit down and listen.", score: { empathy: 5, loyalty: 2 } },
      { id: "7B", text: "Keep your weapon ready, but talk.", score: { courage: 2, empathy: 2, logic: 2 } },
      { id: "7C", text: "Offer it a job guarding the dungeon.", score: { creativity: 4, leadership: 3 } },
      { id: "7D", text: "Run. Emotional conversations are terrifying.", score: { risk: 2, chaos: 3 } }
    ]
  },
  {
    id: 8, chapter: "CHAPTER III", title: "THE IMPOSSIBLE MAP",
    kicker: "THE MAZE REMEMBERS",
    text: "Your map redraws itself every time you blink. Your companions want to follow the oldest route.",
    hint: "The newest path appears to lead straight through a wall.",
    options: [
      { id: "8A", text: "Trust the map and walk through the wall.", score: { creativity: 4, risk: 3, chaos: 2 } },
      { id: "8B", text: "Test the map using small clues and measurements.", score: { logic: 5, creativity: 1 } },
      { id: "8C", text: "Let the group vote.", score: { empathy: 2, leadership: 3, loyalty: 2 } },
      { id: "8D", text: "Draw a third route yourself.", score: { creativity: 5, leadership: 1, risk: 2 } }
    ]
  },
  {
    id: 9, chapter: "CHAPTER III", title: "THE LAST POTION",
    kicker: "ONE BOTTLE REMAINS",
    text: "Only one healing potion remains. Your rival is badly injured, and you are nearly out of strength too.",
    hint: "Nobody would blame you for choosing yourself.",
    options: [
      { id: "9A", text: "Give it to your rival.", score: { empathy: 5, courage: 1, loyalty: 2 } },
      { id: "9B", text: "Drink it. You need to survive the dungeon.", score: { risk: 2, leadership: 2, courage: 2 } },
      { id: "9C", text: "Split it between you both.", score: { logic: 2, empathy: 4, creativity: 2 } },
      { id: "9D", text: "Ask the dungeon itself to choose.", score: { chaos: 4, creativity: 3, risk: 1 } }
    ]
  },
  {
    id: 10, chapter: "CHAPTER IV", title: "THE FINAL DOOR",
    kicker: "THE DUNGEON WITHIN",
    text: "The final door offers you everything you wanted. But the inscription says: “The price is becoming someone else.”",
    hint: "There is no obvious correct answer.",
    options: [
      { id: "10A", text: "Open it. Some doors are meant to be crossed.", score: { courage: 4, risk: 4, leadership: 1 } },
      { id: "10B", text: "Refuse. No reward is worth losing yourself.", score: { logic: 2, loyalty: 4, empathy: 2 } },
      { id: "10C", text: "Search for another way to change the rules.", score: { creativity: 5, logic: 2, courage: 1 } },
      { id: "10D", text: "Knock first. Maybe whoever is inside has snacks.", score: { chaos: 4, creativity: 4, empathy: 1 } }
    ]
  }
];

const CHARACTERS = [
  {
    id: "titan", name: "TITAN", species: "ANCIENT BEAST", title: "THE IRON WARDEN",
    description: "You don't run toward danger because you're fearless. You run toward it because somebody has to.",
    strengths: "Courage • Leadership • Loyalty", weaknesses: "Can carry every burden alone", ability: "Unbreakable Resolve",
    stats: { courage: 92, logic: 68, empathy: 57, leadership: 95, risk: 78, creativity: 49, loyalty: 91, chaos: 28 },
    visual: "titan"
  },
  {
    id: "cipher", name: "CIPHER", species: "ARCANE FOX", title: "THE VEILED MIND",
    description: "You rarely need the loudest sword. You prefer the quiet move that makes every other move unnecessary.",
    strengths: "Logic • Creativity • Strategy", weaknesses: "Overthinks the obvious", ability: "Pattern Sight",
    stats: { courage: 61, logic: 97, empathy: 62, leadership: 72, risk: 44, creativity: 94, loyalty: 71, chaos: 22 },
    visual: "cipher"
  },
  {
    id: "levian", name: "LEVIAN", species: "VOID DRAGON", title: "THE CHAOSBORN",
    description: "Where others see a warning, you see an invitation. Somehow, the dungeon keeps opening doors for you.",
    strengths: "Risk • Chaos • Creativity", weaknesses: "Has never met a suspicious button they didn't like", ability: "Controlled Catastrophe",
    stats: { courage: 84, logic: 41, empathy: 38, leadership: 65, risk: 98, creativity: 91, loyalty: 52, chaos: 100 },
    visual: "levian"
  },
  {
    id: "raven", name: "NOCTIS", species: "MOON RAVEN", title: "THE SILENT SEER",
    description: "You notice what everyone else misses. Your strength is knowing when a choice matters more than the noise around it.",
    strengths: "Empathy • Logic • Loyalty", weaknesses: "Can hesitate when every path hurts", ability: "Echo Reading",
    stats: { courage: 55, logic: 86, empathy: 92, leadership: 58, risk: 33, creativity: 79, loyalty: 96, chaos: 19 },
    visual: "raven"
  },
  {
    id: "wyrm", name: "EMBERWRAITH", species: "FLAME SPIRIT", title: "THE BURNING HEART",
    description: "You act with your whole heart. The dungeon cannot decide whether that makes you its hero or its favourite disaster.",
    strengths: "Empathy • Courage • Chaos", weaknesses: "Feelings move faster than plans", ability: "Phoenix Instinct",
    stats: { courage: 88, logic: 51, empathy: 88, leadership: 67, risk: 76, creativity: 86, loyalty: 90, chaos: 73 },
    visual: "wyrm"
  }
];

window.DUNGEON_DATA = { DIMENSIONS, SCENARIOS, CHARACTERS };
