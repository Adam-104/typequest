// The TypeQuest course: 8 levels of lessons, the exercise text for each, and
// helpers for picking the next lesson. Edit here to change the curriculum.

export const learningLevels = [
    {
        id: 1,
        title: 'Typing Foundations',
        subtitle: 'Start from the beginning',
        description: 'Get comfortable with the keyboard, posture, and finger placement before you begin typing.',
        icon: '⌨',
        color: 'purple',
        lessons: [
            {
                id: '1-1',
                title: 'Meet Your Keyboard',
                duration: '4 min',
                description: 'Learn the main keyboard sections and what the keys do.'
            },
            {
                id: '1-2',
                title: 'Posture and Hand Position',
                duration: '5 min',
                description: 'Set up comfortably and learn how to position your hands.'
            },
            {
                id: '1-3',
                title: 'Your Finger Map',
                duration: '5 min',
                description: 'Discover which fingers reach each group of keys.'
            },
            {
                id: '1-4',
                title: 'Find the Home Row',
                duration: '4 min',
                description: 'Locate the home-row keys and the small guide bumps on F and J.'
            },
        ],
    },
    {
        id: 2,
        title: 'Home Row',
        subtitle: 'Build your foundation',
        description: 'Learn the home-row keys and practise returning your fingers to their starting positions.',
        icon: '⌨',
        color: 'blue',
        lessons: [
            {
                id: '2-1',
                title: 'Left Hand: A, S, D, F',
                duration: '5 min',
                description: 'Practise the four left-hand home-row keys.'
            },
            {
                id: '2-2',
                title: 'Right Hand: J, K, L, ;',
                duration: '5 min',
                description: 'Practise the four right-hand home-row keys.'
            },
            {
                id: '2-3',
                title: 'Both Hands Together',
                duration: '6 min',
                description: 'Combine both hands in short, controlled sequences.'
            },
            {
                id: '2-4',
                title: 'Home Row Words',
                duration: '7 min',
                description: 'Type simple words using the keys you have learned.'
            },
        ],
    },
    {
        id: 3,
        title: 'Upper Row',
        subtitle: 'Reach the keys above',
        description: 'Learn the upper-row keys while keeping your hands anchored to the home row.',
        icon: '↑',
        color: 'cyan',
        lessons: [
            {
                id: '3-1',
                title: 'Left Upper Row: Q, W, E, R, T',
                duration: '6 min',
                description: 'Practise reaching the upper row with your left hand.'
            },
            {
                id: '3-2',
                title: 'Right Upper Row: Y, U, I, O, P',
                duration: '6 min',
                description: 'Practise reaching the upper row with your right hand.'
            },
            {
                id: '3-3',
                title: 'Upper Row Words',
                duration: '7 min',
                description: 'Combine upper-row keys into familiar words.'
            },
        ],
    },
    {
        id: 4,
        title: 'Bottom Row',
        subtitle: 'Reach the keys below',
        description: 'Build control and accuracy as you learn the bottom-row keys.',
        icon: '↓',
        color: 'green',
        lessons: [
            {
                id: '4-1',
                title: 'Left Bottom Row: Z, X, C, V, B',
                duration: '6 min',
                description: 'Learn the bottom-row keys with your left hand.'
            },
            {
                id: '4-2',
                title: 'Right Bottom Row: N, M, Comma, Period',
                duration: '6 min',
                description: 'Learn the bottom-row keys with your right hand.'
            },
            {
                id: '4-3',
                title: 'All Letter Rows',
                duration: '8 min',
                description: 'Combine the top, home, and bottom rows.'
            },
        ],
    },
    {
        id: 5,
        title: 'Numbers and Symbols',
        subtitle: 'Go beyond letters',
        description: 'Practise the number row, capital letters, and common punctuation.',
        icon: '#',
        color: 'orange',
        lessons: [
            {id: '5-1', title: 'Number Row', duration: '6 min', description: 'Practise typing digits accurately.'},
            {
                id: '5-2',
                title: 'Shift and Capital Letters',
                duration: '5 min',
                description: 'Use Shift to type uppercase letters.'
            },
            {
                id: '5-3',
                title: 'Punctuation and Symbols',
                duration: '7 min',
                description: 'Practise commas, periods, question marks, and common symbols.'
            },
        ],
    },
    {
        id: 6,
        title: 'Words and Sentences',
        subtitle: 'Type with confidence',
        description: 'Use your new keyboard skills to type real words and complete sentences.',
        icon: 'Aa',
        color: 'red',
        lessons: [
            {
                id: '6-1',
                title: 'Common Words',
                duration: '7 min',
                description: 'Practise everyday words and useful letter combinations.'
            },
            {
                id: '6-2',
                title: 'Short Sentences',
                duration: '8 min',
                description: 'Build accuracy with complete sentences.'
            },
            {
                id: '6-3',
                title: 'Paragraph Practice',
                duration: '10 min',
                description: 'Bring your skills together in a short paragraph.'
            },
        ],
    },
    {
        id: 7,
        title: 'Speed and Accuracy',
        subtitle: 'Improve your rhythm',
        description: 'Build speed gradually while keeping your typing accurate and relaxed.',
        icon: '⚡',
        color: 'purple',
        lessons: [
            {
                id: '7-1',
                title: 'Type Without Looking',
                duration: '8 min',
                description: 'Practise keeping your eyes on the text instead of the keyboard.'
            },
            {
                id: '7-2',
                title: 'Accuracy First',
                duration: '8 min',
                description: 'Reduce errors before increasing your pace.'
            },
            {
                id: '7-3',
                title: 'Timed Typing Challenge',
                duration: '10 min',
                description: 'Measure your speed in a timed exercise.'
            },
        ],
    },
    {
        id: 8,
        title: 'Real-World Typing',
        subtitle: 'Use typing every day',
        description: 'Apply your skills to emails, documents, longer text, and coding-related content.',
        icon: '✦',
        color: 'blue',
        lessons: [
            {
                id: '8-1',
                title: 'Email and Documents',
                duration: '10 min',
                description: 'Practise realistic work-related text.'
            },
            {
                id: '8-2',
                title: 'Long-Form Typing',
                duration: '12 min',
                description: 'Build consistency across longer passages.'
            },
            {
                id: '8-3',
                title: 'Final Skills Check',
                duration: '10 min',
                description: 'Review your accuracy and speed across a longer exercise.'
            },
        ],
    },
];

