from docx import Document
import sys
import json

_input = sys.argv[1]
_output = sys.argv[2]
_complexinput = sys.argv[3]

# _complexdata = ["[ABC]", "[DEF]"]
_complexdata = json.loads(_complexinput)

document = Document(_input)

invalid_runs = []

outer_idx = 0

# iterate over paragraphs
for paragraph in document.paragraphs:
    missing = False
    inner_idx = 0
    _from = -1

    # iterate over runs
    for run in paragraph.runs:
        # if text starts with [ but doesn't end with ]
        if run.text.startswith('[') and not run.text.endswith(']'):
            missing = True
            _from = inner_idx

        if missing and run.text.startswith(']'):
            missing = False
            invalid_runs.append({
                'paragraph_index': outer_idx,
                'from': _from,
                'to': inner_idx})
            # print(run.text, 'ends')

        inner_idx += 1

    outer_idx += 1

for bad_run in invalid_runs:
    paragraph = document.paragraphs[bad_run['paragraph_index']]
    p = paragraph._p

    tokens = []

    for _group in range(bad_run['from'], bad_run['to']+1):
        tokens.append(paragraph.runs[_group].text)

    correct_word = ''.join(tokens)

    for _group in range(bad_run['from'], bad_run['to']+1):
        if _group == bad_run['from']:
            # add correct_word in the place of the current word
            paragraph.runs[_group].text = correct_word
        else:
            # delete existing run
            paragraph.runs[_group].text = ''

for paragraph in document.paragraphs:
    for run in paragraph.runs:
        if run.text in _complexdata:
            _key = run.text[1:-1]
            run.text = f"""[FOR valor IN {_key}]
  - valor
[END-FOR]"""

document.save(_output)
