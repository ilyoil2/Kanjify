from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0001_initial'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='vocabulary',
            name='hiragana',
        ),
        migrations.RemoveField(
            model_name='vocabulary',
            name='katakana',
        ),
        migrations.AddField(
            model_name='vocabulary',
            name='reading',
            field=models.CharField(blank=True, max_length=200, null=True),
        ),
        migrations.AlterField(
            model_name='vocabulary',
            name='meaning',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name='vocabulary',
            name='n_level',
            field=models.CharField(
                blank=True,
                choices=[('N1', 'N1'), ('N2', 'N2'), ('N3', 'N3'), ('N4', 'N4'), ('N5', 'N5')],
                max_length=2,
                null=True,
            ),
        ),
    ]