export function getAllLessons() {
    return learningLevels.flatMap((level) =>
        level.lessons.map((lesson) => ({
            ...lesson,
            levelId: level.id,
            levelTitle: level.title,
        })),
    );
}

export function getLesson(lessonId) {
    return getAllLessons().find((lesson) => lesson.id === lessonId) ?? null;
}

export function getNextLesson(progress = {}) {
    return getAllLessons().find((lesson) => !progress[lesson.id]?.completed) ?? null;
}

// The lesson after the given one, or null at the end of the course.
export function getFollowingLesson(lessonId) {
    const lessons = getAllLessons();
    const index = lessons.findIndex((lesson) => lesson.id === lessonId);

    return index >= 0 ? lessons[index + 1] ?? null : null;
}

export const lessonExercises = {
    '1-1': {
        target: 'asdf jkl; asdf jkl; fj fj dk dk sl sl',
        heading: 'Get familiar with the keys',
        instruction: 'Type the characters shown below. Take your time and look at the screen, not your keyboard.',
        tip: 'Place your left fingers on A, S, D, F and your right fingers on J, K, L, semicolon. Keep your thumbs near the spacebar.'
    },
    '1-2': {
        target: 'Sit tall relax your shoulders and keep your wrists straight',
        heading: 'Build a comfortable posture',
        instruction: 'Type this short reminder while keeping your shoulders relaxed and wrists straight.',
        tip: 'Avoid bending your wrists sharply or pressing keys harder than necessary.'
    },
    '1-3': {
        target: 'asdf jkl; qwer uiop zxcv nm',
        heading: 'Explore your finger map',
        instruction: 'Practise small groups of keys and notice which finger moves for each group.',
        tip: 'Return each finger to its home position after reaching for another key.'
    },
    '1-4': {
        target: 'asdf jkl; fj fj dk dk sl sl a sad lad fall',
        heading: 'Find the home row',
        instruction: 'Practise the home-row keys first, then try a few simple words.',
        tip: 'Feel for the small raised marks on F and J to find the home row without looking down.'
    },
    '2-1': {
        target: 'asdf fdsa asdf fdsa sad fad ask flask',
        heading: 'Left-hand home row',
        instruction: 'Keep your right hand on its home keys and focus on the left-hand letters.',
        tip: 'Use A with your little finger, S with your ring finger, D with your middle finger and F with your index finger.'
    },
    '2-2': {
        target: 'jkl; ;lkj jkl; ;lkj all ask fall flask',
        heading: 'Right-hand home row',
        instruction: 'Practise the right-hand home keys without rushing.',
        tip: 'Use J with your index finger, K with your middle finger, L with your ring finger and semicolon with your little finger.'
    },
    '2-3': {
        target: 'asdf jkl; fall ask flask salad had shall',
        heading: 'Use both hands together',
        instruction: 'Type each word using both hands and return your fingers to the home row.',
        tip: 'Keep your hands relaxed and avoid looking down at the keyboard.'
    },
    '2-4': {
        target: 'a sad lad asks dad all fall shall ask',
        heading: 'Type home-row words',
        instruction: 'Type the words and short phrases shown below.',
        tip: 'Aim for accurate keystrokes first. Speed will improve with repetition.'
    },
    '3-1': {
        target: 'qwert rtyu qwer tree were quiet',
        heading: 'Upper row with the left hand',
        instruction: 'Reach gently from the home row to the upper-row keys.',
        tip: 'Move only the finger needed, then return it to its home position.'
    },
    '3-2': {
        target: 'uiop poiuy upon our top pour',
        heading: 'Upper row with the right hand',
        instruction: 'Practise reaching for U, I, O and P from your home-row position.',
        tip: 'Keep the other fingers relaxed instead of lifting your whole hand.'
    },
    '3-3': {
        target: 'type write quiet power tree point',
        heading: 'Upper-row words',
        instruction: 'Combine upper-row letters with familiar keys to type whole words.',
        tip: 'Accuracy is more valuable than racing through the exercise.'
    },
    '4-1': {
        target: 'zxcv zxcv cave vex cab',
        heading: 'Bottom row with the left hand',
        instruction: 'Reach down from the home row to practise the lower-left keys.',
        tip: 'Return your fingers to the home row after each reach.'
    },
    '4-2': {
        target: 'nm nm mmm moon name man',
        heading: 'Bottom row with the right hand',
        instruction: 'Practise the lower-right letters while keeping your hands relaxed.',
        tip: 'Use the correct finger rather than stretching one finger across several keys.'
    },
    '4-3': {
        target: 'quick brown fox jumps over the lazy dog',
        heading: 'Combine all letter rows',
        instruction: 'Type a sentence that uses letters from across the keyboard.',
        tip: 'Keep your eyes on the text and let your fingers learn the key positions.'
    },
    '5-1': {
        target: '12345 67890 2026 13579 24680',
        heading: 'Practise the number row',
        instruction: 'Type the number groups exactly as shown.',
        tip: 'Reach for numbers with the appropriate finger and return to your usual position.'
    },
    '5-2': {
        target: 'TypeQuest Helps You Learn Every Day',
        heading: 'Capitals and Shift',
        instruction: 'Use Shift with the opposite hand when typing capital letters.',
        tip: 'For a capital A, hold the right Shift key and press A with your left little finger.'
    },
    '5-3': {
        target: 'Hello, world! Are you ready? Yes, I am.',
        heading: 'Punctuation and symbols',
        instruction: 'Practise commas, full stops, apostrophes and question marks.',
        tip: 'Use the Shift key for symbols that share a key with a number.'
    },
    '6-1': {
        target: 'people make progress when they practise a little every day',
        heading: 'Type common words',
        instruction: 'Build a steady rhythm as you type this sentence.',
        tip: 'Read a few words ahead without losing your place.'
    },
    '6-2': {
        target: 'Learning to type takes patience and regular practice.',
        heading: 'Type a short sentence',
        instruction: 'Focus on spaces, capital letters and punctuation.',
        tip: 'Use one space between words and check punctuation carefully.'
    },
    '6-3': {
        target: 'A calm and steady pace helps you build accuracy. With practice, your typing will become smoother and faster.',
        heading: 'Practise a paragraph',
        instruction: 'Type this short paragraph at a comfortable pace.',
        tip: 'When you make a mistake, correct it calmly and continue.'
    },
    '7-1': {
        target: 'Keep your eyes on the screen and trust your fingers to find the keys.',
        heading: 'Type without looking',
        instruction: 'Keep your eyes on the text rather than your keyboard.',
        tip: 'If you lose your place, feel for F and J and reset your fingers.'
    },
    '7-2': {
        target: 'Accuracy comes first. A steady rhythm helps prevent small mistakes.',
        heading: 'Accuracy before speed',
        instruction: 'Type carefully and try to finish with as few errors as possible.',
        tip: 'Slow down slightly if errors increase. Reliable typing builds speed over time.'
    },
    '7-3': {
        target: 'Practice with focus, stay relaxed, and let each keystroke become more natural.',
        heading: 'Timed typing challenge',
        instruction: 'Complete the text and see your speed and accuracy.',
        tip: 'Keep a consistent pace rather than sprinting at the beginning.'
    },
    '8-1': {
        target: 'Hello team, please find the project update attached. Thank you for your time.',
        heading: 'Type workplace messages',
        instruction: 'Practise realistic text you might use in an email or document.',
        tip: 'Check names, punctuation and spacing before finishing.'
    },
    '8-2': {
        target: 'Consistent practice helps develop a comfortable rhythm. Take your time, maintain good posture, and focus on accuracy throughout longer passages.',
        heading: 'Build long-form stamina',
        instruction: 'Type the full passage while keeping a relaxed, steady rhythm.',
        tip: 'Take short breaks during longer practice sessions.'
    },
    '8-3': {
        target: 'Typing confidently means balancing speed, accuracy, posture, and control. Keep practising and measure your progress over time.',
        heading: 'Check your typing skills',
        instruction: 'Complete this final passage and review your results.',
        tip: 'Compare results from different sessions to see how your skills develop.'
    },
};


