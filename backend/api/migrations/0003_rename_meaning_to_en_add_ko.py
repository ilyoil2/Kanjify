from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0002_alter_vocabulary_nullable'),
    ]

    operations = [
        migrations.RenameField(
            model_name='vocabulary',
            old_name='meaning',
            new_name='meaning_en',
        ),
        migrations.AddField(
            model_name='vocabulary',
            name='meaning_ko',
            field=models.TextField(blank=True, null=True),
        ),
    ]
