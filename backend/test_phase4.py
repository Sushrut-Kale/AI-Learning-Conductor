import urllib.request
import json

def test():
    # 1. Teach Overview
    res = urllib.request.urlopen('http://localhost:8000/api/teach/class/CLS_G3A')
    ov = json.loads(res.read())
    print('1. Overview paths:', len(ov['paths_status']), 'Interventions:', len(ov['active_interventions']))

    # 2. Get Aarav session
    res = urllib.request.urlopen('http://localhost:8000/api/interventions/INT_AARAV_001')
    session = json.loads(res.read())
    print('2. Aarav session loaded:', session['student_name'], 'Baseline:', session['baseline_correct'], '/', session['baseline_total'])

    # 3. Post observation
    req = urllib.request.Request('http://localhost:8000/api/interventions/INT_AARAV_001/observation', 
        data=json.dumps({'raw_text': 'Initially needed prompting, then independently exchanged one ten.', 'source': 'voice'}).encode('utf-8'),
        headers={'Content-Type': 'application/json'})
    res = urllib.request.urlopen(req)
    session = json.loads(res.read())
    print('3. Observation added:', len(session['observations']), session['observations'][-1]['structured_observation'])

    # 4. Multimodal evidence
    req = urllib.request.Request('http://localhost:8000/api/interventions/INT_AARAV_001/multimodal',
        data=json.dumps({'file_reference': 'aarav_slate_43_minus_17.png', 'evidence_type': 'slate'}).encode('utf-8'),
        headers={'Content-Type': 'application/json'})
    res = urllib.request.urlopen(req)
    session = json.loads(res.read())
    print('4. Multimodal added:', len(session['multimodal_records']), session['multimodal_records'][-1]['extracted_observation'])

    # 5. Post check
    req = urllib.request.Request('http://localhost:8000/api/interventions/INT_AARAV_001/post-check',
        data=json.dumps({
            'items': [
                {'id': 'P1', 'task_id': 'T1', 'task_prompt': '43 - 17', 'student_response': '26', 'expected_response': '26', 'correct': True, 'target_strategy_used': True, 'source': 'post_check'},
                {'id': 'P2', 'task_id': 'T2', 'task_prompt': '52 - 28', 'student_response': '24', 'expected_response': '24', 'correct': True, 'target_strategy_used': True, 'source': 'post_check'},
                {'id': 'P3', 'task_id': 'T3', 'task_prompt': '61 - 35', 'student_response': '26', 'expected_response': '26', 'correct': True, 'target_strategy_used': True, 'source': 'post_check'},
                {'id': 'P4', 'task_id': 'T4', 'task_prompt': '70 - 44', 'student_response': '26', 'expected_response': '26', 'correct': True, 'target_strategy_used': True, 'source': 'post_check'},
                {'id': 'P5', 'task_id': 'T5', 'task_prompt': '84 - 49', 'student_response': '34', 'expected_response': '35', 'correct': False, 'target_strategy_used': False, 'source': 'post_check'}
            ]
        }).encode('utf-8'),
        headers={'Content-Type': 'application/json'})
    res = urllib.request.urlopen(req)
    session = json.loads(res.read())
    change_summary = session['adaptation_decision']['observed_change_summary'].encode('ascii', 'replace').decode('ascii')
    print('5. Post-check calculated! Status:', session['adaptation_decision']['response_status'], 'Change:', change_summary, 'Action:', session['adaptation_decision']['action_type'], 'Points:', session['adaptation_decision']['accuracy_change_points'])

    # 6. Trajectory
    res = urllib.request.urlopen('http://localhost:8000/api/students/ST001/trajectory')
    traj = json.loads(res.read())
    print('6. Trajectory entries:', len(traj['timeline']), 'State:', traj['current_response_status'])

    # 7. Update diagnostics
    req = urllib.request.Request('http://localhost:8000/api/interventions/INT_AARAV_001/update-diagnostics',
        data=json.dumps({}).encode('utf-8'),
        headers={'Content-Type': 'application/json'})
    res = urllib.request.urlopen(req)
    diag = json.loads(res.read())
    print('7. Updated diagnostics status:', diag['status'], 'Hypothesis status:', diag['hypotheses'][0]['status'] if diag.get('hypotheses') else 'none')

    # 8. Next lesson
    req = urllib.request.Request('http://localhost:8000/api/teach/class/CLS_G3A/next-lesson',
        data=json.dumps({}).encode('utf-8'),
        headers={'Content-Type': 'application/json'})
    res = urllib.request.urlopen(req)
    plan = json.loads(res.read())
    print('8. Next lesson plan created:', plan['lesson_topic'].encode('ascii', 'replace').decode('ascii'), 'Status:', plan['status'])

if __name__ == '__main__':
    test()
