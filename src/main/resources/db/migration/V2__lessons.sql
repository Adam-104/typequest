-- Moves the course (levels and lessons) into the database so admins can edit
-- lesson text without a deploy. Seeded from the built-in curriculum.
-- Never edit this file after it has run: add V3__*.sql instead.

CREATE TABLE lesson_levels (
    id          INT          NOT NULL,
    title       VARCHAR(100) NOT NULL,
    subtitle    VARCHAR(150) NOT NULL,
    description VARCHAR(500) NOT NULL,
    icon        VARCHAR(20)  NOT NULL,
    color       VARCHAR(20)  NOT NULL,
    sort_order  INT          NOT NULL,
    PRIMARY KEY (id)
) ENGINE=InnoDB;

CREATE TABLE lessons (
    id          VARCHAR(20)   NOT NULL,
    level_id    INT           NOT NULL,
    title       VARCHAR(100)  NOT NULL,
    duration    VARCHAR(20)   NOT NULL,
    description VARCHAR(500)  NOT NULL,
    heading     VARCHAR(150)  NOT NULL,
    instruction VARCHAR(500)  NOT NULL,
    tip         VARCHAR(500)  NOT NULL,
    target      VARCHAR(1000) NOT NULL,
    words       VARCHAR(4000) NOT NULL,
    sort_order  INT           NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_lessons_level FOREIGN KEY (level_id) REFERENCES lesson_levels (id)
) ENGINE=InnoDB;

INSERT INTO lesson_levels (id, title, subtitle, description, icon, color, sort_order) VALUES (1, 'Typing Foundations', 'Start from the beginning', 'Get comfortable with the keyboard, posture, and finger placement before you begin typing.', '⌨', 'purple', 0);
INSERT INTO lesson_levels (id, title, subtitle, description, icon, color, sort_order) VALUES (2, 'Home Row', 'Build your foundation', 'Learn the home-row keys and practise returning your fingers to their starting positions.', '⌨', 'blue', 1);
INSERT INTO lesson_levels (id, title, subtitle, description, icon, color, sort_order) VALUES (3, 'Upper Row', 'Reach the keys above', 'Learn the upper-row keys while keeping your hands anchored to the home row.', '↑', 'cyan', 2);
INSERT INTO lesson_levels (id, title, subtitle, description, icon, color, sort_order) VALUES (4, 'Bottom Row', 'Reach the keys below', 'Build control and accuracy as you learn the bottom-row keys.', '↓', 'green', 3);
INSERT INTO lesson_levels (id, title, subtitle, description, icon, color, sort_order) VALUES (5, 'Numbers and Symbols', 'Go beyond letters', 'Practise the number row, capital letters, and common punctuation.', '#', 'orange', 4);
INSERT INTO lesson_levels (id, title, subtitle, description, icon, color, sort_order) VALUES (6, 'Words and Sentences', 'Type with confidence', 'Use your new keyboard skills to type real words and complete sentences.', 'Aa', 'red', 5);
INSERT INTO lesson_levels (id, title, subtitle, description, icon, color, sort_order) VALUES (7, 'Speed and Accuracy', 'Improve your rhythm', 'Build speed gradually while keeping your typing accurate and relaxed.', '⚡', 'purple', 6);
INSERT INTO lesson_levels (id, title, subtitle, description, icon, color, sort_order) VALUES (8, 'Real-World Typing', 'Use typing every day', 'Apply your skills to emails, documents, longer text, and coding-related content.', '✦', 'blue', 7);

