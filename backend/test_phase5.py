import urllib.request
import json

def test():
    base_url = 'http://localhost:8000/api/school-intelligence'
    
    # 1. School Intelligence Overview
    res = urllib.request.urlopen(f'{base_url}/SCH_ZP_SHIRUR')
    ov = json.loads(res.read())
    print('1. Overview loaded:', ov['school_name'], 'Coverage:', ov['coverage_percentage'], '% Signals count:', len(ov['signals']))

    # 2. Get Evidence for Signal 1
    res = urllib.request.urlopen(f'{base_url}/signals/SIG_REP_SUB_01/evidence')
    ev = json.loads(res.read())
    print('2. Signal Evidence loaded:', ev['signal_title'], 'Classes:', len(ev['classes_breakdown']), 'Total Demonstrated:', ev['overall_skill_status']['demonstrated'])

    # 3. Post School Review
    req = urllib.request.Request(
        f'{base_url}/signals/SIG_REP_SUB_01/review',
        data=json.dumps({
            'action': 'assigned_follow_up',
            'reviewer_id': 'PRIN_001',
            'assigned_to': 'Grade 3–4 Teaching Team',
            'review_question': 'Review the evidence underlying repeated difficulty with two-digit subtraction.',
            'due_date': '30 September 2026',
            'notes': 'Joint review scheduled for Friday team meeting.'
        }).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    res = urllib.request.urlopen(req)
    rev = json.loads(res.read())
    print('3. School Review created:', rev['signal_title'], 'Assigned to:', rev['assigned_to'], 'Status:', rev['status'])

    # 4. School Landscape
    res = urllib.request.urlopen(f'{base_url}/SCH_ZP_SHIRUR/landscape')
    land = json.loads(res.read())
    print('4. Landscape loaded: Literacy skills:', len(land['skills_landscape']['literacy']), 'Numeracy skills:', len(land['skills_landscape']['numeracy']))

    # 5. Intervention Patterns
    res = urllib.request.urlopen(f'{base_url}/SCH_ZP_SHIRUR/intervention-patterns')
    patterns = json.loads(res.read())
    top_title = patterns[0]['title'].encode('ascii', 'replace').decode('ascii')
    print('5. Intervention patterns count:', len(patterns), 'Top pattern:', top_title, 'Progress count:', patterns[0]['progress_count'])

    # 6. Generate Brief
    req = urllib.request.Request(f'{base_url}/SCH_ZP_SHIRUR/generate-brief', data=json.dumps({}).encode('utf-8'), headers={'Content-Type': 'application/json'})
    res = urllib.request.urlopen(req)
    brief = json.loads(res.read())
    rep_period = brief['reporting_period'].encode('ascii', 'replace').decode('ascii')
    print('6. Brief generated for period:', rep_period, 'Repeated gaps summary len:', len(brief['repeated_patterns_summary']))

    # 7. Timeline
    res = urllib.request.urlopen(f'{base_url}/SCH_ZP_SHIRUR/timeline')
    timeline = json.loads(res.read())
    latest_event = timeline[-1]['event'].encode('ascii', 'replace').decode('ascii')
    print('7. Timeline entries:', len(timeline), 'Latest event:', latest_event)

if __name__ == '__main__':
    test()
