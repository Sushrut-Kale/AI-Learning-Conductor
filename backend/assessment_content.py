from typing import List, Dict
from models import Assessment, AssessmentItem

SKILL_DEFINITIONS = {
    "reading": [
        {"id": "letter_recognition", "title": "Letter Recognition"},
        {"id": "word_reading", "title": "Word Reading"},
        {"id": "sentence_reading", "title": "Sentence Reading"},
        {"id": "paragraph_reading", "title": "Paragraph Reading"},
        {"id": "comprehension", "title": "Reading Comprehension"},
    ],
    "numeracy": [
        {"id": "number_recognition", "title": "Number Recognition"},
        {"id": "number_comparison", "title": "Number Comparison"},
        {"id": "basic_operations", "title": "Basic Single-Digit Ops"},
        {"id": "addition", "title": "2-Digit Addition"},
        {"id": "subtraction", "title": "2-Digit Subtraction"},
        {"id": "basic_multiplication", "title": "Basic Multiplication Concept"},
    ]
}

def get_foundational_assessments(language: str = "Marathi") -> List[Assessment]:
    """
    Returns modular FLN assessment batteries inspired by ASER, CBSE FLN, EGRA and EGMA frameworks.
    Notice: Framework inspired only; not an official ASER/CBSE implementation.
    """
    is_marathi = "marathi" in language.lower()
    is_hindi = "hindi" in language.lower()

    # Reading assessment items
    reading_items: List[AssessmentItem] = []
    
    # 1. Letter Recognition (5 items)
    letters = [
        {"stim": "क" if (is_marathi or is_hindi) else "m", "exp": "क" if (is_marathi or is_hindi) else "m"},
        {"stim": "र" if (is_marathi or is_hindi) else "s", "exp": "र" if (is_marathi or is_hindi) else "s"},
        {"stim": "म" if (is_marathi or is_hindi) else "t", "exp": "म" if (is_marathi or is_hindi) else "t"},
        {"stim": "ल" if (is_marathi or is_hindi) else "b", "exp": "ल" if (is_marathi or is_hindi) else "b"},
        {"stim": "प" if (is_marathi or is_hindi) else "p", "exp": "प" if (is_marathi or is_hindi) else "p"},
    ]
    for i, it in enumerate(letters, 1):
        reading_items.append(AssessmentItem(
            id=f"READ_LTR_{i:02d}",
            assessment_id="ASM_READ_G3",
            domain="reading",
            skill_id="letter_recognition",
            skill_title="Letter Recognition",
            question_stimulus=it["stim"],
            stimulus_type="letter",
            expected_response=it["exp"],
            instructions_for_teacher="Point to the letter. Ask child: 'Which letter is this?'",
            difficulty_level=1
        ))

    # 2. Word Reading (5 items)
    words = [
        {"stim": "घर" if (is_marathi or is_hindi) else "sun", "exp": "घर" if (is_marathi or is_hindi) else "sun"},
        {"stim": "शाळा" if is_marathi else ("स्कूल" if is_hindi else "school"), "exp": "शाळा" if is_marathi else ("स्कूल" if is_hindi else "school")},
        {"stim": "झाड" if is_marathi else ("पेड़" if is_hindi else "tree"), "exp": "झाड" if is_marathi else ("पेड़" if is_hindi else "tree")},
        {"stim": "पाणी" if is_marathi else ("पानी" if is_hindi else "water"), "exp": "पाणी" if is_marathi else ("पानी" if is_hindi else "water")},
        {"stim": "मित्र" if (is_marathi or is_hindi) else "friend", "exp": "मित्र" if (is_marathi or is_hindi) else "friend"},
    ]
    for i, it in enumerate(words, 1):
        reading_items.append(AssessmentItem(
            id=f"READ_WRD_{i:02d}",
            assessment_id="ASM_READ_G3",
            domain="reading",
            skill_id="word_reading",
            skill_title="Word Reading",
            question_stimulus=it["stim"],
            stimulus_type="word",
            expected_response=it["exp"],
            instructions_for_teacher="Show the word clearly. Ask child to read the word aloud.",
            difficulty_level=2
        ))

    # 3. Sentence Reading (4 items)
    sentences = [
        {
            "stim": "मी रोज शाळेत जातो." if is_marathi else ("मैं रोज स्कूल जाता हूँ।" if is_hindi else "The dog ran to the park."),
            "exp": "fluent_read"
        },
        {
            "stim": "आकाशात पक्षी उडतात." if is_marathi else ("आकाश में पक्षी उड़ते हैं।" if is_hindi else "She likes to read books."),
            "exp": "fluent_read"
        },
        {
            "stim": "नदीकाठी सुंदर झाडे आहेत." if is_marathi else ("नदी किनारे सुंदर पेड़ हैं।" if is_hindi else "The sun shines in the morning."),
            "exp": "fluent_read"
        },
        {
            "stim": "आम्ही मैदानात खेळतो." if is_marathi else ("हम मैदान में खेलते हैं।" if is_hindi else "We play in the green garden."),
            "exp": "fluent_read"
        }
    ]
    for i, it in enumerate(sentences, 1):
        reading_items.append(AssessmentItem(
            id=f"READ_SNT_{i:02d}",
            assessment_id="ASM_READ_G3",
            domain="reading",
            skill_id="sentence_reading",
            skill_title="Sentence Reading",
            question_stimulus=it["stim"],
            stimulus_type="sentence",
            expected_response=it["exp"],
            instructions_for_teacher="Ask child to read the complete sentence. Note pace and fluency.",
            difficulty_level=3
        ))

    # 4. Paragraph Reading (3 items)
    paragraphs = [
        {
            "stim": (
                "राजू एका छोट्या गावात राहत होता. त्याच्याकडे एक पांढरा कुत्रा होता. कुत्र्याचे नाव मोती होते. "
                "राजू आणि मोती रोज संध्याकाळी शेतात खेळायचे."
            ) if is_marathi else (
                "राजू एक छोटे से गाँव में रहता था। उसके पास एक सफ़ेद कुत्ता था जिसका नाम मोती था। "
                "राजू और मोती रोज़ शाम को खेत में खेलने जाते थे।"
            ) if is_hindi else (
                "Raju lived in a quiet village with green fields. He had a playful dog named Moti. "
                "Every evening after school, Raju and Moti ran around the fields."
            ),
            "exp": "fluent_paragraph"
        },
        {
            "stim": (
                "उन्हाळ्याच्या सुट्टीत मीना आजोळी गेली. तेथे भरपूर आंब्याची झाडे होती. "
                "मीनाने गोड आंबे खाल्ले आणि कालव्यात पोहण्याचा आनंद घेतला."
            ) if is_marathi else (
                "गर्मी की छुट्टियों में मीना नानी के घर गई। वहाँ बहुत सारे आम के पेड़ थे। "
                "मीना ने मीठे आम खाए और नहर में खूब नहाई।"
            ) if is_hindi else (
                "During summer vacation, Meena visited her grandparents in the hills. "
                "The garden had many mango trees with ripe fruits. She tasted fresh sweet mangoes."
            ),
            "exp": "fluent_paragraph"
        }
    ]
    for i, it in enumerate(paragraphs, 1):
        reading_items.append(AssessmentItem(
            id=f"READ_PAR_{i:02d}",
            assessment_id="ASM_READ_G3",
            domain="reading",
            skill_id="paragraph_reading",
            skill_title="Paragraph Reading",
            question_stimulus=it["stim"],
            stimulus_type="paragraph",
            expected_response=it["exp"],
            instructions_for_teacher="Have child read the paragraph aloud. Check for accuracy and flow.",
            difficulty_level=4
        ))

    # 5. Reading Comprehension (3 items based on paragraph)
    comps = [
        {
            "stim": "राजूच्या कुत्र्याचे नाव काय होते?" if is_marathi else ("राजू के कुत्ते का नाम क्या था?" if is_hindi else "What was the name of Raju's dog?"),
            "exp": "मोती" if (is_marathi or is_hindi) else "Moti",
            "options": ["मोती", "टॉमी", "शेरू", "कालू"] if (is_marathi or is_hindi) else ["Moti", "Tommy", "Sheru", "Rocky"]
        },
        {
            "stim": "राजू आणि मोती कुठे खेळायचे?" if is_marathi else ("राजू और मोती कहाँ खेलते थे?" if is_hindi else "Where did Raju and Moti play?"),
            "exp": "शेतात" if is_marathi else ("खेत में" if is_hindi else "In the fields"),
            "options": ["शेतात", "घरावर", "नदीत", "बाजारात"] if is_marathi else (["खेत में", "छत पर", "नदी में", "बाजार में"] if is_hindi else ["In the fields", "On roof", "In river", "At market"])
        },
        {
            "stim": "मीनाने सुट्टीत कोणते फळ खाल्ले?" if is_marathi else ("मीना ने छुट्टियों में कौन सा फल खाया?" if is_hindi else "Which fruit did Meena eat during vacation?"),
            "exp": "आंबा" if is_marathi else ("आम" if is_hindi else "Mango"),
            "options": ["आंबा", "पेरू", "सफरचंद", "केळी"] if is_marathi else (["आम", "अमरूद", "सेब", "केला"] if is_hindi else ["Mango", "Guava", "Apple", "Banana"])
        }
    ]
    for i, it in enumerate(comps, 1):
        reading_items.append(AssessmentItem(
            id=f"READ_CMP_{i:02d}",
            assessment_id="ASM_READ_G3",
            domain="reading",
            skill_id="comprehension",
            skill_title="Reading Comprehension",
            question_stimulus=it["stim"],
            stimulus_type="comprehension",
            expected_response=it["exp"],
            options=it.get("options"),
            instructions_for_teacher="Ask question based on the passage read earlier. Record student answer.",
            difficulty_level=4
        ))

    reading_assessment = Assessment(
        id="ASM_READ_G3",
        title=f"Foundational Literacy ({language})",
        grade=3,
        language=language,
        domain="reading",
        skills=SKILL_DEFINITIONS["reading"],
        items=reading_items
    )

    # Numeracy assessment items
    numeracy_items: List[AssessmentItem] = []

    # 1. Number Recognition (5 items)
    num_rec = [
        {"stim": "7", "exp": "7"},
        {"stim": "24", "exp": "24"},
        {"stim": "59", "exp": "59"},
        {"stim": "78", "exp": "78"},
        {"stim": "93", "exp": "93"},
    ]
    for i, it in enumerate(num_rec, 1):
        numeracy_items.append(AssessmentItem(
            id=f"NUM_REC_{i:02d}",
            assessment_id="ASM_NUM_G3",
            domain="numeracy",
            skill_id="number_recognition",
            skill_title="Number Recognition",
            question_stimulus=f"Identify number: {it['stim']}",
            stimulus_type="number",
            expected_response=it["exp"],
            instructions_for_teacher="Point to the number. Ask child: 'Which number is this?'",
            difficulty_level=1
        ))

    # 2. Number Comparison (4 items)
    num_comp = [
        {"stim": "Which is greater: 18 or 27?", "exp": "27", "opts": ["18", "27"]},
        {"stim": "Which is smaller: 45 or 39?", "exp": "39", "opts": ["45", "39"]},
        {"stim": "Which is greater: 82 or 79?", "exp": "82", "opts": ["82", "79"]},
        {"stim": "Which is smaller: 91 or 98?", "exp": "91", "opts": ["91", "98"]},
    ]
    for i, it in enumerate(num_comp, 1):
        numeracy_items.append(AssessmentItem(
            id=f"NUM_CMP_{i:02d}",
            assessment_id="ASM_NUM_G3",
            domain="numeracy",
            skill_id="number_comparison",
            skill_title="Number Comparison",
            question_stimulus=it["stim"],
            stimulus_type="comparison",
            expected_response=it["exp"],
            options=it.get("opts"),
            instructions_for_teacher="Ask child which number is bigger or smaller as prompted.",
            difficulty_level=2
        ))

    # 3. Basic Operations (Single digit addition/subtraction, 4 items)
    basic_ops = [
        {"stim": "4 + 5", "exp": "9"},
        {"stim": "8 + 6", "exp": "14"},
        {"stim": "9 − 3", "exp": "6"},
        {"stim": "7 − 4", "exp": "3"},
    ]
    for i, it in enumerate(basic_ops, 1):
        numeracy_items.append(AssessmentItem(
            id=f"NUM_BAS_{i:02d}",
            assessment_id="ASM_NUM_G3",
            domain="numeracy",
            skill_id="basic_operations",
            skill_title="Basic Single-Digit Ops",
            question_stimulus=f"Solve: {it['stim']}",
            stimulus_type="addition" if "+" in it["stim"] else "subtraction",
            expected_response=it["exp"],
            instructions_for_teacher="Child can use fingers, mental math, or rough paper.",
            difficulty_level=2
        ))

    # 4. 2-Digit Addition (4 items: without & with regrouping)
    add_items = [
        {"stim": "23 + 14", "exp": "37"},
        {"stim": "41 + 35", "exp": "76"},
        {"stim": "28 + 15", "exp": "43"},  # with regrouping
        {"stim": "47 + 38", "exp": "85"},  # with regrouping
    ]
    for i, it in enumerate(add_items, 1):
        numeracy_items.append(AssessmentItem(
            id=f"NUM_ADD_{i:02d}",
            assessment_id="ASM_NUM_G3",
            domain="numeracy",
            skill_id="addition",
            skill_title="2-Digit Addition",
            question_stimulus=f"Calculate: {it['stim']}",
            stimulus_type="addition",
            expected_response=it["exp"],
            instructions_for_teacher="Observe if child aligns place value and handles regrouping / carry-over.",
            difficulty_level=3
        ))

    # 5. 2-Digit Subtraction (4 items: without & with borrowing)
    sub_items = [
        {"stim": "48 − 23", "exp": "25"},
        {"stim": "67 − 34", "exp": "33"},
        {"stim": "42 − 17", "exp": "25"},  # with borrowing
        {"stim": "71 − 38", "exp": "33"},  # with borrowing
    ]
    for i, it in enumerate(sub_items, 1):
        numeracy_items.append(AssessmentItem(
            id=f"NUM_SUB_{i:02d}",
            assessment_id="ASM_NUM_G3",
            domain="numeracy",
            skill_id="subtraction",
            skill_title="2-Digit Subtraction",
            question_stimulus=f"Calculate: {it['stim']}",
            stimulus_type="subtraction",
            expected_response=it["exp"],
            instructions_for_teacher="Check if child borrows correctly or simply subtracts smaller from larger digit.",
            difficulty_level=4
        ))

    # 6. Basic Multiplication Concept (3 items)
    mul_items = [
        {"stim": "3 groups of 2 apples = ?", "exp": "6", "opts": ["4", "5", "6", "8"]},
        {"stim": "4 × 3", "exp": "12"},
        {"stim": "5 × 5", "exp": "25"},
    ]
    for i, it in enumerate(mul_items, 1):
        numeracy_items.append(AssessmentItem(
            id=f"NUM_MUL_{i:02d}",
            assessment_id="ASM_NUM_G3",
            domain="numeracy",
            skill_id="basic_multiplication",
            skill_title="Basic Multiplication Concept",
            question_stimulus=it["stim"],
            stimulus_type="multiplication",
            expected_response=it["exp"],
            options=it.get("opts"),
            instructions_for_teacher="Assess equal grouping and repeated addition concept.",
            difficulty_level=4
        ))

    numeracy_assessment = Assessment(
        id="ASM_NUM_G3",
        title=f"Foundational Numeracy (Grade 3)",
        grade=3,
        language=language,
        domain="numeracy",
        skills=SKILL_DEFINITIONS["numeracy"],
        items=numeracy_items
    )

    return [reading_assessment, numeracy_assessment]