INSERT INTO lessons (id, level_id, title, duration, description, heading, instruction, tip, target, words, sort_order) VALUES ('1-1', 1, 'Meet Your Keyboard', '4 min', 'Learn the main keyboard sections and what the keys do.', 'Get familiar with the keys', 'Type the characters shown below. Take your time and look at the screen, not your keyboard.', 'Place your left fingers on A, S, D, F and your right fingers on J, K, L, semicolon. Keep your thumbs near the spacebar.', 'asdf jkl; asdf jkl; fj fj dk dk sl sl', 'asdf
jkl;
fj
dk
sl
fd
jk
asdf
jkl;
df
kl
sa
lj
ak
f;', 0);
INSERT INTO lessons (id, level_id, title, duration, description, heading, instruction, tip, target, words, sort_order) VALUES ('1-2', 1, 'Posture and Hand Position', '5 min', 'Set up comfortably and learn how to position your hands.', 'Build a comfortable posture', 'Type this short reminder while keeping your shoulders relaxed and wrists straight.', 'Avoid bending your wrists sharply or pressing keys harder than necessary.', 'Sit tall relax your shoulders and keep your wrists straight', 'Sit tall
relax your shoulders
keep your wrists straight
rest your fingers gently
sit comfortably
keep your hands relaxed
take a calm breath
stay balanced', 1);
INSERT INTO lessons (id, level_id, title, duration, description, heading, instruction, tip, target, words, sort_order) VALUES ('1-3', 1, 'Your Finger Map', '5 min', 'Discover which fingers reach each group of keys.', 'Explore your finger map', 'Practise small groups of keys and notice which finger moves for each group.', 'Return each finger to its home position after reaching for another key.', 'asdf jkl; qwer uiop zxcv nm', 'asdf
jkl;
qwer
uiop
zxcv
nm
a s d f
j k l ;
q w e r
u i o p', 2);
INSERT INTO lessons (id, level_id, title, duration, description, heading, instruction, tip, target, words, sort_order) VALUES ('1-4', 1, 'Find the Home Row', '4 min', 'Locate the home-row keys and the small guide bumps on F and J.', 'Find the home row', 'Practise the home-row keys first, then try a few simple words.', 'Feel for the small raised marks on F and J to find the home row without looking down.', 'asdf jkl; fj fj dk dk sl sl a sad lad fall', 'sad
lad
fall
ask
dad
flask
all
shall
lass
had
salad
adds
flaw
dash', 3);
INSERT INTO lessons (id, level_id, title, duration, description, heading, instruction, tip, target, words, sort_order) VALUES ('2-1', 2, 'Left Hand: A, S, D, F', '5 min', 'Practise the four left-hand home-row keys.', 'Left-hand home row', 'Keep your right hand on its home keys and focus on the left-hand letters.', 'Use A with your little finger, S with your ring finger, D with your middle finger and F with your index finger.', 'asdf fdsa asdf fdsa sad fad ask flask', 'sad
fad
ask
flask
dad
add
fall
glad
half
flag
lass
salad
as
had', 4);
INSERT INTO lessons (id, level_id, title, duration, description, heading, instruction, tip, target, words, sort_order) VALUES ('2-2', 2, 'Right Hand: J, K, L, ;', '5 min', 'Practise the four right-hand home-row keys.', 'Right-hand home row', 'Practise the right-hand home keys without rushing.', 'Use J with your index finger, K with your middle finger, L with your ring finger and semicolon with your little finger.', 'jkl; ;lkj jkl; ;lkj all ask fall flask', 'all
ask
fall
flask
shall
lass
hall
jkl;
lkj;
jill
kill
look
pull
oil', 5);
INSERT INTO lessons (id, level_id, title, duration, description, heading, instruction, tip, target, words, sort_order) VALUES ('2-3', 2, 'Both Hands Together', '6 min', 'Combine both hands in short, controlled sequences.', 'Use both hands together', 'Type each word using both hands and return your fingers to the home row.', 'Keep your hands relaxed and avoid looking down at the keyboard.', 'asdf jkl; fall ask flask salad had shall', 'sad
lad
fall
ask
flask
salad
had
shall
all
dad
glad
lass
adds
half', 6);
INSERT INTO lessons (id, level_id, title, duration, description, heading, instruction, tip, target, words, sort_order) VALUES ('2-4', 2, 'Home Row Words', '7 min', 'Type simple words using the keys you have learned.', 'Type home-row words', 'Type the words and short phrases shown below.', 'Aim for accurate keystrokes first. Speed will improve with repetition.', 'a sad lad asks dad all fall shall ask', 'a sad lad
dad asks
all shall fall
a lass asks
add a salad
a lad falls
all lads ask
dad had a flask
a sad lass
shall a lad ask', 7);
INSERT INTO lessons (id, level_id, title, duration, description, heading, instruction, tip, target, words, sort_order) VALUES ('3-1', 3, 'Left Upper Row: Q, W, E, R, T', '6 min', 'Practise reaching the upper row with your left hand.', 'Upper row with the left hand', 'Reach gently from the home row to the upper-row keys.', 'Move only the finger needed, then return it to its home position.', 'qwert rtyu qwer tree were quiet', 'qwer
wert
erty
rtyu
qwert
tree
were
quiet
write
try
wet
yet
true
treat', 8);
INSERT INTO lessons (id, level_id, title, duration, description, heading, instruction, tip, target, words, sort_order) VALUES ('3-2', 3, 'Right Upper Row: Y, U, I, O, P', '6 min', 'Practise reaching the upper row with your right hand.', 'Upper row with the right hand', 'Practise reaching for U, I, O and P from your home-row position.', 'Keep the other fingers relaxed instead of lifting your whole hand.', 'uiop poiuy upon our top pour', 'uiop
iop
poiuy
upon
our
top
pour
your
out
poor
loop
pool
root
tour', 9);
INSERT INTO lessons (id, level_id, title, duration, description, heading, instruction, tip, target, words, sort_order) VALUES ('3-3', 3, 'Upper Row Words', '7 min', 'Combine upper-row keys into familiar words.', 'Upper-row words', 'Combine upper-row letters with familiar keys to type whole words.', 'Accuracy is more valuable than racing through the exercise.', 'type write quiet power tree point', 'type
write
quiet
power
tree
point
pretty
quite
tower
route
quote
upper
true
were', 10);
INSERT INTO lessons (id, level_id, title, duration, description, heading, instruction, tip, target, words, sort_order) VALUES ('4-1', 4, 'Left Bottom Row: Z, X, C, V, B', '6 min', 'Learn the bottom-row keys with your left hand.', 'Bottom row with the left hand', 'Reach down from the home row to practise the lower-left keys.', 'Return your fingers to the home row after each reach.', 'zxcv zxcv cave vex cab', 'zxcv
zxc
cave
vex
cab
save
face
vac
cz
van
can
zoom
exact
cave', 11);
INSERT INTO lessons (id, level_id, title, duration, description, heading, instruction, tip, target, words, sort_order) VALUES ('4-2', 4, 'Right Bottom Row: N, M, Comma, Period', '6 min', 'Learn the bottom-row keys with your right hand.', 'Bottom row with the right hand', 'Practise the lower-right letters while keeping your hands relaxed.', 'Use the correct finger rather than stretching one finger across several keys.', 'nm nm mmm moon name man', 'nm
mn
moon
name
man
many
money
none
mean
mine
known
woman
among
common', 12);
INSERT INTO lessons (id, level_id, title, duration, description, heading, instruction, tip, target, words, sort_order) VALUES ('4-3', 4, 'All Letter Rows', '8 min', 'Combine the top, home, and bottom rows.', 'Combine all letter rows', 'Type a sentence that uses letters from across the keyboard.', 'Keep your eyes on the text and let your fingers learn the key positions.', 'quick brown fox jumps over the lazy dog', 'quick brown fox
jumps over the lazy dog
pack my box
five dozen liquor jugs
bright stars shine
small steps build skill
the brave bird flew
every key has a place
practice makes progress', 13);
INSERT INTO lessons (id, level_id, title, duration, description, heading, instruction, tip, target, words, sort_order) VALUES ('5-1', 5, 'Number Row', '6 min', 'Practise typing digits accurately.', 'Practise the number row', 'Type the number groups exactly as shown.', 'Reach for numbers with the appropriate finger and return to your usual position.', '12345 67890 2026 13579 24680', '12345
67890
2026
13579
24680
11223
44556
78900
90817
56432
31415
27182', 14);
INSERT INTO lessons (id, level_id, title, duration, description, heading, instruction, tip, target, words, sort_order) VALUES ('5-2', 5, 'Shift and Capital Letters', '5 min', 'Use Shift to type uppercase letters.', 'Capitals and Shift', 'Use Shift with the opposite hand when typing capital letters.', 'For a capital A, hold the right Shift key and press A with your left little finger.', 'TypeQuest Helps You Learn Every Day', 'TypeQuest Helps You Learn
Practice Makes Progress
Keep Your Hands Relaxed
Every Day Brings New Skills
Stay Calm And Keep Typing
Accuracy Comes Before Speed', 15);
INSERT INTO lessons (id, level_id, title, duration, description, heading, instruction, tip, target, words, sort_order) VALUES ('5-3', 5, 'Punctuation and Symbols', '7 min', 'Practise commas, periods, question marks, and common symbols.', 'Punctuation and symbols', 'Practise commas, full stops, apostrophes and question marks.', 'Use the Shift key for symbols that share a key with a number.', 'Hello, world! Are you ready? Yes, I am.', 'Hello, world!
Are you ready?
Yes, I am.
Great work, team!
Can we begin at 10:30?
Type carefully: commas, periods, and questions?
Wait... try again!
Well done; keep going.', 16);
INSERT INTO lessons (id, level_id, title, duration, description, heading, instruction, tip, target, words, sort_order) VALUES ('6-1', 6, 'Common Words', '7 min', 'Practise everyday words and useful letter combinations.', 'Type common words', 'Build a steady rhythm as you type this sentence.', 'Read a few words ahead without losing your place.', 'people make progress when they practise a little every day', 'people make progress
small steps help
typing feels easier
steady practice works
common words become familiar
daily practice builds confidence
fingers learn through repetition
accuracy grows with patience
keep a steady rhythm', 17);
INSERT INTO lessons (id, level_id, title, duration, description, heading, instruction, tip, target, words, sort_order) VALUES ('6-2', 6, 'Short Sentences', '8 min', 'Build accuracy with complete sentences.', 'Type a short sentence', 'Focus on spaces, capital letters and punctuation.', 'Use one space between words and check punctuation carefully.', 'Learning to type takes patience and regular practice.', 'Learning to type takes patience.
A little practice helps every day.
Keep your fingers relaxed.
Look at the screen while typing.
Small steps lead to progress.
Accuracy matters more than speed.
Practice makes typing feel natural.', 18);
INSERT INTO lessons (id, level_id, title, duration, description, heading, instruction, tip, target, words, sort_order) VALUES ('6-3', 6, 'Paragraph Practice', '10 min', 'Bring your skills together in a short paragraph.', 'Practise a paragraph', 'Type this short paragraph at a comfortable pace.', 'When you make a mistake, correct it calmly and continue.', 'A calm and steady pace helps you build accuracy. With practice, your typing will become smoother and faster.', 'A calm and steady pace helps you build accuracy.
With practice, your typing will become smoother and faster.
Typing improves when you practise often and focus on accuracy.
Good typing habits begin with posture and patience.
Read ahead, use the correct fingers, and let your speed grow naturally.', 19);
INSERT INTO lessons (id, level_id, title, duration, description, heading, instruction, tip, target, words, sort_order) VALUES ('7-1', 7, 'Type Without Looking', '8 min', 'Practise keeping your eyes on the text instead of the keyboard.', 'Type without looking', 'Keep your eyes on the text rather than your keyboard.', 'If you lose your place, feel for F and J and reset your fingers.', 'Keep your eyes on the screen and trust your fingers to find the keys.', 'Keep your eyes on the screen and trust your fingers.
Feel the home row and look at the text.
Your fingers can learn the keyboard with practice.
Stay focused on the screen instead of looking down.', 20);
INSERT INTO lessons (id, level_id, title, duration, description, heading, instruction, tip, target, words, sort_order) VALUES ('7-2', 7, 'Accuracy First', '8 min', 'Reduce errors before increasing your pace.', 'Accuracy before speed', 'Type carefully and try to finish with as few errors as possible.', 'Slow down slightly if errors increase. Reliable typing builds speed over time.', 'Accuracy comes first. A steady rhythm helps prevent small mistakes.', 'Accuracy comes first.
A steady rhythm helps prevent small mistakes.
Slow down when needed and type each word correctly.
Careful fingers can reduce typing errors.
Reliable typing builds speed over time.', 21);
INSERT INTO lessons (id, level_id, title, duration, description, heading, instruction, tip, target, words, sort_order) VALUES ('7-3', 7, 'Timed Typing Challenge', '10 min', 'Measure your speed in a timed exercise.', 'Timed typing challenge', 'Complete the text and see your speed and accuracy.', 'Keep a consistent pace rather than sprinting at the beginning.', 'Practice with focus, stay relaxed, and let each keystroke become more natural.', 'Practice with focus and let each keystroke become natural.
Keep a steady rhythm, watch the text, and finish with control.
Every focused session helps your fingers become quicker and more accurate.
Stay relaxed, type carefully, and keep a consistent pace.', 22);
INSERT INTO lessons (id, level_id, title, duration, description, heading, instruction, tip, target, words, sort_order) VALUES ('8-1', 8, 'Email and Documents', '10 min', 'Practise realistic work-related text.', 'Type workplace messages', 'Practise realistic text you might use in an email or document.', 'Check names, punctuation and spacing before finishing.', 'Hello team, please find the project update attached. Thank you for your time.', 'Hello team, please find the project update attached.
Hi everyone, here is the latest project update.
Good morning, I have attached the report for your review.
Please let me know if you have any questions.
Thank you for your time and feedback.', 23);
INSERT INTO lessons (id, level_id, title, duration, description, heading, instruction, tip, target, words, sort_order) VALUES ('8-2', 8, 'Long-Form Typing', '12 min', 'Build consistency across longer passages.', 'Build long-form stamina', 'Type the full passage while keeping a relaxed, steady rhythm.', 'Take short breaks during longer practice sessions.', 'Consistent practice helps develop a comfortable rhythm. Take your time, maintain good posture, and focus on accuracy throughout longer passages.', 'Consistent practice helps develop a comfortable rhythm.
Take your time, maintain good posture, and focus on accuracy.
When typing longer documents, keep your shoulders relaxed.
Read a few words ahead and take a short break when needed.
Building typing stamina takes time and regular practice.', 24);
INSERT INTO lessons (id, level_id, title, duration, description, heading, instruction, tip, target, words, sort_order) VALUES ('8-3', 8, 'Final Skills Check', '10 min', 'Review your accuracy and speed across a longer exercise.', 'Check your typing skills', 'Complete this final passage and review your results.', 'Compare results from different sessions to see how your skills develop.', 'Typing confidently means balancing speed, accuracy, posture, and control. Keep practising and measure your progress over time.', 'Typing confidently means balancing speed, accuracy, posture, and control.
Strong typing skills come from accuracy, good posture, and regular practice.
Review your results and celebrate each improvement.
Stay relaxed, type carefully, and use your results to plan your next session.', 25);
