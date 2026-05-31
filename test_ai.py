import os
import sys
import django

# Setup Django environment
sys.path.append(os.getcwd() + '/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from api.ai_utils import analyze_kanji

word = "両親"
print(f"Testing analyze_kanji with word: {word}")
result = analyze_kanji(word)
print("\nRESULT:")
print(result)
