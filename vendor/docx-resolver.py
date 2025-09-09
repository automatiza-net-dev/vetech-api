from docx import Document
import sys
import json
import requests
import tempfile
import os

_input = sys.argv[1]
_output = sys.argv[2]
_complexinput = sys.argv[3]
_image = sys.argv[4]

# Download image from presigned URL if provided
temp_image_path = None
if _image and _image.strip():
    response = requests.get(_image)
    if response.status_code != 200:
        raise Exception("Failed to download image from URL")

    with tempfile.NamedTemporaryFile(delete=False, suffix='.png') as temp_file:
        temp_file.write(response.content)
        temp_image_path = temp_file.name

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
  - [= $valor ]
[END-FOR valor]"""

# Replace [ASSINATURA] with image if available
if temp_image_path:
    for paragraph in document.paragraphs:
        for run in paragraph.runs:
            if '[ASSINATURA]' in run.text:
                run.text = run.text.replace('[ASSINATURA]', '')
                if run.text.strip() == '':  # If run is now empty, add picture
                    run.add_picture(temp_image_path)
                else:
                    # If there's other text, we might need to split, but for simplicity, add picture after
                    run.add_picture(temp_image_path)

document.save(_output)

# Clean up temporary file
if temp_image_path:
    os.unlink(temp_image_path)
