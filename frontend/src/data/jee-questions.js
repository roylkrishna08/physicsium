export const jeeQuestions = {
    'vernier-calipers': [
        {
            id: 1,
            year: 'JEE Main 2024 (Jan 31 Shift 1)',
            question: 'A vernier caliper has 10 divisions on the vernier scale which coincides with 9 divisions on the main scale. The least count of the instrument is 0.1 mm. The main scale division is:',
            question_hi: 'एक वर्नियर कैलिपर के वर्नियर स्केल पर 10 विभाजन मुख्य स्केल के 9 विभाजनों के साथ संपाती हैं। यंत्र का अल्पतमांक 0.1 मिमी है। मुख्य स्केल विभाजन है:',
            options: [
                '1 mm',
                '0.5 mm',
                '2 mm',
                '0.1 mm'
            ],
            options_hi: [
                '1 मिमी',
                '0.5 मिमी',
                '2 मिमी',
                '0.1 मिमी'
            ],
            correctAnswer: 0,
            solution: 'Least Count (LC) = 1 MSD - 1 VSD.\\nGiven 10 VSD = 9 MSD => 1 VSD = 0.9 MSD.\\nLC = 1 MSD - 0.9 MSD = 0.1 MSD.\\nGiven LC = 0.1 mm, so 0.1 MSD = 0.1 mm => 1 MSD = 1 mm.',
            solution_hi: 'अल्पतमांक (LC) = 1 MSD - 1 VSD.\\nदिया गया है 10 VSD = 9 MSD => 1 VSD = 0.9 MSD.\\nLC = 1 MSD - 0.9 MSD = 0.1 MSD.\\nLC = 0.1 मिमी दिया गया है, इसलिए 0.1 MSD = 0.1 मिमी => 1 MSD = 1 मिमी।'
        },
        {
            id: 2,
            year: 'JEE Main 2023 (Jan 24 Shift 2)',
            question: 'In a vernier calipers, 10 divisions of vernier scale coincide with 9 divisions of main scale, the least count is 0.1 mm. When both jaws touch each other, zero of vernier scale shifts to the left of zero of the main scale and 4th vernier division coincides with a main scale division. The reading is ________ if main scale reading is 10 mm and 5th vernier division coincides with a main scale division.',
            question_hi: 'एक वर्नियर कैलिपर में, वर्नियर स्केल के 10 विभाजन मुख्य स्केल के 9 विभाजनों के साथ संपाती हैं, अल्पतमांक 0.1 मिमी है। जब दोनों जबड़े एक-दूसरे को छूते हैं, तो वर्नियर स्केल का शून्य मुख्य स्केल के शून्य के बाईं ओर खिसक जाता है और चौथा वर्नियर विभाजन मुख्य स्केल विभाजन के साथ संपाती होता है। यदि मुख्य स्केल का पाठ्यांक 10 मिमी है और 5वां वर्नियर विभाजन मुख्य स्केल विभाजन के साथ संपाती होता है, तो पाठ्यांक ________ है।',
            options: [
                '11.1 mm',
                '10.9 mm',
                '9.6 mm',
                '11.5 mm'
            ],
            options_hi: [
                '11.1 मिमी',
                '10.9 मिमी',
                '9.6 मिमी',
                '11.5 मिमी'
            ],
            correctAnswer: 0,
            solution: 'Zero Error (negative) = -(10 - 4) * LC = -6 * 0.1 = -0.6 mm.\\nReading = MSR + (VSR * LC) - Zero Error\\nReading = 10 + (5 * 0.1) - (-0.6) = 10 + 0.5 + 0.6 = 11.1 mm.',
            solution_hi: 'शून्य त्रुटि (ऋणात्मक) = -(10 - 4) * LC = -6 * 0.1 = -0.6 मिमी।\\nपाठ्यांक = MSR + (VSR * LC) - शून्य त्रुटि\\nपाठ्यांक = 10 + (5 * 0.1) - (-0.6) = 10 + 0.5 + 0.6 = 11.1 मिमी।'
        },
        {
            id: 3,
            year: 'JEE Main 2021',
            question: 'The diameter of a spherical bob is measured using a vernier callipers. 9 divisions of the main scale, in the vernier callipers, are equal to 10 divisions of vernier scale. One main scale division is 1 mm. The main scale reading is 10 mm and 8th division of vernier scale was found to coincide exactly with one of the main scale division. If the given vernier callipers has positive zero error of 0.04 cm, then the radius of the bob is _______ x 10^-2 cm.',
            question_hi: 'एक वर्नियर कैलिपर्स का उपयोग करके एक गोलाकार बॉब का व्यास मापा जाता है। वर्नियर कैलिपर्स में मुख्य स्केल के 9 विभाजन वर्नियर स्केल के 10 विभाजनों के बराबर हैं। एक मुख्य स्केल विभाजन 1 मिमी है। मुख्य स्केल का पाठ्यांक 10 मिमी है और वर्नियर स्केल का 8वां विभाजन मुख्य स्केल के एक विभाजन के साथ ठीक संपाती पाया गया। यदि दिए गए वर्नियर कैलिपर्स में 0.04 सेमी की धनात्मक शून्य त्रुटि है, तो बॉब की त्रिज्या _______ x 10^-2 सेमी है।',
            options: [
                '52',
                '54',
                '104',
                '5.2'
            ],
            options_hi: [
                '52',
                '54',
                '104',
                '5.2'
            ],
            correctAnswer: 0,
            solution: 'LC = 1 MSD - 9/10 MSD = 0.1 mm = 0.01 cm.\\nMSR = 10 mm = 1.0 cm, VSR = 8.\\nZero Error = +0.04 cm.\\nDiameter = 1.0 + (8 * 0.01) - 0.04 = 1.04 cm.\\nRadius = 1.04 / 2 = 0.52 cm = 52 x 10^-2 cm.\\nAnswer is 52.',
            solution_hi: 'LC = 1 MSD - 9/10 MSD = 0.1 मिमी = 0.01 सेमी।\\nMSR = 10 मिमी = 1.0 सेमी, VSR = 8।\\nशून्य त्रुटि = +0.04 सेमी।\\nव्यास = 1.0 + (8 * 0.01) - 0.04 = 1.04 सेमी।\\nत्रिज्या = 1.04 / 2 = 0.52 सेमी = 52 x 10^-2 सेमी।\\nउत्तर 52 है।'
        },
        {
            id: 4,
            year: 'JEE Main 2019 (Jan 10 Shift 1)',
            question: 'In a vernier calipers, 1 cm on the main scale is divided into 10 equal parts. If 10 divisions of the vernier scale coincide with 9 divisions of the main scale, the least count of the vernier calipers is:',
            question_hi: 'एक वर्नियर कैलिपर्स में, मुख्य स्केल पर 1 सेमी को 10 बराबर भागों में विभाजित किया गया है। यदि वर्नियर स्केल के 10 विभाजन मुख्य स्केल के 9 विभाजनों के साथ संपाती हैं, तो वर्नियर कैलिपर्स का अल्पतमांक है:',
            options: [
                '0.01 cm',
                '0.02 cm',
                '0.05 cm',
                '0.001 cm'
            ],
            options_hi: [
                '0.01 सेमी',
                '0.02 सेमी',
                '0.05 सेमी',
                '0.001 सेमी'
            ],
            correctAnswer: 0,
            solution: '1 MSD = 1/10 cm = 0.1 cm. \\n10 VSD = 9 MSD => 1 VSD = 0.9 MSD.\\nLC = 1 MSD - 1 VSD = 1 MSD - 0.9 MSD = 0.1 MSD.\\nLC = 0.1 * 0.1 cm = 0.01 cm.',
            solution_hi: '1 MSD = 1/10 सेमी = 0.1 सेमी। \\n10 VSD = 9 MSD => 1 VSD = 0.9 MSD.\\nLC = 1 MSD - 1 VSD = 1 MSD - 0.9 MSD = 0.1 MSD.\\nLC = 0.1 * 0.1 सेमी = 0.01 सेमी।'
        },
        {
            id: 5,
            year: 'JEE Main 2016',
            question: 'A student measured the length of a rod and wrote it as 3.50 cm. Which instrument did he use to measure it?',
            question_hi: 'एक छात्र ने एक छड़ की लंबाई मापी और इसे 3.50 सेमी लिखा। उसने इसे मापने के लिए किस यंत्र का उपयोग किया?',
            options: [
                'A meter scale',
                'A vernier caliper where the 10 divisions in vernier scale matches with 9 divisions in main scale and main scale has 10 divisions in 1 cm',
                'A screw gauge having 100 divisions in the circular scale and pitch as 1 mm',
                'A screw gauge having 50 divisions in the circular scale and pitch as 1 mm'
            ],
            options_hi: [
                'एक मीटर स्केल',
                'एक वर्नियर कैलिपर जहां वर्नियर स्केल में 10 विभाजन मुख्य स्केल में 9 विभाजनों के साथ मेल खाते हैं और मुख्य स्केल में 1 सेमी में 10 विभाजन होते हैं',
                'एक स्क्रू गेज जिसमें गोलाकार स्केल में 100 विभाजन हैं और पिच 1 मिमी है',
                'एक स्क्रू गेज जिसमें गोलाकार स्केल में 50 विभाजन हैं और पिच 1 मिमी है'
            ],
            correctAnswer: 1,
            solution: 'The value 3.50 cm has two decimal places like 0.01 cm precision.\\nA meter scale has LC 0.1 cm.\\nOption B: LC = 1 MSD - 0.9 MSD = 0.1 MSD = 0.1 * (1/10) cm = 0.01 cm. Matches.\\nOption C: Screw gauge LC = 1mm/100 = 0.01 mm = 0.001 cm.\\nOption D: Screw gauge LC = 1mm/50 = 0.02 mm = 0.002 cm.\\nSo, Vernier Caliper (B) is the correct instrument.',
            solution_hi: 'मान 3.50 सेमी में 0.01 सेमी परिशुद्धता जैसे दो दशमलव स्थान हैं।\\nमीटर स्केल का LC 0.1 सेमी है।\\nविकल्प B: LC = 1 MSD - 0.9 MSD = 0.1 MSD = 0.1 * (1/10) सेमी = 0.01 सेमी। मेल खाता है।\\nविकल्प C: स्क्रू गेज LC = 1 मिमी/100 = 0.01 मिमी = 0.001 सेमी।\\nविकल्प D: स्क्रू गेज LC = 1 मिमी/50 = 0.02 मिमी = 0.002 सेमी।\\nइसलिए, वर्नियर कैलिपर (B) सही यंत्र है।'
        },
        {
            id: 6,
            year: 'JEE Main 2024 (Jan 29 Shift 2)',
            question: 'In a vernier caliper, n divisions of its main scale match with (n+1) divisions on its vernier scale. Each division of the main scale of is a units. Using the vernier principle, calculate its least count.',
            question_hi: 'एक वर्नियर कैलिपर में, इसके मुख्य स्केल के n विभाजन इसके वर्नियर स्केल पर (n+1) विभाजनों के साथ मेल खाते हैं। मुख्य स्केल का प्रत्येक विभाजन \'a\' इकाई का है। वर्नियर सिद्धांत का उपयोग करके, इसके अल्पतमांक की गणना करें।',
            options: [
                'a / (n+1)',
                'a / (n)',
                'a / (n-1)',
                'a * n / (n+1)'
            ],
            options_hi: [
                'a / (n+1)',
                'a / (n)',
                'a / (n-1)',
                'a * n / (n+1)'
            ],
            correctAnswer: 0,
            solution: '(n+1) VSD = n MSD \\n1 VSD = n/(n+1) MSD \\nLC = 1 MSD - 1 VSD = 1 MSD - n/(n+1) MSD = MSD (1 - n/(n+1)) \\nLC = MSD * (n+1-n)/(n+1) = MSD / (n+1) \\nGiven 1 MSD = a, so LC = a / (n+1).',
            solution_hi: '(n+1) VSD = n MSD \\n1 VSD = n/(n+1) MSD \\nLC = 1 MSD - 1 VSD = 1 MSD - n/(n+1) MSD = MSD (1 - n/(n+1)) \\nLC = MSD * (n+1-n)/(n+1) = MSD / (n+1) \\nदिया गया है 1 MSD = a, तो LC = a / (n+1)।'
        },
        {
            id: 7,
            year: 'JEE Main 2024 (Feb 1 Shift 1)',
            question: 'In a Vernier Caliper, 10 main scale divisions coincide with 11 Vernier scale divisions. If each division on the main scale is of 5 units, the least count of the instrument is:',
            question_hi: 'एक वर्नियर कैलिपर में, 10 मुख्य स्केल विभाजन 11 वर्नियर स्केल विभाजनों के साथ संपाती हैं। यदि मुख्य स्केल पर प्रत्येक विभाजन 5 इकाइयों का है, तो यंत्र का अल्पतमांक है:',
            options: [
                '5/11 units',
                '50/11 units',
                '5/10 units',
                '5/9 units'
            ],
            options_hi: [
                '5/11 इकाइयाँ',
                '50/11 इकाइयाँ',
                '5/10 इकाइयाँ',
                '5/9 इकाइयाँ'
            ],
            correctAnswer: 0,
            solution: '11 VSD = 10 MSD => 1 VSD = (10/11) MSD.\\nThis is a retrograde vernier case or simply just taking difference |1MSD - 1VSD|.\\nDifference = 1 MSD - 10/11 MSD = (1/11) MSD.\\nGiven 1 MSD = 5 units.\\nLC = (1/11) * 5 = 5/11 units.',
            solution_hi: '11 VSD = 10 MSD => 1 VSD = (10/11) MSD.\\nयह एक रेट्रोग्रेड वर्नियर स्थिति है या बस केवल अंतर ले रहे हैं |1MSD - 1VSD|.\\nअंतर = 1 MSD - 10/11 MSD = (1/11) MSD.\\nदिया गया है 1 MSD = 5 इकाइयाँ।\\nLC = (1/11) * 5 = 5/11 इकाइयाँ।'
        },
        {
            id: 8,
            year: 'JEE Main 2022 (June 26 Shift 1)',
            question: 'In a vernier caliper, each centimeter on the main scale is divided into 20 equal parts. If 10 vernier scale divisions coincide with 9 main scale divisions, the Vernier Constant is:',
            question_hi: 'एक वर्नियर कैलिपर में, मुख्य स्केल पर प्रत्येक सेंटीमीटर को 20 बराबर भागों में विभाजित किया गया है। यदि 10 वर्नियर स्केल विभाजन 9 मुख्य स्केल विभाजनों के साथ संपाती हैं, तो वर्नियर स्थिरांक है:',
            options: [
                '0.005 cm',
                '0.05 mm',
                '0.02 mm',
                '0.001 cm'
            ],
            options_hi: [
                '0.005 सेमी',
                '0.05 मिमी',
                '0.02 मिमी',
                '0.001 सेमी'
            ],
            correctAnswer: 0,
            solution: '1 cm = 20 parts => 1 MSD = 1/20 cm = 0.05 cm.\\n10 VSD = 9 MSD => 1 VSD = 0.9 MSD.\\nVC = 1 MSD - 1 VSD = 0.1 MSD.\\nVC = 0.1 * 0.05 cm = 0.005 cm.',
            solution_hi: '1 सेमी = 20 भाग => 1 MSD = 1/20 सेमी = 0.05 सेमी।\\n10 VSD = 9 MSD => 1 VSD = 0.9 MSD.\\nVC = 1 MSD - 1 VSD = 0.1 MSD.\\nVC = 0.1 * 0.05 सेमी = 0.005 सेमी।'
        },
        {
            id: 9,
            year: 'JEE Main 2022 (June 29 Shift 2)',
            question: 'The vernier constant of a Vernier Caliper is 0.1 mm and it has a zero error of (-0.05) cm. While measuring the diameter of a sphere, the main scale reading is 1.7 cm and coinciding vernier division is 5. The correct diameter is:',
            question_hi: 'एक वर्नियर कैलिपर का वर्नियर स्थिरांक 0.1 मिमी है और इसमें (-0.05) सेमी की शून्य त्रुटि है। एक गोले का व्यास मापते समय, मुख्य स्केल का पाठ्यांक 1.7 सेमी है और संपाती वर्नियर विभाजन 5 है। सही व्यास है:',
            options: [
                '1.80 cm',
                '1.75 cm',
                '1.65 cm',
                '1.70 cm'
            ],
            options_hi: [
                '1.80 सेमी',
                '1.75 सेमी',
                '1.65 सेमी',
                '1.70 सेमी'
            ],
            correctAnswer: 0,
            solution: 'Average LC = 0.1 mm = 0.01 cm.\\nZero Error = -0.05 cm.\\nMSR = 1.7 cm, VSR = 5.\\nMeasured Value = MSR + (VSR * LC) = 1.7 + (5 * 0.01) = 1.75 cm.\\nCorrected Value = Measured - Zero Error = 1.75 - (-0.05) = 1.75 + 0.05 = 1.80 cm.',
            solution_hi: 'औसत LC = 0.1 मिमी = 0.01 सेमी।\\nशून्य त्रुटि = -0.05 सेमी।\\nMSR = 1.7 सेमी, VSR = 5।\\nमापा गया मान = MSR + (VSR * LC) = 1.7 + (5 * 0.01) = 1.75 सेमी।\\nसही मान = मापा गया - शून्य त्रुटि = 1.75 - (-0.05) = 1.75 + 0.05 = 1.80 सेमी।'
        },
        {
            id: 10,
            year: 'JEE Main 2023 (April 10 Shift 2)',
            question: 'In a vernier caliper with least count 0.1 mm, when the jaws are touching each other, the zero of the vernier scale lies to the right of the zero of the main scale and the 6th division of the vernier scale coincides with a main scale division. What is the zero error?',
            question_hi: 'अल्पतमांक 0.1 मिमी वाले एक वर्नियर कैलिपर में, जब जबड़े एक-दूसरे को छू रहे होते हैं, तो वर्नियर स्केल का शून्य मुख्य स्केल के शून्य के दाईं ओर स्थित होता है और वर्नियर स्केल का छठा विभाजन मुख्य स्केल विभाजन के साथ संपाती होता है। शून्य त्रुटि क्या है?',
            options: [
                '+0.6 mm',
                '-0.6 mm',
                '+0.4 mm',
                '-0.4 mm'
            ],
            options_hi: [
                '+0.6 मिमी',
                '-0.6 मिमी',
                '+0.4 मिमी',
                '-0.4 मिमी'
            ],
            correctAnswer: 0,
            solution: 'Zero to the right => Positive Zero Error.\\nZero Error = + (Coinciding Division * LC)\\nZero Error = + (6 * 0.1 mm) = +0.6 mm.',
            solution_hi: 'शून्य दाईं ओर => धनात्मक शून्य त्रुटि।\\nशून्य त्रुटि = + (संपाती विभाजन * LC)\\nशून्य त्रुटि = + (6 * 0.1 मिमी) = +0.6 मिमी।'
        }
    ]
}
