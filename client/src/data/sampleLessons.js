export const sampleLessons = [
  {
    id: 'lesson-math-001',
    title: 'Introduction to Fractions',
    subject: 'Mathematics',
    grade_level: 'Grade 5-6',
    version: 1,
    published: true,
    content: {
      sections: [
        {
          type: 'text',
          content: 'A fraction represents a part of a whole. When you cut a pizza into 4 equal slices and eat 1 slice, you have eaten 1/4 of the pizza.'
        },
        {
          type: 'heading',
          content: 'Parts of a Fraction'
        },
        {
          type: 'text',
          content: 'Every fraction has two parts: the numerator (top number) and the denominator (bottom number). The denominator tells you how many equal parts the whole is divided into. The numerator tells you how many of those parts you have.'
        },
        {
          type: 'diagram',
          label: 'Fraction Diagram',
          svg: `<svg viewBox="0 0 300 120" xmlns="http://www.w3.org/2000/svg">
            <rect x="10" y="10" width="280" height="50" fill="none" stroke="#2dff7a" stroke-width="2"/>
            <rect x="10" y="10" width="70" height="50" fill="#2dff7a" opacity="0.4"/>
            <line x1="80" y1="10" x2="80" y2="60" stroke="#2dff7a" stroke-width="1"/>
            <line x1="150" y1="10" x2="150" y2="60" stroke="#2dff7a" stroke-width="1"/>
            <line x1="220" y1="10" x2="220" y2="60" stroke="#2dff7a" stroke-width="1"/>
            <text x="150" y="85" text-anchor="middle" fill="#e8f5ec" font-size="14" font-family="Space Mono">1/4 is shaded</text>
            <text x="35" y="40" text-anchor="middle" fill="#2dff7a" font-size="20" font-family="Space Mono">1</text>
            <text x="105" y="40" text-anchor="middle" fill="#e8f5ec" font-size="12" font-family="Space Mono">2</text>
            <text x="175" y="40" text-anchor="middle" fill="#e8f5ec" font-size="12" font-family="Space Mono">3</text>
            <text x="245" y="40" text-anchor="middle" fill="#e8f5ec" font-size="12" font-family="Space Mono">4</text>
          </svg>`
        },
        {
          type: 'heading',
          content: 'Equivalent Fractions'
        },
        {
          type: 'text',
          content: 'Two fractions are equivalent if they represent the same amount. For example: 1/2 = 2/4 = 4/8. You can find equivalent fractions by multiplying or dividing both the numerator and denominator by the same number.'
        },
        {
          type: 'example',
          content: 'Example: Is 2/3 equivalent to 4/6?\nMultiply both parts of 2/3 by 2:\n2×2 = 4 (new numerator)\n3×2 = 6 (new denominator)\nSo 2/3 = 4/6. Yes, they are equivalent!'
        }
      ]
    },
    quiz: {
      questions: [
        {
          id: 'q1',
          text: 'In the fraction 3/8, what does the number 8 represent?',
          options: [
            'How many parts you have',
            'How many equal parts the whole is divided into',
            'The total number of fractions',
            'How many parts are missing'
          ],
          correct: 1
        },
        {
          id: 'q2',
          text: 'Which fraction is equivalent to 1/2?',
          options: ['1/3', '2/3', '3/6', '4/6'],
          correct: 2
        },
        {
          id: 'q3',
          text: 'A chocolate bar is divided into 10 equal pieces. You eat 3 pieces. What fraction did you eat?',
          options: ['3/7', '7/10', '3/10', '10/3'],
          correct: 2
        },
        {
          id: 'q4',
          text: 'What is the numerator in the fraction 5/9?',
          options: ['9', '5', '4', '14'],
          correct: 1
        },
        {
          id: 'q5',
          text: 'Which fraction is the largest?',
          options: ['1/4', '1/2', '1/8', '1/3'],
          correct: 1
        }
      ]
    }
  },
  {
    id: 'lesson-sci-001',
    title: 'The Water Cycle',
    subject: 'Science',
    grade_level: 'Grade 4-6',
    version: 1,
    published: true,
    content: {
      sections: [
        {
          type: 'text',
          content: 'The water cycle is the continuous movement of water through Earth\'s systems. It has no beginning and no end. Water is constantly being recycled between the ocean, atmosphere, and land.'
        },
        {
          type: 'heading',
          content: 'The Four Stages'
        },
        {
          type: 'text',
          content: 'Stage 1, Evaporation: The sun heats water in oceans, lakes, and rivers, turning it into water vapor that rises into the atmosphere. This is why puddles disappear after a sunny day.'
        },
        {
          type: 'text',
          content: 'Stage 2, Condensation: As water vapor rises, it cools and condenses into tiny water droplets, forming clouds and fog.'
        },
        {
          type: 'text',
          content: 'Stage 3, Precipitation: When water droplets in clouds combine and become heavy enough, they fall as rain, snow, sleet, or hail.'
        },
        {
          type: 'text',
          content: 'Stage 4, Collection: Water collects in oceans, lakes, rivers, and groundwater, and the cycle begins again.'
        },
        {
          type: 'example',
          content: 'Real World Connection: When you see dew on grass in the morning, that is condensation. Overnight, the air cooled and water vapor turned back into liquid water on the cool grass surface.'
        }
      ]
    },
    quiz: {
      questions: [
        {
          id: 'q1',
          text: 'What provides the energy that powers the water cycle?',
          options: ['Wind', 'The Moon', 'The Sun', 'Gravity alone'],
          correct: 2
        },
        {
          id: 'q2',
          text: 'When water vapor cools and turns into liquid droplets in the atmosphere, this process is called:',
          options: ['Evaporation', 'Precipitation', 'Condensation', 'Collection'],
          correct: 2
        },
        {
          id: 'q3',
          text: 'Which of the following is NOT a form of precipitation?',
          options: ['Rain', 'Snow', 'Fog', 'Hail'],
          correct: 2
        },
        {
          id: 'q4',
          text: 'Why does water evaporate faster on a hot, sunny day than on a cool, cloudy day?',
          options: [
            'Because wind blows the water away',
            'Because the sun provides more energy to convert water to vapor',
            'Because clouds block precipitation',
            'Because cold water is heavier'
          ],
          correct: 1
        }
      ]
    }
  },
  {
    id: 'lesson-lit-001',
    title: 'Reading Comprehension: Main Idea',
    subject: 'Literacy',
    grade_level: 'Grade 4-5',
    version: 1,
    published: true,
    content: {
      sections: [
        {
          type: 'text',
          content: 'The main idea of a text is the most important point the author is making. It is what the whole passage is about. Not just one sentence or detail, but the central message.'
        },
        {
          type: 'heading',
          content: 'How to Find the Main Idea'
        },
        {
          type: 'text',
          content: 'Step 1: Read the entire passage first without stopping to analyze anything.'
        },
        {
          type: 'text',
          content: 'Step 2: Ask yourself: "What is almost every sentence in this passage talking about?" That topic is your subject.'
        },
        {
          type: 'text',
          content: 'Step 3: Ask yourself: "What is the most important thing the author is saying about that subject?" That is your main idea.'
        },
        {
          type: 'heading',
          content: 'Practice Passage'
        },
        {
          type: 'example',
          content: 'Read this passage:\n\n"Trees are essential to life on Earth. They produce the oxygen we breathe by absorbing carbon dioxide during photosynthesis. Trees provide shelter and food for thousands of species of animals and insects. Their roots hold soil in place, preventing erosion and floods. In cities, trees reduce temperatures by providing shade and releasing moisture. Without trees, life as we know it could not exist."\n\nSubject: Trees\nMain Idea: Trees are essential to life on Earth in many ways.'
        }
      ]
    },
    quiz: {
      questions: [
        {
          id: 'q1',
          text: 'What is the main idea of the practice passage about trees?',
          options: [
            'Trees produce oxygen through photosynthesis',
            'Trees prevent soil erosion',
            'Trees are essential to life on Earth in many ways',
            'Trees reduce city temperatures'
          ],
          correct: 2
        },
        {
          id: 'q2',
          text: 'Which strategy helps you find the main idea?',
          options: [
            'Focus only on the first sentence',
            'Count the number of times a word appears',
            'Ask what almost every sentence is about',
            'Look for the longest sentence'
          ],
          correct: 2
        },
        {
          id: 'q3',
          text: 'A supporting detail is different from a main idea because:',
          options: [
            'It is always in the first paragraph',
            'It gives specific information about one aspect of the main idea',
            'It uses more difficult vocabulary',
            'It is always written in bold text'
          ],
          correct: 1
        }
      ]
    }
  }
];
