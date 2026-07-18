import os
import glob

directory = r'c:\dev\LocalWorkerFinderApp\frontend\src\app'
for filepath in glob.glob(directory + '/**/*.tsx', recursive=True):
    with open(filepath, 'r', encoding='utf-8') as file:
        content = file.read()
        
    new_content = content.replace(
        "behavior={Platform.OS === 'ios' ? 'padding' : 'height'}",
        "behavior={Platform.OS === 'ios' ? 'padding' : undefined}"
    )
    
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as file:
            file.write(new_content)
        print(f'Updated {filepath}')