export const lessonExerciseWords = {
    '1-1': ['asdf', 'jkl;', 'fj', 'dk', 'sl', 'fd', 'jk', 'asdf', 'jkl;', 'df', 'kl', 'sa', 'lj', 'ak', 'f;'],
    '1-2': ['Sit tall', 'relax your shoulders', 'keep your wrists straight', 'rest your fingers gently', 'sit comfortably', 'keep your hands relaxed', 'take a calm breath', 'stay balanced'],
    '1-3': ['asdf', 'jkl;', 'qwer', 'uiop', 'zxcv', 'nm', 'a s d f', 'j k l ;', 'q w e r', 'u i o p'],
    '1-4': ['sad', 'lad', 'fall', 'ask', 'dad', 'flask', 'all', 'shall', 'lass', 'had', 'salad', 'adds', 'flaw', 'dash'],
    '2-1': ['sad', 'fad', 'ask', 'flask', 'dad', 'add', 'fall', 'glad', 'half', 'flag', 'lass', 'salad', 'as', 'had'],
    '2-2': ['all', 'ask', 'fall', 'flask', 'shall', 'lass', 'hall', 'jkl;', 'lkj;', 'jill', 'kill', 'look', 'pull', 'oil'],
    '2-3': ['sad', 'lad', 'fall', 'ask', 'flask', 'salad', 'had', 'shall', 'all', 'dad', 'glad', 'lass', 'adds', 'half'],
    '2-4': ['a sad lad', 'dad asks', 'all shall fall', 'a lass asks', 'add a salad', 'a lad falls', 'all lads ask', 'dad had a flask', 'a sad lass', 'shall a lad ask'],
    '3-1': ['qwer', 'wert', 'erty', 'rtyu', 'qwert', 'tree', 'were', 'quiet', 'write', 'try', 'wet', 'yet', 'true', 'treat'],
    '3-2': ['uiop', 'iop', 'poiuy', 'upon', 'our', 'top', 'pour', 'your', 'out', 'poor', 'loop', 'pool', 'root', 'tour'],
    '3-3': ['type', 'write', 'quiet', 'power', 'tree', 'point', 'pretty', 'quite', 'tower', 'route', 'quote', 'upper', 'true', 'were'],
    '4-1': ['zxcv', 'zxc', 'cave', 'vex', 'cab', 'save', 'face', 'vac', 'cz', 'van', 'can', 'zoom', 'exact', 'cave'],
    '4-2': ['nm', 'mn', 'moon', 'name', 'man', 'many', 'money', 'none', 'mean', 'mine', 'known', 'woman', 'among', 'common'],
    '4-3': ['quick brown fox', 'jumps over the lazy dog', 'pack my box', 'five dozen liquor jugs', 'bright stars shine', 'small steps build skill', 'the brave bird flew', 'every key has a place', 'practice makes progress'],
    '5-1': ['12345', '67890', '2026', '13579', '24680', '11223', '44556', '78900', '90817', '56432', '31415', '27182'],
    '5-2': ['TypeQuest Helps You Learn', 'Practice Makes Progress', 'Keep Your Hands Relaxed', 'Every Day Brings New Skills', 'Stay Calm And Keep Typing', 'Accuracy Comes Before Speed'],
    '5-3': ['Hello, world!', 'Are you ready?', 'Yes, I am.', 'Great work, team!', 'Can we begin at 10:30?', 'Type carefully: commas, periods, and questions?', 'Wait... try again!', 'Well done; keep going.'],
    '6-1': ['people make progress', 'small steps help', 'typing feels easier', 'steady practice works', 'common words become familiar', 'daily practice builds confidence', 'fingers learn through repetition', 'accuracy grows with patience', 'keep a steady rhythm'],
    '6-2': ['Learning to type takes patience.', 'A little practice helps every day.', 'Keep your fingers relaxed.', 'Look at the screen while typing.', 'Small steps lead to progress.', 'Accuracy matters more than speed.', 'Practice makes typing feel natural.'],
    '6-3': ['A calm and steady pace helps you build accuracy.', 'With practice, your typing will become smoother and faster.', 'Typing improves when you practise often and focus on accuracy.', 'Good typing habits begin with posture and patience.', 'Read ahead, use the correct fingers, and let your speed grow naturally.'],
    '7-1': ['Keep your eyes on the screen and trust your fingers.', 'Feel the home row and look at the text.', 'Your fingers can learn the keyboard with practice.', 'Stay focused on the screen instead of looking down.'],
    '7-2': ['Accuracy comes first.', 'A steady rhythm helps prevent small mistakes.', 'Slow down when needed and type each word correctly.', 'Careful fingers can reduce typing errors.', 'Reliable typing builds speed over time.'],
    '7-3': ['Practice with focus and let each keystroke become natural.', 'Keep a steady rhythm, watch the text, and finish with control.', 'Every focused session helps your fingers become quicker and more accurate.', 'Stay relaxed, type carefully, and keep a consistent pace.'],
    '8-1': ['Hello team, please find the project update attached.', 'Hi everyone, here is the latest project update.', 'Good morning, I have attached the report for your review.', 'Please let me know if you have any questions.', 'Thank you for your time and feedback.'],
    '8-2': ['Consistent practice helps develop a comfortable rhythm.', 'Take your time, maintain good posture, and focus on accuracy.', 'When typing longer documents, keep your shoulders relaxed.', 'Read a few words ahead and take a short break when needed.', 'Building typing stamina takes time and regular practice.'],
    '8-3': ['Typing confidently means balancing speed, accuracy, posture, and control.', 'Strong typing skills come from accuracy, good posture, and regular practice.', 'Review your results and celebrate each improvement.', 'Stay relaxed, type carefully, and use your results to plan your next session.'],
};

export function generateLessonTarget(lessonId, fallback = '', difficulty = 'beginner', durationSeconds = 0) {
    const words = lessonExerciseWords[lessonId];
    if (!words || !words.length) return fallback;

    const difficultyCounts = {beginner: 7, intermediate: 11, advanced: 16};
    const timedRates = {beginner: 20, intermediate: 29, advanced: 38};
    const count = durationSeconds > 0
        ? Math.max(12, Math.ceil((durationSeconds / 60) * timedRates[difficulty]))
        : difficultyCounts[difficulty] || difficultyCounts.beginner;

    const selected = [];
    let previous = '';
    for (let index = 0; index < count; index += 1) {
        let next = words[Math.floor(Math.random() * words.length)];
        let attempts = 0;
        while (words.length > 1 && next === previous && attempts < 8) {
            next = words[Math.floor(Math.random() * words.length)];
            attempts += 1;
        }
        selected.push(next);
        previous = next;
    }

    const output = selected.join(' ').replace(/\s+/g, ' ').trim();
    if (lessonId === '5-2' || lessonId === '5-3' || lessonId.startsWith('6-') || lessonId.startsWith('7-') || lessonId.startsWith('8-')) {
        return output.charAt(0).toUpperCase() + output.slice(1);
    }
    return output;
}
